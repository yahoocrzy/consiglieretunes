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
        
        // Add control buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_pause')
                    .setLabel('⏸️ Pause')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setLabel('⏭️ Skip')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setLabel('⏹️ Stop')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('music_queue')
                    .setLabel('📋 Queue')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        const npMessage = await message.reply({
            embeds: [embed],
            components: [row]
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
                    
                case 'music_queue':
                    const queueEmbed = EmbedBuilders.queue(currentQueue, 1, 10);
                    await interaction.reply({
                        embeds: [queueEmbed],
                        ephemeral: true
                    });
                    break;
            }
        });
        
        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    row.components.map(button => 
                        ButtonBuilder.from(button).setDisabled(true)
                    )
                );
            
            npMessage.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};