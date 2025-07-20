const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'stop',
    aliases: ['disconnect', 'dc'],
    description: 'Stop the music and clear the queue',
    usage: '-stop',
    category: 'Music',
    async execute(message, args, client) {
        const queue = client.queues.get(message.guild.id);
        
        if (!queue) {
            return message.reply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music playing!')]
            });
        }
        
        // Check if user is in the same voice channel
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
            return message.reply({
                embeds: [EmbedBuilders.error('Wrong Voice Channel', 'You need to be in the same voice channel as the bot!')]
            });
        }
        
        const songsCleared = queue.songs.length;
        queue.stop();
        
        await message.reply({
            embeds: [EmbedBuilders.success('Music Stopped', 
                `⏹️ Music stopped and queue cleared!\n` +
                `${songsCleared > 0 ? `Removed **${songsCleared}** songs from queue.` : ''}`)]
        });
        
        // Destroy the queue after a short delay to allow the message to be sent
        setTimeout(() => {
            queue.destroy();
        }, 1000);
    }
};