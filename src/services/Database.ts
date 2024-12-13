import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

interface WindowSwitchRecord {
    timestamp: Date;
    windowTitle: string;
    processName: string;
    display: number;
    category?: string;
}

export class DatabaseService {
    private db: Database.Database;
    private dbPath: string;

    constructor() {
        // Use the app's user data directory
        const userDataPath = app.getPath('userData');
        this.dbPath = path.join(userDataPath, 'context-tracker.db');

        // Ensure the directory exists
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        console.log('Database path:', this.dbPath);

        try {
            this.db = new Database(this.dbPath);
            this.initializeDatabase();
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    private initializeDatabase() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS window_switches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME NOT NULL,
                window_title TEXT NOT NULL,
                process_name TEXT,
                display_id INTEGER,
                category TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_window_switches_timestamp 
            ON window_switches(timestamp);

            CREATE INDEX IF NOT EXISTS idx_window_switches_category 
            ON window_switches(category);
        `);
    }

    public async recordWindowSwitch(record: WindowSwitchRecord): Promise<void> {
        const stmt = this.db.prepare(`
            INSERT INTO window_switches (
                timestamp, window_title, process_name, display_id, category
            )
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(
            record.timestamp.toISOString(),
            record.windowTitle,
            record.processName,
            record.display,
            record.category || 'Other'
        );
    }

    public close() {
        if (this.db) {
            try {
                this.db.close();
            } catch (error) {
                console.error('Error closing database:', error);
            }
        }
    }
}