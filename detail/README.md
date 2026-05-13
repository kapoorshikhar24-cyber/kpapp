# Project Details - New folder (3)

This folder contains the **Kharcha Expense Tracker**, a modern Next.js application built with a focus on "Premium Aesthetics" and "Rich Functionality".

## Directory Structure

- `app/`: Next.js App Router (Root layout and main page).
- `components/KharchaApp/`: Modular Component Architecture.
  - `index.tsx`: State management & Screen routing.
  - `Styles.ts`: Centralized Design System.
  - `SubComponents.tsx`: Reusable UI Widgets.
  - `Utils.ts`: Helper functions & Storage logic.
  - `Constants.ts`: Configuration & Category data.
  - `Types.ts`: TypeScript Definitions.
- `public/`: Static Assets (Icons, SVGs).
- `detail/`: Project Documentation.
- `package.json`: Dependencies & Scripts.

## Key Features

1. **Modern PWA Design**: Glassmorphic UI with vibrant accents and smooth transitions.
2. **Offline First**: Uses `localStorage` for seamless persistence.
3. **Smart Dashboard**: Real-time spending analysis with interactive bar charts.
4. **Quick Entry**: 2-step expense logging with category selection and numeric entry.
5. **Security**: Functional Lock Screen with biometric simulation.
6. **Detailed History**: Filterable and searchable transaction log.

## Deployment

The app is ready for deployment to **Vercel**. Simply run:
```bash
npm run dev
```
to start local development.
