const { app, BrowserWindow, Menu, shell, ipcMain, session } = require('electron');
const Store = require('electron-store');
const contextMenu = require('electron-context-menu');
const path = require('path');
const pjson = require("./package.json");

// const SLACK_FILE_SERVER = "https://files.slack.com/";

// Detecta si la app está en modo desarrollo o producción
const isDev = !app.isPackaged;

// URL base según el entorno
const DEBUG_URL = 'http://localhost:5000/skylab-main';
const PROD_URL = 'https://skylab.labit.es';

// Detecta el sistema operativo actual
const OS = process.platform === "darwin" ? "mac" : process.platform === "win32" ? "win" : "linux";

// Construye la URL final que se cargará en la ventana principal
// Incluye versión del bundle y sistema operativo como parámetros
const URL = (isDev ? DEBUG_URL : PROD_URL) + "?skylab-version=" + pjson.bundleVersion + "&os=" + OS;

const icon = {
  "mac": path.join("assets", "icons", "mac", "icon.icns"),
  "linux": path.join("assets", "icons", "png", "icon96x96.png"),
  "win": path.join("assets", "icons", "win", "icon.ico")
}

const store = new Store();

let downloadWindowProperties = {
  width: 0,
  height: 0,
  x: 0,
  y: 0
};

let mainWindow, downloadWindow;
let zoomLevel = store.get('window.zoom') || 0;
let currentDownloadAction = '';
let currentDownloadID = '';
let cancelDownloadMethod = 'cancelInModalWindow';
let isQuitting = false;
let items = { arr: [] };

const MENU = [
  {
    label: 'Options',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'togglefullscreen' },
      { role: 'toggledevtools' },
      {
        label: 'Exit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
        click: () => { app.exit(); }
      }
    ]
  }, {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  }, {
    label: 'Skylab Window',
    submenu: [
      {
        label: 'Zoom Reset',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Space' : 'Alt+Shift+Space',
        click: () => { zoomReset(); }
      }, {
        label: 'Zoom In',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Up' : 'Alt+Shift+Up',
        click: () => { zoomIn(); }
      }, {
        label: 'Zoom Out',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Down' : 'Alt+Shift+Down',
        click: () => { zoomOut(); }
      }
    ]
  }, {
    label: 'IFrames',
    submenu: [
      {
        role: 'resetzoom',
        label: 'Zoom Reset'
      }, {
        role: 'zoomin',
        label: 'Zoom In'
      }, {
        role: 'zoomout',
        label: 'Zoom Out'
      }, {
        type: 'separator'
      },
      {
        label: 'Toggle Navigation Menu',
        accelerator: 'Shift+4',
      },
    ]
  }
];

contextMenu({/* 
  prepend: (defaultActions, params, browserWindow) => [
    {
      label: "Open in default browser",
      // Only show it when right-clicking links
      visible: params.linkURL.trim().length > 0,
      click: () => {
        shell.openExternal(params.linkURL.trim());
      },
    },
    {
      label: "Copy URL in Clipboard",
      click: () => {
        console.log({url: webContents.getURL(), u2: params.linkURL})
        clipboard.writeText(webContents.getURL().trim());
      },
    },
  ], */


  showSaveImageAs: true,
  showInspectElement: false,
  showCopyLink: true
});

const saveMainWindowProperties = () => {
  const size = mainWindow.getSize();
  const position = mainWindow.getPosition();
  const maximized = mainWindow.isMaximized();
  const windowProps = {
    window: {
      size: {
        width: size[0],
        height: size[1]
      },
      position: {
        x: position[0],
        y: position[1]
      },
      maximized: maximized
    }
  }
  store.set(windowProps);
};

