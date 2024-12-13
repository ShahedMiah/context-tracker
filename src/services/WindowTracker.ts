import { app, BrowserWindow, screen } from 'electron';
import { DatabaseService } from './Database';
import { ContextCategorizationService } from './ContextCategorizationService';

export class WindowTracker {
    private database: DatabaseService;
    private categorization: ContextCategorizationService;
    private trackingInterval: NodeJS.Timeout | null = null;
    private lastActiveWindow: string | null = null;
    private isTracking: boolean = false;
    private currentWindowTitle: string = 'Unknown';
    private currentCategory: string = 'Other';

    constructor(database: DatabaseService) {
        this.database = database;
        this.categorization = new ContextCategorizationService();
    }

    public startTracking(intervalMs: number = 1000) {
        if (this.isTracking) return;
        
        console.log('Starting window tracking...');
        this.isTracking = true;
        this.trackingInterval = setInterval(() => this.checkActiveWindow(), intervalMs);
    }

    public stopTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
        this.isTracking = false;
        console.log('Window tracking stopped');
    }

    private async checkActiveWindow() {
        try {
            const activeWindow = BrowserWindow.getFocusedWindow();
            
            // Get all visible windows on the system using screen capture permissions
            const displays = screen.getAllDisplays();
            const timestamp = new Date();
            
            // Get the current window title
            const title = activeWindow?.getTitle() || 'Unknown';
            this.currentWindowTitle = title;
            
            // Categorize the window
            this.currentCategory = this.categorization.categorizeWindow(title);
            
            if (title !== this.lastActiveWindow) {
                // Window switch detected
                console.log('Window switch detected:', {
                    from: this.lastActiveWindow,
                    to: title,
                    category: this.currentCategory
                });

                await this.database.recordWindowSwitch({
                    timestamp: timestamp,
                    windowTitle: title,
                    processName: app.getName(),
                    display: displays[0].id,
                    category: this.currentCategory
                });
                
                this.lastActiveWindow = title;
            }
        } catch (error) {
            console.error('Error tracking window:', error);
        }
    }

    public isCurrentlyTracking(): boolean {
        return this.isTracking;
    }

    public getCurrentWindowTitle(): string {
        return this.currentWindowTitle;
    }

    public getCurrentCategory(): string {
        return this.currentCategory;
    }
}