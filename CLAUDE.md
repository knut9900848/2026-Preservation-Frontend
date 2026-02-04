# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (opens browser automatically)
quasar dev

# Build for production
quasar build

# Lint files
yarn lint

# Format files with Prettier
yarn format
```

## Tech Stack

- **Quasar Framework 2.x** with Vue 3 (Composition API with `<script setup>`)
- **Vite** as build tool via `@quasar/app-vite`
- **TypeScript** with strict mode enabled
- **Pinia** for state management
- **Vue Router** with history mode
- **Axios** for HTTP requests

## Architecture

### Project Structure
- `src/boot/` - Bootstrap files loaded at app startup (axios configuration, pinia setup)
- `src/stores/` - Pinia stores (currently auth store for user/token management)
- `src/router/` - Vue Router configuration with authentication guards
- `src/layouts/` - Layout components (MainLayout wraps authenticated pages)
- `src/pages/` - Page components, organized by feature (e.g., `setting/`, `role-permission/`)
- `src/components/` - Reusable UI components
- `quasar.config.ts` - Main Quasar configuration

### Authentication Flow
- Bearer token authentication stored in `localStorage`
- Router guards in `src/router/index.ts` redirect unauthenticated users to `/login`
- Auth state managed via Pinia store in `src/stores/auth.ts`
- API configured in `src/boot/axios.ts` with base URL `http://preservation.test`

### Quasar Plugins
- `Notify` and `Dialog` plugins are enabled in `quasar.config.ts`
- Material Design Icons (`mdi-v7`) and Material Icons available

## Code Style

- Single quotes for strings
- Print width: 100 characters
- Use type imports: `import type { X } from 'y'` (enforced by ESLint)
