import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendInputState: (state: any) => ipcRenderer.send('input:state', state),
  onLog: (callback: (event: any, message: string) => void) => ipcRenderer.on('log:append', callback),
  toggleTranslator: (enabled: boolean) => ipcRenderer.send('translator:toggle', enabled),
  saveCalibration: (mapping: any) => ipcRenderer.send('calibration:save', mapping),
  getCalibration: () => ipcRenderer.invoke('calibration:get'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  onTranslatorUpdate: (callback: (event: any, state: any) => void) => ipcRenderer.on('translator:update', callback),
  updateSettings: (settings: any) => ipcRenderer.send('translator:updateSettings', settings),
  testKey: (key: string) => ipcRenderer.send('output:test', key),
  testVigemKey: (key: string) => ipcRenderer.send('output:testVigem', key),
  debugStatus: () => ipcRenderer.invoke('debug:status'),
})
