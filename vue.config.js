const { VUE_APP_NAME, VUE_APP_SLUG, VUE_APP_ID } = process.env

module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      customFileProtocol: 'ghapp://./',
      // customFileProtocol: './',
      externals: ['dugite'],
      builderOptions: {
        // publish: false,
        publish: {
          "provider": "github",
          "private": true
        },
        productName: VUE_APP_NAME,
        appId: VUE_APP_ID,
        artifactName: '${name}-${version}-${arch}.${ext}',
        protocols: [
          {
            name: VUE_APP_NAME,
            role: 'Viewer',
            schemes: [
              VUE_APP_SLUG,
            ]
          },
          {
            name: VUE_APP_ID,
            schemes: [
              'github-windows',
              'github-mac',
              'sourcetree',
              'ghapp',
            ]
          }
        ],
        mac: {
          category: 'public.app-category.developer-tools',
          icon: 'static/icons/icon.icns',
          extendInfo: {
            CFBundleURLSchemes: [
              VUE_APP_SLUG,
              'github-windows',
              'github-mac',
              'sourcetree',
              'ghapp',
            ]
          }
        },
        dmg: {
          contents: [
            {
              x: 410,
              y: 150,
              type: 'link',
              path: '/Applications'
            },
            {
              x: 130,
              y: 150,
              type: 'file'
            }
          ]
        },
        win: {
          target: [
            '7z',
            'nsis',
            'portable',
            'msi',
            // 'appx',
          ]
        },
        portable: {
          artifactName: '${name}-${version}-${arch}-portable.${ext}',
        },
        linux: {
          category: 'Development',
          target: [
            'AppImage',
            'snap',
            'deb'
          ]
        },
      }
    }
  }
}