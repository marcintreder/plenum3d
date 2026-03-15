export const ExtensionManager = {
  plugins: [],
  register: (plugin) => {
    ExtensionManager.plugins.push(plugin);
    console.log('Plugin registered:', plugin.name);
  }
};
