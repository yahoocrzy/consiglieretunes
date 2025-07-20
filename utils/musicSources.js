const ytdl = require('ytdl-core');
const yts = require('youtube-sr').default;
const SpotifyWebApi = require('spotify-web-api-node');
const SoundCloud = require('soundcloud.ts').default;
const config = require('../config');

// Rate limiter for Spotify API (2025 compliance)
class SpotifyRateLimiter {
    constructor() {
        this.requests = [];
        this.maxRequests = 90; // Conservative limit (100 - buffer)
        this.windowMs = 30000; // 30 second window
    }
    
    async makeRequest(requestFn) {
        this.cleanOldRequests();
        
        if (this.requests.length >= this.maxRequests) {
            const waitTime = this.windowMs - (Date.now() - this.requests[0]);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.cleanOldRequests();
        }
        
        this.requests.push(Date.now());
        return await requestFn();
    }
    
    cleanOldRequests() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
    }
}

class MusicSources {
    constructor() {
        this.spotify = new SpotifyWebApi({
            clientId: config.spotify.clientId,
            clientSecret: config.spotify.clientSecret
        });
        
        // 2025 Spotify rate limiter
        this.spotifyRateLimiter = new SpotifyRateLimiter();
        
        // SoundCloud integration
        this.soundcloud = new SoundCloud();
        
        // Fast search cache (5 minute TTL)
        this.searchCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Clean cache every 10 minutes
        setInterval(() => {
            this.cleanCache();
        }, 10 * 60 * 1000);
        
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
        // Check cache first for instant results
        const cacheKey = `${query}-${limit}`;
        const cached = this.searchCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.results;
        }
        
        const results = [];
        
        try {
            // Check if it's a direct URL
            if (this.isURL(query)) {
                const song = await this.getFromURL(query);
                if (song) results.push(song);
            } else {
                // Fast YouTube search with timeout protection
                const youtubeResults = await Promise.race([
                    this.searchYouTube(query, limit),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Search timeout')), 10000))
                ]);
                results.push(...youtubeResults);
            }
            
            // Cache results for 5 minutes
            this.searchCache.set(cacheKey, {
                results: results,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('Search error:', error);
        }
        
        return results;
    }
    
    async searchYouTube(query, limit = 5) {
        try {
            // Fast search with optimized parameters
            const results = await yts.search(query, { 
                limit: Math.min(limit, 10), // Cap limit for speed
                type: 'video',
                safeSearch: false // Faster search
            });
            
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
            // Use cached info if available
            const cacheKey = `url-${url}`;
            const cached = this.searchCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.results;
            }
            
            // 2025 Enhanced YouTube handling with @distube/ytdl-core
            const info = await Promise.race([
                ytdl.getBasicInfo(url, {
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                        }
                    }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('URL timeout')), 8000))
            ]);
            
            const details = info.videoDetails;
            
            const result = {
                title: details.title,
                url: details.video_url,
                duration: this.formatDuration(parseInt(details.lengthSeconds)),
                thumbnail: details.thumbnails[details.thumbnails.length - 1]?.url,
                platform: 'youtube',
                author: details.author.name
            };
            
            // Cache URL info
            this.searchCache.set(cacheKey, {
                results: result,
                timestamp: Date.now()
            });
            
            return result;
        } catch (error) {
            console.error('YouTube info error:', error);
            return null;
        }
    }
    
    async getSpotifyInfo(url) {
        try {
            // Check cache first
            const cacheKey = `spotify-${url}`;
            const cached = this.searchCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.results;
            }
            
            const trackId = this.extractSpotifyId(url);
            if (!trackId) return null;
            
            // 2025 Rate-limited Spotify API call
            const track = await this.spotifyRateLimiter.makeRequest(async () => {
                return await Promise.race([
                    this.spotify.getTrack(trackId),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Spotify timeout')), 5000))
                ]);
            });
            
            const trackData = track.body;
            
            // Fast YouTube search for equivalent
            const searchQuery = `${trackData.artists[0].name} ${trackData.name}`;
            const youtubeResults = await this.searchYouTube(searchQuery, 1);
            
            if (youtubeResults.length > 0) {
                const result = {
                    ...youtubeResults[0],
                    title: `${trackData.artists[0].name} - ${trackData.name}`,
                    platform: 'spotify',
                    originalUrl: url,
                    thumbnail: trackData.album.images[0]?.url
                };
                
                // Cache result
                this.searchCache.set(cacheKey, {
                    results: result,
                    timestamp: Date.now()
                });
                
                return result;
            }
            
            return null;
        } catch (error) {
            console.error('Spotify info error:', error);
            return null;
        }
    }
    
    async getSoundCloudInfo(url) {
        try {
            const cacheKey = `soundcloud-${url}`;
            const cached = this.searchCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.results;
            }
            
            // 2025 SoundCloud integration
            const track = await this.soundcloud.tracks.getV2(url);
            
            const result = {
                title: track.title,
                url: track.permalink_url,
                duration: this.formatDuration(track.duration / 1000),
                thumbnail: track.artwork_url,
                platform: 'soundcloud',
                author: track.user.username
            };
            
            // Cache result
            this.searchCache.set(cacheKey, {
                results: result,
                timestamp: Date.now()
            });
            
            return result;
        } catch (error) {
            console.error('SoundCloud info error:', error);
            return null;
        }
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
    
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.searchCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.searchCache.delete(key);
            }
        }
        console.log(`🧹 Cache cleaned. ${this.searchCache.size} items remaining.`);
    }
}

module.exports = new MusicSources();