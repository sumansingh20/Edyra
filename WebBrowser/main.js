const path = require('path');
const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const fs = require('fs');

const isDev = !app.isPackaged;

const createDataDirs = () => {
  const userData = app.getPath('userData');
  const configDir = path.join(userData, 'config');
  const downloadsDir = path.join(userData, 'downloads');
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(downloadsDir, { recursive: true });
  return { userData, configDir, downloadsDir };
};

const safeUrlToLoad = (inputUrl) => {
  if (!inputUrl) return 'https://www.google.com';
  try {
    const u = new URL(inputUrl);
    return u.toString();
  } catch {
    // Try to treat as https://{query}
    return `https://${String(inputUrl).trim()}`;
  }
};

/**
 * Security hardening:
 * - Disable nodeIntegration in renderer
 * - Enable contextIsolation
 * - Use secure preload.js
 * - Lock down navigation to only http(s) + chrome://devtools (via devtools toggle)
 */
const createBrowserWindow = async (opts = {}) => {
  const { isIncognito = false } = opts;

  const data = createDataDirs();

  // Separate session for incognito.
  const ses = isIncognito
    ? session.fromPartition(`persist:edyra-incognito-${app.getInstanceCount()}`)
    : session.fromPartition('persist:edyra-default');

  // Incognito session should not persist cookies/history.
  if (isIncognito) {
    ses.clearStorageData().catch(() => {});
    // storage partition is ephemeral for this instance; also block persistence.
  }

  // Download directory for this session.
  ses.setDownloadPath?.(data.downloadsDir);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: '#0b1220',
    webPreferences: {
      session: ses,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: true,
    },
  });

  // Intercept downloads and report progress via IPC.
  ses.on('will-download', (event, item) => {
    const url = item.getURL();
    const filename = item.getFilename();
    item.setSavePath(path.join(data.downloadsDir, filename));

    win.webContents.send('downloads:created', {
      id: `${Date.now()}-${Math.random()}`,
      url,
      filename,
      totalBytes: item.getTotalBytes(),
      receivedBytes: item.getReceivedBytes(),
      state: 'in_progress',
      savePath: item.getSavePath(),
    });

    item.on('updated', (e, state) => {
      win.webContents.send('downloads:updated', {
        id: `${Date.now()}-${Math.random()}`,
        state,
        totalBytes: item.getTotalBytes(),
        receivedBytes: item.getReceivedBytes(),
      });
    });

    item.once('done', (e, state) => {
      win.webContents.send('downloads:done', {
        state,
        savePath: item.getSavePath(),
        filename: item.getFilename(),
      });
      if (state === 'completed') {
        // no auto-open; user will control from UI.
      }
    });
  });

  const indexPath = path.join(__dirname, 'renderer', 'index.html');
  win.loadFile(indexPath);

  // Lock navigation to http(s)
  const enforceSafeURL = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'about:';
    } catch {
      return false;
    }
  };

  win.webContents.on('will-navigate', (e, url) => {
    if (!enforceSafeURL(url)) e.preventDefault();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!enforceSafeURL(url)) return { action: 'deny' };
    // open in same window tab mode via renderer IPC
    win.webContents.send('navigation:new-window', { url: safeUrlToLoad(url) });
    return { action: 'deny' };
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    win.webContents.once('did-frame-finish-load', () => {
      // DevTools are controlled by UI.
    });
  }

  return win;
};

let mainWindow;

app.whenReady().then(async () => {
  mainWindow = await createBrowserWindow({ isIncognito: false });

  ipcMain.handle('app:open-url', (e, url) => {
    // Forward to renderer to navigate active tab.
    mainWindow.webContents.send('navigation:go', { url: safeUrlToLoad(url) });
    return true;
  });

  ipcMain.handle('app:open-incognito', async () => {
    // For simplicity, single window supports incognito via session switching; however
    // Electron can only have one session per BrowserWindow. We'll spawn a new incognito window.
    const incWin = await createBrowserWindow({ isIncognito: true });
    return true;
  });

  ipcMain.handle('app:reveal-in-folder', (e, filePath) => {
    if (filePath) shell.showItemInFolder(filePath);
    return true;
  });

  ipcMain.handle('app:get-environment', () => ({ isDev }));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createBrowserWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

