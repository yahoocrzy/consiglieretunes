const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'resume',
    aliases: ['unpause'],
    description: 'Resume the paused song',
    usage: '-resume',
    category: 'Music',
    async execute(message, args, client) {
        const queue = client.queues.get(message.guild.id);
        
        if (!queue) {
            return message.reply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music playing!')]
            });
        }
        
        if (!queue.currentSong) {
            return message.reply({
                embeds: [EmbedBuilders.error('Nothing Playing', 'There is no song currently playing!')]
            });
        }
        
        // Check if user is in the same voice channel
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
            return message.reply({
                embeds: [EmbedBuilders.error('Wrong Voice Channel', 'You need to be in the same voice channel as the bot!')]
            });
        }
        
        if (queue.resume()) {
            await message.reply({
                embeds: [EmbedBuilders.success('Music Resumed', 
                    `▶️ Resumed **[${queue.currentSong.title}](${queue.currentSong.url})**`)]
            });
        } else {
            await message.reply({
                embeds: [EmbedBuilders.error('Not Paused', 'The music is not paused!')]
            });
        }
    }
};