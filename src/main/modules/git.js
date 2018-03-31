'use strict';

import {
  app,
  remote,
} from 'electron';
import {
  GitProcess
} from 'dugite';

import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import byline from 'byline';
import GitHubApi from 'github';
import Store from 'electron-store';

import GitUniversal from '../../universal/git';
import DbUtils from './db';
import pkg from '../../../package.json';

const git = GitProcess.exec;

// Bitbucket API Repository Query
// https://api.bitbucket.org/2.0/repositories/atlassian?pagelen=20&q=scm+%3D+%22git%22

const github = new GitHubApi({
  debug: true,
  protocol: 'https',
  host: 'api.github.com',
  pathPrefix: '',
  headers: {
    'user-agent': 'GH'
  },
  Promise: require('bluebird'),
  timeout: 5000
});

export class GitUtils {
  constructor (options = {}) {
    const opt = {
      baseCloneDir: path.join((app || remote.app).getPath('home'), pkg.name),
      window: remote ? remote.getCurrentWindow() : null
    };

    this.options = Object.assign({}, opt, options);
    this.db = DbUtils();
    this._window = this.options.window;
    if (this._window && this._window.webContents) {
      this.webcon = this._window.webContents;
    }

    this.receivingObjectsPercent = 0;
    this.resolvingDeltasPercent = 0;

    this.gituni = GitUniversal();
    this.store = new Store();
  }

  get window () {
    return this._window;
  }

  set window (value) {
    this._window = value;

    if (this._window && this._window.webContents) {
      this.webcon = this._window.webContents;
    }
  }

  transferProgress (repo, stats) {
    repo.progress = self.progress(stats);
  }

  tryParse (str) {
    const value = /(\d+)\%/.exec(str);
    if (value) {
      const percentValue = value[1];
      const percent = parseInt(percentValue, 10);
      if (!isNaN(percent)) {
        return percent;
      }
    }

    return null;
  }

  setReceivingProgress (repo, percent) {
    this.receivingObjectsPercent = percent / 100;
    repo.receivingObjectsPercent = percent;

    this.webcon.send('clone-progress', {
      repo: repo,
      receivingObjectsPercent: percent,
      resolvingDeltasPercent: this.resolvingDeltasPercent
    });
  }

  setResolvingProgress (repo, percent) {
    this.resolvingDeltasPercent = percent / 100;
    repo.resolvingDeltasPercent = percent;

    this.webcon.send('clone-progress', {
      repo: repo,
      receivingObjectsPercent: this.receivingObjectsPercent,
      resolvingDeltasPercent: percent
    });
  }

  progressCallback (repo) {
    return {
      processCallback: (process) => {
        byline(process.stderr).on('data', (chunk) => {
          // if (chunk.startsWith('Counting objects: ')) {
          //   const percent = this.tryParse(chunk)
          //   if (percent) {
          //     console.log('total object', percent)
          //     this.setReceivingProgress(repo, percent)
          //   }
          //   return
          // }
          if (chunk.startsWith('Receiving objects: ')) {
            const percent = this.tryParse(chunk);
            if (percent) {
              // console.log('receiving progress', percent)
              this.setReceivingProgress(repo, percent);
            }
            return;
          }

          if (chunk.startsWith('Resolving deltas: ')) {
            const percent = this.tryParse(chunk);
            if (percent) {
              // console.log('resolving progress', percent)
              this.setResolvingProgress(repo, percent);
            }
            return;
          }
        });
      }
    };
  }

  async getBranchName (repoObj) {
    const result = await git(['rev-parse', '--abbrev-ref','HEAD'], repoObj.folder, 'getBranchName');

    if (result.exitCode === 0) {

      const updateQuery = {
        branch: result.stdout.trim(),
      };

      const upRepo = Object.assign({}, repoObj, updateQuery);

      await this.db.updateById(repoObj._id, updateQuery)
        .then((err) => {
          if (!err) {
            this.webcon.send('log', 'getBranchName done', [
              result,
              upRepo
            ]);
          }
        });

      return upRepo;
    }
  }

