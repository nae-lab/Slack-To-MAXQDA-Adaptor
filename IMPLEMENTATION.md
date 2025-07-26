# Slack Exporter Electron Implementation

## Overview

This is a GUI application for the slack-maxqda-adapter (slack-exporter) library built with:
- Electron for desktop application framework
- React with TypeScript for the UI
- shadcn/ui for component library
- i18next for internationalization
- GitHub Actions for automated builds

## Features Implemented

### 1. Slack Token Input with App Manifest Helper
- Users can input their Slack API token
- "Click here to see how to create a Slack app" button opens a dialog
- Dialog displays the complete Slack app manifest with required permissions
- Copy button to easily copy the manifest JSON
- Step-by-step instructions for creating the Slack app

### 2. Export Form
- Channel ID input
- Date range selection (start and end date)
- Format selection (DOCX or Markdown)
- Output path selection with file dialog
- Concurrency setting (1-10 parallel processes)
- Real-time validation with error messages
- Success notification with export details

### 3. Multi-language Support
- English and Japanese translations
- Language switcher in the top-right corner
- All UI elements are internationalized

### 4. Electron Integration
- Main process handles slack-exporter library calls
- IPC communication between renderer and main process
- File dialog integration for output path selection
- Secure context isolation

### 5. GitHub Actions Build Pipeline
- Automated builds for Windows, macOS, and Linux
- Creates installers for each platform:
  - Windows: NSIS installer and portable exe
  - macOS: DMG and ZIP
  - Linux: AppImage and DEB
- Automatic release creation when tagging versions

## Project Structure

```
slack-exporter-electron/
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # Preload script for IPC
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── ExportForm.tsx
│   │   └── SlackManifestDialog.tsx
│   ├── lib/
│   │   ├── i18n.ts      # i18n configuration
│   │   └── utils.ts     # Utility functions
│   ├── locales/
│   │   ├── en.json      # English translations
│   │   └── ja.json      # Japanese translations
│   ├── types/
│   │   └── electron.d.ts # TypeScript definitions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .github/
│   └── workflows/
│       └── build.yml    # GitHub Actions workflow
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Link the local slack-exporter library:
   ```bash
   ./link-local-slack-exporter.sh
   ```

3. Run in development mode:
   ```bash
   npm run electron:dev
   ```

4. Build for production:
   ```bash
   npm run dist
   ```

## Security Considerations

- Slack tokens are only stored in memory during the session
- Context isolation is enabled in Electron
- No direct Node.js access from renderer process
- All IPC calls are properly typed and validated

## Future Enhancements

1. **Secure Token Storage**: Implement secure token storage using Electron's safeStorage API
2. **Export Progress Tracking**: Real-time progress updates during export
3. **Multiple Channel Export**: Enable bulk export of multiple channels
4. **Export History**: Keep a history of previous exports
5. **Auto-update**: Implement auto-update functionality

## Notes

- The slack-exporter library needs to be installed separately (either from npm when published or linked locally)
- The application currently includes mock responses for testing when the library is not available
- Replace the TODO comments in electron/main.ts with actual slack-exporter calls when the library is available