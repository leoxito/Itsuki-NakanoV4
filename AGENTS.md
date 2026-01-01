# AGENTS.md - Agent Development Guidelines

## Build/Lint/Test Commands

```bash
# Start the bot
npm start

# Start bot with debugging
node index.js

# Note: No test framework is currently configured
# Tests would need to be added manually using frameworks like Jest or Mocha
```

## Project Structure

```
Itsuki-NakanoV5/
├── index.js           # Entry point - handles temp folder cleanup and process management
├── main.js            # Core WhatsApp connection logic using Baileys
├── handler.js         # Message handler and plugin system
├── config.js          # Bot configuration (prefixes, owners, settings)
├── lib/               # Core libraries
│   ├── database.js    # SQLite database operations
│   ├── serialize.js   # Message serialization
│   └── recsubs.js     # Sub-bot recovery system
├── plugins/           # Command plugins organized by category
│   ├── Anime/         # Anime reactions
│   ├── Downloader/    # Download commands
│   ├── Economy/       # Economy system
│   ├── Enable/        # Group settings commands
│   ├── Main/          # Main commands (menu, etc.)
│   ├── Owner/         # Owner-only commands
│   ├── Subbots/       # Sub-bot management
│   ├── Tools/         # Utility commands
│   └── functions/     # Shared plugin utilities
├── database/          # SQLite database files
└── temp/              # Temporary files (auto-created)
```

## Code Style Guidelines

### Imports and Modules

- Use CommonJS (`require`/`module.exports`) - NOT ES6 modules
- Group imports: standard library → external deps → local modules
- Example:
```javascript
const fs = require('fs')
const axios = require('axios')
const config = require('../config')
```

### Plugin Structure

All plugins MUST export an object with these properties:

```javascript
module.exports = {
  command: ['cmd1', 'cmd2', 'cmd3'],  // Array of command aliases (string or array)
  help: ['cmd1', 'cmd2'],              // Help menu aliases
  description: 'Command description', // Brief description
  tags: ['category'],                  // Optional: tags for organization
  admin: false,                        // Optional: requires group admin
  group: false,                        // Optional: groups only
  isOwner: false,                      // Optional: owner only
  isBotAdmin: false,                   // Optional: bot must be admin
  async run(ms, { sylph, text, args, command, isOwner, isPrem, prefix }) {
    // Command logic here
  }
}
```

### Naming Conventions

- **Files**: `kebab-case.js` (e.g., `chatgpt.js`, `what-music.js`)
- **Variables**: `camelCase` (e.g., `userId`, `messageText`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RECONNECT_ATTEMPTS`)
- **Functions**: `camelCase` (e.g., `formatUptime`, `getProfilePic`)
- **Database tables**: `snake_case` (e.g., `users`, `chats`, `settings`)
- **Plugin categories**: `PascalCase` for folders (e.g., `Downloader`, `Economy`)

### Error Handling

- Always wrap async operations in try-catch blocks
- Log errors with context using `console.error()`
- Return user-friendly error messages via `ms.reply()`
- Example:
```javascript
async function someFunction() {
  try {
    const result = await riskyOperation()
    return result
  } catch (error) {
    console.error('Error in someFunction:', error)
    ms.reply('❌ Ocurrió un error al procesar tu solicitud.')
    throw error // Re-throw if caller needs to handle it
  }
}
```

### Database Operations

- Use the database helper functions: `getUser()`, `updateUser()`, `getChat()`, `updateChat()`
- Database is SQLite with async/await pattern
- Tables: `users` (user data), `chats` (group settings), `settings` (bot config)
- Example:
```javascript
const user = await getUser(userId)
await updateUser(userId, { coin: user.coin + 100 })
```

### Message Handling

- Messages are passed to plugins via `ms` object with methods like:
  - `ms.reply(text)` - Send reply message
  - `ms.media(url, buffer)` - Send media
  - `ms.Mentions(text)` - Extract mentions from text
  - `ms.key` - Message key for reactions
- Always use `await` for async message operations
- Use reactions for user feedback: `{ react: { text: "✅", key: ms.key } }`

### WhatsApp/Baileys Specific

- Bot instance is available as `sylph` in plugin context
- Use `sylph.sendMessage()` for sending messages
- Use `sylph.user.id` to get bot number
- Connection is auto-reconnecting (see main.js reconnect logic)
- Session files stored in `Sesion/` directory

### Performance Optimization

- Use `NodeCache` for caching expensive operations (profile pics, API responses)
- Temp files should be auto-deleted (cleanup interval: 6 hours)
- Use `processedMessages` cache to prevent duplicate message handling
- Plugin hot-reload is enabled via `chokidar`

### Configuration

- Bot settings in `config.js`
- Prefixes: `.`, `!`, `#`, `-`, `/`
- Owner numbers can check with `isOwner` in plugin context
- Public mode can be toggled via `isPublic` in config

### Formatting

- Use 2-space indentation (project standard)
- Keep lines under 100 characters when possible
- Add comments for complex logic
- Use template literals for string interpolation

### Testing

- No test framework currently configured
- Manual testing required: start bot with `npm start` and test commands
- Test in real WhatsApp environment or with WhatsApp Business API
- Test edge cases: missing args, invalid inputs, permission errors

### Important Notes

- `temp/` folder is auto-created on startup and cleaned every 6 hours
- Bot auto-restarts if main.js crashes (index.js handles this)
- Sub-bot sessions stored in `Sesiones/Subbot/`
- Session files should NOT be committed to git (add to .gitignore)
- Baileys version: `@whiskeysockets/baileys` as `npm:wileys`
