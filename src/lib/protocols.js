import {
  app,
  protocol,
} from 'electron';
import {
  createProtocol,
} from 'vue-cli-plugin-electron-builder/lib'

function schemeBoilerplate (scheme) {
  return { scheme, privileges: { secure: true, standard: true } }
}

export function initFileProtocol() {
  if (!process.env.WEBPACK_DEV_SERVER_URL) {
    createProtocol('ghapp')
  }
}

export function initProtocols() {
  if (process.env.NODE_ENV !== 'development') {
    const urlSchemes = {
      app: 'ghapp',
      ghwin: 'github-windows',
      ghmac: 'github-mac',
      bb: 'sourcetree',
      githoard: 'githoard'
    };

    protocol.registerSchemesAsPrivileged([
      schemeBoilerplate(urlSchemes.app),
      schemeBoilerplate(urlSchemes.ghwin),
      schemeBoilerplate(urlSchemes.ghmac),
      schemeBoilerplate(urlSchemes.bb),
      schemeBoilerplate(urlSchemes.githoard),
    ]);

    app.setAsDefaultProtocolClient(urlSchemes.githoard);

    // Optional
    // app.setAsDefaultProtocolClient(urlSchemes.ghwin);
    // app.setAsDefaultProtocolClient(urlSchemes.ghmac);
    // app.setAsDefaultProtocolClient(urlSchemes.bb);
  }
}
