const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set or check the music volume')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setMinValue(0)
                .setMaxValue(100)),
    
    async execute(interaction, client) {
        const queue = client.queues.get(interaction.guild.id);
        
        if (!queue) {
            return interaction.reply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music playing!')],
                ephemeral: true
            });
        }
        
        // Check if user is in the same voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
            return interaction.reply({
                embeds: [EmbedBuilders.error('Wrong Voice Channel', 'You need to be in the same voice channel as the bot!')],
                ephemeral: true
            });
        }
        
        const volume = interaction.options.getInteger('level');
        
        // If no volume provided, show current volume
        if (volume === null) {
            return interaction.reply({
                embeds: [EmbedBuilders.info('Current Volume', 
                    `🔊 Current volume is **${queue.volume}%**\n` +
                    `Use \`/volume <0-100>\` to change the volume.`)],
                ephemeral: true
            });
        }
        
        const oldVolume = queue.volume;
        queue.setVolume(volume);
        
        let emoji = '🔊';
        if (volume === 0) emoji = '🔇';
        else if (volume < 30) emoji = '🔉';
        else if (volume < 70) emoji = '🔊';
        else emoji = '📢';
        
        await interaction.reply({
            embeds: [EmbedBuilders.success('Volume Changed', 
                `${emoji} Volume changed from **${oldVolume}%** to **${volume}%**`)]
        });
    }
};