import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card } from '@/src/components/ui';
import { useReminders } from '@/src/features/reminders/hooks/useReminders';
import { formatCurrency, getRelativeDate, formatDate } from '@/src/lib/formatters';

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  description: z.string().optional(),
});

type ReminderForm = z.infer<typeof reminderSchema>;

export default function RemindersScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'paid'>('upcoming');
  const {
    upcomingReminders,
    paidReminders,
    overdueReminders,
    createReminder,
    payReminder,
    deleteReminder,
  } = useReminders();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReminderForm>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: '',
      amount: '',
      due_date: '',
      description: '',
    },
  });

  const onSubmit = async (data: ReminderForm) => {
    await createReminder({
      title: data.title,
      amount: data.amount ? parseFloat(data.amount) : undefined,
      due_date: data.due_date,
      description: data.description,
    });
    reset();
    setShowAddModal(false);
  };

  const handlePay = (id: string, title: string) => {
    Alert.alert('Mark as Paid', `Mark "${title}" as paid?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Paid', onPress: () => payReminder(id) },
    ]);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Reminder', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteReminder(id),
      },
    ]);
  };

  const displayList = activeTab === 'upcoming' ? upcomingReminders : paidReminders;

  return (
    <View className="flex-1 bg-surface-50">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-surface-100">
        <Pressable onPress={() => router.back()} className="p-1">
          <FontAwesome name="arrow-left" size={18} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-bold text-surface-900">Reminders</Text>
        <Pressable onPress={() => setShowAddModal(true)} className="p-1">
          <FontAwesome name="plus" size={18} color="#2563eb" />
        </Pressable>
      </View>

      {/* Overdue Banner */}
      {overdueReminders.length > 0 && (
        <View className="bg-danger-50 px-4 py-3">
          <View className="flex-row items-center">
            <FontAwesome name="exclamation-circle" size={16} color="#dc2626" />
            <Text className="ml-2 text-sm font-medium text-danger-700">
              {overdueReminders.length} overdue bill{overdueReminders.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row bg-white px-4 py-2 border-b border-surface-100">
        <Pressable
          onPress={() => setActiveTab('upcoming')}
          className={`flex-1 items-center py-2 rounded-lg ${
            activeTab === 'upcoming' ? 'bg-primary-50' : ''
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              activeTab === 'upcoming' ? 'text-primary-600' : 'text-surface-500'
            }`}
          >
            Upcoming ({upcomingReminders.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('paid')}
          className={`flex-1 items-center py-2 rounded-lg ${
            activeTab === 'paid' ? 'bg-primary-50' : ''
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              activeTab === 'paid' ? 'text-primary-600' : 'text-surface-500'
            }`}
          >
            Paid ({paidReminders.length})
          </Text>
        </Pressable>
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {displayList.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome
              name={activeTab === 'upcoming' ? 'bell-o' : 'check-circle'}
              size={48}
              color="#cbd5e1"
            />
            <Text className="mt-4 text-base text-surface-400">
              {activeTab === 'upcoming'
                ? 'No upcoming reminders'
                : 'No paid bills yet'}
            </Text>
          </View>
        ) : (
          displayList.map((reminder) => {
            const isOverdue =
              !reminder.is_paid && new Date(reminder.due_date) < new Date();

            return (
              <Card key={reminder.id} variant="elevated" className="mb-3">
                <View className="flex-row items-start">
                  <View
                    className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
                      isOverdue
                        ? 'bg-danger-50'
                        : reminder.is_paid
                        ? 'bg-accent-50'
                        : 'bg-warning-50'
                    }`}
                  >
                    <FontAwesome
                      name={
                        reminder.is_paid
                          ? 'check-circle'
                          : isOverdue
                          ? 'exclamation-circle'
                          : 'bell'
                      }
                      size={18}
                      color={
                        isOverdue
                          ? '#dc2626'
                          : reminder.is_paid
                          ? '#16a34a'
                          : '#d97706'
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-surface-900">
                      {reminder.title}
                    </Text>
                    {reminder.description && (
                      <Text className="mt-0.5 text-xs text-surface-500">
                        {reminder.description}
                      </Text>
                    )}
                    <Text
                      className={`mt-1 text-xs ${
                        isOverdue ? 'text-danger-600 font-medium' : 'text-surface-400'
                      }`}
                    >
                      {reminder.is_paid
                        ? `Paid ${formatDate(reminder.paid_date!)}`
                        : isOverdue
                        ? `Overdue - was due ${formatDate(reminder.due_date)}`
                        : `Due ${getRelativeDate(reminder.due_date)}`}
                    </Text>
                    {reminder.source !== 'manual' && (
                      <View className="mt-1 self-start rounded-full bg-primary-50 px-2 py-0.5">
                        <Text className="text-xs text-primary-600">
                          {reminder.source === 'sms_detected'
                            ? 'SMS'
                            : reminder.source === 'email_detected'
                            ? 'Email'
                            : reminder.source === 'receipt_detected'
                            ? 'Receipt'
                            : 'Recurring'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="items-end">
                    {reminder.amount && (
                      <Text className="text-sm font-bold text-surface-900">
                        {formatCurrency(reminder.amount)}
                      </Text>
                    )}
                    {!reminder.is_paid && (
                      <View className="mt-2 flex-row gap-2">
                        <Pressable
                          onPress={() => handlePay(reminder.id, reminder.title)}
                          className="rounded-lg bg-accent-50 px-3 py-1.5"
                        >
                          <Text className="text-xs font-medium text-accent-700">
                            Pay
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(reminder.id, reminder.title)}
                          className="rounded-lg bg-surface-100 px-2 py-1.5"
                        >
                          <FontAwesome name="trash-o" size={12} color="#94a3b8" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white"
        >
          <View className="flex-row items-center justify-between border-b border-surface-200 px-4 py-4">
            <Pressable onPress={() => setShowAddModal(false)}>
              <Text className="text-base text-surface-500">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold text-surface-900">
              Add Reminder
            </Text>
            <View className="w-12" />
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Bill Name"
                  placeholder="e.g., Meralco, PLDT, Globe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Amount (optional)"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  leftIcon={<Text className="text-base text-surface-400">₱</Text>}
                />
              )}
            />

            <Controller
              control={control}
              name="due_date"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Due Date"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                  error={errors.due_date?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Notes (optional)"
                  placeholder="Add any notes..."
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                />
              )}
            />

            <View className="mb-8 mt-4">
              <Button
                title="Create Reminder"
                onPress={handleSubmit(onSubmit)}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
