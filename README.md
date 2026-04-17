# Stickman RPG — Ancient Ascendance

A minimal indie pixel-style dungeon crawler built with React, TypeScript, and Vite.

## Play
Conquer 31 floors of increasingly difficult enemies. Choose your class, unlock abilities as you level up, and reach the top.

**Controls**
- `WASD` / Arrow keys — move
- Mouse click — basic attack  
- `1` `2` `3` `4` / custom keybinds — abilities
- Click an ability slot to rebind it

**Classes**
| Class  | Style             | HP  |
|--------|-------------------|-----|
| Knight | Balanced, durable | 150 |
| Rogue  | Fast, lethal      | 100 |
| Mage   | Ranged, burst     | 100 |
| Archer | Precise, rapid    | 100 |

## Deploy to Vercel

### Option A — Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option B — Vercel Dashboard
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Vercel auto-detects Vite — just click **Deploy**

No environment variables needed.

## Local Development
```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Stack
- React 19
- TypeScript 5.8
- Vite 6
- Tailwind CSS 4
- Lucide React (icons)
