import activeWindow from 'active-win';
import { Database } from './Database';

export class WindowTracker {
  private trackingInterval: NodeJS.Timer | null = null;
  private lastActiveWindow: string | null = null;
  private lastSwitchTime: number = Date.now();
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async startTracking() {
    // Check active window every second
    this.trackingInterval = setInterval(async () => {
      try {
        const result = await activeWindow();
        
        if (!result) return;

        const currentWindow = {
          title: result.title,
          appName: result.owner.name,
          bundleId: result.owner.bundleId || '',
          timestamp: Date.now()
        };

        // Detect context switch
        if (this.lastActiveWindow !== currentWindow.appName) {
          const duration = Date.now() - this.lastSwitchTime;
          
          if (this.lastActiveWindow) {
            // Log the completed session
            await this.database.logSession({
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
          await this.database.logContextSwitch({
            fromApp: this.lastActiveWindow || '',
            toApp: currentWindow.appName,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error tracking window:', error);
      }
    }, 1000);
  }

  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }
}
