const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("widgetApp", {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings) => ipcRenderer.invoke("settings:save", settings),
  setView: (view) => ipcRenderer.invoke("window:set-view", view),
  quit: () => ipcRenderer.send("app:quit"),
});