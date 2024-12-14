import { app, screen } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabaseService } from './Database';
import { ContextCategorizationService } from './ContextCategorizationService';

const execAsync = promisify(exec);

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

    private async checkPermissions(): Promise<boolean> {
        if (process.platform === 'darwin') {
            try {
                const script = 'tell application "System Events" to get name of first application process whose frontmost is true';
                await execAsync(`osascript -e '${script}'`);
                return true;
            } catch (error) {
                console.error('Permission error:', error);
                return false;
            }
        }
        return true;
    }

    private async getNativeWindowTitle(): Promise<string> {
        if (!this.isTracking) {
            return 'Tracking Paused';
        }

        try {
            if (process.platform === 'darwin') {
                const hasPermissions = await this.checkPermissions();
                if (!hasPermissions) {
                    return 'Permissions required';
                }

                const script = `
                    tell application "System Events"
                        set frontApp to first application process whose frontmost is true
                        set windowTitle to ""
                        try
                            set windowTitle to name of window 1 of frontApp
                        end try
                        return {name of frontApp, windowTitle}
                    end tell
                `;
                const { stdout } = await execAsync(`osascript -e '${script}'`);
                const [appName, windowTitle] = stdout.trim().split(',').map(s => s.trim());
                return windowTitle || appName;
            } else if (process.platform === 'win32') {
                const script = `
                    Add-Type @"
                    using System;
                    using System.Runtime.InteropServices;
                    public class WindowTitle {
                        [DllImport("user32.dll")]
                        public static extern IntPtr GetForegroundWindow();
                        [DllImport("user32.dll")]
                        public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
                    }
                "@
                $window = [WindowTitle]::GetForegroundWindow()
                $buffer = New-Object System.Text.StringBuilder(256)
                [WindowTitle]::GetWindowText($window, $buffer, 256)
                $buffer.ToString()
                `;
                const { stdout } = await execAsync('powershell -Command "' + script + '"');
                return stdout.trim();
            }
            return 'Unknown';
        } catch (error) {
            console.error('Error getting window title:', error);
            return 'Unknown';
        }
    }

    public async startTracking(intervalMs: number = 1000) {
        console.log('Starting window tracking...');

        // Stop any existing tracking first
        this.stopTracking();

        // Check permissions before starting
        const hasPermissions = await this.checkPermissions();
        if (!hasPermissions) {
            console.log('Cannot start tracking - missing permissions');
            return;
        }

        // Set tracking state
        this.isTracking = true;
        
        // Start the tracking interval
        this.trackingInterval = setInterval(async () => {
            await this.checkActiveWindow();
        }, intervalMs);

        // Get initial window title
        this.currentWindowTitle = await this.getNativeWindowTitle();
        this.currentCategory = this.categorization.categorizeWindow(this.currentWindowTitle);
        
        console.log('Tracking started successfully');
    }

    public stopTracking() {
        console.log('Stopping window tracking...');

        // Clear the tracking interval
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        // Reset tracking state
        this.isTracking = false;
        this.lastActiveWindow = null;
        this.currentWindowTitle = 'Tracking Paused';
        this.currentCategory = 'Tracking Paused';

        console.log('Tracking stopped successfully');
    }

    private async checkActiveWindow() {
        if (!this.isTracking || !this.trackingInterval) {
            return;
        }

        try {
            const title = await this.getNativeWindowTitle();
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

                const displays = screen.getAllDisplays();
                await this.database.recordWindowSwitch({
                    timestamp: new Date(),
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
        return this.isTracking && this.trackingInterval !== null;
    }

    public getWindowTitle(): string {
        return this.isCurrentlyTracking() ? this.currentWindowTitle : 'Tracking Paused';
    }

    public getCurrentCategory(): string {
        return this.isCurrentlyTracking() ? this.currentCategory : 'Tracking Paused';
    }
}