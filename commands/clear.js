const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'clear',
    aliases: ['clearqueue', 'cq'],
    description: 'Clear all songs from the queue',
    usage: '-clear',
    category: 'Music',
    async execute(message, args, client) {
        const queue = client.queues.get(message.guild.id);
        
        if (!queue) {
            return message.reply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music queue!')]
            });
        }
        
        if (queue.songs.length === 0) {
            return message.reply({
                embeds: [EmbedBuilders.error('Empty Queue', 'The queue is already empty!')]
            });
        }
        
        // Check if user is in the same voice channel
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
            return message.reply({
                embeds: [EmbedBuilders.error('Wrong Voice Channel', 'You need to be in the same voice channel as the bot!')]
            });
        }
        
        // Check if user has manage messages permission or is the owner
        if (!message.member.permissions.has('ManageMessages') && message.author.id !== client.config.ownerId) {
            return message.reply({
                embeds: [EmbedBuilders.error('Missing Permissions', 'You need the "Manage Messages" permission to clear the queue!')]
            });
        }
        
        const clearedCount = queue.clear();
        
        await message.reply({
            embeds: [EmbedBuilders.success('Queue Cleared', 
                `🗑️ Cleared **${clearedCount}** songs from the queue!\n` +
                `${queue.currentSong ? 'Current song will continue playing.' : 'No music is currently playing.'}`)]
        });
    }
};