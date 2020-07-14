/* global __static */
'use strict';

import { BrowserWindow } from 'electron';
import path from 'path';
import windowStateKeeper from 'electron-window-state';
import Positioner from 'electron-positioner';
import Store from 'electron-store';

import { initFileProtocol } from './protocols';
import GitUniversal from './universal/git';

const store = new Store();

const isDevelopment = process.env.NODE_ENV !== 'production'

export class WindowUtils {
  constructor (options = {}) {
    const opt = {
      iconName: 'icon.png',
      // iconPressedName: 'iconPressed.png',
      iconPath: '',
      window: null
    };

    if (process.platform === 'darwin') {
      opt.iconName = 'iconTemplate.png';
    }

    opt.iconPath = path.join(__static, 'icons');

    this.options = Object.assign({}, opt, options);
    this.winURL = isDevelopment
        ? 'http://localhost:9080'
        // : `file://${__dirname}/index.html`;
        : `ghapp://./index.html`;

    this.gituni = GitUniversal();
  }

  create () {
    initFileProtocol();
    const mainWindowState = windowStateKeeper({
      defaultWidth: 440,
      defaultHeight: 580
    });

    const mainWindowOptions = {
      'x': mainWindowState.x,
      'y': mainWindowState.y,
      'width': mainWindowState.width,
      'height': mainWindowState.height,
      useContentSize: true,
      'minWidth': 440,
      'minHeight': 580,
      backgroundColor: '#232421',
      show: false,
      webPreferences: {
        // Disable auxclick event
        // See https://developers.google.com/web/updates/2016/10/auxclick
        disableBlinkFeatures: 'Auxclick',
        // Enable, among other things, the ResizeObserver
        experimentalFeatures: true,
        nodeIntegration: true
      },
      acceptFirstMouse: true,
      icon: path.join(this.options.iconPath, this.options.iconName),
    };

    if (process.platform === 'darwin') {
      mainWindowOptions.titleBarStyle = 'hidden';
      mainWindowOptions.fullscreen = false;
      mainWindowOptions.fullscreenable = false;
    } else if (['win32', 'linux'].includes(process.platform)) {
      mainWindowOptions.frame = false;
    }

    let mainWindow = new BrowserWindow(mainWindowOptions);

    const positioner = new Positioner(mainWindow);

    if (!mainWindowState.x && !mainWindowState.y) {
      positioner.move('center');
    }

    mainWindowState.manage(mainWindow);

    // console.warn('mainWindowState', `file://${__dirname}/index.html`, process.env.WEBPACK_DEV_SERVER_URL, mainWindow);

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
      if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
    } else {
      // createProtocol('ghapp')
      mainWindow.loadURL(`ghapp://./index.html`)
      if (store.get('autoCheckForUpdates')) {
        this.options.autoUpdater.checkForUpdatesAndNotify()
      }
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    mainWindow.webContents.on('did-finish-load', () => {
      // const origMenu = Menu.getApplicationMenu();
      const cmdArgs = this.gituni.parseUrlArgs(process.argv);
      // mainWindow.webContents.send('log', 'did-finish-load', [cmdArgs, this.gituni.gitUrlRegexTest.test(cmdArgs.repoUrl)]);
      // mainWindow.webContents.send('log', 'menubar', [mainWindow.isMenuBarVisible(), mainWindow.isMenuBarAutoHide(), origMenu]);
      // mainWindow.webContents.send('log', 'menubar', [origMenu]);

      if (this.gituni.gitUrlRegexTest.test(cmdArgs.repoUrl)) {
        this.options.utils.git.clone(cmdArgs.repoUrl);
      }
    });

    mainWindow.once('ready-to-show', () => {
      console.warn('ready-to-show');
      mainWindow.show();
    });

    return mainWindow;
  }
}

export default function (opts) {
  return new WindowUtils(opts);
}
