import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button, Card } from '@/src/components/ui';
import { usePriceStore, PriceItem } from '@/src/stores/priceStore';

const CATEGORIES = ['All', 'Groceries', 'Utilities', 'Transport', 'Dining', 'Healthcare', 'Other'];

function PriceChangeIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return null;
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.01) {
    return (
      <View className="rounded-full bg-surface-100 dark:bg-surface-700 px-2 py-0.5">
        <Text className="text-xs text-surface-500 dark:text-surface-400">0%</Text>
      </View>
    );
  }
  const isUp = change > 0;
  return (
    <View className={`rounded-full px-2 py-0.5 ${isUp ? 'bg-danger-50' : 'bg-accent-50'}`}>
      <Text className={`text-xs font-medium ${isUp ? 'text-danger-600' : 'text-accent-600'}`}>
        {isUp ? '+' : ''}{change.toFixed(1)}%
      </Text>
    </View>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function PriceMonitor() {
  const { items, addItem, updatePrice, removeItem } = usePriceStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [updateItemId, setUpdateItemId] = useState<string | null>(null);
  const [newPriceText, setNewPriceText] = useState('');

  // Add form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Groceries');
  const [formUnit, setFormUnit] = useState('');
  const [formLocation, setFormLocation] = useState('');

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((i) => i.category === selectedCategory);

  const handleAddItem = () => {
    if (!formName.trim() || !formPrice.trim()) {
      Alert.alert('Error', 'Name and price are required');
      return;
    }
    addItem({
      name: formName.trim(),
      current_price: parseFloat(formPrice),
      category: formCategory,
      unit: formUnit.trim() || 'pc',
      location: formLocation.trim() || '',
      currency: 'PHP',
    });
    setFormName('');
    setFormPrice('');
    setFormUnit('');
    setFormLocation('');
    setShowAddModal(false);
  };

  const handleUpdatePrice = () => {
    if (!updateItemId || !newPriceText.trim()) return;
    updatePrice(updateItemId, parseFloat(newPriceText));
    setUpdateItemId(null);
    setNewPriceText('');
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert('Delete Item', `Remove "${name}" from tracking?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeItem(id) },
    ]);
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3 max-h-14">
        <View className="flex-row gap-2">
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 ${
                selectedCategory === cat ? 'bg-primary-600' : 'bg-surface-100 dark:bg-surface-700'
              }`}
            >
              <Text className={`text-sm font-medium ${
                selectedCategory === cat ? 'text-white' : 'text-surface-600 dark:text-surface-300'
              }`}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ScrollView className="flex-1 px-4">
        {filteredItems.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="tags" size={48} color="#cbd5e1" />
            <Text className="mt-4 text-base text-surface-400">No items tracked</Text>
            <Text className="mt-1 text-sm text-surface-400">Tap + to start tracking prices</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} variant="elevated" className="mb-3">
              <Pressable onPress={() => { setUpdateItemId(item.id); setNewPriceText(item.current_price.toString()); }}>
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                        {item.name}
                      </Text>
                      <PriceChangeIndicator current={item.current_price} previous={item.previous_price} />
                    </View>
                    <View className="mt-1 flex-row items-center gap-2">
                      <Text className="text-lg font-bold text-primary-600">
                        ₱{item.current_price.toFixed(2)}
                      </Text>
                      <Text className="text-xs text-surface-400">/{item.unit}</Text>
                    </View>
                    <View className="mt-1 flex-row items-center gap-3">
                      {item.location ? (
                        <View className="flex-row items-center gap-1">
                          <FontAwesome name="map-marker" size={10} color="#94a3b8" />
                          <Text className="text-xs text-surface-400">{item.location}</Text>
                        </View>
                      ) : null}
                      <Text className="text-xs text-surface-400">{formatRelativeTime(item.updated_at)}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="rounded-full bg-surface-100 dark:bg-surface-700 px-2 py-0.5">
                      <Text className="text-xs text-surface-500 dark:text-surface-400">{item.category}</Text>
                    </View>
                    <Pressable onPress={() => handleDeleteItem(item.id, item.name)} className="p-1">
                      <FontAwesome name="trash-o" size={14} color="#94a3b8" />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setShowAddModal(true)}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary-600 shadow-lg active:bg-primary-700"
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Add Item Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white dark:bg-surface-900">
          <View className="flex-row items-center justify-between border-b border-surface-200 dark:border-surface-700 px-4 py-4">
            <Pressable onPress={() => setShowAddModal(false)}>
              <Text className="text-base text-surface-500 dark:text-surface-400">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">Add Item</Text>
            <View className="w-12" />
          </View>
          <ScrollView className="flex-1 px-4 pt-4">
            <Text className="mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">Item Name</Text>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g., Rice (Sinandomeng)"
              placeholderTextColor="#94a3b8"
              className="mb-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3 text-base text-surface-900 dark:text-surface-100"
            />

            <Text className="mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">Price (PHP)</Text>
            <TextInput
              value={formPrice}
              onChangeText={setFormPrice}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              className="mb-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3 text-base text-surface-900 dark:text-surface-100"
            />

            <Text className="mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setFormCategory(cat)}
                    className={`rounded-full px-4 py-2 ${
                      formCategory === cat ? 'bg-primary-600' : 'bg-surface-100 dark:bg-surface-700'
                    }`}
                  >
                    <Text className={`text-sm ${
                      formCategory === cat ? 'text-white' : 'text-surface-600 dark:text-surface-300'
                    }`}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text className="mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">Unit</Text>
            <TextInput
              value={formUnit}
              onChangeText={setFormUnit}
              placeholder="e.g., kg, L, pc"
              placeholderTextColor="#94a3b8"
              className="mb-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3 text-base text-surface-900 dark:text-surface-100"
            />

            <Text className="mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">Location (optional)</Text>
            <TextInput
              value={formLocation}
              onChangeText={setFormLocation}
              placeholder="e.g., SM Supermarket"
              placeholderTextColor="#94a3b8"
              className="mb-6 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3 text-base text-surface-900 dark:text-surface-100"
            />

            <Button title="Add Item" onPress={handleAddItem} fullWidth size="lg" />
            <View className="h-8" />
          </ScrollView>
        </View>
      </Modal>

      {/* Update Price Modal */}
      <Modal visible={updateItemId !== null} animationType="fade" transparent>
        <Pressable onPress={() => setUpdateItemId(null)} className="flex-1 justify-center bg-black/50 px-6">
          <Pressable className="rounded-2xl bg-white dark:bg-surface-800 p-6">
            <Text className="text-lg font-bold text-surface-900 dark:text-surface-100 text-center mb-4">
              Update Price
            </Text>
            <TextInput
              value={newPriceText}
              onChangeText={setNewPriceText}
              placeholder="New price"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              autoFocus
              className="mb-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3 text-center text-xl font-bold text-surface-900 dark:text-surface-100"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Cancel" onPress={() => setUpdateItemId(null)} variant="secondary" fullWidth />
              </View>
              <View className="flex-1">
                <Button title="Update" onPress={handleUpdatePrice} fullWidth />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
