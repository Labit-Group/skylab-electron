const { app, BrowserWindow, Menu, MenuItem, shell, ipcMain } = require('electron')
const path = require('path');

//const DEBUG_URL = 'http://localhost:5000';
//const PROD_URL = 'https://skylab.labit.es';

const pjson = require("./package.json");
const OS = process.platform === "darwin" ? "mac" : "windows"; // darwin / win32 /  linux / others...

const PROD_URL = "https://skylab.labit.es?skylab-version=" + pjson.version + "&os=" + OS;


//const SLACK_FILE_SERVER = 'https://files.slack.com/';
const NEW_WINDOW_BROWSER_URL = '/openexternal';

const MENU = {
  label: 'Options',
  submenu: [
    { type: 'separator' },
    { role: 'reload' },
    { role: 'forcereload' },
    { role: 'togglefullscreen' },
    { role: 'toggledevtools' },
    { type: 'separator' },
    { role: 'resetzoom' },
    { role: 'zoomin' },
    { role: 'zoomout' },
    { type: 'separator' },

    {
      label: 'Zoom In',
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Up' : 'Alt+Shift+Up',
      click: () => { zoomIn(); }
    },
    {
      label: 'Zoom Out',
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Down' : 'Alt+Shift+Down',
      click: () => { zoomOut(); }
    },
    {
      label: 'Zoom Reset',
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+Space' : 'Alt+Shift+Space',
      click: () => { zoomReset(); }
    },

    {
      label: 'Toggle Navigation Menu',
      accelerator: 'Shift+4',
      click: () => {
        mainWindow.webContents.sendInputEvent({
          type: "keyDown",
          modifiers: ["shift"],
          keyCode: "4",
        });
        mainWindow.webContents.sendInputEvent({
          type: "char",
          modifiers: ["shift"],
          keyCode: "4",
        });
        mainWindow.webContents.sendInputEvent({
          type: "keyUp",
          modifiers: ["shift"],
          keyCode: "4",
        });
      }
    },
    
    { type: 'separator' },
    { role: 'about' },
    { role: 'help' }
  ]
};

let downloadWindowProperties = {
  width: 0,
  height: 0,
  x: 0,
  y: 0
};

let mainWindow, downloadWindow;
let zoomLevel = 0, closeWindowTimeout = 0;
let currentDownloadAction = '';
let currentDownloadID = '';

const createWindow = () => {
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, // default: false
      //webSecurity: false, // default: true
      nodeIntegration: true,
      contextIsolation: false, // default: true -- Para ejecutar apis de electron y preload en otro contexto (mal)
      
      /* lo mas seguro
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      sandbox: true,
      */
    },
    icon: path.join(__dirname, 'assets', 'skylab-dark.png')
  });
  mainWindow.maximize();
  mainWindow.show();
  
  mainWindow.loadURL(PROD_URL, {userAgent: 'SkyLab'});
};

const zoomIn = () => {
  zoomLevel += 0.025;
  if (zoomLevel > 3) zoomLevel = 3;
  mainWindow.webContents.setZoomLevel(zoomLevel);
};

const zoomOut = () => {
  zoomLevel -= 0.025;
  if (zoomLevel < -3) zoomLevel = -3;
  mainWindow.webContents.setZoomLevel(zoomLevel);
};

const zoomReset = () => {
  zoomLevel = 0;
  mainWindow.webContents.setZoomLevel(0);
};

const createMenu = () => {
  const menu = new Menu();
  menu.append(new MenuItem(MENU));

  Menu.setApplicationMenu(menu);
};

const resizeDownloadWindow = () => {
  downloadWindow.setSize(downloadWindowProperties.width, downloadWindowProperties.height + 20);
  downloadWindow.setMaximumSize(downloadWindowProperties.width, downloadWindowProperties.height + 20);
  downloadWindow.setPosition(downloadWindowProperties.x - 4, downloadWindowProperties.y - 4);
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
    alwaysOnTop: false,
    resizable: false,
    type: 'toolbar',
    transparent: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  resizeDownloadWindow();
  downloadWindow.loadFile(path.join(__dirname, 'downloadProgress', 'downloadProgress.html'));
  //downloadWindow.webContents.openDevTools();

  return new Promise((resolve) => { downloadWindow.webContents.on('did-finish-load', () => { setTimeout(() => resolve(), 500 ) }); });
};

