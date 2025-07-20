module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`🎵 ${client.user.tag} is ready to serve music!`);
        console.log(`📊 Connected to ${client.guilds.cache.size} servers`);
        console.log(`👥 Serving ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} users`);
    }
};