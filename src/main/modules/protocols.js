import {
  app,
  protocol,
} from 'electron';

export function initProtocols() {
  if (process.env.NODE_ENV !== 'development') {
    const urlSchemes = {
      ghwin: 'github-windows',
      ghmac: 'github-mac',
      bb: 'sourcetree',
      hoard: 'githoard'
    };

    protocol.registerStandardSchemes([
      urlSchemes.ghwin,
      urlSchemes.ghmac,
      urlSchemes.bb,
      urlSchemes.hoard
    ]);
    app.setAsDefaultProtocolClient(urlSchemes.ghwin);
    app.setAsDefaultProtocolClient(urlSchemes.ghmac);
    app.setAsDefaultProtocolClient(urlSchemes.bb);
    app.setAsDefaultProtocolClient(urlSchemes.hoard);
  }
}
