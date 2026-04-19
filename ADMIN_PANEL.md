# Admin Panel Guide

The admin panel is now integrated into the game for testing and debugging purposes.

## Toggling the Admin Panel

Press **`Ctrl+Shift+D`** to open/close the admin panel during gameplay.

## Features

### 1. Game State Info
Displays current game status:
- **Floor**: Current floor (X/31)
- **Health**: Current/Max player health
- **Level**: Current player level
- **Enemies**: Number of active enemies
- **Room State**: Current room state (clearing, dropped, unlocked)

### 2. Floor Navigation

#### Manual Jump
- Enter a floor number (1-31) in the input field
- Click "Go" or press Enter
- Instantly jumps to that floor and initializes the room

#### Quick Jump Buttons
- **START (F1)**: Jump to Floor 1
- **BOSS 1 (F2)**: Jump to Floor 11 (first boss)
- **BOSS 2 (F3)**: Jump to Floor 21 (second boss)
- **FINAL (F4)**: Jump to Floor 31 (final boss)

### 3. Utility Commands

#### HEAL
- Restores player health to maximum
- Useful for testing without dying

#### KILL ALL
- Instantly kills all enemies in the current room
- Allows quick progression testing

#### UNLOCK ALL
- Unlocks all abilities for the current character
- Lets you test late-game abilities without leveling up

## Testing Workflow

1. **Quick Boss Testing**: Press `Ctrl+Shift+D`, then click "BOSS 1 (F2)" to jump straight to a boss battle
2. **Damage/Health Testing**: Use HEAL to test enemy damage values
3. **Ability Testing**: Use UNLOCK ALL to access all abilities without grinding
4. **Full Playthrough**: Navigate floors sequentially with manual input or quick jumps
5. **End-Game Testing**: Jump to Floor 31 to test the final boss

## Notes

- The admin panel only appears during active gameplay (not on menus)
- All floor jumps properly reinitialize the room and reset enemy spawning
- Jumping floors doesn't affect level/XP (you keep your current progression)
- The panel matches the game's pixel-art aesthetic
