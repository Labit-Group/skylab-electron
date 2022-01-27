const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron')
const path = require('path');
const pjson = require("./package.json");

const SLACK_FILE_SERVER = "https://files.slack.com/";

//const DEBUG_URL = 'http://localhost:5000';
const PROD_URL = 'https://skylab.labit.es';
const OS = process.platform === "darwin" ? "mac" : process.platform === "windows" ? "win" : "linux";
const URL = PROD_URL + "?skylab-version=" + pjson.version + "&os=" + OS;

const icon = {
  "mac": path.join("assets", "icons", "mac", "icon.icns"),
  "linux": path.join("assets", "icons", "png", "icon96x96.png"),
  "win": path.join("assets", "icons", "win", "icon.ico")
}

const NEW_WINDOW_BROWSER_URL = '/openexternal';

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
  });
  mainWindow.maximize();
  mainWindow.show();
  
  mainWindow.loadURL(URL, {userAgent: 'SkyLab'});
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
  const menu = new Menu.buildFromTemplate(MENU);
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

  return new Promise((resolve) => { downloadWindow.webContents.on('did-finish-load', () => { setTimeout(() => resolve(), 200 ) }); });
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
    /* Evita que aparezcan varias ventanas a la hora de descargar desde slack */    
    const menu = new Menu.buildFromTemplate(MENU);
    window.setMenu(menu);


    window.webContents.setWindowOpenHandler(({ url }) => {
      if (url === undefined) {
        return { action: 'deny' };
      } else {
        return { action: 'allow' };
      }
    });

    window.webContents.on('will-navigate', (e,url) => {
      if (url === '' || url.startsWith(SLACK_FILE_SERVER)) {
        e.preventDefault();
        window.close();
        window.destroy();
        window = null;
      }
    });
    /* Evita que aparezcan varias ventanas a la hora de descargar desde slack */

    window.webContents.setWindowOpenHandler((e, url) => {
      if (url.includes(NEW_WINDOW_BROWSER_URL + '/#/')) {
        e.preventDefault();
        const tokens = url.split('/#/');
        if (tokens.length > 1) {
          shell.openExternal(tokens[1]);
        }
      }
    });

    /*
    window.webContents.on("did-attach-webview", (ev, webContents) => {
      ev.preventDefault();
      webContents.on("new-window", (ev) => { ev.preventDefault(); });
    });
    */
    
  });

  /*  
  mainWindow.on('blur', () => {
    const bws = BrowserWindow.getAllWindows();
    //const bw = BrowserWindow.fromId(bws[1]);
    //bw.close();

    bws.forEach((e) => {
      const elem = e.webContents;
      console.log("URL: " + elem.getURL());
      console.log("ID: " + elem.id);
      console.log("TITLE" + elem.getTitle());
      console.log("TYPE" + elem.getType());
      console.log("\n");
      console.log("\n");
      
      //if (url === '') {
      //  console.log("Hiding and Resizing...");
      //  //e.hide();
      //  e.setSize(0,0);
      //}
      
    });
  });
  */

  mainWindow.webContents.session.on('will-download', async (event, item) => {

    if (!downloadWindow) await createDownloadWindow(); // SOLO UNA VENTANA DE DESCARGA

    if (closeWindowTimeout !== 0) {
      clearTimeout(closeWindowTimeout);
      closeWindowTimeout = 0;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    const bws = BrowserWindow.getAllWindows();

    bws.forEach((e) => {
      const wc = e.webContents;
      const url = wc.getURL();
      if (url === '') e.close();
    });

    const downloadedFrom = item.getURL();
    let fileName = item.getFilename();
    const ext = path.extname(fileName).replace(/\./g, '').toUpperCase(); 
    const bytes = item.getTotalBytes();
    const realPath = item.getSavePath();
    
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
          downloadWindow.webContents.send('downloadingFile', { id: id, perc: perc });
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
