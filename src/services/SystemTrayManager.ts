import { Tray, Menu, app } from 'electron';
import path from 'path';
import { WindowTracker } from './WindowTracker';

export class SystemTrayManager {
    private tray: Tray | null = null;
    private windowTracker: WindowTracker;
    private updateInterval: NodeJS.Timeout | null = null;

    constructor(windowTracker: WindowTracker) {
        this.windowTracker = windowTracker;
        this.initializeTray();
        this.startStatsUpdate();
    }

    private initializeTray() {
        // For now, we'll use a simple 16x16 icon - we'll create this next
        const iconPath = path.join(__dirname, '../../resources/tray-icon.png');
        this.tray = new Tray(iconPath);
        
        this.tray.setToolTip('Context Tracker');
        this.updateContextMenu();
    }

    private updateContextMenu() {
        if (!this.tray) return;

        const contextMenu = Menu.buildFromTemplate([
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

        this.tray.setContextMenu(contextMenu);
    }

    private startStatsUpdate() {
        // Update stats every 2 seconds
        this.updateInterval = setInterval(() => {
            this.updateCurrentWindow();
        }, 2000);
    }

    private updateCurrentWindow() {
        if (!this.tray) return;

        const contextMenu = this.tray.contextMenu;
        if (!contextMenu) return;

        const currentWindowItem = contextMenu.getMenuItemById('currentWindow');
        if (currentWindowItem) {
            currentWindowItem.label = `Current: ${this.windowTracker.getCurrentWindowTitle()}`;
        }

        this.tray.setContextMenu(contextMenu);
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
