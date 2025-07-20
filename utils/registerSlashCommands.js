const { REST, Routes } = require('discord.js');
const fs = require('fs');
const config = require('../config');

module.exports = async (client) => {
    const commands = [];
    
    // Load all slash commands
    const slashCommandFiles = fs.readdirSync('./slash-commands').filter(file => file.endsWith('.js'));
    
    for (const file of slashCommandFiles) {
        const command = require(`../slash-commands/${file}`);
        commands.push(command.data.toJSON());
    }
    
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);
        
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );
        
        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
};