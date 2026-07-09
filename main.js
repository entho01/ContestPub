const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'frontend/dist/vite.svg')
  });

  // Load the React app from the frontend dist folder
  mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  
  // Hide the default menu bar for a cleaner look
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startBackend() {
  console.log('Starting local backend server inside Electron...');
  
  // Set the path for the SQLite database to the user's appData folder (which is writable)
  const userDataPath = app.getPath('userData');
  process.env.DB_PATH = path.join(userDataPath, 'database.sqlite');
  
  // Run the express server natively inside the Electron process
  require('./backend/server.js');
}

function waitForServer(url, timeout, callback) {
  const startTime = Date.now();
  
  const checkServer = () => {
    http.get(url, (res) => {
      // If we get a response (even 404), the server is up
      callback();
    }).on('error', (err) => {
      if (Date.now() - startTime > timeout) {
        console.error('Backend server failed to start in time.');
        // We'll still try to create the window
        callback();
      } else {
        setTimeout(checkServer, 500);
      }
    });
  };
  
  checkServer();
}

app.whenReady().then(() => {
  startBackend();
  // Wait for the backend API to be ready before opening the window
  waitForServer('http://localhost:5000/api/contests', 15000, () => {
    createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  // Backend is running in the same process, it will naturally close when Electron quits.
});