  async openExistingRepo (repoObj) {
    const result = await git(['rev-parse', '--is-inside-work-tree'], repoObj.folder, 'isGitDir');

    if (result.exitCode === 0) {
      repoObj.receivingObjectsPercent = 100;
      repoObj.resolvingDeltasPercent = 100;

      if (!repoObj.pillaging) {
        this.webcon.send('notify', repoObj.owner + ' / ' + repoObj.name, {
          body: 'Clone failed. Repository already exists',
          repo: repoObj.url,
          folder: repoObj.folder
        });
      }

      return result;
    }
  }

  readmeDoesExist (cloneDir) {
    return fs.existsSync(path.join(cloneDir, '/README'));
  }

  repoDoesExist (cloneDir) {
    if (!cloneDir) {
      return false;
    }
    return fs.existsSync(path.join(cloneDir, '/.git'));
  }

  async checkIfRepoExists (repoObj, newRepo) {
    this.webcon.send('clone-start', {
      repo: newRepo,
      folder: repoObj.folder
    });

    if (this.repoDoesExist(repoObj.folder)) {
      return await this.openExistingRepo(repoObj);
    }

    return await this.cloneRepository(repoObj, newRepo);
  }

  async cloneRepository (repoObj, newRepo) {
    const result = await git(['clone', repoObj.url, '--progress'], path.join(repoObj.folder, '..'), this.progressCallback(newRepo));

    if (result.exitCode === 0) {
      const newRepoWithBranch = await this.getBranchName(newRepo);
      newRepo.receivingObjectsPercent = 100;
      newRepo.resolvingDeltasPercent = 100;

      this.webcon.send('log', 'clone done', [
        repoObj.folder,
        newRepoWithBranch,
        result
      ]);

      this.webcon.send('clone-done', {
        repo: newRepoWithBranch,
        folder: repoObj.folder
      });

      if (!repoObj.pillaging) {
        this.webcon.send('notify', repoObj.owner + ' / ' + repoObj.name, {
          body: 'Clone finished',
          repo: repoObj.url,
          folder: repoObj.folder
        });
      }

      // if (repoObj.source === 'github.com') {
      //   github.repos.get({
      //     owner: repoObj.owner,
      //     repo: repoObj.name
      //   }, (err, repoData) => {
      //     if (!err) {
      //       this.webcon.send('clone-api-data', repoData)

      //       // console.log('this.db', this.db)
      //       this.db.updateBySlug(repoObj.slug, { github: repoData })
      //         .then((err, upRepo) => {
      //           if (!err) {
      //             this.webcon.send('log', 'clone github api', [
      //               upRepo
      //             ])
      //           }
      //         })
      //     }
      //   })
      // }

      return newRepoWithBranch;
    } else {
      console.error('git cloneRepository error', result.stderr);
      this.webcon.send('log', 'clone err', result.stderr);
    }
  }

  async clone (url, opt = { args: ' ' }) {
    const cmdArgs = this.gituni.parseUrl(url);
    if (!opt.cwd) opt.cwd = this.options.baseCloneDir || (remote.process || process).cwd();

    let tmpOwner = cmdArgs.repoObj.owner;
    if (tmpOwner === '' && cmdArgs.originalUrl.indexOf('gist.github.com') > -1) {
      tmpOwner = 'gist';
    }

    if (this.window) {
      this.window.focus();
    }

    const cloneDir = path.join(opt.cwd, tmpOwner, cmdArgs.repoObj.name);

    this.webcon.send('log', 'clone start', cmdArgs);
    this.webcon.send('log', 'clone to dir', cloneDir);

    if (!fs.existsSync(cloneDir)) {
      mkdirp(path.join(cloneDir, '..'));
    }
    const repoObj = {
      slug: tmpOwner + '/' + cmdArgs.repoObj.name,
      owner: tmpOwner,
      name: cmdArgs.repoObj.name,
      source: cmdArgs.repoObj.source,
      url: cmdArgs.repoUrl,
      originalUrl: cmdArgs.originalUrl,
      folder: cloneDir,
      createdAt: new Date(),
      updatedAt: new Date(),
      checkedAt: new Date(),
      branchAheadBehind: {
        ahead: 0,
        behind: 0
      }
    };

    const cloneInsert = this.db.insert(repoObj);
    repoObj.pillaging = !!opt.pillaging;

    return await cloneInsert
      .then(async (newRepo) => {
        return await this.checkIfRepoExists(repoObj, newRepo);
      })
      .then(async (clonedRepo) => {
        return clonedRepo;
      })
      .catch((err) => {
        if (this.repoDoesExist(repoObj.folder)) {
          return this.openExistingRepo(repoObj);
        }
        this.db.get({ url: repoObj.url }).then((docs) => {
          if (docs.length > 0 && this.repoDoesExist(docs[0].folder)) {
            docs[0].pillaging = !!opt.pillaging;
            return this.openExistingRepo(docs[0]);
          }
        });
      });
  }

