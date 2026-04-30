"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendInputState: (state) => electron.ipcRenderer.send("input:state", state),
  onLog: (callback) => electron.ipcRenderer.on("log:append", callback),
  toggleTranslator: (enabled) => electron.ipcRenderer.send("translator:toggle", enabled),
  saveCalibration: (mapping) => electron.ipcRenderer.send("calibration:save", mapping),
  getCalibration: () => electron.ipcRenderer.invoke("calibration:get"),
  getSettings: () => electron.ipcRenderer.invoke("settings:get"),
  onTranslatorUpdate: (callback) => electron.ipcRenderer.on("translator:update", callback),
  updateSettings: (settings) => electron.ipcRenderer.send("translator:updateSettings", settings),
  testKey: (key) => electron.ipcRenderer.send("output:test", key),
  testVigemKey: (key) => electron.ipcRenderer.send("output:testVigem", key),
  debugStatus: () => electron.ipcRenderer.invoke("debug:status")
});
