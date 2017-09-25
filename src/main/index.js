import { app } from 'electron';
import fs from 'fs';
import mkdirp from 'mkdirp';
import Store from 'electron-store';
import pkg from '../../package.json';
import initContextMenu from './modules/contextMenu';
import { initProtocols } from './modules/protocols';
import { initSettings } from './modules/settings';
import Events from './modules/events';

const store = new Store();

initSettings();

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static');
}

global.baseCloneDir = store.get('baseCloneDir');
global.dbDir = store.get('dbDir');
global.displayName = pkg.displayName;

if (!fs.existsSync(global.baseCloneDir)) {
  mkdirp(global.baseCloneDir);
}

const events = Events();

events.makeSingleInstance();
initProtocols();
initContextMenu();
events.init(app);

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