ipcMain.on('closeDownloadWindow', (event, args) => {
  resizeDownloadWindow();
  if (args === 0) closeWindowTimeout = setTimeout(() => { 
    if (downloadWindow !== null) { 
      downloadWindow.destroy(); downloadWindow = null; 
    } 
  }, 5000);
});

ipcMain.on('openFile', (event, arg) => {
  if (arg.fullPath === '') {
    open(app.getPath('downloads'));
  } else {
    open(arg.fullPath);
  }
});

ipcMain.on('retryDownload', (event, arg) => {
  currentDownloadAction = 'retry';
  currentDownloadID = arg.id;
  mainWindow.webContents.downloadURL(arg.url);
});

/*
ipcMain.on('cancelDownload', (event, arg) => {
  if (arg.id !== null && arg.id !== undefined && arg.id !== '') {
    currentDownloadAction = 'cancel';
    currentDownloadID = arg.id;
    mainWindow.webContents.downloadURL(arg.url);
  }
});
*/

ipcMain.on('resizeWindow', (event, arg) => {
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

/* START */

(async () => {
  createMenu();

  app.commandLine.appendSwitch('disable-http-cache');
	await app.whenReady();
	createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('browser-window-created', (e, window) => {
    window.setMenu(null);

    window.webContents.on('new-window', (e, url) => {
      if (url.includes(NEW_WINDOW_BROWSER_URL + '/#/')) {
        e.preventDefault();
        const tokens = url.split('/#/');
        if (tokens.length > 1) {
          shell.openExternal(tokens[1]);
        }
      }
    });
  });

  mainWindow.webContents.session.on('will-download', async (event, item) => {

    if (!downloadWindow) await createDownloadWindow(); // SOLO UNA VENTANA DE DESCARGA

    if (closeWindowTimeout !== 0) {
      clearTimeout(closeWindowTimeout);
      closeWindowTimeout = 0;
    }

    let fileName = item.getFilename();
    const ext = path.extname(fileName).replace(/\./g, '').toUpperCase(); // Posiblemente quitar
    const bytes = item.getTotalBytes();
    const realPath = item.getSavePath();
    const downloadedFrom = item.getURL();
    //const basePath = app.getPath("downloads") + "/";

    //currentDownloadAction
    //currentDownloadID
    let id;
    
    switch(currentDownloadAction) {
      case 'retry':
        id = currentDownloadID;
        break;
    //case 'cancel':
    //  id = currentDownloadID;
    //  item.cancel();
    //  downloadWindow.webContents.send('downloadCancelled', { id: id });
    //  break;
      default:
        id = Math.floor(Math.random() * 10000000);
        downloadWindow.webContents.send('newFile', { 
          id: id,
          fileName: fileName,
          extension: ext,
          fullPath: realPath,
          bytes: bytes,
          downloadedFrom: downloadedFrom
        });
    }
    
    currentDownloadAction = '';
    currentDownloadID = '';

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log(`Descarga del archivo ${fileName} interrumpida`);
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log(`Descarga del archivo ${fileName} pausada`);
        } else {
          const perc = (item.getReceivedBytes() / bytes) * 100;
          downloadWindow.webContents.send('downloadingFile', { id: id, perc: perc }); // ERROR (dowloadWindow es null)
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        downloadWindow.webContents.send('fileDownloaded', { id: id });
        console.log('completed');
      } else {
        downloadWindow.webContents.send('downloadCancelled', { id: id });
        console.log('non completed');
      }
    });

  });
})();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  //progressInterval.forEach((e) => clearInterval(e));
});
