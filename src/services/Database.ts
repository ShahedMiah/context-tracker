import Database from 'better-sqlite3';

interface WindowSwitchRecord {
    timestamp: Date;
    windowTitle: string;
    processName: string;
    display: number;
    category?: string;
}

interface TimeSpent {
    category: string;
    totalMinutes: number;
    percentage: number;
}

interface RecentWindow {
    title: string;
    category: string;
    timestamp: string;
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

    public getTimeSpentByCategory(startDate: Date, endDate: Date): TimeSpent[] {
        const query = `
            WITH time_diffs AS (
                SELECT 
                    category,
                    ROUND(
                        SUM(
                            CASE 
                                WHEN lead_timestamp IS NULL THEN 
                                    JULIANDAY(?) - JULIANDAY(timestamp)
                                ELSE 
                                    JULIANDAY(lead_timestamp) - JULIANDAY(timestamp)
                            END * 24 * 60
                        )
                    ) as minutes
                FROM (
                    SELECT 
                        category,
                        timestamp,
                        LEAD(timestamp) OVER (ORDER BY timestamp) as lead_timestamp
                    FROM window_switches
                    WHERE timestamp BETWEEN ? AND ?
                )
                GROUP BY category
            )
            SELECT 
                category,
                minutes as totalMinutes,
                ROUND(CAST(minutes AS FLOAT) * 100 / SUM(minutes) OVER (), 2) as percentage
            FROM time_diffs
            ORDER BY minutes DESC;
        `;

        const stmt = this.db.prepare(query);
        return stmt.all(
            endDate.toISOString(),
            startDate.toISOString(),
            endDate.toISOString()
        ) as TimeSpent[];
    }

    public getRecentWindows(limit: number = 10): RecentWindow[] {
        const query = `
            SELECT 
                window_title as title,
                category,
                timestamp
            FROM window_switches
            ORDER BY timestamp DESC
            LIMIT ?;
        `;
        
        const stmt = this.db.prepare(query);
        return stmt.all(limit) as RecentWindow[];
    }

    public close() {
        this.db.close();
    }
}