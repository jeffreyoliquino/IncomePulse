import AsyncStorage from '@react-native-async-storage/async-storage';

export function createMMKVStorage(id: string) {
  const prefix = `${id}:`;
  return {
    getItem: (name: string) => AsyncStorage.getItem(prefix + name),
    setItem: (name: string, value: string) => AsyncStorage.setItem(prefix + name, value),
    removeItem: (name: string) => AsyncStorage.removeItem(prefix + name),
  };
}
