import {
  clipboard,
} from 'electron';
import contextMenu from 'electron-context-menu';

export default function ({ git, helpers }) {
  contextMenu({
    showInspectElement: process.env.NODE_ENV === 'development',
    prepend: (defaultActions, params, browserWindow) => [
      {
        label: 'Paste && Go',
        click: async () => {
          let cb = await clipboard.readText();
          const cbIsGhGlOrBBUrl = await helpers.githubUrlRegexTest.test(cb);
          const clipboardHasGitRepo = await helpers.gitUrlRegexTest.test(cb);
          // console.warn('P&G ==', cb, clipboardHasGitRepo, cbIsGhGlOrBBUrl)
          if (clipboardHasGitRepo || cbIsGhGlOrBBUrl) {
            const parsedClipboard = await helpers.parseUrl(cb);
            // console.warn('P&G clipboardHasGitRepo ==', parsedClipboard)
            git.clone(parsedClipboard.repoUrl);
          }
        },
        // Only show it when right-clicking images
        visible: params.isEditable
      },
      // {
      //   label: 'Search Google for “{selection}”',
      //   // Only show it when right-clicking text
      //   visible: params.selectionText.trim().length > 0,
      //   click: () => {
      //     shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
      //   }
      // }
    ],
    // prepend: () => () => {
    //   // Enables Keyboard Shortcuts for Copy/Pasting in OSX
    //   return process.platform === 'darwin' ? [
    //     {
    //       label: 'Cut',
    //       accelerator: 'Cmd+X',
    //       selector: 'cut:',
    //       visible: false
    //     },
    //     {
    //       label: 'Copy',
    //       accelerator: 'Cmd+C',
    //       selector: 'copy:',
    //       visible: false
    //     },
    //     {
    //       label: 'Paste',
    //       accelerator: 'Cmd+V',
    //       selector: 'paste:',
    //       visible: false
    //     },
    //     {
    //       label: 'Select All',
    //       accelerator: 'Cmd+A',
    //       selector: 'selectAll:',
    //       visible: false
    //     }
    //   ] : [];
    // }
  });
}