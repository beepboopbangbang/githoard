import {
  app,
  shell,
  ipcMain,
  BrowserWindow,
  dialog,
  globalShortcut,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import queue from 'async/queue';
import Store from 'electron-store';
import { GitProcess } from 'dugite';
import searchQuery from 'search-query-parser';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

import { initProtocols } from './protocols';
import { rmdir } from './fs';
import utilsGitLib from './git';
import utilsTrayLib from './tray';
import utilsWindowLib from './window';
import initContextMenu from './contextMenu';
import DbUtils from './db';
import GitUniversal from './universal/git';
import pkg from '../../package.json';

const git = GitProcess.exec;

const isDevelopment = process.env.NODE_ENV !== 'production'

export class Events {
  constructor (options = {}) {
    const opt = {
      queueConcurrency: 3,
      settingsWindow: null,
      window: null
    };

    this.options = Object.assign({}, opt, options);

    this._window = this.options.window;
    this.shouldQuit = false;
    this.appIcon = null;
    this.fetchQ = null;
    this.fixQ = null;


    this.utilsGit = utilsGitLib({
      baseCloneDir: global.baseCloneDir,
      window: this.window
    });

    this.utilsTray = utilsTrayLib({
      trayName: pkg.displayName,
      window: this.window
    });

    this.utilsWindow = utilsWindowLib({
      utils: {
        git: this.utilsGit,
        tray: this.utilsTray
      },
      autoUpdater
    });

    this.store = new Store();
    this.utilsDb = DbUtils({});
    this.gituni = GitUniversal();

    autoUpdater.autoDownload = false
  }

  get window () {
    return this._window;
  }

  set window (value) {
    this._window = value;
  }

  init () {
    this.initIpc();
    this.initApp();

    if (this.store.get('repo.fixDirs')) {
      this.fixDirectories();
    }
  }

  initApp () {
    this.appReady();
    this.appWindowAllClosed();
    this.appActivate();
    this.appOpenUrl();
  }

  initIpc () {
    this.fetchQ = this.fetchQueue();
    this.fixQ = this.fixQueue();
    this.ipcGetDB();
    this.ipcStore();
    this.ipcStoreGet();
    this.ipcStoreSet();
    this.ipcStoreHas();
    this.ipcDbSearch();
    this.ipcRemoveEntry();
    this.ipcGitPillage();
    this.ipcGitClone();
    this.ipcGitCmd();
    this.ipcGitFetchStatus();
    this.ipcGitStatus();
    this.ipcOpenFolder();
    this.ipcShowFolder();
    this.ipcOpenSettingsWindow();
    this.ipcOpenUrl();
    this.ipcSelectDir();
    this.ipcShowTray();
    this.ipcCheckForUpdates();
  }

  makeSingleInstance () {
    app.allowRendererProcessReuse = true;

    const gotTheLock = app.requestSingleInstanceLock()
    console.warn('makeSingleInstance', gotTheLock)
    if (!gotTheLock) {
      app.quit()
    } else {
      app.on('second-instance', (event, argv, wd) => {
        const cmdArgs = this.gituni.parseUrlArgs(argv);

        if (this.window) {
          const cmdHasGitRepo = this.gituni.gitUrlRegexTest.test(cmdArgs.repoUrl);
          const cmdIsGhGlOrBBUrl = this.gituni.githubUrlRegexTest.test(cmdArgs.repoUrl);
          this.window.webContents.send('log', 'shouldQuit', [event, argv, wd, process.argv, app.commandLine, cmdArgs, cmdHasGitRepo, cmdIsGhGlOrBBUrl]);

          console.warn('makeSingleInstance', event, argv, wd, process.argv)

          if (cmdHasGitRepo || cmdIsGhGlOrBBUrl) {
            // const parsedRepoURL = this.gituni.parseUrl(cmdArgs.repoUrl);
            this.utilsGit.clone(cmdArgs.repoUrl);
          }

          if (this.window.isVisible()) {
            this.window.focus();
          }
        }
        return true;
      });

      initProtocols();
      initContextMenu({ git: this.utilsGit, helpers: this.gituni });

      this.init();
    }
    // if (process.platform !== 'win32' && this.shouldQuit) {
    //   app.exit();
    // }

    // if (process.platform === 'win32') {
    //   if (this.shouldQuit) {
    //     app.exit();
    //   }
    // }
  }

  fetchQueue () {
    const q = queue(({ repo, event }, callback) => {
      this.utilsGit.fetchStatus(repo).then((res) => {
        // console.warn(`fetchQueue`, repo, res);
        if (res) {
          event.sender.send(`repo-fetch-status-${repo._id}`, res.status);
        }
        callback();
      });
    }, this.options.queueConcurrency);

    q.drain(() => {});

    return q;
  }

  pillageQueue (target) {
    const { owner: group } = target;
    const folder = path.join(global.baseCloneDir, group);

    const q = queue(async ({ repo, event }, callback) => {
      await this.utilsGit.clone(repo.clone_url, { pillaging: true })
        .then((res) => {
          event.sender.send('log', 'pillage cloned', JSON.stringify({ group, repo, res }));
          callback();
        })
        .catch(callback);
    }, this.options.queueConcurrency);

    q.drain(() => {
      this.window.webContents.send('notify', group, {
        body: 'Pillaged!',
        repo: target.url,
        folder,
        pillage: true,
        silent: true
      });
    });

    return q;
  }

  fixQueue () {
    const q = queue(({ opts }, callback) => {
      fs.stat(opts.folder, (err) => {
        const currentBaseDir = opts.folder.split(path.sep + opts.owner)[0];
        const compareBaseDir = global.baseCloneDir === currentBaseDir;
        if(err != null && !compareBaseDir) {
          // console.warn('folder does not exist', opts.folder);
          const directory = path.join(global.baseCloneDir, opts.owner, opts.name);
          fs.stat(directory, (err2) => {
            if(err2 == null) {
              // console.warn('folder exists, updating db entry', directory);
              this.utilsDb.updateById(opts._id, {
                folder: directory,
              }, 'updatedAt');
              opts.folder = directory;
            }
            callback();
          });
        } else {
          callback();
        }
      });
    }, this.options.queueConcurrency);

    q.drain(() => {});

    return q;
  }

  fixDirectories () {
    // console.warn('fixDirectories init');
    this.utilsDb.get().then((docs) => {
      // console.warn('fixDirectories', docs);
      docs.forEach((opts) => {
        this.fixQ.push({ opts }, () => {});
      });
    });
  }

  toggleTray (vis) {
    if (!vis) {
      this.appIcon.destroy();
    } else {
      this.utilsTray.window = this.window;
      this.appIcon = this.utilsTray.addIcon();
    }
  }

  toggleDock (vis) {
    if (process.platform !== 'darwin') {
      return;
    }
    if (!vis) {
      app.dock.hide();
    } else {
      app.dock.show();
    }
  }

  ipcGetDB () {
    ipcMain.on('get-db', (event) => {
      this.utilsDb.get().then((docs) => {
        event.sender.send('local-list', docs);
      });
    });
  }

  ipcStore () {
    ipcMain.on('store', (event) => {
      event.sender.send('store:res', this.store.store);
    });
  }

  ipcStoreGet () {
    ipcMain.on('store:get', (event, key) => {
      event.sender.send('store:get:res', this.store.get(key));
    });
  }

  ipcStoreSet () {
    ipcMain.on('store:set', (event, key, item) => {
      if (typeof item !== 'undefined') {
        event.sender.send('store:set:res', this.store.set(key, item));
        if (key === 'win.showTray') {
          this.toggleTray(item);
        }
        if (key === 'win.showDock') {
          this.toggleDock(item);
        }
      } else if (typeof key === 'object') {
        event.sender.send('store:set:res', this.store.set(key));
      }
    });
  }

  ipcStoreHas () {
    ipcMain.on('store:has', (event, key) => {
      event.sender.send('store:has:res', this.store.has(key));
    });
  }

  ipcDbSearch () {
    ipcMain.on('db-search', (event, query) => {
      const searchOptions = {
        keywords: ['slug', 'branch', 'name', 'owner', 'source', 'url', 'createdAt', 'updatedAt'],
        ranges: ['createdAt', 'updatedAt']
      };
      let parsedQuery = searchQuery.parse(query, searchOptions);
      if (typeof parsedQuery === 'string') {
        if (parsedQuery !== '') {
          parsedQuery = { slug: parsedQuery };
        } else {
          parsedQuery = {};
        }
      }
      let { offsets, exclude, ...pq } = parsedQuery; // eslint-disable-line
      if (exclude && Object.keys(exclude).length !== 0) {
        pq = {...pq, $not: {...exclude}}
      }
      this.utilsDb
        .get(toMongo(pq))
        .then((docs) => {
          event.sender.send('local-list', docs);
        });
    });
  }

  ipcRemoveEntry () {
    ipcMain.on('remove-entry', async (event, entry) => {
      await this.utilsDb.removeById(entry._id);
      // console.warn('remove-entry', entry.folder, fs.existsSync(entry.folder))
      if (fs.existsSync(entry.folder)) {
        await rmdir(entry.folder)
      }
      this.utilsDb.get().then(docs => event.sender.send('local-list', docs));
    });
  }

  ipcGitStatus () {
    ipcMain.on('git-status', async (event, folder) => {
      this.utilsGit.status({ folder });
    });
  }

  ipcGitFetchStatus () {
    ipcMain.on('git-fetch-status', async (event, repo) => {
      this.fetchQ.push({ repo, event }, () => {});
    });
  }

  ipcGitPillage () {
    ipcMain.on('git-pillage', async (event, target) => {
      if (target.source === 'github.com') {
        const pillageQ = this.pillageQueue(target);
        await this.utilsGit.pillage(target)
          .then((result) => {
            if (result) {
              const ledger = result.data.filter((repo) => {
                return !this.store.get('pillage.forked') && !repo.fork;
              });
              event.sender.send('log', 'git-pillage-res', JSON.stringify([ledger, result.data]));

              ledger.forEach((repo) => {
                pillageQ.push({ repo, event, target }, () => {});
              });
            }
          });
      } else {
        // Implement GitLab and BitBucket API's
      }
    });
  }

  ipcGitClone () {
    ipcMain.on('git-clone', async (event, repoUrl) => {
      if (this.gituni.gitUrlRegexTest.test(repoUrl) || this.gituni.githubUrlRegexTest.test(repoUrl)) {
        this.utilsGit.clone(repoUrl);
      }
    });
  }

  ipcGitCmd () {
    ipcMain.on('git-cmd', async (event, cmd, repo) => {
      const folder = repo.folder;
      let directory = folder;
      let options = {};
      let cmdArgs = {};
      const gitArgs = [];

      gitArgs.push(cmd);
      if (['fetch', 'pull'].indexOf(cmd) > -1) {
        gitArgs.push('--progress');
        options = this.utilsGit.progressCallback(repo);
        event.sender.send(`${cmd}-start`, {
          repo,
          folder: repo.folder
        });
      }
      if (cmd === 'clone') {
        cmdArgs = this.gituni.parseUrl(folder);
        gitArgs.push(folder);
        directory = path.join(global.baseCloneDir, cmdArgs.repoObj.owner, cmdArgs.repoObj.name);
        options = {
          env: {},
          processCallback: this.utilsGit.progressCallback().processCallback
        };
      }

      console.warn('before git cmd', gitArgs, directory, options)
      const result = await git(gitArgs, directory, options);
      console.warn('after git cmd', gitArgs, result)
      if (result.exitCode === 0) {
        const output = result.stdout;
        event.sender.send('log', 'git', [folder, output]);
        let res, change;
        if (cmd === 'clone') {
          let tmpOwner = cmdArgs.repoObj.owner;
          if (tmpOwner === '' && cmdArgs.originalUrl.indexOf('gist.github.com') > -1) {
            tmpOwner = 'gist';
          }
          const repoObj = {
            slug: tmpOwner + '/' + cmdArgs.repoObj.name,
            owner: tmpOwner,
            name: cmdArgs.repoObj.name,
            source: cmdArgs.repoObj.source,
            url: cmdArgs.repoUrl,
            originalUrl: cmdArgs.originalUrl,
            folder: directory,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          this.utilsDb.insert(repoObj, () => {});
        } else if (cmd === 'branch') {
          event.sender.send('git-current-branch', output);
        } else if (cmd === 'pull') {
          change = {
            branchAheadBehind: { ahead: 0, behind: 0 },
          }
          // event.sender.send(`pull-done`, { repo: { ...repo, branchAheadBehind: { ahead: 0, behind: 0 } }, result });
          // event.sender.send(`repo-pull-${repo._id}`, result);
        } else if (cmd === 'stash') {
          change = {
            status: { ...repo.status, changes: [] },
          }
        }
        if (change) {
          res = { cmd, repo: { ...repo, ...change }, result }
          this.utilsDb.updateById(repo._id, change, 'updatedAt');
          console.warn('update-list', res);
          event.sender.send('update-list', res);
        }
      } else {
        const error = result.stderr;
        event.sender.send('log', 'git-cmd error', [folder, result]);
        event.sender.send('err', [folder, error]);
      }
    });
  }

  ipcOpenFolder () {
    ipcMain.on('open-folder', (event, opts) => {
      fs.stat(opts.folder, (err) => {
        const currentBaseDir = opts.folder.split(path.sep + opts.owner)[0];
        const compareBaseDir = global.baseCloneDir === currentBaseDir;
        if(err == null) {
          // console.warn('folder exists');
          const opened = shell.openItem(opts.folder);
          event.sender.send('log', 'open-folder', [opts, opened]);
        } else if(!compareBaseDir) {
          const directory = path.join(global.baseCloneDir, opts.owner, opts.name);
          // console.warn('folder does not exist');
          fs.stat(directory, (err) => {
            if(err == null) {
              // console.warn('folder exists, updating db entry');
              this.utilsDb.updateById(opts._id, {
                folder: directory,
              }, 'updatedAt');
              opts = directory;
              const opened = shell.openItem(opts.folder);
              event.sender.send('log', 'open-folder', [opts, opened]);
            }
            // console.warn('compare folders', global.baseCloneDir, currentBaseDir, compareBaseDir);
          });
        }
      });
    });
  }

  ipcShowFolder () {
    ipcMain.on('show-folder', (event, folder) => {
      const opened = shell.showItemInFolder(folder);
      event.sender.send('log', 'show-folder', [folder, opened]);
    });
  }

  ipcOpenUrl () {
    ipcMain.on('open-url', (event, url) => {
      shell.openExternal(url);
    });
  }

  ipcCheckForUpdates () {
    ipcMain.on('check-for-updates', () => {
      console.warn('check-for-updates', autoUpdater)
      autoUpdater.checkForUpdates()
    });
  }

  autoUpdaterEvents () {
    autoUpdater.on('error', (error) => {
      console.warn('autoUpdater error', error)
      dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
    })

    autoUpdater.on('update-available', () => {
      console.warn('autoUpdater update-available')
      dialog.showMessageBox({
        type: 'info',
        title: 'Found Updates',
        message: 'Found updates, do you want update now?',
        buttons: ['Sure', 'No']
      }, (buttonIndex) => {
        if (buttonIndex === 0) {
          autoUpdater.downloadUpdate()
        }
        // else {
        //   updater.enabled = true
        //   updater = null
        // }
      })
    })

    autoUpdater.on('update-not-available', () => {
      console.warn('autoUpdater update-not-available')
      dialog.showMessageBox({
        title: 'No Updates',
        message: 'Current version is up-to-date.'
      })
      // updater.enabled = true
      // updater = null
    })

    autoUpdater.on('update-downloaded', () => {
      console.warn('autoUpdater update-downloaded')
      dialog.showMessageBox({
        title: 'Install Updates',
        message: 'Updates downloaded, application will be quit for update...'
      }, () => {
        setImmediate(() => autoUpdater.quitAndInstall())
      })
    })
  }

  ipcSelectDir () {
    ipcMain.on('select-dir', (event) => {
      const selectedDir = dialog.showOpenDialog(this.window, {
        properties: ['openDirectory']
      });
      if (selectedDir && selectedDir.length > 0) {
        event.sender.send('selected-folder', selectedDir[0]);

        global.baseCloneDir = selectedDir[0];

        this.utilsGit = utilsGitLib({
          baseCloneDir: global.baseCloneDir,
          window: this.window
        });
      }
    });
  }

  ipcOpenSettingsWindow () {
    ipcMain.on('open-settings-window', function () {
      if (this.options.settingsWindow) {
        return;
      }

      const settingsWindowOptions = {
        frame: false,
        height: 580,
        width: 440,
        minWidth: 440,
        minHeight: 580,
        resizable: true,
        minimizable: false,
        maximizable: false,
        useContentSize: true,
        backgroundColor: '#232421',
        parent: this.window || null,
        modal: true,
        show: false
      };

      this.options.settingsWindow = new BrowserWindow(settingsWindowOptions);
      const settingsURL = isDevelopment
          ? process.env.WEBPACK_DEV_SERVER_URL
          // : `file://${__dirname}/index.html#settings`;
          : `ghapp://./index.html/#/settings`;

      this.options.settingsWindow.loadURL(settingsURL);
      this.options.settingsWindow.setMenuBarVisibility(false);

      this.options.settingsWindow.on('closed', function () {
        this.options.settingsWindow = null;
      });

      this.options.settingsWindow.once('ready-to-show', () => {
        this.options.settingsWindow.show();
      });
    });
  }

  ipcShowTray () {
    ipcMain.on('show-tray', (event, vis) => {
      this.toggleTray(vis);
    });
  }

  appBeforeQuit () {
    app.on('before-quit', () => {
      console.warn('QUIT IT!')
      // this.quitting = true;
    });
  }

  appReady () {
    if (process.platform === 'win32') {
      app.setAppUserModelId(pkg.displayName)
    }
    app.on('ready', async (launchInfo) => {
      console.warn('app ready'. launchInfo)
      if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        await installExtension(VUEJS_DEVTOOLS)
      }

      this.window = this.utilsWindow.create(this.appIcon);
      this.utilsGit.window = this.utilsTray.window = this.window;

      globalShortcut.register('CmdOrCtrl+Q', () => {
        app.exit();
      });

      if (this.store.get('win.showTray')) {
        this.toggleTray(this.store.get('win.showTray'));
      }

      this.toggleDock(this.store.get('win.showDock'));

      this.autoUpdaterEvents();
    });
  }

  appWindowAllClosed () {
    app.on('window-all-closed', () => {
      if (this.appIcon) {
        this.appIcon.destroy();
      }
      app.quit();
    });

    if (isDevelopment) {
      if (process.platform === 'win32') {
        process.on('message', data => {
          if (data === 'graceful-exit') {
            app.quit()
          }
        })
      } else {
        process.on('SIGTERM', () => {
          app.quit()
        })
      }
    }
  }

  appActivate () {
    app.on('activate', (event, hasVisWins) => {
      console.warn('activate', event, hasVisWins)
      if (this.window === null) {
        this.window = this.utilsWindow.create(this.appIcon);
        this.utilsGit.window = this.utilsTray.window = this.window;

        if (this.store.get('win.showTray')) {
          this.toggleTray(this.store.get('win.showTray'));
        }
      }
      if (this.window) {
        this.window.show();
      }
    });
  }

  appOpenUrl () {
    app.on('open-url', (event, url) => {
      event.preventDefault();
      const cmdArgs = this.gituni.parseUrl(url);
      console.warn('open-url', event, url, cmdArgs)
      if (this.window) {
        this.window.webContents.send('log', 'open-url', [event, url, cmdArgs, this.gituni.gitUrlRegexTest.test(cmdArgs.repoUrl)]);

        if (this.gituni.gitUrlRegexTest.test(cmdArgs.repoUrl)) {
          this.utilsGit.clone(cmdArgs.repoUrl);
        }
      }
    });
  }
}

function toMongo (query) {
  let newQuery = {};
  if (typeof query === 'object') {
    newQuery = Object.assign({}, query);
    Object.entries(query).forEach(([key, value]) => {
      if (typeof value === 'string') {
        newQuery[key] = new RegExp(value, 'gi');
      }
    });
  }
  return newQuery;
}

export default function (opts) {
  return new Events(opts);
}