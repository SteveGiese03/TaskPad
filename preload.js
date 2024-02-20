const {contextBridge, ipcRenderer} = require('electron')

//(section) => ipcRenderer.invoke('recieve', section)
contextBridge.exposeInMainWorld('data', {
    receive: (section) => ipcRenderer.invoke('recieve', section),
    save: (section, toSave) => ipcRenderer.invoke('save', section, toSave)
});