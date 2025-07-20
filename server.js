const express = require('express');
const axios = require('axios');
const config = require('./config');

class WebServer {
    constructor(client) {
        this.client = client;
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.setupMiddleware();
        this.setupRoutes();
        this.startSelfPing();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Basic logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupRoutes() {
        // Health check endpoint
        this.app.get('/', (req, res) => {
            res.status(200).json({
                status: 'online',
                bot: {
                    username: this.client.user?.tag || 'Starting...',
                    servers: this.client.guilds?.cache.size || 0,
                    users: this.client.guilds?.cache.reduce((acc, guild) => acc + guild.memberCount, 0) || 0,
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    activeQueues: this.client.queues?.size || 0
                },
                timestamp: new Date().toISOString()
            });
        });
        
        // Ping endpoint for self-pinging
        this.app.get('/ping', (req, res) => {
            res.status(200).json({
                message: 'pong',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        
        // Bot stats endpoint
        this.app.get('/stats', (req, res) => {
            const stats = {
                bot: {
                    username: this.client.user?.tag,
                    id: this.client.user?.id,
                    servers: this.client.guilds?.cache.size || 0,
                    channels: this.client.channels?.cache.size || 0,
                    users: this.client.guilds?.cache.reduce((acc, guild) => acc + guild.memberCount, 0) || 0
                },
                music: {
                    activeQueues: this.client.queues?.size || 0,
                    totalSongs: Array.from(this.client.queues?.values() || []).reduce((acc, queue) => acc + queue.songs.length, 0)
                },
                system: {
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    nodeVersion: process.version,
                    platform: process.platform
                },
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(stats);
        });
        
        // Commands endpoint
        this.app.get('/commands', (req, res) => {
            const commands = Array.from(this.client.commands.values()).map(cmd => ({
                name: cmd.name,
                description: cmd.description,
                category: cmd.category,
                aliases: cmd.aliases,
                usage: cmd.usage
            }));
            
            res.status(200).json({
                totalCommands: commands.length,
                commands: commands
            });
        });
        
        // Simple web interface
        this.app.get('/dashboard', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Concigliere Music Bot - Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #2f3136; color: #fff; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #36393f; padding: 20px; border-radius: 8px; border-left: 4px solid #7289da; }
        .card h3 { margin-top: 0; color: #7289da; }
        .status-online { color: #43b581; }
        .status-offline { color: #f04747; }
        pre { background: #2f3136; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .footer { text-align: center; margin-top: 30px; color: #72767d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎵 Concigliere Music Bot</h1>
        <p>Real-time Dashboard</p>
    </div>
    
    <div class="stats">
        <div class="card">
            <h3>🤖 Bot Status</h3>
            <p><strong>Status:</strong> <span class="status-online">Online</span></p>
            <p><strong>Username:</strong> ${this.client.user?.tag || 'Loading...'}</p>
            <p><strong>Servers:</strong> ${this.client.guilds?.cache.size || 0}</p>
            <p><strong>Users:</strong> ${this.client.guilds?.cache.reduce((acc, guild) => acc + guild.memberCount, 0) || 0}</p>
        </div>
        
        <div class="card">
            <h3>🎵 Music Stats</h3>
            <p><strong>Active Queues:</strong> ${this.client.queues?.size || 0}</p>
            <p><strong>Total Songs:</strong> ${Array.from(this.client.queues?.values() || []).reduce((acc, queue) => acc + queue.songs.length, 0)}</p>
            <p><strong>Commands:</strong> ${this.client.commands?.size || 0}</p>
        </div>
        
        <div class="card">
            <h3>⚙️ System Info</h3>
            <p><strong>Uptime:</strong> ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m</p>
            <p><strong>Memory:</strong> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</p>
            <p><strong>Node.js:</strong> ${process.version}</p>
        </div>
        
        <div class="card">
            <h3>🔗 Quick Links</h3>
            <p><a href="/stats" style="color: #7289da;">📊 API Stats</a></p>
            <p><a href="/commands" style="color: #7289da;">📋 Commands List</a></p>
            <p><a href="/ping" style="color: #7289da;">🏓 Ping Test</a></p>
        </div>
    </div>
    
    <div class="footer">
        <p>Concigliere Music Bot - Powered by Discord.js</p>
        <p>Last updated: ${new Date().toLocaleString()}</p>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => window.location.reload(), 30000);
    </script>
</body>
</html>
            `);
        });
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                availableEndpoints: ['/', '/ping', '/stats', '/commands', '/dashboard']
            });
        });
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🌐 Web server running on port ${this.port}`);
            console.log(`📊 Dashboard: http://localhost:${this.port}/dashboard`);
        });
        
        return this.server;
    }
    
    startSelfPing() {
        // Only enable self-pinging if RENDER_URL is provided
        const renderUrl = process.env.RENDER_URL || process.env.SELF_PING_URL;
        
        if (!renderUrl) {
            console.log('⚠️  No RENDER_URL provided - self-pinging disabled');
            return;
        }
        
        console.log(`🏓 Self-ping enabled for: ${renderUrl}`);
        
        // Ping every 14 minutes to prevent Render from spinning down (free tier spins down after 15 minutes)
        const pingInterval = 14 * 60 * 1000; // 14 minutes
        
        const selfPing = async () => {
            try {
                const response = await axios.get(`${renderUrl}/ping`, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Concigliere-Bot-SelfPing/1.0'
                    }
                });
                
                console.log(`🏓 Self-ping successful: ${response.status} - ${new Date().toISOString()}`);
            } catch (error) {
                console.error('❌ Self-ping failed:', error.message);
            }
        };
        
        // Initial ping after 5 minutes
        setTimeout(selfPing, 5 * 60 * 1000);
        
        // Then ping every 14 minutes
        setInterval(selfPing, pingInterval);
        
        console.log(`✅ Self-ping scheduled every ${pingInterval / 1000 / 60} minutes`);
    }
    
    stop() {
        if (this.server) {
            this.server.close();
            console.log('🌐 Web server stopped');
        }
    }
}

module.exports = WebServer;