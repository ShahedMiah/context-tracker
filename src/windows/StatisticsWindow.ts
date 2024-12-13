import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { DatabaseService } from '../services/Database';

export class StatisticsWindow {
    private window: BrowserWindow | null = null;
    private database: DatabaseService;

    constructor(database: DatabaseService) {
        this.database = database;
        this.setupIpcHandlers();
    }

    private setupIpcHandlers() {
        // Add IPC handlers for communicating with the window
        ipcMain.handle('get-window-switches', (event, limit) => {
            // We'll implement this in the Database service
            return this.database.getRecentWindows(limit || 10);
        });
    }

    public show() {
        if (this.window) {
            this.window.focus();
            return;
        }

        this.window = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            title: 'Context Tracker - Statistics'
        });

        this.window.loadFile(path.join(__dirname, '../../views/statistics.html'));

        this.window.on('closed', () => {
            this.window = null;
        });
    }
}