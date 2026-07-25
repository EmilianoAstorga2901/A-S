const memoryStorage = new Map();

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return {
    getItem: key => memoryStorage.get(key) ?? null,
    setItem: (key, value) => memoryStorage.set(key, value),
    removeItem: key => memoryStorage.delete(key),
  };
}

export function createRepository(key, defaultValue) {
  return {
    get() {
      try {
        const value = getStorage().getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    save(value) {
      getStorage().setItem(key, JSON.stringify(value));
      return value;
    },
    update(updater) {
      const updated = updater(this.get());
      return this.save(updated);
    },
    clear() {
      getStorage().removeItem(key);
    },
  };
}
