const { app, BrowserWindow, Menu, MenuItem, shell } = require('electron')
const electronDl = require('electron-dl');
const path = require('path');

const DEBUG_URL = 'http://localhost:5000';
const PROD_URL = 'https://skylab.labit.es';

const SLACK_FILE_SERVER = 'https://files.slack.com/';
const NEW_WINDOW_BROWSER_URL = "/openexternal";

const OS = process.platform; //darwin / win32 /  linux / others...
const MENU = {
  label: 'Options',
  submenu: [
    { type: 'separator' },
    { role: 'reload' },
    { role: 'forcereload' },
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
    
    { type: 'separator' },
    { role: 'about' },
    { role: 'help' }
  ]
};

electronDl({
  saveAs: true,
  onProgress: (e) => { console.log(e) },
  
});

let zoomLevel = 0;
let mainWindow;
const createWindow = () => {
  mainWindow = new BrowserWindow({
    height: 900,
    width: 1200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, // default: false
      webSecurity: false, // default: true
      contextIsolation: false, // default: true -- Para ejecutar apis de electron y preload en otro contexto,

      webviewTag: true,
      webSecurity: false,
      nativeWindowOpen: true,
      allowRunningInsecureContent: true,
      nodeIntegration: false,
      contextIsolation: false,
    },
    icon: path.join(__dirname, 'assets', 'skylab.png')
  })
  
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

/* START */

(async () => {
  createMenu();

	await app.whenReady();
	createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('browser-window-created', (e, window) => {
    window.setMenu(null);

    window.webContents.on('new-window', (e, url) => {
      if (url.includes(NEW_WINDOW_BROWSER_URL + "/#/")) {
        e.preventDefault();
        const tokens = url.split("/#/");
        if (tokens.length > 1) {
          shell.openExternal(tokens[1]);
        }
      }
    });
  });

})();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});