import { ipcRenderer } from 'electron';
import { Chart, ChartConfiguration } from 'chart.js/auto';

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

class StatisticsView {
    private categoryChart: Chart | null = null;
    private timeRange: number = 24; // Default to 24 hours

    constructor() {
        this.initializeCharts();
        this.updateRecentWindows();
        this.setupEventListeners();
        
        // Update every 30 seconds
        setInterval(() => {
            this.updateCharts();
            this.updateRecentWindows();
        }, 30000);
    }

    private setupEventListeners() {
        const timeRangeSelect = document.getElementById('timeRange') as HTMLSelectElement;
        timeRangeSelect.addEventListener('change', (e) => {
            this.timeRange = parseInt((e.target as HTMLSelectElement).value);
            this.updateCharts();
        });
    }

    private async initializeCharts() {
        const ctx = (document.getElementById('categoryChart') as HTMLCanvasElement).getContext('2d');
        if (!ctx) return;

        const config: ChartConfiguration = {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: 'Time Spent by Category'
                    }
                }
            }
        };

        this.categoryChart = new Chart(ctx, config);
        await this.updateCharts();
    }

    private async updateCharts() {
        if (!this.categoryChart) return;

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (this.timeRange * 60 * 60 * 1000));
        
        const timeSpent = await ipcRenderer.invoke('get-time-spent', startDate, endDate) as TimeSpent[];
        
        this.categoryChart.data.labels = timeSpent.map((t: TimeSpent) => `${t.category} (${t.percentage}%)`);
        this.categoryChart.data.datasets[0].data = timeSpent.map((t: TimeSpent) => t.totalMinutes);
        this.categoryChart.update();
    }

    private async updateRecentWindows() {
        const recentWindows = await ipcRenderer.invoke('get-window-switches', 10) as RecentWindow[];
        const tbody = document.querySelector('#recentWindowsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        recentWindows.forEach((window: RecentWindow) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(window.timestamp).toLocaleTimeString()}</td>
                <td>${window.title}</td>
                <td>${window.category}</td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Initialize the view
new StatisticsView();