import { app } from 'electron';
import path from 'path';
import Store from 'electron-store';

import pkg from '../../package.json';

const store = new Store();

export function initSettings() {
  if (!store.has('baseCloneDir')) {
    store.set('baseCloneDir', path.join(app.getPath('home'), pkg.name));
  }

  if (!store.has('dbDir')) {
    store.set('dbDir', path.join(app.getPath('userData'), 'library.db'));
  }

  if (!store.has('autoCheckForUpdates')) {
    store.set('autoCheckForUpdates', false);
  }

  if (!store.has('win')) {
    store.set('win', {
      minimizeToTray: true,
      closeToTray: false,
      showTray: true,
      showDock: false,
    });
  }

  if (!store.has('repo')) {
    store.set('repo', {
      openDir: false,
      fixDirs: false,
      removeRepo: false,
      removeFailed: false,
      removeToTrash: true,
      trySSH: false
    });
  }

  if (!store.has('pillage')) {
    store.set('pillage', {
      owned: true,
      forked: false,
      member: false,
    });
  }
}
