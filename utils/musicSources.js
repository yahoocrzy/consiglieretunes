const ytdl = require('ytdl-core');
const yts = require('youtube-sr').default;
const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../config');

class MusicSources {
    constructor() {
        this.spotify = new SpotifyWebApi({
            clientId: config.spotify.clientId,
            clientSecret: config.spotify.clientSecret
        });
        
        this.initSpotify();
    }
    
    async initSpotify() {
        if (config.spotify.clientId && config.spotify.clientSecret) {
            try {
                const data = await this.spotify.clientCredentialsGrant();
                this.spotify.setAccessToken(data.body['access_token']);
                
                // Refresh token every hour
                setInterval(async () => {
                    try {
                        const data = await this.spotify.clientCredentialsGrant();
                        this.spotify.setAccessToken(data.body['access_token']);
                    } catch (error) {
                        console.error('Spotify token refresh error:', error);
                    }
                }, 3600000);
                
                console.log('✅ Spotify integration enabled');
            } catch (error) {
                console.error('Spotify initialization error:', error);
            }
        }
    }
    
    async search(query, limit = 5) {
        const results = [];
        
        try {
            // Check if it's a direct URL
            if (this.isURL(query)) {
                const song = await this.getFromURL(query);
                if (song) results.push(song);
            } else {
                // Search YouTube
                const youtubeResults = await this.searchYouTube(query, limit);
                results.push(...youtubeResults);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
        
        return results;
    }
    
    async searchYouTube(query, limit = 5) {
        try {
            const results = await yts.search(query, { limit: limit, type: 'video' });
            
            return results.map(video => ({
                title: video.title,
                url: video.url,
                duration: this.formatDuration(video.duration),
                thumbnail: video.thumbnail?.url || video.thumbnail?.displayThumbnailURL?.('maxresdefault'),
                platform: 'youtube',
                author: video.channel?.name || 'Unknown'
            }));
        } catch (error) {
            console.error('YouTube search error:', error);
            return [];
        }
    }
    
    async getFromURL(url) {
        try {
            if (ytdl.validateURL(url)) {
                return await this.getYouTubeInfo(url);
            } else if (url.includes('spotify.com')) {
                return await this.getSpotifyInfo(url);
            } else if (url.includes('soundcloud.com')) {
                return await this.getSoundCloudInfo(url);
            }
        } catch (error) {
            console.error('URL processing error:', error);
        }
        
        return null;
    }
    
    async getYouTubeInfo(url) {
        try {
            const info = await ytdl.getBasicInfo(url);
            const details = info.videoDetails;
            
            return {
                title: details.title,
                url: details.video_url,
                duration: this.formatDuration(parseInt(details.lengthSeconds)),
                thumbnail: details.thumbnails[details.thumbnails.length - 1]?.url,
                platform: 'youtube',
                author: details.author.name
            };
        } catch (error) {
            console.error('YouTube info error:', error);
            return null;
        }
    }
    
    async getSpotifyInfo(url) {
        try {
            const trackId = this.extractSpotifyId(url);
            if (!trackId) return null;
            
            const track = await this.spotify.getTrack(trackId);
            const trackData = track.body;
            
            // Search for YouTube equivalent
            const searchQuery = `${trackData.artists[0].name} ${trackData.name}`;
            const youtubeResults = await this.searchYouTube(searchQuery, 1);
            
            if (youtubeResults.length > 0) {
                return {
                    ...youtubeResults[0],
                    title: `${trackData.artists[0].name} - ${trackData.name}`,
                    platform: 'spotify',
                    originalUrl: url,
                    thumbnail: trackData.album.images[0]?.url
                };
            }
            
            return null;
        } catch (error) {
            console.error('Spotify info error:', error);
            return null;
        }
    }
    
    async getSoundCloudInfo(url) {
        // Placeholder for SoundCloud integration
        // Would need scdl-core or similar library
        console.log('SoundCloud support coming soon');
        return null;
    }
    
    async getPlaylist(url) {
        try {
            if (url.includes('youtube.com') && url.includes('playlist')) {
                return await this.getYouTubePlaylist(url);
            } else if (url.includes('spotify.com') && url.includes('playlist')) {
                return await this.getSpotifyPlaylist(url);
            }
        } catch (error) {
            console.error('Playlist processing error:', error);
        }
        
        return [];
    }
    
    async getYouTubePlaylist(url) {
        try {
            const playlist = await yts.getPlaylist(url);
            const songs = [];
            
            for (const video of playlist.videos.slice(0, config.settings.maxPlaylistSize)) {
                songs.push({
                    title: video.title,
                    url: video.url,
                    duration: this.formatDuration(video.duration),
                    thumbnail: video.thumbnail?.url,
                    platform: 'youtube',
                    author: video.channel?.name || 'Unknown'
                });
            }
            
            return {
                name: playlist.title,
                songs: songs,
                total: playlist.videoCount
            };
        } catch (error) {
            console.error('YouTube playlist error:', error);
            return { songs: [] };
        }
    }
    
    async getSpotifyPlaylist(url) {
        try {
            const playlistId = this.extractSpotifyId(url);
            if (!playlistId) return { songs: [] };
            
            const playlist = await this.spotify.getPlaylist(playlistId);
            const songs = [];
            
            for (const item of playlist.body.tracks.items.slice(0, config.settings.maxPlaylistSize)) {
                if (item.track && item.track.type === 'track') {
                    const searchQuery = `${item.track.artists[0].name} ${item.track.name}`;
                    const youtubeResults = await this.searchYouTube(searchQuery, 1);
                    
                    if (youtubeResults.length > 0) {
                        songs.push({
                            ...youtubeResults[0],
                            title: `${item.track.artists[0].name} - ${item.track.name}`,
                            platform: 'spotify'
                        });
                    }
                }
            }
            
            return {
                name: playlist.body.name,
                songs: songs,
                total: playlist.body.tracks.total
            };
        } catch (error) {
            console.error('Spotify playlist error:', error);
            return { songs: [] };
        }
    }
    
    isURL(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }
    
    extractSpotifyId(url) {
        const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
        return match ? match[2] : null;
    }
    
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

module.exports = new MusicSources();