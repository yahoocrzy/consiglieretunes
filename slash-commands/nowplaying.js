const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show the currently playing song with interactive controls'),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        const queue = client.queues.get(interaction.guild.id);
        
        if (!queue) {
            return interaction.editReply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music playing!')]
            });
        }
        
        if (!queue.currentSong) {
            return interaction.editReply({
                embeds: [EmbedBuilders.error('Nothing Playing', 'There is no song currently playing!')]
            });
        }
        
        const embed = EmbedBuilders.nowPlaying(queue.currentSong, queue);
        
        // Enhanced control buttons (like Lara)
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_previous')
                    .setLabel('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(queue.previousSongs.length === 0),
                new ButtonBuilder()
                    .setCustomId(queue.isPlaying ? 'music_pause' : 'music_resume')
                    .setLabel(queue.isPlaying ? '⏸️' : '▶️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setLabel('⏭️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setLabel('⏹️')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('music_shuffle')
                    .setLabel('🔀')
                    .setStyle(ButtonStyle.Secondary)
            );
            
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_loop')
                    .setLabel(`🔁 ${queue.repeatMode === 'off' ? 'Off' : queue.repeatMode === 'song' ? 'Song' : 'Queue'}`)
                    .setStyle(queue.repeatMode === 'off' ? ButtonStyle.Secondary : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('music_volume_down')
                    .setLabel('🔉')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('music_volume_up')
                    .setLabel('🔊')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('music_queue')
                    .setLabel('📋 Queue')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('music_247')
                    .setLabel('🕐 24/7')
                    .setStyle(queue.settings.twentyFourSeven ? ButtonStyle.Success : ButtonStyle.Secondary)
            );
        
        const npMessage = await interaction.editReply({
            embeds: [embed],
            components: [row1, row2]
        });
        
        // Handle button interactions
        const collector = npMessage.createMessageComponentCollector({
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async (buttonInteraction) => {
            // Check if user is in voice channel
            const voiceChannel = buttonInteraction.member.voice.channel;
            if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
                return buttonInteraction.reply({
                    content: '❌ You need to be in the same voice channel as the bot!',
                    ephemeral: true
                });
            }
            
            const currentQueue = client.queues.get(buttonInteraction.guild.id);
            if (!currentQueue) {
                return buttonInteraction.reply({
                    content: '❌ There is no music playing!',
                    ephemeral: true
                });
            }
            
            switch (buttonInteraction.customId) {
                case 'music_previous':
                    if (currentQueue.previous()) {
                        await buttonInteraction.reply({
                            content: '⏮️ Playing previous song!',
                            ephemeral: true
                        });
                    } else {
                        await buttonInteraction.reply({
                            content: '❌ No previous song available!',
                            ephemeral: true
                        });
                    }
                    break;
                    
                case 'music_pause':
                    if (currentQueue.pause()) {
                        await buttonInteraction.reply({
                            content: '⏸️ Music paused!',
                            ephemeral: true
                        });
                    } else {
                        await buttonInteraction.reply({
                            content: '❌ Music is already paused!',
                            ephemeral: true
                        });
                    }
                    break;
                    
                case 'music_resume':
                    if (currentQueue.resume()) {
                        await buttonInteraction.reply({
                            content: '▶️ Music resumed!',
                            ephemeral: true
                        });
                    } else {
                        await buttonInteraction.reply({
                            content: '❌ Music is not paused!',
                            ephemeral: true
                        });
                    }
                    break;
                    
                case 'music_skip':
                    if (currentQueue.skip()) {
                        await buttonInteraction.reply({
                            content: '⏭️ Song skipped!',
                            ephemeral: true
                        });
                    } else {
                        await buttonInteraction.reply({
                            content: '❌ Failed to skip song!',
                            ephemeral: true
                        });
                    }
                    break;
                    
                case 'music_stop':
                    currentQueue.stop();
                    await buttonInteraction.reply({
                        content: '⏹️ Music stopped and queue cleared!',
                        ephemeral: true
                    });
                    setTimeout(() => currentQueue.destroy(), 1000);
                    break;
                    
                case 'music_shuffle':
                    currentQueue.shuffle();
                    await buttonInteraction.reply({
                        content: '🔀 Queue shuffled!',
                        ephemeral: true
                    });
                    break;
                    
                case 'music_loop':
                    const nextMode = currentQueue.toggleRepeatMode();
                    const modeText = nextMode === 'off' ? 'Off' : nextMode === 'song' ? 'Song' : 'Queue';
                    await buttonInteraction.reply({
                        content: `🔁 Loop mode set to: **${modeText}**`,
                        ephemeral: true
                    });
                    break;
                    
                case 'music_volume_down':
                    const newVolDown = Math.max(0, currentQueue.volume - 10);
                    currentQueue.setVolume(newVolDown);
                    await buttonInteraction.reply({
                        content: `🔉 Volume decreased to **${newVolDown}%**`,
                        ephemeral: true
                    });
                    break;
                    
                case 'music_volume_up':
                    const newVolUp = Math.min(100, currentQueue.volume + 10);
                    currentQueue.setVolume(newVolUp);
                    await buttonInteraction.reply({
                        content: `🔊 Volume increased to **${newVolUp}%**`,
                        ephemeral: true
                    });
                    break;
                    
                case 'music_queue':
                    const queueEmbed = EmbedBuilders.queue(currentQueue, 1, 10);
                    await buttonInteraction.reply({
                        embeds: [queueEmbed],
                        ephemeral: true
                    });
                    break;
                    
                case 'music_247':
                    currentQueue.settings.twentyFourSeven = !currentQueue.settings.twentyFourSeven;
                    await buttonInteraction.reply({
                        content: `🕐 24/7 mode ${currentQueue.settings.twentyFourSeven ? 'enabled' : 'disabled'}!`,
                        ephemeral: true
                    });
                    break;
            }
            
            // Update the embed and buttons after interaction
            try {
                const updatedEmbed = EmbedBuilders.nowPlaying(currentQueue.currentSong, currentQueue);
                const updatedRow1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('music_previous')
                            .setLabel('⏮️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentQueue.previousSongs?.length === 0),
                        new ButtonBuilder()
                            .setCustomId(currentQueue.isPlaying ? 'music_pause' : 'music_resume')
                            .setLabel(currentQueue.isPlaying ? '⏸️' : '▶️')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('music_skip')
                            .setLabel('⏭️')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('music_stop')
                            .setLabel('⏹️')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('music_shuffle')
                            .setLabel('🔀')
                            .setStyle(ButtonStyle.Secondary)
                    );
                    
                const updatedRow2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('music_loop')
                            .setLabel(`🔁 ${currentQueue.repeatMode === 'off' ? 'Off' : currentQueue.repeatMode === 'song' ? 'Song' : 'Queue'}`)
                            .setStyle(currentQueue.repeatMode === 'off' ? ButtonStyle.Secondary : ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('music_volume_down')
                            .setLabel('🔉')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('music_volume_up')
                            .setLabel('🔊')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('music_queue')
                            .setLabel('📋 Queue')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('music_247')
                            .setLabel('🕐 24/7')
                            .setStyle(currentQueue.settings.twentyFourSeven ? ButtonStyle.Success : ButtonStyle.Secondary)
                    );
                
                await npMessage.edit({
                    embeds: [updatedEmbed],
                    components: [updatedRow1, updatedRow2]
                });
            } catch (error) {
                console.error('Error updating now playing message:', error);
            }
        });
        
        collector.on('end', () => {
            const disabledRow1 = new ActionRowBuilder()
                .addComponents(
                    row1.components.map(button => 
                        ButtonBuilder.from(button).setDisabled(true)
                    )
                );
                
            const disabledRow2 = new ActionRowBuilder()
                .addComponents(
                    row2.components.map(button => 
                        ButtonBuilder.from(button).setDisabled(true)
                    )
                );
            
            npMessage.edit({ components: [disabledRow1, disabledRow2] }).catch(() => {});
        });
    }
};