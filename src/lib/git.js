'use strict';

import {
  app,
  remote,
} from 'electron';
import { GitProcess } from 'dugite';

import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import byline from 'byline';
import Store from 'electron-store';
import { Octokit } from '@octokit/rest';
import { Gitlab } from 'gitlab';
// import * as Deque from 'double-ended-queue';

import GitUniversal from './universal/git';
import DbUtils from './db';
import { rmdir } from './fs';
import pkg from '../../package.json';
import { parsePorcelainStatus } from './parseStatus'

const git = GitProcess.exec;

// Bitbucket API Repository Query
// https://api.bitbucket.org/2.0/repositories/atlassian?pagelen=20&q=scm+%3D+%22git%22

const github = new Octokit({
  debug: true,
  // baseUrl: 'https://api.github.com',
  // userAgent: 'GH',
  // Promise: require('bluebird'),
  // request: {
  //   timeout: 5000
  // }
});
const gitlab = new Gitlab({
  rejectUnauthorized: false,
  // host: 'http://example.com',
  // token: 'personaltoken',
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
    const value = /(\d+)%/.exec(str);
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
      repo,
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
      env: {
        // supported since Git 2.3, this is used to ensure we never interactively prompt
        // for credentials - even as a fallback
        GIT_TERMINAL_PROMPT: '0',
        // by setting HOME to an empty value Git won't look at ~ for any global
        // configuration values. This means we won't accidentally use a
        // credential.helper value if it's been set by the current user
        // HOME: ''
        // GIT_SSH_COMMAND: `ssh -i ${customSshKey} -o IdentitiesOnly=yes`,
      },
      processCallback: (process) => {
        byline(process.stderr).on('data', (chunk) => {
          // console.log('processCallback byline chunk', typeof chunk, chunk.indexOf('Receiving objects:'), chunk.indexOf('Resolving deltas:'), chunk)
          // if (chunk.startsWith('Counting objects: ')) {
          //   const percent = this.tryParse(chunk)
          //   if (percent) {
          //     console.log('total object', percent)
          //     this.setReceivingProgress(repo, percent)
          //   }
          //   return
          // }
          if (chunk.indexOf('Receiving objects:') > -1) {
            const percent = this.tryParse(chunk);
            // console.log('receiving objects', percent, chunk)
            if (percent) {
              this.setReceivingProgress(repo, percent);
            }
            return;
          }

          if (chunk.indexOf('Resolving deltas:') > -1) {
            const percent = this.tryParse(chunk);
            // console.log('resolving deltas', percent, chunk)
            if (percent) {
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
    const {
      folder, pillaging, owner, name, url,
      // receivingObjectsPercent, resolvingDeltasPercent
    } = repoObj
    const result = await git(['rev-parse', '--is-inside-work-tree'], folder, 'isGitDir');

    if (result.exitCode === 0) {
      // receivingObjectsPercent = 100;
      // resolvingDeltasPercent = 100;

      if (!pillaging) {
        this.webcon.send('notify', owner + ' / ' + name, {
          body: 'Clone failed. Repository already exists',
          repo: url,
          folder: folder,
          silent: true
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
    const {
      folder, owner, name, url, source, slug,
      // receivingObjectsPercent, resolvingDeltasPercent
    } = repoObj
    const result = await git(['clone', url, '--progress'], path.join(folder, '..'), this.progressCallback(newRepo));
    // console.warn('git clone result', result);

    if (result.exitCode === 0) {
      const newRepoWithBranch = await this.getBranchName(newRepo);
      // newRepo.receivingObjectsPercent = 100;
      // newRepo.resolvingDeltasPercent = 100;

      this.webcon.send('log', 'clone done', [
        folder,
        newRepoWithBranch,
        result
      ]);

      this.webcon.send('clone-done', {
        repo: newRepoWithBranch,
        folder
      });

      if (!repoObj.pillaging) {
        this.webcon.send('notify', owner + ' / ' + name, {
          body: 'Clone finished',
          repo: url,
          folder: folder,
          silent: true
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
    } else if (result.exitCode === 128) {
      console.error('git cloneRepository requires auth', result);
      if (this.store.get('repo.trySSH')) {
        // `git@${source}:${owner}/${name}.git`
        const url = `git@${source}:${slug}.git`
        const repoObjModified = {
          ...repoObj,
          url
        }
        const trySSH = await this.cloneRepository(repoObjModified, { ...newRepo, url });

        if (!trySSH.exitCode) {
          const upRes = await this.db.updateById(newRepo._id, { url }, 'checkedAt')
          this.webcon.send('log', 'clone update db for ssh', [result, repoObj, trySSH, upRes]);
        }

        return trySSH;
      }
    }

    console.error('git cloneRepository error', result.stderr);
    this.webcon.send('log', 'clone err', result.stderr);
    if (this.store.get('repo.removeFailed')) {
      await this.db.removeById(newRepo._id);
      if (fs.existsSync(newRepo.folder)) {
        await rmdir(newRepo.folder)
      }
      this.db.get().then(docs => this.webcon.send('local-list', docs));
    }

    this.webcon.send('notify', owner + ' / ' + name, {
      body: 'Epic fail trying to clone this repo',
      repo: url,
      folder: folder,
      silent: true
    });
    return result;
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

    this.webcon.send('log', 'clone start', JSON.stringify(cmdArgs));
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
    // console.warn('GITLAB ===== clone', repoObj.owner, repoObj.source, gitlab.Projects)
    // if (repoObj.source === 'gitlab.com') {
    //   gitlab.Projects.all().then(projects => {
    //     console.warn('gitlab projects', projects);
    //   });
    // }

    const cloneInsert = this.db.insert(repoObj);
    repoObj.pillaging = !!opt.pillaging;

    return await cloneInsert
      .then(async (newRepo) => {
        return await this.checkIfRepoExists(repoObj, newRepo);
      })
      .then(async (clonedRepo) => {
        return clonedRepo;
      })
      .catch(() => {
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
    let upRepo = {}
    // const changeQueue = new Deque();
    const statusObject = { changes: [] };
    const result = await git(['status', '--untracked-files=all', '--branch', '--porcelain=2', '-z'], opts.folder, 'getStatus');
    console.warn('status res', result)
    if (result.exitCode === 0) {
      let entry
      console.warn('status res parsePorcelainStatus', this.parsePorcelainStatus(result.stdout))
      for (entry of this.parsePorcelainStatus(result.stdout)) {
        let m;
        const { value, statusCode } = entry;
        if (value) {
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
        } else if (statusCode) {
          statusObject.changes.push(entry)
        }
      }
      const updateQuery = {
        branch: statusObject.currentBranch,
        branchAheadBehind: statusObject.branchAheadBehind,
        checkedAt: new Date(),
        status: statusObject
      };

      upRepo = Object.assign({}, opts, updateQuery);
      await this.db.updateById(opts._id, updateQuery, 'checkedAt')
        .then(err => {
          if (!err) {
            this.webcon.send('log', 'update repo branch', [
              upRepo
            ]);
            return upRepo
          }
        });
      // console.warn('db updateById!!!', upRepo)
    }
    // console.warn('status!!!', {
    //   // result,
    //   status: statusObject,
    //   repo: upRepo
    // })

    return {
      result,
      status: statusObject,
      repo: upRepo
    };
  }

  async fetchStatus (opts) {
    // console.warn('fetchStatus', opts)
    this.webcon.send('fetch-start', {
      repo: opts,
      folder: opts.folder
    });
    return await this.fetch(opts).then(async () => {
      const status = await this.status(opts)
      const output = {
        repo: opts,
        folder: opts.folder,
        ...status
      }
      this.webcon.send('fetch-done', output)
      return output
    });
  }

  async pillage ({ owner, source }) {
    console.warn('pillage', owner, source)
    if (source === 'gitlab.com') {
      gitlab.Projects.all().then(projects => {
        console.warn('gitlab projects', projects);
      });
    }
    return await github.repos.listForUser({
      username: owner,
      type: this.store.get('pillage.member') ? 'all' : 'owner',
      per_page: 100,
    });
  }

  parsePorcelainStatus (output) {
    return parsePorcelainStatus(output)
  }
  // parsePorcelainStatus (output) {
  //   const entries = [];

  //   const fields = output.split('\0');
  //   let field = '';

  //   console.warn('parsed porcelain status fields', fields)

  //   while ((field = fields.shift())) {
  //     if (field.startsWith('# ') && field.length > 2) {
  //       entries.push({ kind: 'header', value: field.substr(2) });
  //       continue;
  //     }

  //     const entryKind = field.substr(0, 1)

  //     if (entryKind === ChangedEntryType) {
  //       entries.push(parseChangedEntry(field))
  //     } else if (entryKind === RenamedOrCopiedEntryType) {
  //       entries.push(parsedRenamedOrCopiedEntry(field, fields.shift()))
  //     } else if (entryKind === UnmergedEntryType) {
  //       entries.push(parseUnmergedEntry(field))
  //     } else if (entryKind === UntrackedEntryType) {
  //       entries.push(parseUntrackedEntry(field))
  //     } else if (entryKind === IgnoredEntryType) {
  //       // Ignored, we don't care about these for now
  //     }
  //   }

  //   console.warn('parsed porcelain status', entries)

  //   return entries;
  // }
}

export default function (opts) {
  return new GitUtils(opts);
}
