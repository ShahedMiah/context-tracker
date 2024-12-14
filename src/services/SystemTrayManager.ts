import { Tray, Menu, app, dialog } from 'electron';
import path from 'path';
import { WindowTracker } from './WindowTracker';
import { StatisticsWindow } from '../windows/StatisticsWindow';
import { DatabaseService } from './Database';

export class SystemTrayManager {
    private tray: Tray | null = null;
    private windowTracker: WindowTracker;
    private updateInterval: NodeJS.Timeout | null = null;
    private currentContextMenu: Menu | null = null;
    private statisticsWindow: StatisticsWindow;

    constructor(windowTracker: WindowTracker, database: DatabaseService) {
        this.windowTracker = windowTracker;
        this.statisticsWindow = new StatisticsWindow(database);
        this.initializeTray();
        this.startStatsUpdate();
    }

    private initializeTray() {
        try {
            console.log('Creating tray icon...');
            const iconPath = path.join(__dirname, '../../resources/tray-icon.png');
            console.log('Icon path:', iconPath);
            
            this.tray = new Tray(iconPath);
            this.tray.setToolTip('Context Tracker');
            
            // Set a default menu immediately
            const defaultMenu = Menu.buildFromTemplate([
                { label: 'Loading...', enabled: false }
            ]);
            this.tray.setContextMenu(defaultMenu);
            
            console.log('Tray icon created successfully');
            
            // Update menu after a short delay
            setTimeout(() => this.updateContextMenu(), 1000);
        } catch (error) {
            console.error('Error creating tray:', error);
            dialog.showErrorBox('Tray Error', 
                `Failed to create system tray icon: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    private updateContextMenu() {
        try {
            if (!this.tray) {
                throw new Error('Tray not initialized');
            }

            const isTracking = this.windowTracker.isCurrentlyTracking();
            const currentWindow = this.windowTracker.getWindowTitle() || 'Unknown';
            const currentCategory = this.windowTracker.getCurrentCategory() || 'Other';

            this.currentContextMenu = Menu.buildFromTemplate([
                {
                    label: `👁 Monitoring: ${currentWindow}`,
                    type: 'normal',
                    enabled: true,
                    id: 'currentWindow'
                },
                {
                    label: `🏷 Category: ${currentCategory}`,
                    type: 'normal',
                    enabled: true,
                    id: 'currentCategory'
                },
                { type: 'separator' },
                {
                    label: isTracking ? '⏸ Pause Tracking' : '▶️ Resume Tracking',
                    click: () => {
                        if (isTracking) {
                            this.windowTracker.stopTracking();
                        } else {
                            this.windowTracker.startTracking();
                        }
                        this.updateContextMenu();
                    }
                },
                { type: 'separator' },
                {
                    label: '📊 Show Statistics',
                    click: () => {
                        this.statisticsWindow.show();
                    }
                },
                { type: 'separator' },
                {
                    label: '❌ Quit',
                    click: () => app.quit()
                }
            ]);

            this.tray.setContextMenu(this.currentContextMenu);
            console.log('Context menu updated successfully');
        } catch (error) {
            console.error('Error updating context menu:', error);
        }
    }

    private startStatsUpdate() {
        try {
            console.log('Starting stats update timer...');
            // Update stats more frequently for smoother updates
            this.updateInterval = setInterval(() => {
                this.updateCurrentWindow();
            }, 1000); // Changed from 2000ms to 1000ms for more responsive updates
        } catch (error) {
            console.error('Error starting stats update:', error);
        }
    }

    private updateCurrentWindow() {
        if (!this.tray || !this.currentContextMenu) return;

        try {
            const isTracking = this.windowTracker.isCurrentlyTracking();
            const currentWindow = this.windowTracker.getWindowTitle() || 'Unknown';
            const currentCategory = this.windowTracker.getCurrentCategory() || 'Other';

            const windowItem = this.currentContextMenu.getMenuItemById('currentWindow');
            const categoryItem = this.currentContextMenu.getMenuItemById('currentCategory');

            if (windowItem) {
                windowItem.label = `👁 Monitoring: ${isTracking ? currentWindow : 'Paused'}`;
            }

            if (categoryItem) {
                categoryItem.label = `🏷 Category: ${isTracking ? currentCategory : 'Paused'}`;
            }

            this.tray.setContextMenu(this.currentContextMenu);
        } catch (error) {
            console.error('Error updating current window info:', error);
        }
    }

    public destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.tray) {
            this.tray.destroy();
        }
    }
}