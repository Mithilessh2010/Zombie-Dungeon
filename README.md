# Stickman RPG — Ancient Ascendance

A minimal indie pixel-style dungeon crawler built with React, TypeScript, and Vite.

## Play
Conquer 31 floors of increasingly difficult enemies. Choose your class, unlock abilities as you level up, and reach the top.

**Controls**
- `WASD` / Arrow keys — move
- Mouse click — basic attack  
- `1` `2` `3` `4` / custom keybinds — abilities
- Click an ability slot to rebind it

**Admin Panel** (Testing & Debugging)
- Press `Ctrl+Shift+D` during gameplay to open the admin panel
- Jump to any floor (1-31) with manual input
- Quick jump buttons: Start, Boss 1 (Floor 11), Boss 2 (Floor 21), Final (Floor 31)
- Utilities: HEAL, KILL ALL, UNLOCK ALL
- View real-time game state (floor, health, level, enemies, room state)

**Abilities Unlock**
Abilities unlock as you level up during gameplay:
- Level 2: First ability
- Level 5: Second ability
- Level 8: Third ability
- Level 11: Fourth ability
- Level 14: Fifth ability

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
