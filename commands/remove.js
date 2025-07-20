const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'remove',
    aliases: ['rm', 'delete'],
    description: 'Remove a song from the queue',
    usage: '-remove <position>',
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
                embeds: [EmbedBuilders.error('Empty Queue', 'The queue is empty!')]
            });
        }
        
        // Check if user is in the same voice channel
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
            return message.reply({
                embeds: [EmbedBuilders.error('Wrong Voice Channel', 'You need to be in the same voice channel as the bot!')]
            });
        }
        
        if (!args.length) {
            return message.reply({
                embeds: [EmbedBuilders.error('Missing Position', 
                    'Please specify the position of the song to remove!\n' +
                    'Usage: `-remove <position>`\n' +
                    'Use `-queue` to see song positions.')]
            });
        }
        
        const position = parseInt(args[0]);
        
        if (isNaN(position) || position < 1 || position > queue.songs.length) {
            return message.reply({
                embeds: [EmbedBuilders.error('Invalid Position', 
                    `Please provide a valid position between 1 and ${queue.songs.length}!\n` +
                    'Use `-queue` to see song positions.')]
            });
        }
        
        const removedSong = queue.remove(position - 1);
        
        if (removedSong) {
            await message.reply({
                embeds: [EmbedBuilders.success('Song Removed', 
                    `🗑️ Removed **[${removedSong.title}](${removedSong.url})** from position ${position}\n` +
                    `${queue.songs.length} songs remaining in queue.`)]
            });
        } else {
            await message.reply({
                embeds: [EmbedBuilders.error('Remove Failed', 'Failed to remove the song from the queue!')]
            });
        }
    }
};