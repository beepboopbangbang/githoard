<div align="center">
<img width="150" src="/src/renderer/assets/icon.png" alt="GitHoard" />
</div>

<h3 align="center">
GitHoard
</h3>

<p align="center">
Hoard git repositories with ease
</p>

<p align="center">

[![Build Status](https://travis-ci.org/jojobyte/githoard.svg?branch=master)](https://travis-ci.org/jojobyte/githoard)
</p>

## Overview

The goal of GitHoard is to trivialize cloning repositories for future offline review.

Often, the process of copy & pasting a repository to the command line breaks focus and flow, and other Git GUI's perpetuate this problem by requiring the selecting of a directory before starting the clone process.

GitHoard solves this by overriding the HTTP protocols associated with GitHub (github-mac:// and github-win://) and Sourcetree (sourcetree://) then automatically cloning when a link using that protocol is clicked.

## Download
Download the latest version from the [releases](https://github.com/jojobyte/githoard/releases/latest) page.

## Demo
![](/screens/demo.gif)

#### Build Setup

```bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run build


# run unit & end-to-end tests
npm test

# lint all JS/Vue component files in `src/`
npm run lint

```

## Thanks
 - [Vue.js](https://github.com/vuejs/vue)
 - [Electron](https://github.com/electron/electron)
 - [electron-vue](https://github.com/SimulatedGREG/electron-vue)
 - [Insomnia](https://github.com/getinsomnia/insomnia)
 - Everyone who contributed to the packages that made this possible. Seriously, checkout the dependencies in [package.json](/package.json)


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright &copy; 2016-present, Jordan Hess