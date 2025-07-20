# 🚀 Render Deployment Guide

## Complete guide to deploy Concigliere Music Bot on Render with self-pinging

### Prerequisites
1. GitHub account
2. Render account (free tier available)
3. Discord Bot Token and Application ID

---

## 📋 Step 1: Prepare Your Repository

1. **Upload to GitHub:**
   - Create a new repository on GitHub
   - Upload all bot files to the repository
   - Make sure `.env` is in `.gitignore` (it already is)

---

## 🌐 Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended)

1. **Connect Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` configuration

2. **Set Environment Variables:**
   - In your service settings, add these environment variables:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_application_id
   OWNER_ID=your_discord_user_id
   PREFIX=-
   SPOTIFY_CLIENT_ID=your_spotify_client_id (optional)
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret (optional)
   ```

### Option B: Manual Setup

1. **Create Web Service:**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service:**
   - **Name:** `concigliere-music-bot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

3. **Health Check:**
   - **Health Check Path:** `/ping`

---

## 🔧 Step 3: Configure Self-Pinging

The bot includes automatic self-pinging to prevent Render's free tier from spinning down.

### Automatic Configuration:
1. **Get Your Render URL:**
   - After deployment, Render provides a URL like: `https://your-app-name.onrender.com`

2. **Set RENDER_URL Environment Variable:**
   - In Render dashboard, go to your service
   - Go to "Environment" tab
   - Add: `RENDER_URL=https://your-app-name.onrender.com`

### How Self-Pinging Works:
- ✅ Pings itself every **14 minutes** (Render free tier spins down after 15 minutes)
- ✅ Uses `/ping` endpoint for health checks
- ✅ Automatic logging of ping status
- ✅ No external services required

---

## 📊 Step 4: Verify Deployment

### Check Bot Status:
1. **Dashboard:** Visit `https://your-app-name.onrender.com/dashboard`
2. **Health Check:** Visit `https://your-app-name.onrender.com/ping`
3. **Stats API:** Visit `https://your-app-name.onrender.com/stats`

### Logs:
- Check Render logs for successful startup messages:
  ```
  🎵 BotName#1234 is online and ready!
  📊 Serving X servers
  🌐 Web server running on port 3000
  🏓 Self-ping enabled for: https://your-app-name.onrender.com
  ✅ Self-ping scheduled every 14 minutes
  ```

---

## 🔍 Troubleshooting

### Common Issues:

1. **Bot Not Starting:**
   - ❌ Check Discord token is correct
   - ❌ Verify all required environment variables are set
   - ❌ Check Render logs for error messages

2. **Self-Ping Not Working:**
   - ❌ Ensure `RENDER_URL` environment variable is set correctly
   - ❌ Check logs for ping success/failure messages
   - ❌ Verify the URL is accessible from browser

3. **Voice Connection Issues:**
   - ❌ Make sure all voice dependencies are installed
   - ❌ Check if the bot has proper permissions in Discord servers

### Log Messages to Look For:

**✅ Success Messages:**
```
🎵 BotName#1234 is online and ready!
🌐 Web server running on port 3000
🏓 Self-ping enabled for: https://your-app-name.onrender.com
🏓 Self-ping successful: 200 - 2024-XX-XX...
```

**❌ Error Messages:**
```
❌ Self-ping failed: [error message]
❌ Connection error: [error details]
```

---

## 🎯 Features After Deployment

### Available Endpoints:
- **`/`** - Health check and bot status
- **`/ping`** - Simple ping endpoint (used for self-pinging)
- **`/stats`** - Detailed bot statistics API
- **`/commands`** - List of all bot commands
- **`/dashboard`** - Web dashboard with real-time stats

### Self-Pinging Benefits:
- ✅ **99% Uptime:** Bot stays online 24/7 on free tier
- ✅ **Automatic:** No manual intervention required
- ✅ **Efficient:** Minimal resource usage
- ✅ **Logging:** Track ping success/failures

### Dashboard Features:
- 📊 Real-time bot statistics
- 🎵 Active music queues
- 📈 Memory and uptime monitoring
- 🔗 Quick links to API endpoints

---

## 💡 Advanced Configuration

### Custom Ping Interval:
To change the ping frequency, modify `server.js`:
```javascript
const pingInterval = 14 * 60 * 1000; // 14 minutes (change as needed)
```

### Multiple Ping URLs:
Add multiple URLs for redundancy:
```javascript
const urls = [
  process.env.RENDER_URL,
  process.env.BACKUP_URL
];
```

### Custom Health Checks:
Modify the `/ping` endpoint in `server.js` for custom health checks:
```javascript
app.get('/ping', (req, res) => {
    // Add custom health check logic here
    res.status(200).json({ message: 'pong', custom: 'data' });
});
```

---

## 📈 Monitoring

### Built-in Monitoring:
- Real-time dashboard at `/dashboard`
- API stats at `/stats`
- Automatic ping logging in Render logs

### External Monitoring (Optional):
- **UptimeRobot:** Monitor the `/ping` endpoint
- **StatusCake:** Track uptime and response times
- **Pingdom:** Professional monitoring solution

---

## 🎉 Success!

Your Concigliere Music Bot is now deployed on Render with:
- ✅ **24/7 Uptime** with self-pinging
- ✅ **Free Hosting** on Render
- ✅ **Web Dashboard** for monitoring
- ✅ **Automatic Health Checks**
- ✅ **All Premium Features** included

**Bot URL:** `https://your-app-name.onrender.com`  
**Dashboard:** `https://your-app-name.onrender.com/dashboard`

Enjoy your free, always-online Discord music bot! 🎵