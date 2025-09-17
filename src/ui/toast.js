import Alpine from 'alpinejs';

export function registerToastStore() {
  Alpine.store('toast', {
    items: [],
    show(message, type = 'info') {
      const id = crypto.randomUUID();
      this.items.push({ id, message, type });
      setTimeout(() => {
        this.items = this.items.filter((item) => item.id !== id);
      }, 5000);
    },
    clear() {
      this.items = [];
    },
  });
}
