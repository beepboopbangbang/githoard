<div align="center">
<img width="150" src="/public/icons/icon.png" alt="GitHoard" />
</div>

<h3 align="center">
GitHoard
</h3>

<p align="center">
Hoard git repositories with ease
</p>

<p align="center">
 
![Build/release](https://github.com/beepboopbangbang/githoard/workflows/Build/release/badge.svg)
</p>

## Overview

The goal of GitHoard is to trivialize cloning repositories for future offline review.

Often, the process of copy & pasting a repository to the command line breaks focus and flow, and other Git GUI's perpetuate this problem by requiring the selecting of a directory before starting the clone process.

GitHoard solves this by overriding the HTTP protocols associated with GitHub (github-mac:// and github-win://) and Sourcetree (sourcetree://) as well as creating a new protocol (githoard://) then automatically cloning when a link using that protocol is clicked.

## Download
Download the latest version from the [releases](https://github.com/beepboopbangbang/githoard/releases/latest) page.

## Demo
![](/screens/demo.gif)

#### Build Setup

```bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run electron:serve

# build electron application for production
npm run electron:build


# run unit & end-to-end tests
npm run test:unit

# lint all JS/Vue component files in `src/`
npm run lint

```

## Related
Want to clone stuff even quicker? Check out our Firefox browser addon
 - https://addons.mozilla.org/en-US/firefox/addon/githoard-quick-clone/
 - https://github.com/beepboopbangbang/githoard-browser-addons

## Thanks & Love go out to
 - [Vue.js](https://github.com/vuejs/vue)
 - [Electron](https://github.com/electron/electron)
 - [Vue CLI Plugin Electron Builder](https://github.com/nklayman/vue-cli-plugin-electron-builder)
 - [electron-vue](https://github.com/SimulatedGREG/electron-vue) (No longer used)
 - [Insomnia](https://github.com/getinsomnia/insomnia)
 - Everyone who contributed to the packages that made this possible. Seriously, checkout the dependencies in [package.json](/package.json)


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright &copy; 2016-present, Beep Boop Bang Bang LLC

GitHoard logo designed by Jordan and makes use of Git Logo by Jason Long which is licensed under the Creative Commons Attribution 3.0 Unported License. See https://git-scm.com/downloads/logos
