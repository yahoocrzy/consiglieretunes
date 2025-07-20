const EmbedBuilders = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
    name: 'filter',
    aliases: ['filters', 'fx'],
    description: 'Apply audio filters to the music',
    usage: '-filter <filter_name> or -filter list or -filter clear',
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
        
        if (!args.length) {
            const currentFilters = queue.filters.length > 0 ? queue.filters.join(', ') : 'None';
            return message.reply({
                embeds: [EmbedBuilders.info('Current Filters', 
                    `**Active Filters:** ${currentFilters}\n\n` +
                    '**Usage:**\n' +
                    '• `-filter list` - Show available filters\n' +
                    '• `-filter <name>` - Apply a filter\n' +
                    '• `-filter clear` - Remove all filters')]
            });
        }
        
        const filterName = args[0].toLowerCase();
        
        if (filterName === 'list') {
            const filterList = Object.keys(config.filters).map(filter => `\`${filter}\``).join(', ');
            return message.reply({
                embeds: [EmbedBuilders.info('Available Filters', 
                    `**Audio Filters:**\n${filterList}\n\n` +
                    '**Popular Filters:**\n' +
                    '• `bassboost` - Enhance bass frequencies\n' +
                    '• `nightcore` - Speed up and pitch up\n' +
                    '• `vaporwave` - Slow down and pitch down\n' +
                    '• `8d` - 8D audio effect\n' +
                    '• `karaoke` - Remove vocals\n' +
                    '• `treble` - Enhance treble frequencies')]
            });
        }
        
        if (filterName === 'clear' || filterName === 'reset') {
            if (queue.filters.length === 0) {
                return message.reply({
                    embeds: [EmbedBuilders.error('No Filters', 'There are no filters currently applied!')]
                });
            }
            
            queue.filters = [];
            
            return message.reply({
                embeds: [EmbedBuilders.success('Filters Cleared', 
                    '🔧 All audio filters have been removed!\n' +
                    'Music will play with normal settings.')]
            });
        }
        
        if (!config.filters[filterName]) {
            return message.reply({
                embeds: [EmbedBuilders.error('Invalid Filter', 
                    `Filter \`${filterName}\` not found!\n` +
                    'Use `-filter list` to see available filters.')]
            });
        }
        
        if (queue.filters.includes(filterName)) {
            // Remove filter
            queue.filters = queue.filters.filter(f => f !== filterName);
            
            await message.reply({
                embeds: [EmbedBuilders.success('Filter Removed', 
                    `🔧 Removed **${filterName}** filter!\n` +
                    `Active filters: ${queue.filters.length > 0 ? queue.filters.join(', ') : 'None'}`)]
            });
        } else {
            // Add filter
            queue.filters.push(filterName);
            
            await message.reply({
                embeds: [EmbedBuilders.success('Filter Applied', 
                    `🔧 Applied **${filterName}** filter!\n` +
                    `Active filters: ${queue.filters.join(', ')}\n\n` +
                    '⚠️ **Note:** Filters will apply to the next song. Use `-skip` to apply to current song.')]
            });
        }
    }
};