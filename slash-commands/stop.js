const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilders = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and clear the queue'),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        const queue = client.queues.get(interaction.guild.id);
        
        if (!queue) {
            return interaction.editReply({
                embeds: [EmbedBuilders.error('No Queue', 'There is no music playing!')]
            });
        }
        
        // Check if user is in the same voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
            return interaction.editReply({
                embeds: [EmbedBuilders.error('Wrong Voice Channel', 'You need to be in the same voice channel as the bot!')]
            });
        }
        
        const songsCleared = queue.songs.length;
        queue.stop();
        
        await interaction.editReply({
            embeds: [EmbedBuilders.success('Music Stopped', 
                `⏹️ Music stopped and queue cleared!\n` +
                `${songsCleared > 0 ? `Removed **${songsCleared}** songs from queue.` : ''}`)]
        });
        
        // Destroy the queue after a short delay to allow the message to be sent
        setTimeout(() => {
            queue.destroy();
        }, 1000);
    }
};