  async fetch (opts) {
    if (!this.repoDoesExist(opts.folder)) {
      return false;
    }

    const result = await git(['fetch', '--progress'], opts.folder, this.progressCallback(opts));

    return result;
  }

  async status (opts) {
    if (!this.repoDoesExist(opts.folder)) {
      return false;
    }
    const statusObject = {};
    const result = await git(['status', '--untracked-files=all', '--branch', '--porcelain=2', '-z'], opts.folder, 'getStatus');
    if (result.exitCode === 0) {
      for (const entry of this.parsePorcelainStatus(result.stdout)) {
        let m;
        const value = entry.value;

        if ((m = value.match(/^branch\.oid ([a-f0-9]+)$/))) {
          statusObject.currentTip = m[1];
        } else if ((m = value.match(/^branch.head (.*)/))) {
          if (m[1] !== '(detached)') {
            statusObject.currentBranch = m[1];
          }
        } else if ((m = value.match(/^branch.upstream (.*)/))) {
          statusObject.currentUpstreamBranch = m[1];
        } else if ((m = value.match(/^branch.ab \+(\d+) -(\d+)$/))) {
          const ahead = parseInt(m[1], 10);
          const behind = parseInt(m[2], 10);

          if (!isNaN(ahead) && !isNaN(behind)) {
            statusObject.branchAheadBehind = { ahead, behind };
          }
        }
      }
      const updateQuery = {
        branch: statusObject.currentBranch,
        branchAheadBehind: statusObject.branchAheadBehind,
        checkedAt: new Date()
      };
      await this.db.updateById(opts._id, updateQuery, 'checkedAt')
        .then((err) => {
          const upRepo = Object.assign({}, opts, updateQuery);
          if (!err) {
            this.webcon.send('log', 'update repo branch', [
              upRepo
            ]);
          }
        });
    }

    return {
      result,
      status: statusObject || {},
      repo: opts
    };
  }

  async fetchStatus (opts) {
    this.webcon.send('fetch-start', {
      repo: opts,
      folder: opts.folder
    });
    return await this.fetch(opts).then(async () => {
      return await this.status(opts);
    });
  }

  async pillage (repoObj) {
    return await github.repos.getForUser({
      username: repoObj.owner,
      type: this.store.get('pillage.member') ? 'all' : 'owner',
      per_page: 100,
    });
  }

  parsePorcelainStatus (output) {
    const entries = [];

    const fields = output.split('\0');
    let field = '';

    while ((field = fields.shift())) {
      if (field.startsWith('# ') && field.length > 2) {
        entries.push({ kind: 'header', value: field.substr(2) });
        continue;
      }

      // const entryKind = field.substr(0, 1)

      // if (entryKind === ChangedEntryType) {
      //   entries.push(parseChangedEntry(field))
      // } else if (entryKind === RenamedOrCopiedEntryType) {
      //   entries.push(parsedRenamedOrCopiedEntry(field, fields.shift()))
      // } else if (entryKind === UnmergedEntryType) {
      //   entries.push(parseUnmergedEntry(field))
      // } else if (entryKind === UntrackedEntryType) {
      //   entries.push(parseUntrackedEntry(field))
      // } else if (entryKind === IgnoredEntryType) {
      //   // Ignored, we don't care about these for now
      // }
    }

    return entries;
  }
}

export default function (opts) {
  return new GitUtils(opts);
}
