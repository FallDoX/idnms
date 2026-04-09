# External Integrations

## Overview

This application is primarily a client-side single-page application with minimal external dependencies. Most data processing happens in the browser using client-side libraries.

## Data Import

### CSV Parsing (Client-Side)

- **Library**: PapaParse 5.5.3
- **Location**: `src/utils/parser.ts`
- **Usage**: Parses uploaded CSV files in the browser
- **Formats Supported**: 
  - Old format: `02.04.2026 09:33:15.123` timestamp format
  - New format: Separate `date` and `time` columns with extended sensor fields
- **Auto-detection**: Format detection based on column headers
- **No server-side processing**: All parsing happens client-side

## Data Export

### Screenshot Generation

- **Libraries**: 
  - html-to-image 1.11.13
  - html2canvas 1.4.1
  - Canvas 3.2.3
- **Usage**: Generate PNG screenshots of the entire page
- **Features**: 
  - High resolution (1.5x scale)
  - Full page capture including charts and tables
  - Download as `trip-log-[date].png`
- **Location**: Implemented in `src/App.tsx` via `handleShareStats` function

## Bot Integration (Optional)

### Telegram Bot

- **Library**: Telegraf 4.16.3
- **Location**: `bot/` directory
- **Build Config**: `tsconfig.bot.json`
- **Scripts**:
  - `bot:build` - Compile bot TypeScript
  - `bot:start` - Run compiled bot
  - `bot:dev` - Watch mode for development
- **Status**: Optional feature, separate from main web app
- **Output**: Compiled to `bot-dist/bot/bot.js`

## Deployment

### Netlify

- **Config File**: `netlify.toml`
- **Deployment Type**: Static site
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Features**: 
  - Automatic HTTPS
  - CDN distribution
  - Edge caching
- **Live URL**: https://wfeucapp.netlify.app/

## Development Server

### Local Network Access

- **Command**: `npm run dev` (configured with `--host 0.0.0.0`)
- **Purpose**: Access dev server from other devices on local network
- **Local IP**: Accessible via `http://192.168.1.74:5173/` (example)
- **Default Port**: 5173 (Vite default)

## External APIs & Services

### None Detected

The application does not integrate with:
- External APIs (REST/GraphQL)
- Databases (SQL/NoSQL)
- Authentication providers (OAuth, Auth0, etc.)
- Payment gateways
- Analytics services
- CDN services (beyond Netlify's built-in)
- Email services
- File storage services (S3, etc.)

All data processing is client-side:
- CSV parsing in browser
- Chart rendering in browser
- Screenshot generation in browser
- No server-side data storage or processing

## Third-Party Libraries (Data Processing)

### Date/Time Handling

- **date-fns** 4.1.0 - Date manipulation and formatting
- **chartjs-adapter-date-fns** 3.0.0 - Chart.js date axis adapter

### Visualization

- **Chart.js** 4.5.1 - Charting engine
- **react-chartjs-2** 5.3.1 - React wrapper for Chart.js

## Browser APIs Used

- **File API** - CSV file upload and reading
- **Canvas API** - Image generation and rendering
- **Blob API** - File download for screenshots
- **Navigator API** - Language detection for i18n

## Security Considerations

- No external API calls = reduced attack surface
- No authentication required = public access
- Client-side processing = no server data exposure
- CSV parsing is sandboxed in browser
- No sensitive data transmission to external services
