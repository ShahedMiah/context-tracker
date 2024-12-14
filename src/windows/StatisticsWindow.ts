import { BrowserWindow, ipcMain, app } from 'electron';
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
        ipcMain.handle('get-window-switches', async (event, limit) => {
            console.log('Fetching recent windows, limit:', limit);
            const result = await this.database.getRecentWindows(limit || 10);
            console.log('Recent windows result:', result);
            return result;
        });

        ipcMain.handle('get-time-spent', async (event, startDate, endDate) => {
            console.log('Fetching time spent between:', startDate, 'and', endDate);
            const result = this.database.getTimeSpentByCategory(new Date(startDate), new Date(endDate));
            console.log('Time spent result:', result);
            return result;
        });
    }

    public show() {
        if (this.window) {
            this.window.focus();
            return;
        }

        // Show dock icon when statistics window is opened
        if (process.platform === 'darwin') {
            app.dock.show();
        }

        this.window = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            title: 'Context Tracker - Statistics',
            show: false // Don't show until ready-to-show
        });

        const htmlPath = path.join(__dirname, '../views/statistics.html');
        console.log('Loading HTML from:', htmlPath);
        
        this.window.loadFile(htmlPath);

        // Wait for the content to be ready before showing
        this.window.once('ready-to-show', () => {
            this.window?.show();
        });

        // Remove DevTools for production
        // this.window.webContents.openDevTools();

        // Log any loading errors
        this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('Failed to load:', errorCode, errorDescription);
        });

        this.window.on('closed', () => {
            // Hide dock icon when window is closed (if no other windows are open)
            if (process.platform === 'darwin' && BrowserWindow.getAllWindows().length === 0) {
                app.dock.hide();
            }
            this.window = null;
        });
    }
}