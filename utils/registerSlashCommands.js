const { REST, Routes } = require('discord.js');
const fs = require('fs');
const config = require('../config');

module.exports = async (client) => {
    const commands = [];
    
    // Load all slash commands
    const slashCommandFiles = fs.readdirSync('./slash-commands').filter(file => file.endsWith('.js'));
    
    for (const file of slashCommandFiles) {
        const command = require(`../slash-commands/${file}`);
        if (command.data) {
            commands.push(command.data.toJSON());
            console.log(`📝 Loaded slash command: ${command.data.name}`);
        } else {
            console.warn(`⚠️ Command ${file} missing data property`);
        }
    }
    
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);
        console.log(`📋 Commands: ${commands.map(cmd => cmd.name).join(', ')}`);
        
        // Clear existing commands first
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: [] }
        );
        
        // Register new commands
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );
        
        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
};