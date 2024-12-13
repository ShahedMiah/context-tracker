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

console.log('App starting...');

app.whenReady().then(() => {
  console.log('App is ready');
  
  try {
    // Initialize database
    console.log('Initializing database...');
    database = new DatabaseService();
    
    // Initialize window tracker
    console.log('Initializing window tracker...');
    windowTracker = new WindowTracker(database);
    windowTracker.startTracking();

    // Initialize system tray with both windowTracker and database
    console.log('Initializing system tray...');
    systemTray = new SystemTrayManager(windowTracker, database);

    console.log('App initialization complete');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
  
  // Keep the app running even when all windows are closed
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

// Log any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

// Ensure proper cleanup
app.on('before-quit', () => {
  console.log('App quitting...');
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