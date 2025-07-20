const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'skip',
    aliases: ['s'],
    description: 'Skip the current song',
    usage: '-skip',
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
        
        const skippedSong = queue.currentSong;
        
        if (queue.skip()) {
            await message.reply({
                embeds: [EmbedBuilders.success('Song Skipped', 
                    `⏭️ Skipped **[${skippedSong.title}](${skippedSong.url})**\n` +
                    `${queue.songs.length > 0 ? `Next up: **${queue.songs[0].title}**` : 'Queue is now empty!'}`)]
            });
        } else {
            await message.reply({
                embeds: [EmbedBuilders.error('Skip Failed', 'Failed to skip the current song!')]
            });
        }
    }
};