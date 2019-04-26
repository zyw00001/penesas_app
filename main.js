const {app, BrowserWindow, session, Menu} = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

const DEV = true;
let win;
let DOMAIN;
let URL_SINGLE;
let URL_ALL;
let URL_EXPORT;

const readConfig = () => {
  try {
    const filePath = path.join(__dirname, '../config.json');
    console.log(filePath);
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
};

const loadSingle = (item, win) => {
  const menu = Menu.getApplicationMenu();
  menu.getMenuItemById('single').enabled = false;
  menu.getMenuItemById('all').enabled = true;
  win.loadURL(URL_SINGLE);
};

const loadAll = (item, win) => {
  const menu = Menu.getApplicationMenu();
  menu.getMenuItemById('single').enabled = true;
  menu.getMenuItemById('all').enabled = false;
  win.loadURL(URL_ALL);
};

const loadExport = (item, win) => {
  const menu = Menu.getApplicationMenu();
  menu.getMenuItemById('single').enabled = true;
  menu.getMenuItemById('all').enabled = true;
  win.loadURL(URL_EXPORT);
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
    {label: '单看板', id: 'single', enabled: false, click: loadSingle},
    {label: '所有看板', id: 'all', click: loadAll},
    {label: '导出', click: loadExport},
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
  if (domain) {
    try {
      domain = (new url.URL(domain)).origin;
    } catch (e) {
      if (domain[0] !== '/') {
        domain = `http://${domain}`;
      } else {
        domain = '';
      }
    }
  }

  DOMAIN = domain || 'http://58.250.251.124:3001';
  URL_SINGLE = DOMAIN;
  URL_ALL = `${DOMAIN}/all`;
  URL_EXPORT = `${DOMAIN}/export`;
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
  const config = readConfig();
  createWindow();
  setDomain(config.url);
  setMenu();
  setCookieMac((err) => {
    err && console.log(err);
    win.maximize();
    win.loadURL(URL_SINGLE);
  }, config.mac);
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