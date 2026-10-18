const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

let server;

async function startDesktopApp() {
  app.setName('Fortis Vault');
  process.env.DB_FILE = path.join(app.getPath('userData'), 'database.sqlite');

  const backend = require('../backend/server');
  server = backend.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    const window = new BrowserWindow({
      width: 1280,
      height: 820,
      minWidth: 900,
      minHeight: 600,
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    try {
      await window.loadURL(`http://127.0.0.1:${port}`);
    } catch (error) {
      dialog.showErrorBox('Fortis Vault failed to start', error.message);
      app.quit();
    }
  });

  server.on('error', (error) => {
    dialog.showErrorBox('Fortis Vault failed to start', error.message);
    app.quit();
  });
}

app.whenReady().then(startDesktopApp);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});
