const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Display the current music queue')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number to display')
                .setMinValue(1)),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        const queue = client.queues.get(interaction.guild.id);
        
        if (!queue) {
            return interaction.editReply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music queue for this server!')]
            });
        }
        
        const page = interaction.options.getInteger('page') || 1;
        const queueData = queue.getFormattedQueue(page, 10);
        
        if (page > queueData.totalPages && queueData.totalPages > 0) {
            return interaction.editReply({
                embeds: [EmbedBuilders.error('Invalid Page', `Page ${page} doesn't exist! There are only ${queueData.totalPages} pages.`)]
            });
        }
        
        const embed = EmbedBuilders.queue(queue, page, 10);
        
        await interaction.editReply({ embeds: [embed] });
    }
};