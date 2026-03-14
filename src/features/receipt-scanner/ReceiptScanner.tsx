import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView } from 'expo-camera';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, Select } from '@/src/components/ui';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { useTransactionStore } from '@/src/stores/transactionStore';
import { supabase } from '@/src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useCamera } from './hooks/useCamera';
import { extractReceiptData } from './services/receiptOCRService';
import type { TransactionType } from '@/src/types/database';

// Same list as expenses.tsx — keeps categories in sync
const EXPENSE_CATEGORIES: { label: string }[] = [
  { label: 'Food & Groceries' },
  { label: 'Rent' },
  { label: 'Utilities' },
  { label: 'Healthcare' },
  { label: 'Insurance' },
  { label: 'Emergency Fund' },
  { label: 'Transportation' },
  { label: 'Gas' },
  { label: 'Toll Gate' },
  { label: 'Travel' },
  { label: 'Vehicle Maintenance' },
  { label: 'House Maintenance' },
  { label: 'Online Shopping' },
  { label: 'Vacation' },
  { label: 'Dining' },
  { label: 'Shopping' },
  { label: 'Entertainment' },
  { label: 'CellPhone Load' },
  { label: 'Pet Supplies' },
  { label: 'Gardening Needs' },
  { label: 'Taxes' },
  { label: 'Tuition Fee' },
  { label: 'School Service' },
  { label: 'School Supplies' },
  { label: 'Allowance' },
  { label: 'Remittance' },
  { label: 'Personal Care and Leisure' },
  { label: 'License, Registration and Certification' },
];

const receiptSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  notes: z.string().optional(),
});

type ReceiptForm = z.infer<typeof receiptSchema>;

type ScanState = 'camera' | 'scanning' | 'preview';

const RECEIPT_TYPES: { label: string; value: TransactionType; icon: string; color: string }[] = [
  { label: 'Expense', value: 'expense', icon: 'arrow-up', color: '#dc2626' },
  { label: 'Income', value: 'income', icon: 'arrow-down', color: '#16a34a' },
];

