# The Abel Experience™ - Pokémon FireRed Overlay

A React-based streaming overlay for Pokémon FireRed/LeafGreen, designed for OBS Browser Source.

## Features

- **Live Team Display**: Shows current party with sprites, stats, and details.
- **Badge Tracker**: Displays collected Kanto badges.
- **Location & Events**: Shows current map location and recent game events.
- **Retro Aesthetic**: FireRed/LeafGreen inspired UI with TAEXP branding (Black & Amber).
- **Transparent Background**: Ready for OBS overlay.

## Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Run Development Server**:

   ```bash
   npm run dev
   ```

3. **OBS Setup**:
   - Add a **Browser Source**.
   - Set URL to `http://localhost:5173/` (or your build output).
   - Set Width: `1920`.
   - Set Height: `1080`.
   - Check "Shutdown source when not visible" and "Refresh browser when scene becomes active" if desired.

## Data Source

The overlay polls `public/live.json` every 500ms.
Update this file (via Lua script or manually) to change the overlay content.

### JSON Structure

```json
{
  "team": [
    {
      "species": "Charizard",
      "nickname": "Ignis",
      "level": 36,
      "gender": "Male",
      "nature": "Adamant",
      "shiny": false,
      "stats": { "total": 534 },
      "sprite": "URL_TO_SPRITE"
    },
    ... (up to 6 slots)
  ],
  "badges": [true, false, ...], // 8 booleans
  "location": "Route 1",
  "events": ["Event 1", "Event 2"]
}
```

## Customization

- **Theme**: Edit `src/styles/theme.css` to change colors.
- **Layout**: Edit `src/styles/overlay.css` to adjust positions.
