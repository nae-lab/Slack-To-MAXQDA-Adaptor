# Slack Exporter Electron

A desktop application for exporting Slack messages to DOCX and Markdown formats.

## Features

- Export Slack channel messages to DOCX or Markdown format
- User-friendly GUI built with Electron and React
- Multi-language support (English and Japanese)
- Slack app manifest generator for easy setup
- Cross-platform support (Windows, macOS, Linux)

## Installation

Download the latest release for your platform from the [Releases](https://github.com/nae-lab/slack-exporter-electron/releases) page.

## Development

### Prerequisites

- Node.js 20 or later
- npm or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/nae-lab/slack-exporter-electron.git
cd slack-exporter-electron

# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

### Building

```bash
# Build for your current platform
npm run dist

# Build for specific platforms
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

## Usage

1. Create a Slack app by clicking "Click here to see how to create a Slack app" in the application
2. Copy the provided manifest and create a new Slack app
3. Install the app to your workspace and copy the Bot User OAuth Token
4. Enter the token in the application
5. Provide the channel ID and date range for export
6. Choose the output format and location
7. Click Export

## License

MIT