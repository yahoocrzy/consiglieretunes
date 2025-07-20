const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'pause',
    description: 'Pause the current song',
    usage: '-pause',
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
        
        if (queue.pause()) {
            await message.reply({
                embeds: [EmbedBuilders.success('Music Paused', 
                    `⏸️ Paused **[${queue.currentSong.title}](${queue.currentSong.url})**\n` +
                    `Use \`-resume\` to continue playing.`)]
            });
        } else {
            await message.reply({
                embeds: [EmbedBuilders.error('Already Paused', 'The music is already paused!')]
            });
        }
    }
};