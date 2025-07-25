const EmbedBuilders = require('../utils/embedBuilder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'current'],
    description: 'Show the currently playing song',
    usage: '-nowplaying',
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
        
        const embed = EmbedBuilders.nowPlaying(queue.currentSong, queue);
        
        // Enhanced control buttons (like Lara)
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_previous')
                    .setLabel('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(queue.previousSongs?.length === 0),
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
        
        const npMessage = await message.reply({
            embeds: [embed],
            components: [row1, row2]
        });
        
        // Handle button interactions
        const collector = npMessage.createMessageComponentCollector({
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async (interaction) => {
            // Check if user is in voice channel
            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
                return interaction.reply({
                    content: '❌ You need to be in the same voice channel as the bot!',
                    ephemeral: true
                });
            }
            
            const currentQueue = client.queues.get(interaction.guild.id);
            if (!currentQueue) {
                return interaction.reply({
                    content: '❌ There is no music playing!',
                    ephemeral: true
                });
            }
            
            switch (interaction.customId) {
                case 'music_previous':
                    if (currentQueue.previous()) {
                        await interaction.reply({
                            content: '⏮️ Playing previous song!',
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: '❌ No previous song available!',
                            ephemeral: true
                        });
                    }
                    break;
                    
                case 'music_pause':
                    if (currentQueue.pause()) {
                        await interaction.reply({
                            content: '⏸️ Music paused!',
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: '❌ Music is already paused!',
                            ephemeral: true
                        });
                    }
                    break;
                    
                case 'music_resume':
                    if (currentQueue.resume()) {
                        await interaction.reply({
                            content: '▶️ Music resumed!',
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: '❌ Music is not paused!',
                            ephemeral: true
                        });
                    }
                    break;
                    
                case 'music_skip':
                    if (currentQueue.skip()) {
                        await interaction.reply({
                            content: '⏭️ Song skipped!',
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: '❌ Failed to skip song!',
                            ephemeral: true
                        });
                    }
                    break;
                    
                case 'music_stop':
                    currentQueue.stop();
                    await interaction.reply({
                        content: '⏹️ Music stopped and queue cleared!',
                        ephemeral: true
                    });
                    setTimeout(() => currentQueue.destroy(), 1000);
                    break;
                    
                case 'music_shuffle':
                    currentQueue.shuffle();
                    await interaction.reply({
                        content: '🔀 Queue shuffled!',
                        ephemeral: true
                    });
                    break;
                    
                case 'music_loop':
                    const nextMode = currentQueue.toggleRepeatMode();
                    const modeText = nextMode === 'off' ? 'Off' : nextMode === 'song' ? 'Song' : 'Queue';
                    await interaction.reply({
                        content: `🔁 Loop mode set to: **${modeText}**`,
                        ephemeral: true
                    });
                    break;
                    
                case 'music_volume_down':
                    const newVolDown = Math.max(0, currentQueue.volume - 10);
                    currentQueue.setVolume(newVolDown);
                    await interaction.reply({
                        content: `🔉 Volume decreased to **${newVolDown}%**`,
                        ephemeral: true
                    });
                    break;
                    
                case 'music_volume_up':
                    const newVolUp = Math.min(100, currentQueue.volume + 10);
                    currentQueue.setVolume(newVolUp);
                    await interaction.reply({
                        content: `🔊 Volume increased to **${newVolUp}%**`,
                        ephemeral: true
                    });
                    break;
                    
                case 'music_queue':
                    const queueEmbed = EmbedBuilders.queue(currentQueue, 1, 10);
                    await interaction.reply({
                        embeds: [queueEmbed],
                        ephemeral: true
                    });
                    break;
                    
                case 'music_247':
                    currentQueue.settings.twentyFourSeven = !currentQueue.settings.twentyFourSeven;
                    await interaction.reply({
                        content: `🕐 24/7 mode ${currentQueue.settings.twentyFourSeven ? 'enabled' : 'disabled'}!`,
                        ephemeral: true
                    });
                    break;
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