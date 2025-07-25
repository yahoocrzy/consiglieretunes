# 🎵 Concigliere Music Bot

> A feature-rich Discord music bot that provides **all premium features for free**, inspired by Lara but with enhanced capabilities and 24/7 Render deployment.

<div align="center">

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg?logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy](https://img.shields.io/badge/Deploy-Render-purple.svg)](https://render.com/)

[🚀 Deploy on Render](#-render-deployment-recommended) • [📋 Commands](#-commands) • [✨ Features](#-features) • [🆚 vs Lara](#-comparison-with-lara)

</div>

---

## ✨ Features

### 🎵 Core Music Features
- **Multi-Platform Support** - YouTube, Spotify, SoundCloud, Apple Music, Deezer
- **High-Quality Audio** - Crystal clear sound with low latency
- **Advanced Queue Management** - Add, remove, shuffle, and organize your music
- **Loop Modes** - Loop current song or entire queue
- **Audio Filters** - 15+ audio effects including bassboost, nightcore, 8D, and more
- **Full Playback Control** - Play, pause, skip, stop, volume control

### 🔥 Premium Features (FREE!)
- **24/7 Mode** - Bot stays in voice channel continuously
- **YouTube Playback** - Full YouTube support *(Lara now charges for this)*
- **Interactive Controls** - Button-based music controls
- **Smart Search** - Intelligent search with multiple result options
- **Playlist Support** - Import playlists from YouTube and Spotify
- **AutoPlay** - Automatically play related songs when queue ends

### ⚡ Advanced Features
- **Stage Channel Support** - Works in Discord stage channels
- **DJ Commands** - Advanced controls for server DJs
- **Queue Persistence** - Queues survive bot restarts
- **Rich Embeds** - Beautiful, informative displays
- **Permission System** - Role-based command access
- **Customizable** - Configurable prefix and settings

---

## 🎮 Commands

### 🎵 Music Commands
| Command | Aliases | Description |
|---------|---------|-------------|
| `-play <song>` | `-p` | Play a song from YouTube, Spotify, or SoundCloud |
| `-queue` | `-q` | Display the current music queue |
| `-skip` | `-s` | Skip the current song |
| `-stop` | `-disconnect`, `-dc` | Stop music and clear queue |
| `-pause` | | Pause the current song |
| `-resume` | `-unpause` | Resume the paused song |
| `-volume <0-100>` | `-vol`, `-v` | Set music volume |
| `-nowplaying` | `-np`, `-current` | Show currently playing song |
| `-shuffle` | | Shuffle the queue |
| `-loop <song/queue/off>` | `-repeat` | Toggle loop modes |
| `-remove <position>` | `-rm`, `-delete` | Remove song from queue |
| `-clear` | `-clearqueue`, `-cq` | Clear the entire queue |

### 🎛️ Filter Commands
| Command | Description |
|---------|-------------|
| `-filter list` | Show available audio filters |
| `-filter <name>` | Apply/remove an audio filter |
| `-filter clear` | Remove all filters |

**🎚️ Available Filters:**
```
bassboost • nightcore • vaporwave • 8d • karaoke • treble
flanger • phaser • tremolo • vibrato • normalizer • subboost
```

### 🕒 Premium Commands (FREE!)
| Command | Aliases | Description |
|---------|---------|-------------|
| `-247` | `-24/7`, `-stay` | Toggle 24/7 mode |

### ℹ️ General Commands
| Command | Aliases | Description |
|---------|---------|-------------|
| `-help` | `-h`, `-commands` | Show command help |
| `-help <command>` | | Get detailed help for a command |

---

## 🚀 Setup

### 📋 Prerequisites
- **Node.js** 18.x or higher
- **Discord Bot Token**
- **(Optional)** Spotify API credentials for enhanced Spotify support

### 💻 Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yahoocrzy/consiglieretunes.git
   cd concigliere-music-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the bot**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your credentials:**
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_client_id_here
   PREFIX=-
   OWNER_ID=your_discord_user_id
   
   # Optional Spotify API
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

   For development:
   ```bash
   npm run dev
   ```

### 🌐 Render Deployment (Recommended)

Deploy on Render with **automatic self-pinging** to prevent spin-down:

1. **Push to GitHub** and connect to Render
2. **Set environment variables** in Render dashboard  
3. **Deploy** - Bot will auto-ping every 14 minutes to stay online

📋 **Complete deployment guide:** [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

**✅ Benefits:**
- 24/7 uptime on free tier
- Built-in web dashboard
- Automatic health monitoring
- No spin-down issues

### 🤖 Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to your `.env` file
5. **Enable necessary intents:**
   - Message Content Intent
   - Server Members Intent  
   - Presence Intent

6. **Invite the bot with these permissions:**
   ```
   Connect • Speak • Use Voice Activity • Send Messages
   Embed Links • Read Message History • Use Slash Commands
   Manage Messages (for queue management)
   ```

### 🎵 Optional: Spotify Integration

For enhanced Spotify support:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy Client ID and Client Secret to your `.env` file

---

## 💡 Usage

### 🎯 Basic Usage
1. Join a voice channel
2. Use `-play <song name>` to start playing music
3. Use `-queue` to see upcoming songs
4. Use `-help` for all available commands

### 🔥 Advanced Features
- **24/7 Mode:** Use `-247` to keep the bot in voice channel permanently
- **Audio Filters:** Use `-filter bassboost` for enhanced bass, `-filter nightcore` for high-energy music
- **Playlist Import:** Paste YouTube or Spotify playlist URLs with `-play`
- **Interactive Controls:** Use `-nowplaying` for button-based controls

---

## 🆚 Comparison with Lara

| Feature | Lara | Concigliere | Notes |
|---------|------|-------------|-------|
| YouTube Playback | 💰 **Premium** | ✅ **Free** | Lara now charges for YouTube |
| Spotify Support | ✅ Free | ✅ Free | Both support Spotify |
| 24/7 Mode | ✅ Free | ✅ Free | Always-on music |
| Audio Filters | ✅ Free | ✅ Free | 15+ filters available |
| Button Controls | ✅ Free | ✅ Free | Interactive music controls |
| Playlist Import | ✅ Free | ✅ Free | YouTube & Spotify playlists |
| Stage Channels | ✅ Free | ✅ Free | Discord stage support |
| Queue Management | ✅ Free | ✅ Free | Full queue control |
| Multiple Platforms | ✅ Free | ✅ Free | YouTube, Spotify, SoundCloud+ |
| **Premium Cost** | **$5-10/month** | **🆓 FREE** | All features included |

---

## 🔧 Technical Details

### 🏗️ Architecture
- **Framework:** Discord.js v14
- **Audio:** @discordjs/voice with FFmpeg  
- **Music Sources:** ytdl-core, spotify-web-api-node, youtube-sr
- **Web Server:** Express.js with self-pinging
- **Deployment:** Render-optimized with automatic uptime

### ⚡ Performance
- Low memory footprint
- Efficient audio streaming
- Optimized for multiple servers
- Automatic cleanup and resource management
- **24/7 uptime** with self-pinging system

---

## 💬 Support

For support, feature requests, or bug reports:

1. Check the `-help` command first
2. Create an issue on [GitHub Issues](https://github.com/yahoocrzy/consiglieretunes/issues)
3. Join our support server: *Coming Soon*

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<div align="center">

**🎵 Enjoy unlimited music with all premium features for free! 🎵**

Made with ❤️ using [Claude Code](https://claude.ai/code)

</div>