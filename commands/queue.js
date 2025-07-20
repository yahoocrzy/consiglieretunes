const EmbedBuilders = require('../utils/embedBuilder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    description: 'Display the current music queue',
    usage: '-queue [page]',
    category: 'Music',
    async execute(message, args, client) {
        const queue = client.queues.get(message.guild.id);
        
        if (!queue) {
            return message.reply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music queue for this server!')]
            });
        }
        
        const page = parseInt(args[0]) || 1;
        const queueData = queue.getFormattedQueue(page, 10);
        
        if (page > queueData.totalPages && queueData.totalPages > 0) {
            return message.reply({
                embeds: [EmbedBuilders.error('Invalid Page', `Page ${page} doesn't exist! There are only ${queueData.totalPages} pages.`)]
            });
        }
        
        const embed = EmbedBuilders.queue(queue, page, 10);
        
        // Add navigation buttons if there are multiple pages
        if (queueData.totalPages > 1) {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('queue_first')
                        .setLabel('⏮️ First')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 1),
                    new ButtonBuilder()
                        .setCustomId('queue_prev')
                        .setLabel('⬅️ Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 1),
                    new ButtonBuilder()
                        .setCustomId('queue_next')
                        .setLabel('➡️ Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === queueData.totalPages),
                    new ButtonBuilder()
                        .setCustomId('queue_last')
                        .setLabel('⏭️ Last')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === queueData.totalPages)
                );
            
            const queueMessage = await message.reply({
                embeds: [embed],
                components: [row]
            });
            
            // Handle button interactions
            const collector = queueMessage.createMessageComponentCollector({
                time: 60000
            });
            
            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: '❌ Only the command user can navigate the queue!',
                        ephemeral: true
                    });
                }
                
                let newPage = page;
                
                switch (interaction.customId) {
                    case 'queue_first':
                        newPage = 1;
                        break;
                    case 'queue_prev':
                        newPage = Math.max(1, page - 1);
                        break;
                    case 'queue_next':
                        newPage = Math.min(queueData.totalPages, page + 1);
                        break;
                    case 'queue_last':
                        newPage = queueData.totalPages;
                        break;
                }
                
                const newEmbed = EmbedBuilders.queue(queue, newPage, 10);
                const newQueueData = queue.getFormattedQueue(newPage, 10);
                
                const newRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('queue_first')
                            .setLabel('⏮️ First')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === 1),
                        new ButtonBuilder()
                            .setCustomId('queue_prev')
                            .setLabel('⬅️ Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(newPage === 1),
                        new ButtonBuilder()
                            .setCustomId('queue_next')
                            .setLabel('➡️ Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(newPage === newQueueData.totalPages),
                        new ButtonBuilder()
                            .setCustomId('queue_last')
                            .setLabel('⏭️ Last')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(newPage === newQueueData.totalPages)
                    );
                
                await interaction.update({
                    embeds: [newEmbed],
                    components: [newRow]
                });
            });
            
            collector.on('end', () => {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        row.components.map(button => 
                            ButtonBuilder.from(button).setDisabled(true)
                        )
                    );
                
                queueMessage.edit({ components: [disabledRow] }).catch(() => {});
            });
            
        } else {
            await message.reply({ embeds: [embed] });
        }
    }
};