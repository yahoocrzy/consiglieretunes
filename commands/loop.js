const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'loop',
    aliases: ['repeat'],
    description: 'Toggle loop mode for current song or queue',
    usage: '-loop [song|queue|off]',
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
        
        const mode = args[0]?.toLowerCase() || 'song';
        
        switch (mode) {
            case 'song':
            case 'track':
                queue.loop = !queue.loop;
                queue.loopQueue = false;
                
                await message.reply({
                    embeds: [EmbedBuilders.success('Loop Mode Updated', 
                        `🔂 Song loop has been **${queue.loop ? 'enabled' : 'disabled'}**!\n` +
                        `${queue.loop ? 'Current song will repeat.' : 'Song will play normally.'}`)]
                });
                break;
                
            case 'queue':
            case 'all':
                queue.loopQueue = !queue.loopQueue;
                queue.loop = false;
                
                await message.reply({
                    embeds: [EmbedBuilders.success('Loop Mode Updated', 
                        `🔁 Queue loop has been **${queue.loopQueue ? 'enabled' : 'disabled'}**!\n` +
                        `${queue.loopQueue ? 'Entire queue will repeat.' : 'Queue will play normally.'}`)]
                });
                break;
                
            case 'off':
            case 'disable':
                queue.loop = false;
                queue.loopQueue = false;
                
                await message.reply({
                    embeds: [EmbedBuilders.success('Loop Mode Updated', 
                        `❌ All loop modes have been **disabled**!\n` +
                        `Music will play normally.`)]
                });
                break;
                
            default:
                await message.reply({
                    embeds: [EmbedBuilders.error('Invalid Mode', 
                        'Please specify a valid loop mode:\n' +
                        '• `-loop song` - Loop current song\n' +
                        '• `-loop queue` - Loop entire queue\n' +
                        '• `-loop off` - Disable all loops\n\n' +
                        `**Current Status:**\n` +
                        `Song Loop: ${queue.loop ? '🔂 Enabled' : '❌ Disabled'}\n` +
                        `Queue Loop: ${queue.loopQueue ? '🔁 Enabled' : '❌ Disabled'}`)]
                });
                break;
        }
    }
};