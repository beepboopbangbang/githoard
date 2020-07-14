'use strict'

// import { app } from 'electron'
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import Store from 'electron-store';

import pkg from '../package.json';
import { initSettings } from './lib/settings';
import Events from './lib/events';

const store = new Store();

initSettings();

if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static');
}

global.baseCloneDir = store.get('baseCloneDir');
global.dbDir = store.get('dbDir');
global.displayName = pkg.displayName;

if (!fs.existsSync(global.baseCloneDir)) {
  mkdirp(global.baseCloneDir);
}

Events().makeSingleInstance();
