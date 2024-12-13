import Database from 'better-sqlite3';

interface WindowSwitchRecord {
  timestamp: Date;
  windowTitle: string;
  processName: string;
  display: number;
}

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database('context-tracker.db');
    this.initializeDatabase();
  }

  private initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS window_switches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME NOT NULL,
        window_title TEXT NOT NULL,
        process_name TEXT,
        display_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async recordWindowSwitch(record: WindowSwitchRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO window_switches (timestamp, window_title, process_name, display_id)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      record.timestamp.toISOString(),
      record.windowTitle,
      record.processName,
      record.display
    );
  }

  public close() {
    this.db.close();
  }
}
