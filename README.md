# Context Tracker

A smart desktop application that helps you understand and optimize your context switching patterns by running quietly in the background and providing insights about your work habits.

## Features

### Core Functionality
- 🔄 Automatic detection of application switches
- 📊 Time tracking for different applications and activities
- 🧠 Smart context categorization (Development, Communication, Planning, etc.)
- 📈 Productivity insights and patterns
- 🔔 Optional gentle reminders for better context management

### Privacy First
- 💾 All data stays local on your machine
- 🔒 No cloud sync or data collection
- 👀 Only tracks application names and times, never content

### Smart Features
- Automatically detects work contexts (e.g., "coding session" when in IDE)
- Learns your most productive patterns
- Suggests optimal times for deep work
- Identifies potential productivity drains
- Helps maintain focus during important tasks

## Technical Stack
- Electron
- React
- Node.js
- SQLite
- TypeScript

## Development Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run in development mode:
\`\`\`bash
npm run dev
\`\`\`

3. Build for production:
\`\`\`bash
npm run build
\`\`\`

## How It Works

1. **Background Monitoring**
   - Runs silently in your system tray
   - Tracks active window changes
   - Categorizes applications into contexts

2. **Smart Analysis**
   - Identifies context switching patterns
   - Calculates focus scores
   - Generates productivity insights

3. **Gentle Suggestions**
   - Optional notifications for better timing
   - Recommendations for focus periods
   - Weekly insights reports

## Privacy & Data

All data is stored locally in a SQLite database. The app tracks:
- Application names and window titles
- Time spent in each application
- Context switches and patterns

The app does NOT track or store:
- Any application content
- Keystrokes or inputs
- Personal or sensitive information

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License