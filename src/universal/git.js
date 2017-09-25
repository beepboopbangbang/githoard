'use strict';

import url from 'url';
import gup from 'git-url-parse';

export class GitUniversal {
  constructor () {
    this.regexTest = /^((git|ssh|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:/\-~]+)(\.git)(\/)?$/i;
  }

  get gitUrlRegexTest () {
    return this.regexTest;
  }

  parseUrl (ghUrl) {
    if (ghUrl !== '.') {
      const parsedURL = url.parse(ghUrl, true);
      let repo = ghUrl.split(/openRepo\/|cloneRepo\//).pop();
      if (parsedURL.protocol === 'sourcetree:') {
        repo = parsedURL.query.cloneUrl;
      }

      const ghu = gup(repo);

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