export function ReceiptScanner() {
  const [scanState, setScanState] = useState<ScanState>('camera');
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedUri, setUploadedUri] = useState<string | null>(null);

  const { cameraRef, permission, requestPermission, capturedUri, capturePhoto, resetCapture } =
    useCamera();
  const { addTransaction } = useTransactionSync();
  const { categories: storeCategories, setCategories: setStoreCategories } = useTransactionStore();

  const today = new Date().toISOString().split('T')[0];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReceiptForm>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: today,
      vendor: '',
      notes: '',
    },
  });

  const vendorValue = useWatch({ control, name: 'vendor' });
  const canSave = !!selectedCategoryName && !!vendorValue?.trim();

  // Fetch categories whenever selected type changes
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('type', selectedType)
          .order('name');
        if (!error && data) {
          setCategories(data);
          if (storeCategories.length === 0) setStoreCategories(data);
        }
      } catch {
        // offline — use store cache
        setCategories(storeCategories.filter(c => c.type === selectedType));
      }
    };
    fetchCategories();
  }, [selectedType]);

  // For expense: use the same hard-coded list as expenses.tsx
  // For income: use DB categories
  const categoryOptions = selectedType === 'expense'
    ? EXPENSE_CATEGORIES.map(c => ({ label: c.label, value: c.label }))
    : categories.map(c => ({ label: c.name, value: c.name }));

  const runOCRAndPreview = async (uri: string, mimeType?: string | null, base64?: string | null) => {
    setScanState('scanning');

    const formValues = {
      description: '',
      amount: '',
      date: today,
      vendor: '',
      notes: '',
    };

    try {
      const data = await extractReceiptData(uri, mimeType, base64);
      if (data.description) formValues.description = data.description;
      if (data.amount) formValues.amount = data.amount;
      if (data.date) formValues.date = data.date;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Receipt OCR failed:', message);
      Alert.alert('Could not read receipt', message);
    }

    reset(formValues);
    setScanState('preview');
  };

  const handleCapture = async () => {
    const uri = await capturePhoto();
    if (!uri) return;
    await runOCRAndPreview(uri);
  };

  const handleUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library to upload a receipt.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true, // expo converts HEIC→JPEG and provides base64 directly
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadedUri(asset.uri);
    await runOCRAndPreview(asset.uri, asset.mimeType, asset.base64);
  };

  const handleRetake = () => {
    resetCapture();
    reset();
    setSelectedCategoryName(null);
    setCategoryError(false);
    setScanState('camera');
  };

  const onSubmit = async (data: ReceiptForm) => {
    const notesParts: string[] = [];
    if (data.vendor) notesParts.push(`Vendor: ${data.vendor}`);
    if (data.notes) notesParts.push(data.notes);

    // Resolve category name → DB id
    const resolvedCategoryId =
      categories.find(c => c.name === selectedCategoryName)?.id ?? null;

    await addTransaction({
      account_id: '',
      category_id: resolvedCategoryId,
      type: selectedType,
      amount: parseFloat(data.amount),
      currency: 'PHP',
      description: data.description,
      notes: notesParts.length > 0 ? notesParts.join('\n') : null,
      date: data.date,
      is_recurring: false,
      recurring_id: null,
      receipt_url: capturedUri,
      source: 'receipt_scan' as const,
      transfer_to_account_id: null,
    });

    Alert.alert('Saved', 'Transaction from receipt has been recorded.');
    handleRetake();
  };

  // Permission not granted yet
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 p-6">
        <FontAwesome name="spinner" size={32} color="#94a3b8" />
        <Text className="mt-4 text-surface-500">Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 p-6">
        <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary-50">
            <FontAwesome name="camera" size={28} color="#2563eb" />
          </View>
          <Text className="mb-2 text-center text-lg font-bold text-surface-900">
            Camera Access Required
          </Text>
          <Text className="mb-6 text-center text-sm text-surface-500">
            To scan receipts, we need access to your camera. Your photos stay on your device.
          </Text>
          <Button title="Grant Camera Access" onPress={requestPermission} fullWidth />
        </View>
      </View>
    );
  }

  // Camera view
  if (scanState === 'camera') {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
          <View className="flex-1 items-center justify-center">
            <View className="h-72 w-80 rounded-2xl border-2 border-white/50" />
            <Text className="mt-4 text-sm text-white/80">
              Position the receipt within the frame
            </Text>
          </View>
          <View className="items-center pb-10">
            <Pressable
              onPress={handleCapture}
              className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 active:bg-white/40"
            >
              <View className="h-16 w-16 rounded-full bg-white" />
            </Pressable>
            <Pressable
              onPress={handleUpload}
              className="mt-5 flex-row items-center gap-2 rounded-full bg-white/20 px-5 py-2.5 active:bg-white/40"
            >
              <FontAwesome name="image" size={16} color="#ffffff" />
              <Text className="text-sm font-medium text-white">Upload Image</Text>
            </Pressable>
          </View>
        </CameraView>
      </View>
    );
  }

  // Scanning / OCR in progress
  if (scanState === 'scanning') {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 p-6">
        <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-4 text-base font-semibold text-surface-900">
            Analyzing receipt...
          </Text>
          <Text className="mt-1 text-sm text-surface-500">
            Extracting amount, date and description
          </Text>
        </View>
      </View>
    );
  }

  // Preview + form
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface-50"
    >
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Receipt preview */}
        {capturedUri && (
          <Card variant="elevated" className="mb-4">
            <Image
              source={{ uri: capturedUri }}
              className="h-48 w-full rounded-xl"
              resizeMode="cover"
            />
            <Pressable
              onPress={handleRetake}
              className="mt-3 flex-row items-center justify-center"
            >
              <FontAwesome name="refresh" size={14} color="#2563eb" />
              <Text className="ml-2 text-sm font-medium text-primary-600">Retake Photo</Text>
            </Pressable>
          </Card>
        )}

        {/* Type selector */}
        <Text className="mb-2 text-sm font-medium text-surface-700">Transaction Type</Text>
        <View className="mb-4 flex-row gap-2">
          {RECEIPT_TYPES.map((type) => (
            <Pressable
              key={type.value}
              onPress={() => {
                setSelectedType(type.value);
                setSelectedCategoryName(null);
              }}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
                selectedType === type.value ? 'bg-primary-600' : 'bg-surface-100'
              }`}
            >
              <FontAwesome
                name={type.icon as any}
                size={14}
                color={selectedType === type.value ? '#ffffff' : type.color}
              />
              <Text
                className={`ml-2 text-sm font-medium ${
                  selectedType === type.value ? 'text-white' : 'text-surface-700'
                }`}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Category */}
        <Select
          label="Category *"
          placeholder="Select a category"
          options={categoryOptions}
          value={selectedCategoryName}
          onValueChange={(val) => {
            setSelectedCategoryName(val);
            setCategoryError(false);
          }}
          error={categoryError ? 'Category is required' : undefined}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Description"
              placeholder="e.g., Grocery at SM Supermarket"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.description?.message}
            />
          )}
        />

        {/* Amount */}
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Amount (PHP)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.amount?.message}
              leftIcon={<Text className="text-base text-surface-400">₱</Text>}
            />
          )}
        />

        {/* Date */}
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Date"
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={onChange}
              error={errors.date?.message}
            />
          )}
        />

        {/* Vendor / Merchant */}
        <Controller
          control={control}
          name="vendor"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Merchant / Vendor *"
              placeholder="e.g., SM Supermarket"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.vendor?.message}
            />
          )}
        />

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Notes (optional)"
              placeholder="Add any notes..."
              multiline
              numberOfLines={3}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        {!canSave && (
          <View className="mb-2 mt-4 flex-row items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
            <FontAwesome name="info-circle" size={14} color="#d97706" />
            <Text className="text-xs text-amber-700">
              {!selectedCategoryName && !vendorValue?.trim()
                ? 'Category and Vendor are required'
                : !selectedCategoryName
                ? 'Please select a category'
                : 'Please enter a vendor / merchant'}
            </Text>
          </View>
        )}

        <View className="mb-8 mt-2">
          <Button
            title="Save Transaction"
            onPress={() => {
              if (!selectedCategoryName) setCategoryError(true);
              if (canSave) handleSubmit(onSubmit)();
            }}
            fullWidth
            size="lg"
            disabled={!canSave}
            icon={<FontAwesome name="check" size={16} color={canSave ? '#ffffff' : '#94a3b8'} />}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
