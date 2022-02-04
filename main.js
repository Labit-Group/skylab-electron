const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron')
const Store = require('electron-store');
const path = require('path');
const pjson = require("./package.json");

const SLACK_FILE_SERVER = "https://files.slack.com/";

const DEBUG_URL = 'http://localhost:5000';
const PROD_URL = 'https://skylab.labit.es';
const OS = process.platform === "darwin" ? "mac" : process.platform === "windows" ? "win" : "linux";
const URL = PROD_URL + "?skylab-version=" + pjson.version + "&os=" + OS;

const icon = {
  "mac": path.join("assets", "icons", "mac", "icon.icns"),
  "linux": path.join("assets", "icons", "png", "icon96x96.png"),
  "win": path.join("assets", "icons", "win", "icon.ico")
}

const store = new Store();

//const NEW_WINDOW_BROWSER_URL = '/openexternal';


let downloadWindowProperties = {
  width: 0,
  height: 0,
  x: 0,
  y: 0
};

let mainWindow, downloadWindow;
let zoomLevel = store.get('window.zoom') || 0; 
let closeWindowTimeout = 0;
let currentDownloadAction = '';
let currentDownloadID = '';
let cancelDownloadMethod = 'cancelInModalWindow';


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
        type: 'separator' },
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
    ]
  }
];

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
  let options;
  if (store.has('window.maximized') && store.has('window.maximized') && store.has('window.maximized')) {
    const size = store.get('window.size');
    const position = store.get('window.position');

    options = {
      width: size.width,
      height: size.height,
      x: position.x,
      y: position.y,
      
      show: false,
      webPreferences: {
        webviewTag: true,
        nodeIntegration: true,
        contextIsolation: false
      },
      icon: path.join(__dirname, icon[OS])
    }
  } else {
    options = {
      show: false,
      webPreferences: {
        
        //preload: path.join(__dirname, 'preload.js'),
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
      icon: path.join(__dirname, icon[OS])
    }
  }

  mainWindow = new BrowserWindow(options);

  //mainWindow.maximize();
  mainWindow.show();
  mainWindow.loadURL(URL, {userAgent: 'SkyLab'});

  mainWindow.on('resized', () => {
    saveMainWindowProperties();
  });
  
  mainWindow.on('moved', () => {
    saveMainWindowProperties();
  });
  
  mainWindow.on('close', () => {
    saveMainWindowProperties();
    store.set('window.zoom', zoomLevel);
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

const createMenu = () => {
  const menu = new Menu.buildFromTemplate(MENU);
  Menu.setApplicationMenu(menu);
};

const resizeDownloadWindow = () => {
  if (downloadWindow !== null && downloadWindow !== undefined) {
    downloadWindow.setSize(downloadWindowProperties.width, downloadWindowProperties.height + 20);
    downloadWindow.setMaximumSize(downloadWindowProperties.width, downloadWindowProperties.height + 20);
    downloadWindow.setPosition(downloadWindowProperties.x - 4, downloadWindowProperties.y - 4);
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

  return new Promise((resolve) => { downloadWindow.webContents.on('did-finish-load', () => { setTimeout(() => resolve(), 200 ) }); });
};

const closeDownloadWindow = (now) => { //Creo que nunca va a ser false
  resizeDownloadWindow();
  
  // Guardo el ID del timeout en una variable para poder cancelar la eliminacion de la ventana si descargo de nuevo
  closeWindowTimeout = setTimeout(() => {
    if (downloadWindow !== null) { 
      downloadWindow.destroy(); downloadWindow = null; 
    } 
  }, now ? 0 : 5000);
};

ipcMain.on('openFolder', (event, arg) => {
  if (arg.fullPath === '') {
    shell.showItemInFolder(app.getPath('downloads'));
  } else {
    shell.showItemInFolder(arg.fullPath);
  }
});
/*
ipcMain.on('retryDownload', (event, arg) => {
  currentDownloadAction = 'retry';
  currentDownloadID = arg.id;
  mainWindow.webContents.downloadURL(arg.url);
});
*/

/*
ipcMain.on('cancelDownload', (event, arg) => {
  if (arg.id !== null && arg.id !== undefined && arg.id !== '') {
    currentDownloadAction = 'cancel';
    currentDownloadID = arg.id;
    mainWindow.webContents.downloadURL(arg.url);
  }
});
*/

ipcMain.on('removeFile', (event, arg) => {
  if (arg.cancelDownload) {
    currentDownloadAction = 'cancel';
    currentDownloadID = arg.id;
    cancelDownloadMethod = 'buttonPressed';
    mainWindow.webContents.downloadURL(arg.url);
  }

  if (arg.closeDownloadWindow) {
    closeDownloadWindow(true);
  }
});

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
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

  app.on('browser-window-created', (e, browserWindow) => {
    const initialPosition = browserWindow.getPosition();
    browserWindow.setSize(0, 0, false);
    browserWindow.setPosition(-200, -200);
    
    browserWindow.webContents.on('will-navigate', (e,url) => {
      if (url.startsWith(SLACK_FILE_SERVER) || url === undefined || url === null || url === '') {
        e.preventDefault();
        browserWindow.close();
        browserWindow.destroy();
        browserWindow = null;
      } else {
        browserWindow.setPosition(initialPosition[0], initialPosition[1]);
        browserWindow.setSize(800, 600, false);
        browserWindow.show();
      }
    });
  });

  let items = {
    'arr': []
  };
  mainWindow.webContents.session.on('will-download', async (event, item) => {
    // Cancelar el cierre de la ventana si se ha disparado el evento
    if (closeWindowTimeout !== 0) {
      clearTimeout(closeWindowTimeout);
      closeWindowTimeout = 0;
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
      
      if (!downloadWindow) await createDownloadWindow(); // SOLO UNA VENTANA DE DESCARGA

      await new Promise(resolve => setTimeout(resolve, 1000)); // Espero un segundo para que la ventana de descarga cargue completamente
      const bws = BrowserWindow.getAllWindows();

      bws.forEach((e) => {
        const wc = e.webContents;
        const url = wc.getURL();
        if (url === '') { 
          if (OS === 'mac') {
            e.setOpacity(0);
          } else {
            e.close();
          };
        }; 
      });
      
      if (currentDownloadAction === 'retry') {
        id = currentDownloadID;
      } else {
        id = Math.floor(Math.random() * 10000000);
        downloadWindow.webContents.send('newFile', { 
          id: id,
          fileName: fileName,
          extension: ext,
          fullPath: '',
          bytes: bytes,
          downloadedFrom: downloadedFrom
        });
      }

      items[id] = items.arr.length;
      items.arr.push(item);
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
          if (downloadWindow !== null && downloadWindow !== undefined && item.getSavePath() !== '') {
            downloadWindow.webContents.send('downloadingFile', { id: id, perc: perc });
          }
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        const downloadPath = item.getSavePath();
        downloadWindow.webContents.send('fileDownloaded', { id: id, fullPath: downloadPath});
        console.log('completed');
      } else {
        if (cancelDownloadMethod === 'cancelInModalWindow') {
          downloadWindow.webContents.send('downloadCancelled', { id: id });
        }
        cancelDownloadMethod = '';
        console.log('non completed');
      }
    });

  });
})();
