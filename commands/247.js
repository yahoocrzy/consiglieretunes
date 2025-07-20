const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: '247',
    aliases: ['24/7', 'stay'],
    description: 'Toggle 24/7 mode (bot stays in voice channel)',
    usage: '-247',
    category: 'Music',
    async execute(message, args, client) {
        const queue = client.queues.get(message.guild.id);
        
        if (!queue) {
            return message.reply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no active music session!')]
            });
        }
        
        // Check if user is in the same voice channel
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
            return message.reply({
                embeds: [EmbedBuilders.error('Wrong Voice Channel', 'You need to be in the same voice channel as the bot!')]
            });
        }
        
        // Check if user has manage server permission or is the owner
        if (!message.member.permissions.has('ManageGuild') && message.author.id !== client.config.ownerId) {
            return message.reply({
                embeds: [EmbedBuilders.error('Missing Permissions', 'You need the "Manage Server" permission to use 24/7 mode!')]
            });
        }
        
        queue.settings.twentyFourSeven = !queue.settings.twentyFourSeven;
        
        const status = queue.settings.twentyFourSeven ? 'enabled' : 'disabled';
        const emoji = queue.settings.twentyFourSeven ? '🕒' : '⏰';
        
        await message.reply({
            embeds: [EmbedBuilders.success('24/7 Mode Updated', 
                `${emoji} 24/7 mode has been **${status}**!\n` +
                `${queue.settings.twentyFourSeven ? 
                    'The bot will now stay in the voice channel even when empty.' : 
                    'The bot will leave the voice channel when empty after 5 minutes.'}`)]
        });
    }
};