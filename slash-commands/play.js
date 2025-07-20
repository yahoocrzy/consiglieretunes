const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const Queue = require('../structures/Queue');
const musicSources = require('../utils/musicSources');
const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube, Spotify, or SoundCloud')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or URL to play')
                .setRequired(true)),
    
    async execute(interaction, client) {
        // Immediate acknowledgment to prevent timeout
        await interaction.deferReply();
        
        const query = interaction.options.getString('query');
        
        // Check if user is in a voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.editReply({
                embeds: [EmbedBuilders.error('Not in Voice Channel', 'You need to be in a voice channel to play music!')]
            });
        }
        
        // Check bot permissions
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has(['Connect', 'Speak'])) {
            return interaction.editReply({
                embeds: [EmbedBuilders.error('Missing Permissions', 'I need Connect and Speak permissions in that voice channel!')]
            });
        }
        
        let queue = client.queues.get(interaction.guild.id);
        
        // Create queue if it doesn't exist
        if (!queue) {
            queue = new Queue(interaction.guild, interaction.channel, voiceChannel);
            client.queues.set(interaction.guild.id, queue);
            
            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
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
                client.queues.delete(interaction.guild.id);
                return interaction.editReply({
                    embeds: [EmbedBuilders.error('Connection Error', 'Could not connect to the voice channel!')]
                });
            }
        }
        
        try {
            // Send immediate loading response
            await interaction.editReply({
                embeds: [EmbedBuilders.info('Searching...', `🔍 Searching for: **${query}**`)]
            });
            
            const results = await musicSources.search(query);
            
            if (results.length === 0) {
                return interaction.editReply({
                    embeds: [EmbedBuilders.error('No Results', 'No results found for your search!')]
                });
            }
            
            // Check if it's a playlist
            if (query.includes('playlist')) {
                const playlistData = await musicSources.getPlaylist(query);
                if (playlistData.songs && playlistData.songs.length > 0) {
                    let added = 0;
                    for (const song of playlistData.songs) {
                        song.requestedBy = interaction.user.id;
                        if (queue.addSong(song)) {
                            added++;
                        } else {
                            break; // Queue is full
                        }
                    }
                    
                    await interaction.editReply({
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
            
            // Add the first result
            const song = results[0];
            song.requestedBy = interaction.user.id;
            
            if (!queue.addSong(song)) {
                return interaction.editReply({
                    embeds: [EmbedBuilders.error('Queue Full', 'The queue is full! Maximum 100 songs allowed.')]
                });
            }
            
            await interaction.editReply({
                embeds: [EmbedBuilders.success('Song Added', 
                    `**[${song.title}](${song.url})** has been added to the queue!\n` +
                    `Position in queue: **${queue.songs.length}**`)]
            });
            
            if (!queue.currentSong) {
                queue.play();
            }
            
        } catch (error) {
            console.error('Play slash command error:', error);
            await interaction.editReply({
                embeds: [EmbedBuilders.error('Search Error', 'An error occurred while searching for the song!')]
            });
        }
    }
};