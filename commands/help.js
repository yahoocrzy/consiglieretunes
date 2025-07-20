const EmbedBuilders = require('../utils/embedBuilder');
const fs = require('fs');

module.exports = {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Display help information for commands',
    usage: '-help [command]',
    category: 'General',
    async execute(message, args, client) {
        if (!args.length) {
            // Show all commands
            const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
            const commands = [];
            
            for (const file of commandFiles) {
                const command = require(`./${file}`);
                commands.push(command);
            }
            
            const embed = EmbedBuilders.help(commands);
            embed.setFooter({ 
                text: `Prefix: ${client.config.prefix} | Use ${client.config.prefix}help <command> for detailed info` 
            });
            
            return message.reply({ embeds: [embed] });
        }
        
        // Show specific command help
        const commandName = args[0].toLowerCase();
        const command = client.commands.get(commandName);
        
        if (!command) {
            return message.reply({
                embeds: [EmbedBuilders.error('Command Not Found', `No command found with name \`${commandName}\`!`)]
            });
        }
        
        const embed = new EmbedBuilders.info('Command Help', '')
            .setTitle(`📖 Help: ${command.name}`)
            .addFields(
                { name: '📝 Description', value: command.description || 'No description available', inline: false },
                { name: '📋 Usage', value: command.usage || `${client.config.prefix}${command.name}`, inline: false }
            );
        
        if (command.aliases && command.aliases.length > 0) {
            embed.addFields({ 
                name: '🔗 Aliases', 
                value: command.aliases.map(alias => `\`${alias}\``).join(', '), 
                inline: false 
            });
        }
        
        if (command.category) {
            embed.addFields({ name: '📂 Category', value: command.category, inline: true });
        }
        
        await message.reply({ embeds: [embed] });
    }
};