import activeWindow, { Result } from 'active-win';
import { DatabaseService } from './Database';

interface WindowInfo {
  title: string;
  appName: string;
  timestamp: number;
}

export class WindowTracker {
  private trackingInterval: NodeJS.Timeout | null = null;
  private lastActiveWindow: string | null = null;
  private lastSwitchTime: number = Date.now();
  private database: DatabaseService;

  constructor(database: DatabaseService) {
    this.database = database;
  }

  async startTracking(): Promise<void> {
    // Check active window every second
    this.trackingInterval = setInterval(async () => {
      try {
        const result = await activeWindow();
        
        if (!result) return;

        const currentWindow: WindowInfo = {
          title: result.title,
          appName: result.owner.name,
          timestamp: Date.now()
        };

        // Detect context switch
        if (this.lastActiveWindow !== currentWindow.appName) {
          const duration = Date.now() - this.lastSwitchTime;
          
          if (this.lastActiveWindow) {
            // Log the completed session
            this.database.logSession({
              appName: this.lastActiveWindow,
              startTime: this.lastSwitchTime,
              endTime: Date.now(),
              duration
            });
          }

          // Update tracking state
          this.lastActiveWindow = currentWindow.appName;
          this.lastSwitchTime = Date.now();

          // Log the context switch
          this.database.logContextSwitch({
            fromApp: this.lastActiveWindow || '',
            toApp: currentWindow.appName,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error tracking window:', error);
      }
    }, 1000) as unknown as NodeJS.Timeout;
  }

  stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }
}