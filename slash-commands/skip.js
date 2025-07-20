const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),
    
    async execute(interaction, client) {
        const queue = client.queues.get(interaction.guild.id);
        
        if (!queue) {
            return interaction.reply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music playing!')],
                ephemeral: true
            });
        }
        
        if (!queue.currentSong) {
            return interaction.reply({
                embeds: [EmbedBuilders.error('Nothing Playing', 'There is no song currently playing!')],
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
        
        const skippedSong = queue.currentSong;
        
        if (queue.skip()) {
            await interaction.reply({
                embeds: [EmbedBuilders.success('Song Skipped', 
                    `⏭️ Skipped **[${skippedSong.title}](${skippedSong.url})**\n` +
                    `${queue.songs.length > 0 ? `Next up: **${queue.songs[0].title}**` : 'Queue is now empty!'}`)]
            });
        } else {
            await interaction.reply({
                embeds: [EmbedBuilders.error('Skip Failed', 'Failed to skip the current song!')],
                ephemeral: true
            });
        }
    }
};