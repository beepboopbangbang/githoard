'use strict';

import url from 'url';
import gup from 'git-url-parse';

export class GitUniversal {
  constructor () {
    this.regexTest = /^((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?$/i;
    this.dotgittxt = '.git'
  }

  get gitUrlRegexTest () {
    return this.regexTest;
  }

  get githubUrlRegexTest () {
    // (?:(git|ssh|http(?:s)?)|(git@[\w.]+))(?::(?:\/\/)?)(git(?:hub|lab).com)?((?:\/)?[\w.@:/\-~]+)(?:\.git)?(\/)?
    // (https?:\/\/(?:.+?\.)?git(?:hub|lab).com((\/[a-zA-Z0-9-]*)((\/[^!@#$%^&*()_+-={}\[\];:'",<.>/?`~]+)(?:\/|\.git))?)?)
    // const ghRegexTest = /^(https?:\/\/(.+?\.)?git(hub|lab).com(\/[a-zA-Z0-9-]*\/[^!@#$%^&*()_+-={}[\];:'",<.>/?`~]+\/?)?)$/i;
    const ghRegexTest = /^((?:(?:git@?|ssh|http(?:s)?):?\/?\/?)((?:git(?:hub|lab)|bitbucket).com)):?\/?([\w:\-~]+)\/?([\w:\-~]+)(?:\.git)?\/?$/i
    return ghRegexTest;
  }

  get dotgit () {
    return this.dotgittxt;
  }

  endsWithDotGit (str) {
    return str && (str.lastIndexOf(this.dotgit) >= str.length - this.dotgit.length || str.lastIndexOf(this.dotgit + '/') >= str.length - this.dotgit.length - 1) // add one to length in case of slash at end
  }

  parseUrl (ghUrl) {
    if (ghUrl !== '.') {
      const parsedURL = url.parse(ghUrl, true);
      let repo = ghUrl.split(/openRepo\/|cloneRepo\//).pop();
      if (parsedURL.protocol === 'sourcetree:') {
        repo = parsedURL.query.cloneUrl;
      }

      const ghu = gup(repo);

      if (repo.endsWith('/')) {
        repo = repo.slice(0, -1);
      }

      if (!repo.endsWith('.git')) {
        repo += '.git';
      }

      return {
        originalUrl: ghUrl,
        repoUrl: repo,
        repoObj: ghu
      };
    }
    return false;
  }

  parseUrlArgs (pargs) {
    if (pargs.length > 1) {
      const ghUrl = pargs.pop();
      return this.parseUrl(ghUrl);
    }
    return false;
  }
}

export default function () {
  return new GitUniversal();
}
