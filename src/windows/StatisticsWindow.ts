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
        ipcMain.handle('get-window-switches', (event, limit) => {
            return this.database.getRecentWindows(limit || 10);
        });

        ipcMain.handle('get-time-spent', (event, startDate, endDate) => {
            return this.database.getTimeSpentByCategory(new Date(startDate), new Date(endDate));
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

        const htmlPath = path.join(__dirname, '../views/statistics.html');
        console.log('Loading HTML from:', htmlPath);
        
        this.window.loadFile(htmlPath);

        // Open DevTools for debugging
        this.window.webContents.openDevTools();

        // Log any loading errors
        this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('Failed to load:', errorCode, errorDescription);
        });

        this.window.on('closed', () => {
            this.window = null;
        });
    }
}