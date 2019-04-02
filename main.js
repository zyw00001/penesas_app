const {app, BrowserWindow, globalShortcut, session, Menu} = require('electron');
const path = require('path');
const url = require('url');

const DEV = true;
let win;
let DOMAIN;
let URL_SINGLE;
let URL_ALL;

const switchBoard = (item, id, win) => {
  const item2 = Menu.getApplicationMenu().getMenuItemById(id);
  item2.enabled = true;
  item.enabled = false;
  if (id === 'single') {
    win.loadURL(URL_SINGLE);
  } else if (id === 'all') {
    win.loadURL(URL_ALL);
  }
};

const addItemsForDev = (submenu) => {
  if (DEV) {
    const click = (item, win) => {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools();
      }
    };
    submenu.push({label: '打开控制台', accelerator: 'F12', visible: false, click});
  }
};

const setMenu = () => {
  const submenu = [
    {label: '切换到所有看板', id: 'single', click: (item) => switchBoard(item, 'all', win)},
    {label: '切换到单看板', id: 'all', enabled: false, click: (item) => switchBoard(item, 'single', win)},
    {type: 'separator'},
    {label: '重新加载', accelerator: 'F5', click: (item, win) => win.reload()}
  ];

  const template = [
    {label: '功能', submenu}
  ];

  addItemsForDev(submenu);
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const setDomain = (domain) => {
  DOMAIN = domain || 'http://localhost:3001';
  URL_SINGLE = DOMAIN;
  URL_ALL = `${DOMAIN}/all`;
};

const setCookieMac = (callback, mac) => {
  const setCookie = (name, value) => {
    const cookie = {url: DOMAIN, name, value};
    session.defaultSession.cookies.set(cookie, callback);
  };

  if (!mac) {
    require('getmac').getMac((err, macAddress) => {
      if (!err) {
        setCookie('mac', macAddress);
      } else {
        callback(err);
      }
    });
  } else {
    setCookie('mac', mac);
  }
};

const createWindow = () => {
  win = new BrowserWindow({show: false});
  win.on('closed', () => {
    win = null
  })
};

app.on('ready', () => {
  createWindow();
  setDomain();
  setMenu();
  setCookieMac((err) => {
    err && console.log(err);
    win.maximize();
    win.loadURL(URL_SINGLE);
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
});