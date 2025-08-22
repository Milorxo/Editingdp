// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: __dirname + 'pd.ico',  // path to your icon
    title: "Daily Productivity"
    frame: true,
    autoHideMenuBar: true
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
// Remove the menu bar completely
mainWindow.setMenuBarVisibility(false);

mainWindow.loadFile('index.html');
  // Load your web app (local index.html)
  win.loadFile(path.join(__dirname, 'index.html'));

  // Optional: open DevTools
  // win.webContents.openDevTools();
}

// Called when Electron is ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create a window if none are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
