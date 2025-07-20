const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const Queue = require('../structures/Queue');
const musicSources = require('../utils/musicSources');
const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'Play a song from YouTube, Spotify, or SoundCloud',
    usage: '-play <song name or URL>',
    category: 'Music',
    async execute(message, args, client) {
        if (!args.length) {
            return message.reply({
                embeds: [EmbedBuilders.error('Invalid Usage', 'Please provide a song name or URL!\nUsage: `-play <song name or URL>`')]
            });
        }
        
        // Check if user is in a voice channel
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply({
                embeds: [EmbedBuilders.error('Not in Voice Channel', 'You need to be in a voice channel to play music!')]
            });
        }
        
        // Check bot permissions
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has(['Connect', 'Speak'])) {
            return message.reply({
                embeds: [EmbedBuilders.error('Missing Permissions', 'I need Connect and Speak permissions in that voice channel!')]
            });
        }
        
        const query = args.join(' ');
        let queue = client.queues.get(message.guild.id);
        
        // Create queue if it doesn't exist
        if (!queue) {
            queue = new Queue(message.guild, message.channel, voiceChannel);
            client.queues.set(message.guild.id, queue);
            
            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
                
                queue.connection = connection;
                
                connection.on(VoiceConnectionStatus.Disconnected, () => {
                    queue.destroy();
                });
                
                connection.on(VoiceConnectionStatus.Destroyed, () => {
                    queue.destroy();
                });
                
            } catch (error) {
                console.error('Connection error:', error);
                client.queues.delete(message.guild.id);
                return message.reply({
                    embeds: [EmbedBuilders.error('Connection Error', 'Could not connect to the voice channel!')]
                });
            }
        }
        
        // Search for the song
        const searchMsg = await message.reply({
            embeds: [EmbedBuilders.info('Searching', `🔍 Searching for: \`${query}\``)]
        });
        
        try {
            const results = await musicSources.search(query);
            
            if (results.length === 0) {
                return searchMsg.edit({
                    embeds: [EmbedBuilders.error('No Results', 'No results found for your search!')]
                });
            }
            
            // Check if it's a playlist
            if (query.includes('playlist')) {
                const playlistData = await musicSources.getPlaylist(query);
                if (playlistData.songs && playlistData.songs.length > 0) {
                    let added = 0;
                    for (const song of playlistData.songs) {
                        song.requestedBy = message.author.id;
                        if (queue.addSong(song)) {
                            added++;
                        } else {
                            break; // Queue is full
                        }
                    }
                    
                    await searchMsg.edit({
                        embeds: [EmbedBuilders.success('Playlist Added', 
                            `Added **${added}** songs from playlist **${playlistData.name}**\n` +
                            `Total songs in queue: **${queue.songs.length}**`)]
                    });
                    
                    if (!queue.currentSong) {
                        queue.play();
                    }
                    return;
                }
            }
            
            // If single result or direct URL, add it directly
            if (results.length === 1 || musicSources.isURL(query)) {
                const song = results[0];
                song.requestedBy = message.author.id;
                
                if (!queue.addSong(song)) {
                    return searchMsg.edit({
                        embeds: [EmbedBuilders.error('Queue Full', 'The queue is full! Maximum 100 songs allowed.')]
                    });
                }
                
                await searchMsg.edit({
                    embeds: [EmbedBuilders.success('Song Added', 
                        `**[${song.title}](${song.url})** has been added to the queue!\n` +
                        `Position in queue: **${queue.songs.length}**`)]
                });
                
                if (!queue.currentSong) {
                    queue.play();
                }
                return;
            }
            
            // Multiple results - show search menu
            await searchMsg.edit({
                embeds: [EmbedBuilders.searchResults(results, query)]
            });
            
            // Wait for user selection
            const filter = (response) => {
                const num = parseInt(response.content);
                return response.author.id === message.author.id && 
                       num >= 1 && num <= Math.min(results.length, 5);
            };
            
            try {
                const collected = await message.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 30000,
                    errors: ['time']
                });
                
                const choice = parseInt(collected.first().content) - 1;
                const selectedSong = results[choice];
                selectedSong.requestedBy = message.author.id;
                
                if (!queue.addSong(selectedSong)) {
                    return message.reply({
                        embeds: [EmbedBuilders.error('Queue Full', 'The queue is full! Maximum 100 songs allowed.')]
                    });
                }
                
                await message.reply({
                    embeds: [EmbedBuilders.success('Song Added', 
                        `**[${selectedSong.title}](${selectedSong.url})** has been added to the queue!\n` +
                        `Position in queue: **${queue.songs.length}**`)]
                });
                
                if (!queue.currentSong) {
                    queue.play();
                }
                
                // Delete the search message and user's choice
                collected.first().delete().catch(() => {});
                searchMsg.delete().catch(() => {});
                
            } catch (error) {
                await searchMsg.edit({
                    embeds: [EmbedBuilders.error('Selection Timeout', 'You took too long to select a song!')]
                });
            }
            
        } catch (error) {
            console.error('Play command error:', error);
            await searchMsg.edit({
                embeds: [EmbedBuilders.error('Search Error', 'An error occurred while searching for the song!')]
            });
        }
    }
};