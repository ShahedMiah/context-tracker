import { app, screen, systemPreferences } from 'electron';
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
            // Force permission check for Accessibility
            const hasAccessibility = systemPreferences.isTrusted('accessibility');
            console.log('Has accessibility permission:', hasAccessibility);

            // Request screen recording permission if needed
            try {
                const script = 'tell application "System Events" to get name of first application process whose frontmost is true';
                await execAsync(`osascript -e '${script}'`);
                console.log('Successfully executed AppleScript');
                return true;
            } catch (error) {
                console.error('Permission error:', error);
                return false;
            }
        }
        return true;
    }

    private async getNativeWindowTitle(): Promise<string> {
        try {
            if (process.platform === 'darwin') {
                // Check permissions first
                const hasPermissions = await this.checkPermissions();
                if (!hasPermissions) {
                    console.log('Missing required permissions');
                    return 'Permissions required';
                }

                // macOS
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
                // Windows
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
        if (this.isTracking) return;
        
        console.log('Starting window tracking...');

        // Check permissions before starting
        const hasPermissions = await this.checkPermissions();
        if (!hasPermissions) {
            console.log('Cannot start tracking - missing permissions');
            return;
        }

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
        return this.isTracking;
    }

    public getWindowTitle(): string {
        return this.currentWindowTitle;
    }

    public getCurrentCategory(): string {
        return this.currentCategory;
    }
}