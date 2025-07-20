const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'volume',
    aliases: ['vol', 'v'],
    description: 'Set or check the music volume (0-100)',
    usage: '-volume [0-100]',
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
        
        // If no volume provided, show current volume
        if (!args.length) {
            return message.reply({
                embeds: [EmbedBuilders.info('Current Volume', 
                    `🔊 Current volume is **${queue.volume}%**\n` +
                    `Use \`-volume <0-100>\` to change the volume.`)]
            });
        }
        
        const volume = parseInt(args[0]);
        
        if (isNaN(volume) || volume < 0 || volume > 100) {
            return message.reply({
                embeds: [EmbedBuilders.error('Invalid Volume', 'Volume must be a number between 0 and 100!')]
            });
        }
        
        const oldVolume = queue.volume;
        queue.setVolume(volume);
        
        let emoji = '🔊';
        if (volume === 0) emoji = '🔇';
        else if (volume < 30) emoji = '🔉';
        else if (volume < 70) emoji = '🔊';
        else emoji = '📢';
        
        await message.reply({
            embeds: [EmbedBuilders.success('Volume Changed', 
                `${emoji} Volume changed from **${oldVolume}%** to **${volume}%**`)]
        });
    }
};