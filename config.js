require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    prefix: process.env.PREFIX || '-',
    ownerId: process.env.OWNER_ID,
    
    // Spotify configuration
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    },
    
    // Bot settings
    settings: {
        maxQueueSize: 100,
        defaultVolume: 50,
        leaveTimeout: 300000, // 5 minutes
        searchLimit: 10,
        maxPlaylistSize: 100
    },
    
    // Audio filters
    filters: {
        bassboost: 'bass=g=20:f=110:w=0.3',
        '8d': 'apulsator=hz=0.125',
        nightcore: 'atempo=1.3,asetrate=48000*1.25',
        vaporwave: 'atempo=0.8,asetrate=48000*0.8',
        karaoke: 'pan=mono|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1,volume=0.7',
        flanger: 'flanger',
        gate: 'agate',
        haas: 'haas',
        reverse: 'areverse',
        surround: 'surround',
        mcompand: 'mcompand',
        phaser: 'aphaser',
        tremolo: 'tremolo',
        vibrato: 'vibrato',
        treble: 'treble=g=5',
        normalizer: 'dynaudnorm=f=200',
        subboost: 'asubboost'
    }
};