const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const WebServer = require('./server');

// Create Discord client with required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Collections for commands and music queues
client.commands = new Collection();
client.slashCommands = new Collection();
client.queues = new Collection();
client.config = config;

// Load command files
const loadCommands = () => {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
        
        if (command.aliases) {
            command.aliases.forEach(alias => {
                client.commands.set(alias, command);
            });
        }
    }
    
    console.log(`✅ Loaded ${client.commands.size} commands`);
};

// Load slash commands
const loadSlashCommands = () => {
    const slashCommandFiles = fs.readdirSync('./slash-commands').filter(file => file.endsWith('.js'));
    
    for (const file of slashCommandFiles) {
        const command = require(`./slash-commands/${file}`);
        client.slashCommands.set(command.data.name, command);
    }
    
    console.log(`✅ Loaded ${client.slashCommands.size} slash commands`);
};

// Load event handlers
const loadEvents = () => {
    const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
    
    console.log(`✅ Loaded ${eventFiles.length} events`);
};

// Bot ready event
client.once('ready', () => {
    console.log(`🎵 ${client.user.tag} is online and ready!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    
    // Set bot activity
    client.user.setActivity('🎵 Music | -help', { type: ActivityType.Listening });
    
    // Register slash commands
    const registerSlashCommands = require('./utils/registerSlashCommands');
    registerSlashCommands(client);
    
    // Start web server for Render hosting
    const webServer = new WebServer(client);
    webServer.start();
    
    // Store web server reference for cleanup
    client.webServer = webServer;
});

// Message handler for prefix commands
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (!command) return;
    
    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error('Command execution error:', error);
        message.reply('❌ There was an error executing that command!');
    }
});

// Slash command handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;
    
    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error('Slash command execution error:', error);
        await interaction.reply({ content: '❌ There was an error executing that command!', ephemeral: true });
    }
});

// Voice state update handler for 24/7 mode
client.on('voiceStateUpdate', (oldState, newState) => {
    const queue = client.queues.get(oldState.guild.id);
    if (!queue || !queue.connection) return;
    
    // Check if bot was moved or disconnected
    if (oldState.channelId && !newState.channelId && oldState.id === client.user.id) {
        queue.destroy();
        return;
    }
    
    // 24/7 mode check - don't leave if enabled
    if (queue.settings.twentyFourSeven) return;
    
    // Check if channel is empty (excluding bots)
    const channel = oldState.channel;
    if (channel && channel.members.filter(member => !member.user.bot).size === 0) {
        setTimeout(() => {
            const currentQueue = client.queues.get(oldState.guild.id);
            if (currentQueue && channel.members.filter(member => !member.user.bot).size === 0) {
                currentQueue.textChannel.send('👋 Left the voice channel due to inactivity.');
                currentQueue.destroy();
            }
        }, config.settings.leaveTimeout);
    }
});

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    
    if (client.webServer) {
        client.webServer.stop();
    }
    
    // Destroy all voice connections
    client.queues.forEach(queue => {
        queue.destroy();
    });
    
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    
    if (client.webServer) {
        client.webServer.stop();
    }
    
    // Destroy all voice connections
    client.queues.forEach(queue => {
        queue.destroy();
    });
    
    client.destroy();
    process.exit(0);
});

// Initialize bot
const init = async () => {
    try {
        // Create necessary directories
        const dirs = ['commands', 'slash-commands', 'events', 'utils', 'structures'];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Load components
        loadEvents();
        loadCommands();
        loadSlashCommands();
        
        // Login to Discord
        await client.login(config.token);
    } catch (error) {
        console.error('Failed to initialize bot:', error);
        process.exit(1);
    }
};

init();