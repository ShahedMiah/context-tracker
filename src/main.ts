import { app, BrowserWindow } from 'electron';
import { WindowTracker } from './services/WindowTracker';
import { DatabaseService } from './services/Database';
import { SystemTrayManager } from './services/SystemTrayManager';

let windowTracker: WindowTracker;
let database: DatabaseService;
let systemTray: SystemTrayManager;

// Add support for secure restorable state on macOS
if (process.platform === 'darwin' && typeof app.setSecureKeyboardEntryEnabled === 'function') {
  // @ts-ignore - Property might not exist in older versions
  app.applicationSupportsSecureRestorableState = true;
}

app.whenReady().then(() => {
  // Initialize database
  database = new DatabaseService();
  
  // Initialize window tracker
  windowTracker = new WindowTracker(database);
  windowTracker.startTracking();

  // Initialize system tray
  systemTray = new SystemTrayManager(windowTracker);
  
  // Keep the app running even when all windows are closed
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

// Ensure proper cleanup
app.on('before-quit', () => {
  if (systemTray) {
    systemTray.destroy();
  }
  if (windowTracker) {
    windowTracker.stopTracking();
  }
  if (database) {
    database.close();
  }
});