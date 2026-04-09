# Technology Stack

## Languages & Runtime

- **TypeScript** ~5.9.3 - Primary language for type-safe development
- **JavaScript** (ES2020) - Runtime target for browser compatibility
- **React** 19.2.4 - UI framework with StrictMode enabled

## Build Tools & Bundlers

- **Vite** 8.0.1 - Development server and build tool
  - Config: `vite.config.ts` with React plugin
  - Base path: `./` for relative asset loading
  - Dev server: `--host 0.0.0.0` for network access

- **TypeScript Compiler** (tsc) - Type checking and compilation
  - Configs: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.bot.json`
  - Project references for multi-config setup

## Styling

- **Tailwind CSS** 4.2.2 - Utility-first CSS framework
  - PostCSS integration via `postcss.config.js`
  - Content paths: `index.html`, `src/**/*.{js,ts,jsx,tsx}`
  - No custom theme extensions (default theme)

- **CSS Modules** - Component-scoped styles via `App.css`, `index.css`

## Data Visualization

- **Chart.js** 4.5.1 - Charting library
  - **react-chartjs-2** 5.3.1 - React integration
  - **chartjs-adapter-date-fns** 3.0.0 - Date/time axis adapter
  - **date-fns** 4.1.0 - Date manipulation utilities

## Data Processing

- **PapaParse** 5.5.3 - CSV parsing
  - Dynamic typing enabled
  - Header-based parsing
  - Two CSV format support (old/new)

- **Canvas** 3.2.3 - Canvas API for image generation
- **html-to-image** 1.11.13 - HTML to image conversion
- **html2canvas** 1.4.1 - Screenshot generation

## UI Components & Icons

- **Lucide React** 1.7.0 - Icon library
- **clsx** 2.1.1 - Conditional className utility
- **tailwind-merge** 3.5.0 - Tailwind className merging

## Bot/Backend (Optional)

- **Telegraf** 4.16.3 - Telegram bot framework
  - Separate bot build via `tsconfig.bot.json`
  - Bot scripts: `bot:build`, `bot:start`, `bot:dev`

## Development Tools

- **ESLint** 9.39.4 - Code linting
  - Config: `eslint.config.js` (flat config format)
  - Plugins: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
  - Globals: browser environment via `globals` package

- **PostCSS** 8.5.8 - CSS processing
- **Autoprefixer** 10.4.27 - CSS vendor prefixing

## Testing

- **Playwright** - Browser automation for visual testing
  - Script: `visual-test.py` (Python)
  - Viewport emulation: desktop (1920x1080), laptop (1366x768), tablet (768x1024), mobile (375x667)
  - Screenshot capture for regression testing

## Deployment

- **Netlify** - Static hosting platform
  - Config: `netlify.toml`
  - Build command: `npm run build`
  - Publish directory: `dist`

## Development Scripts

```json
{
  "dev": "vite --host 0.0.0.0",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "serve": "npx serve dist -l 3000",
  "bot:build": "tsc -p tsconfig.bot.json",
  "bot:start": "node bot-dist/bot/bot.js",
  "bot:dev": "tsc -p tsconfig.bot.json --watch"
}
```

## Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App TypeScript config
- `tsconfig.node.json` - Build tool TypeScript config
- `tsconfig.bot.json` - Bot TypeScript config
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint configuration
- `netlify.toml` - Netlify deployment config
