const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'shuffle',
    description: 'Shuffle the current queue',
    usage: '-shuffle',
    category: 'Music',
    async execute(message, args, client) {
        const queue = client.queues.get(message.guild.id);
        
        if (!queue) {
            return message.reply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music queue!')]
            });
        }
        
        if (queue.songs.length <= 1) {
            return message.reply({
                embeds: [EmbedBuilders.error('Insufficient Songs', 'There need to be at least 2 songs in the queue to shuffle!')]
            });
        }
        
        // Check if user is in the same voice channel
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
            return message.reply({
                embeds: [EmbedBuilders.error('Wrong Voice Channel', 'You need to be in the same voice channel as the bot!')]
            });
        }
        
        if (queue.shuffle()) {
            await message.reply({
                embeds: [EmbedBuilders.success('Queue Shuffled', 
                    `🔀 Shuffled **${queue.songs.length}** songs in the queue!\n` +
                    `Next up: **${queue.songs[0].title}**`)]
            });
        } else {
            await message.reply({
                embeds: [EmbedBuilders.error('Shuffle Failed', 'Failed to shuffle the queue!')]
            });
        }
    }
};