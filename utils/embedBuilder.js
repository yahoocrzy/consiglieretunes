const { EmbedBuilder } = require('discord.js');

class EmbedBuilders {
    static success(title, description) {
        return new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setTimestamp();
    }
    
    static error(title, description) {
        return new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setTimestamp();
    }
    
    static info(title, description) {
        return new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`ℹ️ ${title}`)
            .setDescription(description)
            .setTimestamp();
    }
    
    static music(title, description, thumbnail = null) {
        const embed = new EmbedBuilder()
            .setColor(0x9932cc)
            .setTitle(`🎵 ${title}`)
            .setDescription(description)
            .setTimestamp();
            
        if (thumbnail) {
            embed.setThumbnail(thumbnail);
        }
        
        return embed;
    }
    
    static queue(queue, page = 1, pageSize = 10) {
        const queueData = queue.getFormattedQueue(page, pageSize);
        let description = '';
        
        if (queue.currentSong) {
            description += `**🎵 Now Playing:**\n[${queue.currentSong.title}](${queue.currentSong.url})\n\n`;
        }
        
        if (queueData.songs.length === 0) {
            description += '📭 Queue is empty!';
        } else {
            description += '**📋 Up Next:**\n';
            queueData.songs.forEach((song, index) => {
                const position = (page - 1) * pageSize + index + 1;
                description += `\`${position}.\` [${song.title}](${song.url}) - \`${song.duration}\`\n`;
            });
            
            if (queueData.totalPages > 1) {
                description += `\n📄 Page ${page}/${queueData.totalPages} • ${queueData.totalSongs} total songs`;
            }
        }
        
        return new EmbedBuilder()
            .setColor(0x9932cc)
            .setTitle('🎵 Music Queue')
            .setDescription(description)
            .setFooter({ 
                text: `${queue.loop ? '🔂 Loop' : ''}${queue.loopQueue ? '🔁 Loop Queue' : ''}${queue.settings.twentyFourSeven ? '🕒 24/7' : ''}`.trim() || 'No special modes active'
            })
            .setTimestamp();
    }
    
    static searchResults(results, query) {
        let description = `**Search results for:** \`${query}\`\n\n`;
        
        results.slice(0, 5).forEach((result, index) => {
            description += `\`${index + 1}.\` [${result.title}](${result.url})\n`;
            description += `**Duration:** ${result.duration} | **Platform:** ${result.platform}\n\n`;
        });
        
        description += 'Type the number of the song you want to play!';
        
        return new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🔍 Search Results')
            .setDescription(description)
            .setTimestamp();
    }
    
    static nowPlaying(song, queue) {
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🎵 Now Playing')
            .setDescription(`**[${song.title}](${song.url})**`)
            .addFields(
                { name: '⏱️ Duration', value: song.duration, inline: true },
                { name: '👤 Requested by', value: `<@${song.requestedBy}>`, inline: true },
                { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
                { name: '📺 Platform', value: song.platform, inline: true },
                { name: '📋 Queue', value: `${queue.songs.length} songs`, inline: true },
                { name: '🎛️ Filters', value: queue.filters.length > 0 ? queue.filters.join(', ') : 'None', inline: true }
            )
            .setTimestamp();
            
        if (song.thumbnail) {
            embed.setThumbnail(song.thumbnail);
        }
        
        return embed;
    }
    
    static help(commands) {
        let description = 'Here are all available commands:\n\n';
        
        const categories = {};
        commands.forEach(command => {
            const category = command.category || 'General';
            if (!categories[category]) categories[category] = [];
            categories[category].push(command);
        });
        
        Object.keys(categories).forEach(category => {
            description += `**${category}:**\n`;
            categories[category].forEach(command => {
                description += `\`-${command.name}\` - ${command.description}\n`;
            });
            description += '\n';
        });
        
        return new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🤖 Bot Commands')
            .setDescription(description)
            .setFooter({ text: 'Use -help <command> for detailed information about a specific command' })
            .setTimestamp();
    }
}

module.exports = EmbedBuilders;