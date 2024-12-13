import { app, BrowserWindow } from 'electron';
import { WindowTracker } from './services/WindowTracker';
import { DatabaseService } from './services/Database';

let windowTracker: WindowTracker;
let database: DatabaseService;

app.whenReady().then(() => {
  // Initialize database
  database = new DatabaseService();
  
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