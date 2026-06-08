const { contextBridge, ipcRenderer } = require('electron');

// Safer bridge: expose minimal API surface.
const api = {
  on: (channel, listener) => {
    ipcRenderer.on(channel, (event, ...args) => listener(...args));
  },
  send: (channel, payload) => {
    ipcRenderer.send(channel, payload);
  },
  invoke: (channel, payload) => {
    return ipcRenderer.invoke(channel, payload);
  },
  webContentsOpenDevTools: () => ipcRenderer.invoke('devtools:open'),
};

contextBridge.exposeInMainWorld('edyraBrowser', api);

