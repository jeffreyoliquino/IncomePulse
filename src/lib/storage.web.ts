export function createMMKVStorage(_id: string) {
  return {
    getItem: (name: string) => {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(name);
      }
      return null;
    },
    setItem: (name: string, value: string) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(name, value);
      }
    },
    removeItem: (name: string) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(name);
      }
    },
  };
}
