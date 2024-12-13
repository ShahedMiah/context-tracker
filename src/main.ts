import { app, BrowserWindow } from 'electron';
import { WindowTracker } from './services/WindowTracker';
import { Database } from './services/Database';

let windowTracker: WindowTracker;
let database: Database;

app.whenReady().then(() => {
  // Initialize database
  database = new Database();
  
  // Initialize window tracker
  windowTracker = new WindowTracker(database);
  windowTracker.startTracking();
  
  // Keep the app running even when all windows are closed
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

// Ensure proper cleanup
app.on('before-quit', () => {
  if (windowTracker) {
    windowTracker.stopTracking();
  }
  if (database) {
    database.close();
  }
});