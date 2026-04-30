import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { inputHandler } from './services/InputHandler'
import { translator } from './services/Translator'
import { store } from './services/Store'
import { keyOutput } from './services/KeyOutput'
import { virtualController } from './services/VirtualController'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load saved calibration
const savedCalibration = store.get('calibration');
if (savedCalibration && Object.keys(savedCalibration).length > 0) {
  inputHandler.setFullMapping(savedCalibration);
}

const savedClutchAxis = store.get('clutchAxisIndex') ?? 1;
const savedSteeringAxis = store.get('steeringAxisIndex') ?? 0;
const savedThrottleAxis = store.get('throttleAxisIndex') ?? 2;
const savedBrakeAxis = store.get('brakeAxisIndex') ?? 3;
inputHandler.setAxesIndices(savedClutchAxis, savedSteeringAxis, savedThrottleAxis, savedBrakeAxis);

const savedSettings = store.get('settings');
if (savedSettings) {
  Object.assign(translator.settings, savedSettings);
  if (translator.settings.enabled && translator.settings.mode === 'vigem') {
    virtualController.plugin();
  }
}

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null
let _lastAxes: number[] = [];

// ─── IPC HANDLERS (process-level — must be registered once, not per window) ───

ipcMain.on('input:state', (_event, state) => {
  if (state.axes) _lastAxes = state.axes;
  inputHandler.handleState(state);
});

ipcMain.handle('debug:status', () => {
  return {
    bridgeConnected: virtualController.isConnected,
    translatorEnabled: translator.settings.enabled,
    translatorMode: translator.settings.mode,
    steeringAxisIndex: inputHandler.steeringAxisIndex,
    throttleAxisIndex: inputHandler.throttleAxisIndex,
    brakeAxisIndex: inputHandler.brakeAxisIndex,
    clutchAxisIndex: inputHandler.clutchAxisIndex,
    lastAxes: _lastAxes,
  };
});

ipcMain.handle('calibration:get', () => {
  return {
    mapping: inputHandler.getMapping(),
    clutchAxisIndex: inputHandler.clutchAxisIndex,
    steeringAxisIndex: inputHandler.steeringAxisIndex,
    throttleAxisIndex: inputHandler.throttleAxisIndex,
    brakeAxisIndex: inputHandler.brakeAxisIndex,
  };
});

ipcMain.handle('settings:get', () => {
  return translator.settings;
});

ipcMain.on('translator:toggle', (_event, enabled) => {
  translator.setEnable(enabled);
  console.log('Translator enabled:', enabled);
});

ipcMain.on('calibration:save', (_event, data) => {
  const { mapping, clutchAxisIndex, steeringAxisIndex, throttleAxisIndex, brakeAxisIndex } = data;
  store.set('calibration', mapping);
  store.set('clutchAxisIndex', clutchAxisIndex);
  store.set('steeringAxisIndex', steeringAxisIndex);
  store.set('throttleAxisIndex', throttleAxisIndex);
  store.set('brakeAxisIndex', brakeAxisIndex);
  inputHandler.setFullMapping(mapping);
  inputHandler.setAxesIndices(clutchAxisIndex, steeringAxisIndex, throttleAxisIndex, brakeAxisIndex);
});

ipcMain.on('translator:updateSettings', (_event, settings) => {
  const oldMode = translator.settings.mode;
  const oldEnabled = translator.settings.enabled;
  Object.assign(translator.settings, settings);
  store.set('settings', translator.settings);

  if (oldEnabled && oldMode !== translator.settings.mode) {
    if (translator.settings.mode === 'vigem') {
      virtualController.plugin();
    } else {
      virtualController.unplug();
    }
  }
});

ipcMain.on('output:test', (_event, key) => {
  keyOutput.tap(key);
});

ipcMain.on('output:testVigem', (_event, button) => {
  virtualController.plugin();      // no-op if already running
  virtualController.tap(button, 800); // tap() awaits READY internally
});

// ─── WINDOW ────────────────────────────────────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  })

  translator.onUpdate((state) => {
    win?.webContents.send('translator:update', state);
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
