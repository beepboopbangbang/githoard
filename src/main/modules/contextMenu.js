export default function () {
  require('electron-context-menu')({
    showInspectElement: process.env.NODE_ENV === 'development',
    prepend: () => () => {
      // Enables Keyboard Shortcuts for Copy/Pasting in OSX
      return process.platform === 'darwin' ? [
        {
          label: 'Cut',
          accelerator: 'Cmd+X',
          selector: 'cut:',
          visible: false
        },
        {
          label: 'Copy',
          accelerator: 'Cmd+C',
          selector: 'copy:',
          visible: false
        },
        {
          label: 'Paste',
          accelerator: 'Cmd+V',
          selector: 'paste:',
          visible: false
        },
        {
          label: 'Select All',
          accelerator: 'Cmd+A',
          selector: 'selectAll:',
          visible: false
        }
      ] : [];
    }
  });
}