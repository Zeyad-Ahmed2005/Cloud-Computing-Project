const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Docker API
  docker: {
    listImages: () => ipcRenderer.invoke('docker:listImages'),
    listContainers: () => ipcRenderer.invoke('docker:listContainers'),
    listRunningContainers: () => ipcRenderer.invoke('docker:listRunningContainers'),
    createDockerfile: (path, code) => ipcRenderer.invoke('docker:createDockerfile', path, code),
    buildImage: (path, tag) => ipcRenderer.invoke('docker:buildImage', path, tag),
    stopContainer: (id) => ipcRenderer.invoke('docker:stopContainer', id),
    startContainer: (id) => ipcRenderer.invoke('docker:startContainer', id),
    createContainer: (image, name, ports, envVars) => 
      ipcRenderer.invoke('docker:createContainer', image, name, ports, envVars),
    deleteContainer: (id, force) => ipcRenderer.invoke('docker:deleteContainer', id, force),
    deleteImage: (id, force) => ipcRenderer.invoke('docker:deleteImage', id, force),
    getContainerLogs: (id, tail) => ipcRenderer.invoke('docker:getContainerLogs', id, tail),
    getContainerStats: (id) => ipcRenderer.invoke('docker:getContainerStats', id),
    searchDockerhub: (name) => ipcRenderer.invoke('docker:searchDockerhub', name),
    pullImage: (name) => ipcRenderer.invoke('docker:pullImage', name),
    searchImageLocal: (name) => ipcRenderer.invoke('docker:searchImageLocal', name)
  },
  
  // QEMU API
  qemu: {
    startVM: (cpuCores, ramSize, diskPath, isoPath) => 
      ipcRenderer.invoke('qemu:startVM', cpuCores, ramSize, diskPath, isoPath),
    createVMFromConfig: (configFilePath) => 
      ipcRenderer.invoke('qemu:createVMFromConfig', configFilePath),
    deleteVM: (diskPath) => ipcRenderer.invoke('qemu:deleteVM', diskPath),
    listRunningVMs: () => ipcRenderer.invoke('qemu:listRunningVMs'),
    stopVM: (pid) => ipcRenderer.invoke('qemu:stopVM', pid),
    createDiskImage: (imagePath, size) => 
      ipcRenderer.invoke('qemu:createDiskImage', imagePath, size)
  },
  
  // Dialog API
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options)
  },
  
  // File API
  file: {
    read: (filePath) => ipcRenderer.invoke('file:read', filePath),
    write: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content)
  }
});