const createWindow = () => {
  const size = store.get('window.size') || { width: 1000, height: 800 };
  const position = store.get('window.position') || { x: 500, y: 200 };
  const options = {
    width: size.width < 50 ? 800 : size.width,
    height: size.height < 50 ? 800 : size.height,
    x: position.x,
    y: position.y,

    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: true
      // default: true -- Para ejecutar apis de electron y preload en otro contexto (mal)
      /* lo mas seguro
      webSecurity: false, // default: true
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      sandbox: true,
      */
    },
    icon: path.join(__dirname, icon[OS])
  }
  mainWindow = new BrowserWindow(options);

  mainWindow.show();
  mainWindow.loadURL(URL);

  mainWindow.on('resized', () => {
    resizeDownloadWindow();
    saveMainWindowProperties();
  });

  mainWindow.on('moved', () => {
    resizeDownloadWindow();
    saveMainWindowProperties();
  });

  mainWindow.on('close', (event) => {
    // Guardar propiedades de forma segura
    try {
      saveMainWindowProperties();
      store.set('window.zoom', zoomLevel);
    } catch (err) {
      console.error('Error guardando propiedades de ventana:', err);
    }

    // Si no estamos ya en proceso de cierre, forzar limpieza
    if (!isQuitting) {
      isQuitting = true;

      // Cancelar todas las descargas activas
      try {
        if (items && items.arr) {
          items.arr.forEach((item) => {
            try {
              if (item && !item.isDestroyed && item.getState && item.getState() === 'progressing') {
                item.cancel();
              }
            } catch (e) {
              // Ignorar errores en items ya destruidos
            }
          });
          items = { arr: [] };
        }
      } catch (err) {
        console.error('Error cancelando descargas:', err);
      }

      // Destruir la ventana de descargas
      try {
        if (downloadWindow && !downloadWindow.isDestroyed()) {
          downloadWindow.removeAllListeners();
          downloadWindow.destroy();
          downloadWindow = null;
        }
      } catch (err) {
        console.error('Error destruyendo downloadWindow:', err);
      }

      // Cerrar todas las ventanas hijas que puedan quedar abiertas
      try {
        const allWindows = BrowserWindow.getAllWindows();
        allWindows.forEach((win) => {
          if (win !== mainWindow && !win.isDestroyed()) {
            win.removeAllListeners();
            win.destroy();
          }
        });
      } catch (err) {
        console.error('Error cerrando ventanas hijas:', err);
      }
    }
  });

  // Forzar cierre si la ventana queda en estado "zombie"
  mainWindow.on('unresponsive', () => {
    console.warn('⚠️ mainWindow no responde, forzando cierre...');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
    }
  });

  // Limpiar referencia cuando la ventana se destruye
  mainWindow.on('closed', () => {
    mainWindow = null;
    downloadWindow = null;
  });
};

const zoomIn = () => {
  zoomLevel += 0.050;
  if (zoomLevel > 3) zoomLevel = 3;
  mainWindow.webContents.setZoomLevel(zoomLevel);
};

const zoomOut = () => {
  zoomLevel -= 0.050;
  if (zoomLevel < -3) zoomLevel = -3;
  mainWindow.webContents.setZoomLevel(zoomLevel);
};

const zoomReset = () => {
  zoomLevel = 0;
  mainWindow.webContents.setZoomLevel(0);
};

const resizeDownloadWindow = () => {
  if (downloadWindow !== null && downloadWindow !== undefined && !downloadWindow.isDestroyed()) {
    try {
      downloadWindow.setSize(downloadWindowProperties.width, downloadWindowProperties.height + 20);
      downloadWindow.setMaximumSize(downloadWindowProperties.width, downloadWindowProperties.height + 20);
      downloadWindow.setPosition(downloadWindowProperties.x - 4, downloadWindowProperties.y - 4);
    } catch (err) {
      console.warn('⚠️ Error redimensionando downloadWindow:', err.message);
    }
  }
};

const createDownloadWindow = async () => {
  downloadWindow = new BrowserWindow({
    width: 0,
    height: 0,
    frame: false,
    fullscreenable: false,
    parent: mainWindow,
    useContentSize: false,
    movable: false,
    closable: false,
    focusable: false,
    alwaysOnTop: false,
    resizable: false,
    type: 'toolbar',
    transparent: true,
    show: true,
    hasShadow: false,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      contextIsolation: true,
    }
  });

  downloadWindow.hide();
  resizeDownloadWindow();
  downloadWindow.loadFile(path.join(__dirname, 'downloadProgress', 'downloadProgress.html'));
};

const closeDownloadWindow = () => {
  resizeDownloadWindow();
  downloadWindow.hide();
};

ipcMain.on('openFolder', (event, arg) => {
  if (arg.fullPath === '') {
    shell.showItemInFolder(app.getPath('downloads'));
  } else {
    shell.showItemInFolder(arg.fullPath);
  }
});

ipcMain.on('removeFile', (event, arg) => {
  if (arg.cancelDownload) {
    currentDownloadAction = 'cancel';
    currentDownloadID = arg.id;
    cancelDownloadMethod = 'buttonPressed';
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.downloadURL(arg.url);
    }
  }

  if (arg.closeDownloadWindow) {
    closeDownloadWindow(true);
  }
});

ipcMain.on('resizeWindow', (event, arg) => {
  if (!downloadWindow || downloadWindow.isDestroyed()) {
    console.warn("⚠️ resizeWindow ignorado: downloadWindow no disponible");
    return;
  }

  const w = arg.width;
  const h = arg.height;
  const mainWindowPosition = mainWindow.getPosition();
  const mainWindowSize = mainWindow.getSize();
  const x = mainWindowPosition[0] + mainWindowSize[0] - w - 1;
  const y = mainWindowPosition[1] + mainWindowSize[1] - h - 1;

  downloadWindowProperties = {
    width: w,
    height: h,
    x: x,
    y: y
  };

  resizeDownloadWindow();
});

/**
 * Evita que se generen ventanas nuevas si se hace click en un enlace que intenta abrir una pestaña nueva.
 * Además, permite abrir más instancias de skylab.
 */

