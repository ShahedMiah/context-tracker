import { Tray, Menu, app, dialog, MenuItemConstructorOptions } from 'electron';
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
                { label: 'Loading...', enabled: false } as MenuItemConstructorOptions
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

            // Create menu template with proper type annotations
            const menuTemplate: MenuItemConstructorOptions[] = [
                {
                    label: `📱 ${currentWindow}`,
                    enabled: true
                },
                {
                    label: `🏷️ ${currentCategory}`,
                    enabled: true
                },
                { type: 'separator' },
                {
                    label: isTracking ? '⏸️ Pause Tracking' : '▶️ Resume Tracking',
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
            ];

            this.currentContextMenu = Menu.buildFromTemplate(menuTemplate);
            this.tray.setContextMenu(this.currentContextMenu);
            console.log('Context menu updated successfully');
        } catch (error) {
            console.error('Error updating context menu:', error);
        }
    }

    private startStatsUpdate() {
        try {
            console.log('Starting stats update timer...');
            // Update stats every second for smoother updates
            this.updateInterval = setInterval(() => {
                this.updateCurrentWindow();
            }, 1000);
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

            // Update the labels
            const menuItems = this.currentContextMenu.items;
            if (menuItems[0]) {
                menuItems[0].label = `📱 ${isTracking ? currentWindow : 'Tracking Paused'}`;
            }
            if (menuItems[1]) {
                menuItems[1].label = `🏷️ ${isTracking ? currentCategory : 'Tracking Paused'}`;
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