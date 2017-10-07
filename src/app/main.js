const electron = require('electron');
const app = electron.app;
const ipc = electron.ipcMain;

const path = require('path');
const url = require('url');
const moment = require('moment');

const Welcome = require('./welcome');

const Datastore = require('nedb');
const isDev = (process.argv[2] || process.env.ENV) === 'dev';

global.APPROOT = path.join(__dirname, '../..');

global.AppSettingsDB = new Datastore({
  filename: path.join(global.APPROOT, '/data/settings.json'),
  autoload: true
});

let PasswordsDB = new Datastore({
  filename: path.join(global.APPROOT, '/data/pws.json'),
  autoload: true
});

// app.commandLine.appendSwitch('disable-renderer-backgrounding');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let tray;
let isOpenedWithShortcut = false;
let allowQuitting = false;

function startApp() {
  tray = new electron.Tray(global.APPROOT + '/src/assets/icon.ico');

  const contextMenu = electron.Menu.buildFromTemplate([{
    label: 'Open app',
    type: 'normal',
    click: function() {
      mainWindow.show();
    }
  }, {
    label: 'Quit',
    type: 'normal',
    click: function() {
      allowQuitting = true;
      mainWindow.close();
    }
  }]);

  tray.on('double-click', function() {
    mainWindow.show();
  });

  tray.setToolTip('Hasloo is running in the background');
  tray.setContextMenu(contextMenu);

  mainWindow = new electron.BrowserWindow({
    width: 300,
    height: 450,
    show: false,
    minimizable: false,
    resizable: false,
    center: true,
    transparent: true,
    frame: false,
    fullscreenable: false
  });

  let indexPath;

  // indexPath = url.format({
  //   protocol: 'http:',
  //   host: 'localhost:3000',
  //   pathname: 'index.html',
  //   slashes: true
  // });

  indexPath = url.format({
    protocol: 'file:',
    pathname: path.join(__dirname, '../../dist', 'index.html'),
    slashes: true
  });

  mainWindow.loadURL(indexPath);

  mainWindow.on('close', function (event) {
    if (!allowQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }

    return false;
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // mainWindow.webContents.openDevTools({
    //   mode: 'detach'
    // });
  });
}

ipc.on('closeWindow', function() {
  mainWindow.hide();
});

ipc.on('getAppSettings', function(event) {
  initAppSettingsDB(function() {
    getAppSettings(function(reply) {
      event.sender.send('appSettings', reply);
    });
  });
});

ipc.on('copyAppPassword', function(event, app) {
  electron.clipboard.writeText(app.password);
  if (isOpenedWithShortcut) {
    isOpenedWithShortcut = false;
    mainWindow.hide();
  }
});

ipc.on('finishOnboarding', function(event) {
  Welcome.finishOnboarding(() => {
    getAppSettings(function(reply) {
      event.sender.send('appSettings', reply);
    });
  });
});

ipc.on('init', function(event) {
  getAppSettings(function(settings) {
    getPasswords(event);
    electron.globalShortcut.register(settings.hotkey, () => {
      isOpenedWithShortcut = true;
      mainWindow.show();
    });
  });
});

ipc.on('removeApp', function(event, _id) {
  PasswordsDB.remove({_id: _id}, function(err, reply) {
    if(err) throw err;

    if (reply) {
      getPasswords(event);
      event.sender.send('appModifySuccess');
    }
  });
});

ipc.on('saveNewApp', function(event, app) {
  app['createdAt'] = moment().unix();

  PasswordsDB.update({_id: app._id}, app, {upsert: true}, function(err, reply) {
    if (err) throw err;

    if (reply) {
      getPasswords(event);
      event.sender.send('appModifySuccess');
    }
  });
});

function getPasswords(event) {
  PasswordsDB.find({}).sort({_id: -1}).exec(function(err, apps) {
    if (err) throw err;

    event.sender.send('passwords', apps);
  });
}

function getAppSettings(cb) {
  global.AppSettingsDB.findOne({}, function(err, reply) {
    if(err) throw err;

    cb(reply);
  });
}

function initAppSettingsDB(cb) {
  global.AppSettingsDB.count({}, function(err, reply) {
    if (err) throw err;

    if (reply > 0) {
      cb();
    } else {
      global.AppSettingsDB.insert({
        onboarding: false,
        hotkey: 'CommandOrControl+Shift+]'
      }, function(err, reply) {
        if (err) throw err;
        cb();
      });
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', startApp);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    tray.destroy();
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});