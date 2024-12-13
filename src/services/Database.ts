import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';

interface Session {
  appName: string;
  startTime: number;
  endTime: number;
  duration: number;
}

interface ContextSwitch {
  fromApp: string;
  toApp: string;
  timestamp: number;
}

export class Database {
  private db: Database.Database;

  constructor() {
    const dbPath = join(app.getPath('userData'), 'context-tracker.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize() {
    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        duration INTEGER NOT NULL
      )
    `);

    // Create context switches table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS context_switches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_app TEXT NOT NULL,
        to_app TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    // Create index for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_app_name ON sessions(app_name);
      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_context_switches_timestamp ON context_switches(timestamp);
    `);
  }

  async logSession(session: Session) {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (app_name, start_time, end_time, duration)
      VALUES (@appName, @startTime, @endTime, @duration)
    `);

    stmt.run(session);
  }

  async logContextSwitch(contextSwitch: ContextSwitch) {
    const stmt = this.db.prepare(`
      INSERT INTO context_switches (from_app, to_app, timestamp)
      VALUES (@fromApp, @toApp, @timestamp)
    `);

    stmt.run(contextSwitch);
  }

  getRecentSessions(limit: number = 10) {
    return this.db.prepare(`
      SELECT * FROM sessions
      ORDER BY start_time DESC
      LIMIT ?
    `).all(limit);
  }

  getContextSwitchFrequency(timespan: number) {
    const since = Date.now() - timespan;
    return this.db.prepare(`
      SELECT COUNT(*) as switches
      FROM context_switches
      WHERE timestamp > ?
    `).get(since);
  }

  close() {
    this.db.close();
  }
}
