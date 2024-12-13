import { app, BrowserWindow, dialog, Event } from 'electron';
import { WindowTracker } from './services/WindowTracker';
import { DatabaseService } from './services/Database';
import { SystemTrayManager } from './services/SystemTrayManager';

let windowTracker: WindowTracker;
let database: DatabaseService;
let systemTray: SystemTrayManager;

// Prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    console.log('App starting...');

    // Add support for secure restorable state on macOS
    if (process.platform === 'darwin' && typeof app.setSecureKeyboardEntryEnabled === 'function') {
        // @ts-ignore - Property might not exist in older versions
        app.applicationSupportsSecureRestorableState = true;
    }

    app.dock?.hide(); // Hide dock icon on macOS

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

            // Initialize system tray
            console.log('Initializing system tray...');
            systemTray = new SystemTrayManager(windowTracker, database);

            console.log('App initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
            dialog.showErrorBox('Startup Error', 
                `The application encountered an error during startup: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    });

    // Keep the app running even when all windows are closed
    app.on('window-all-closed', (event: Event) => {
        event.preventDefault(); // Prevent the app from quitting
    });

    // Log any unhandled errors
    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        dialog.showErrorBox('Error', 
            `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
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
}