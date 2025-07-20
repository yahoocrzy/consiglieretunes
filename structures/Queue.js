const { createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const config = require('../config');

class Queue {
    constructor(guild, textChannel, voiceChannel) {
        this.guild = guild;
        this.textChannel = textChannel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.player = createAudioPlayer();
        this.songs = [];
        this.currentSong = null;
        this.volume = config.settings.defaultVolume;
        this.loop = false;
        this.loopQueue = false;
        this.filters = [];
        this.settings = {
            twentyFourSeven: false,
            autoplay: false
        };
        
        this.setupPlayer();
    }
    
    setupPlayer() {
        this.player.on(AudioPlayerStatus.Playing, () => {
            if (this.currentSong) {
                this.textChannel.send({
                    embeds: [{
                        color: 0x00ff00,
                        title: '🎵 Now Playing',
                        description: `**[${this.currentSong.title}](${this.currentSong.url})**`,
                        fields: [
                            { name: 'Duration', value: this.currentSong.duration, inline: true },
                            { name: 'Requested by', value: `<@${this.currentSong.requestedBy}>`, inline: true }
                        ],
                        thumbnail: { url: this.currentSong.thumbnail }
                    }]
                });
            }
        });
        
        this.player.on(AudioPlayerStatus.Idle, () => {
            this.handleSongEnd();
        });
        
        this.player.on('error', (error) => {
            console.error('Audio player error:', error);
            this.textChannel.send('❌ An error occurred while playing audio.');
            this.handleSongEnd();
        });
    }
    
    async play() {
        if (this.songs.length === 0) {
            if (!this.settings.twentyFourSeven) {
                this.destroy();
            }
            return;
        }
        
        this.currentSong = this.songs[0];
        
        try {
            let stream;
            const song = this.currentSong;
            
            if (song.platform === 'youtube') {
                const format = ytdl.chooseFormat(await ytdl.getInfo(song.url), {
                    filter: 'audioonly',
                    quality: 'highestaudio'
                });
                
                stream = ytdl(song.url, {
                    format: format,
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25
                });
            } else {
                // Handle other platforms (Spotify, SoundCloud, etc.)
                stream = await this.getStreamForPlatform(song);
            }
            
            let resource = createAudioResource(stream, {
                inlineVolume: true
            });
            
            // Apply filters
            if (this.filters.length > 0) {
                resource = this.applyFilters(resource);
            }
            
            resource.volume.setVolume(this.volume / 100);
            this.player.play(resource);
            
            if (this.connection) {
                this.connection.subscribe(this.player);
            }
            
        } catch (error) {
            console.error('Play error:', error);
            this.textChannel.send(`❌ Failed to play: ${this.currentSong.title}`);
            this.handleSongEnd();
        }
    }
    
    async getStreamForPlatform(song) {
        // This would integrate with various music APIs
        // For now, we'll focus on YouTube as the primary source
        throw new Error('Platform not supported yet');
    }
    
    applyFilters(resource) {
        // Apply audio filters using FFmpeg
        // This is a placeholder for filter implementation
        return resource;
    }
    
    handleSongEnd() {
        if (this.loop && this.currentSong) {
            // Replay current song
            this.play();
            return;
        }
        
        if (!this.loopQueue) {
            this.songs.shift();
        } else {
            // Move current song to end of queue
            const currentSong = this.songs.shift();
            this.songs.push(currentSong);
        }
        
        this.currentSong = null;
        
        if (this.songs.length > 0) {
            this.play();
        } else if (this.settings.autoplay && this.currentSong) {
            this.addRelatedSong();
        } else if (!this.settings.twentyFourSeven) {
            this.textChannel.send('📭 Queue is empty. Use `-play` to add more songs!');
            setTimeout(() => {
                if (this.songs.length === 0 && !this.settings.twentyFourSeven) {
                    this.destroy();
                }
            }, 30000);
        }
    }
    
    async addRelatedSong() {
        // Implement autoplay functionality
        // This would search for related songs based on current/previous songs
    }
    
    addSong(song) {
        if (this.songs.length >= config.settings.maxQueueSize) {
            return false;
        }
        this.songs.push(song);
        return true;
    }
    
    skip() {
        if (this.currentSong) {
            this.player.stop();
            return true;
        }
        return false;
    }
    
    stop() {
        this.songs = [];
        this.currentSong = null;
        this.player.stop();
    }
    
    pause() {
        return this.player.pause();
    }
    
    resume() {
        return this.player.unpause();
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        if (this.player.state.resource && this.player.state.resource.volume) {
            this.player.state.resource.volume.setVolume(this.volume / 100);
        }
    }
    
    shuffle() {
        if (this.songs.length <= 1) return false;
        
        for (let i = this.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
        }
        return true;
    }
    
    remove(index) {
        if (index < 0 || index >= this.songs.length) return null;
        return this.songs.splice(index, 1)[0];
    }
    
    clear() {
        const cleared = this.songs.length;
        this.songs = [];
        return cleared;
    }
    
    destroy() {
        this.stop();
        if (this.connection) {
            this.connection.destroy();
        }
        this.guild.client.queues.delete(this.guild.id);
    }
    
    getFormattedQueue(page = 1, pageSize = 10) {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const queuePage = this.songs.slice(startIndex, endIndex);
        
        return {
            songs: queuePage,
            totalPages: Math.ceil(this.songs.length / pageSize),
            currentPage: page,
            totalSongs: this.songs.length
        };
    }
}

module.exports = Queue;