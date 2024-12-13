interface CategoryRule {
    name: string;
    patterns: string[];
}

export class ContextCategorizationService {
    private categories: CategoryRule[] = [
        {
            name: 'Development',
            patterns: ['VS Code', 'Visual Studio', 'IntelliJ', 'GitHub', '.ts', '.js', '.py', 'Terminal']
        },
        {
            name: 'Communication',
            patterns: ['Slack', 'Microsoft Teams', 'Zoom', 'Discord', 'Outlook', 'Gmail', 'Mail']
        },
        {
            name: 'Productivity',
            patterns: ['Word', 'Excel', 'PowerPoint', 'Google Docs', 'Notion', 'Trello', 'Jira']
        },
        {
            name: 'Browsing',
            patterns: ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']
        },
        {
            name: 'Entertainment',
            patterns: ['YouTube', 'Netflix', 'Spotify', 'VLC', 'Media Player']
        }
    ];

    public categorizeWindow(windowTitle: string): string {
        for (const category of this.categories) {
            if (category.patterns.some(pattern => 
                windowTitle.toLowerCase().includes(pattern.toLowerCase()))) {
                return category.name;
            }
        }
        return 'Other';
    }

    public addCategory(name: string, patterns: string[]) {
        // Prevent duplicate categories
        if (!this.categories.some(c => c.name === name)) {
            this.categories.push({ name, patterns });
        }
    }

    public removeCategory(name: string) {
        this.categories = this.categories.filter(c => c.name !== name);
    }

    public getCategories(): string[] {
        return this.categories.map(c => c.name);
    }

    public getCategoryRules(): CategoryRule[] {
        return [...this.categories];
    }
}