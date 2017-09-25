'use strict';

import { app, Menu, Tray } from 'electron';
import path from 'path';
import Store from 'electron-store';
import pkg from '../../../package.json';
const store = new Store();

export class TrayUtils {
  constructor (options = {}) {
    const opt = {
      iconName: 'icon.png',
      // iconPressedName: 'iconPressed.png',
      iconPath: '',
      window: null
    };

    if (process.platform === 'darwin') {
      opt.iconName = 'iconTemplate.png';
    } else if (process.platform === 'win32') {
      opt.iconName = 'icon.png';
    }

    opt.iconPath = path.join(__static, 'icons');

    this.options = Object.assign({}, opt, options);

    this._window = this.options.window;

    this.appIcon = null;
    this.trayContextOpen = false;
  }

  get window () {
    return this._window;
  }

  set window (value) {
    this._window = value;
  }

  addIcon () {
    this.appIcon = new Tray(path.join(this.options.iconPath, this.options.iconName));
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Quit ${pkg.displayName}`,
        accelerator: 'CmdOrCtrl+Q',
        click: function () {
          app.exit();
        }
      }
    ]);
    this.appIcon.setToolTip(this.options.trayName);

    if (process.platform === 'win32') {
      this.appIcon.setContextMenu(contextMenu);
    }

    this.appIcon.on('click', (event) => {
      event.preventDefault();
      this.window.isVisible() ? this.window.hide() : this.window.show();
    });

    if (process.platform === 'darwin') {
      this.appIcon.on('right-click', (event) => {
        event.preventDefault();
        if (!this.trayContextOpen) {
          this.appIcon.popUpContextMenu(contextMenu);
        }
        this.trayContextOpen = !this.trayContextOpen;
      });
    }

    this.window.on('show', () => {
      this.appIcon.setHighlightMode('always');
    });

    this.window.on('hide', () => {
      this.appIcon.setHighlightMode('never');
    });

    this.window.on('minimize', (event) => {
      if (store.get('win.minimizeToTray')) {
        event.preventDefault();
        this.window.hide();
      }
    });

    this.window.on('close', (event) => {
      if (!app.isQuiting && store.get('win.closeToTray')) {
        event.preventDefault();
        this.window.hide();
      }
      return false;
    });

    return this;
  }

  destroy () {
    this.window.removeAllListeners('show');
    this.window.removeAllListeners('hide');
    this.window.removeAllListeners('minimize');
    this.window.removeAllListeners('close');
    this.appIcon.destroy();
  }
}

export default function (opts) {
  return new TrayUtils(opts);
}