app.on('browser-window-created', (e, bw) => {
  const wc = bw.webContents;
  wc.setWindowOpenHandler((details) => {
    const url = details.url;

    // URLs que deben abrirse en una ventana nueva de Electron (flujos OAuth, etc.)
    const allowInNewWindow = [
      'https://skylab.labit.es',
      'http://localhost',
      'https://login.microsoftonline.com',
      // OAuth de Autodesk: tu API backend que redirige a Autodesk
      'http://localhost:3000',
      'http://localhost:5000',
      'https://cloudadmin.labit.es',
      'https://developer.api.autodesk.com',
      'https://accounts.autodesk.com',
    ];

    // URLs que deben abrirse en el navegador externo del sistema
    // (útil como fallback para dominios desconocidos)
    const openExternally = [
      'https://accounts.autodesk.com',
    ];

    const shouldAllowNewWindow = allowInNewWindow.some(prefix => url.startsWith(prefix));

    if (shouldAllowNewWindow) {
      // Abrir en una nueva ventana de Electron (hija de mainWindow)
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: mainWindow,
          modal: false,
          width: 600,
          height: 720,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        }
      };
    }

    // Para cualquier otra URL: abrir en el navegador externo del sistema
    // y NO cargar en la ventana actual (evita sobrescribir la app)
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

/*

app.on('browser-window-created', (e, bw) => {
  console.log("Tengo sueño")
  const wc = bw.webContents;
  wc.setWindowOpenHandler((details) => {
    const url = details.url;
    if (!url.startsWith('https://skylab.labit.es') && !url.startsWith('http://localhost') && !url.startsWith('https://login.microsoftonline.com')) {
      wc.loadURL(url);
      return { action: 'deny' };
    } else {
      // const b = new BrowserWindow();
      // b.show();
      // b.loadURL(url);
      return { action: 'allow' };
    }
  });
});
*/

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // En todas las plataformas, salir cuando se cierran todas las ventanas
  app.quit();
});

/* START */

(async () => {
  const menu = new Menu.buildFromTemplate(MENU);
  Menu.setApplicationMenu(menu);

  app.commandLine.appendSwitch('disable-http-cache');
  await app.whenReady();

  // === UA REAL + " SkyLab" a nivel de sesión (para ventana y webviews) ===
  // 1) Toma el UA real del runtime de Electron (incluye Chrome/XX real).
  const realUA = session.defaultSession.getUserAgent();
  // 2) Añade tu marca como sufijo (necesario para getPlatform() en tu front).
  const brandedUA = `${realUA} SkyLab`;
  // 3) Fija el UA global de la sesión y el fallback del proceso.
  session.defaultSession.setUserAgent(brandedUA);
  app.userAgentFallback = brandedUA;

  createWindow();
  createDownloadWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  mainWindow.webContents.session.on('will-download', async (event, item, webContents) => {
    let bw = BrowserWindow.fromWebContents(webContents);
    const url = webContents.getURL();
    if (url === undefined || url === null || url === '') {
      bw.hide(); bw.close(); bw.destroy(); bw = null;
    }

    // El orden TIENE que quedarse asi, si no no funciona
    const downloadedFrom = item.getURL();
    let fileName = item.getFilename();
    const ext = path.extname(fileName).replace(/\./g, '').toUpperCase();
    const bytes = item.getTotalBytes();
    let id;

    if (currentDownloadAction === 'cancel') { // Cancelar la descarga cuando pulsas en la 'x' (gracias electron por facilitarme tanto la vida..., ah no)
      event.preventDefault();
      const index = items[currentDownloadID];
      items['arr'][index].cancel();
      cancelDownloadMethod = '';
    } else {
      cancelDownloadMethod = 'cancelInModalWindow';
      downloadWindow.show();

      id = Math.floor(Math.random() * 10000000);
      downloadWindow.webContents.send('newFile', {
        id: id,
        fileName: fileName,
        extension: ext,
        fullPath: '',
        bytes: bytes,
        downloadedFrom: downloadedFrom
      });

      items[id] = items.arr.length;
      items.arr.push(item);
    }

    currentDownloadAction = '';
    currentDownloadID = '';

    item.on('updated', (event, state) => {
      resizeDownloadWindow();
      if (state === 'interrupted') {
        console.log(`Descarga del archivo ${fileName} interrumpida`);
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log(`Descarga del archivo ${fileName} pausada`);
        } else {
          const perc = (item.getReceivedBytes() / bytes) * 100;
          if (downloadWindow !== null && downloadWindow !== undefined && item.getSavePath() !== '') {
            downloadWindow.webContents.send('downloadingFile', { id: id, perc: perc });
          }
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        const downloadPath = item.getSavePath();
        downloadWindow.webContents.send('fileDownloaded', { id: id, fullPath: downloadPath });
        console.log('completed');
      } else { // se hace esto para disparar la accion que cierra la ventana de descarga
        if (cancelDownloadMethod === 'cancelInModalWindow') {
          downloadWindow.webContents.send('downloadCancelled', { id: id });
        }
        cancelDownloadMethod = '';
        console.log('non completed');
      }
    });
  });
})();
