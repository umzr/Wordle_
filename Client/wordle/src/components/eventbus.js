const eventBus = {
  listeners: {},

  on(event, callback) {
    // Create a unique function reference that wraps the callback
    const listener = (e) => callback(e.detail);

    // Store the listener so it can be removed later
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push({ callback, listener });

    // Add the event listener
    document.addEventListener(event, listener);
  },

  off(event, callback) {
    if (!this.listeners[event]) return;

    // Find the listener stored for this callback
    const index = this.listeners[event].findIndex(
      (item) => item.callback === callback
    );
    if (index !== -1) {
      const { listener } = this.listeners[event][index];
      document.removeEventListener(event, listener);
      this.listeners[event].splice(index, 1);
    }
  },

  dispatch(event, data) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  },

  remove(event, callback) {
    this.off(event, callback);
  },
};

export default eventBus;
