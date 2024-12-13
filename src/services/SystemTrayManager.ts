import { Tray, Menu, app } from 'electron';
import path from 'path';
import { WindowTracker } from './WindowTracker';

export class SystemTrayManager {
    private tray: Tray | null = null;
    private windowTracker: WindowTracker;
    private updateInterval: NodeJS.Timeout | null = null;
    private currentContextMenu: Menu | null = null;  // Add this to track the current menu

    constructor(windowTracker: WindowTracker) {
        this.windowTracker = windowTracker;
        this.initializeTray();
        this.startStatsUpdate();
    }

    private initializeTray() {
        const iconPath = path.join(__dirname, '../../resources/tray-icon.png');
        this.tray = new Tray(iconPath);
        this.tray.setToolTip('Context Tracker');
        this.updateContextMenu();
    }

    private updateContextMenu() {
        if (!this.tray) return;

        this.currentContextMenu = Menu.buildFromTemplate([
            {
                label: 'Current Window',
                enabled: false,
                id: 'currentWindow'
            },
            { type: 'separator' },
            {
                label: this.windowTracker.isCurrentlyTracking() ? 'Pause Tracking' : 'Resume Tracking',
                click: () => {
                    if (this.windowTracker.isCurrentlyTracking()) {
                        this.windowTracker.stopTracking();
                    } else {
                        this.windowTracker.startTracking();
                    }
                    this.updateContextMenu();
                }
            },
            { type: 'separator' },
            {
                label: 'Show Statistics',
                click: () => {
                    // We'll implement this later
                    console.log('Show statistics clicked');
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => app.quit()
            }
        ]);

        this.tray.setContextMenu(this.currentContextMenu);
    }

    private startStatsUpdate() {
        // Update stats every 2 seconds
        this.updateInterval = setInterval(() => {
            this.updateCurrentWindow();
        }, 2000);
    }

    private updateCurrentWindow() {
        if (!this.tray || !this.currentContextMenu) return;

        const currentWindowItem = this.currentContextMenu.getMenuItemById('currentWindow');
        if (currentWindowItem) {
            const currentTitle = this.windowTracker.getCurrentWindowTitle();
            currentWindowItem.label = `Current: ${currentTitle || 'Unknown'}`;
        }

        this.tray.setContextMenu(this.currentContextMenu);
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