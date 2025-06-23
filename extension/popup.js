class MusicPlayer {
  constructor() {
    this.audio = document.getElementById('audioPlayer');
    this.isPlaying = false;
    this.currentTrack = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.isLooping = false;
    this.isShuffling = false;
    
    this.initializeElements();
    this.attachEventListeners();
    this.createBackgroundAnimation();
    this.loadState();
    this.loadPlaylist();
  }

  initializeElements() {
    this.fileInput = document.getElementById('fileInput');
    this.playBtn = document.getElementById('playBtn');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.progressBar = document.getElementById('progressBar');
    this.progressFill = document.getElementById('progressFill');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.volumeValue = document.getElementById('volumeValue');
    this.trackTitle = document.getElementById('trackTitle');
    this.trackDuration = document.getElementById('trackDuration');
    this.loopBtn = document.getElementById('loopBtn');
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.status = document.getElementById('status');
  }

  attachEventListeners() {
    // File input - now supports multiple files
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    // Audio controls
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.previousTrack());
    this.nextBtn.addEventListener('click', () => this.nextTrack());
    
    // Progress bar
    this.progressBar.addEventListener('click', (e) => this.seekTo(e));
    
    // Volume control
    this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    
    // Options
    this.loopBtn.addEventListener('click', () => this.toggleLoop());
    this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
    
    // Audio events
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.handleTrackEnd());
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    this.audio.addEventListener('error', (e) => this.handleError(e));
  }

  createBackgroundAnimation() {
    const symbols = ['♪', '♫', '♬', '🎵', '🎶', '🎼'];
    const container = document.getElementById('backgroundAnimation');
    
    setInterval(() => {
      const symbol = document.createElement('div');
      symbol.className = 'music-symbol';
      symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      symbol.style.left = Math.random() * 100 + '%';
      symbol.style.animationDelay = Math.random() * 2 + 's';
      symbol.style.fontSize = (Math.random() * 10 + 15) + 'px';
      
      container.appendChild(symbol);
      
      setTimeout(() => {
        if (symbol.parentNode) {
          symbol.parentNode.removeChild(symbol);
        }
      }, 8000);
    }, 1000);
  }

  handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    let addedCount = 0;
    
    files.forEach(file => {
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        // Check if file already exists in playlist
        const existingTrack = this.playlist.find(track => 
          track.name === file.name && track.size === file.size
        );
        
        if (!existingTrack) {
          const url = URL.createObjectURL(file);
          const track = {
            name: file.name,
            url: url,
            file: file,
            size: file.size,
            duration: null,
            id: Date.now() + Math.random()
          };
          
          this.playlist.push(track);
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      this.savePlaylist();
      
      // If no current track, set the first track as current
      if (!this.currentTrack && this.playlist.length > 0) {
        this.currentIndex = this.playlist.length - addedCount;
        this.loadTrack(this.currentIndex);
      }
      
      this.updateStatus(`Added ${addedCount} song(s). Total: ${this.playlist.length}`);
    } else {
      this.updateStatus('No new songs added (duplicates or invalid files)');
    }
    
    // Clear the file input
    this.fileInput.value = '';
  }

  loadTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    
    this.currentIndex = index;
    this.currentTrack = this.playlist[index];
    
    this.audio.src = this.currentTrack.url;
    this.trackTitle.textContent = this.currentTrack.name.replace(/\.[^/.]+$/, "");
    this.updateStatus(`Loaded: ${this.currentTrack.name}`);
    this.saveState();
  }

  togglePlay() {
    if (!this.currentTrack) {
      if (this.playlist.length > 0) {
        this.loadTrack(0);
      } else {
        this.updateStatus('Please add music files first');
        return;
      }
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.playBtn.textContent = '⏸';
      this.updateStatus(`Playing: ${this.currentTrack.name}`);
      this.saveState();
    }).catch(error => {
      console.error('Error playing audio:', error);
      this.updateStatus('Error playing audio');
    });
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.playBtn.textContent = '▶';
    this.updateStatus('Paused');
    this.saveState();
  }

  previousTrack() {
    if (this.playlist.length === 0) return;
    
    if (this.isShuffling) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
    }
    
    this.loadTrack(this.currentIndex);
    if (this.isPlaying) {
      this.play();
    }
  }

  nextTrack() {
    if (this.playlist.length === 0) return;
    
    if (this.isShuffling) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = this.currentIndex < this.playlist.length - 1 ? this.currentIndex + 1 : 0;
    }
    
    this.loadTrack(this.currentIndex);
    if (this.isPlaying) {
      this.play();
    }
  }

  seekTo(event) {
    if (!this.currentTrack) return;
    
    const rect = this.progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newTime = percent * this.audio.duration;
    
    if (isFinite(newTime)) {
      this.audio.currentTime = newTime;
    }
  }

  setVolume(value) {
    this.audio.volume = value / 100;
    this.volumeValue.textContent = value + '%';
    this.saveState();
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    this.audio.loop = this.isLooping;
    this.loopBtn.classList.toggle('active', this.isLooping);
    this.updateStatus(this.isLooping ? 'Loop enabled' : 'Loop disabled');
    this.saveState();
  }

  toggleShuffle() {
    this.isShuffling = !this.isShuffling;
    this.shuffleBtn.classList.toggle('active', this.isShuffling);
    this.updateStatus(this.isShuffling ? 'Shuffle enabled' : 'Shuffle disabled');
    this.saveState();
  }

  updateProgress() {
    if (!this.audio.duration) return;
    
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.progressFill.style.width = percent + '%';
    
    const currentTime = this.formatTime(this.audio.currentTime);
    const duration = this.formatTime(this.audio.duration);
    this.trackDuration.textContent = `${currentTime} / ${duration}`;
  }

  updateDuration() {
    if (this.audio.duration && this.currentTrack) {
      const duration = this.formatTime(this.audio.duration);
      this.trackDuration.textContent = `00:00 / ${duration}`;
      
      // Save duration to track
      this.currentTrack.duration = this.audio.duration;
      this.savePlaylist();
    }
  }

  handleTrackEnd() {
    if (this.isLooping) {
      return; // Let the audio loop naturally
    }
    
    // Auto-play next track if available
    if (this.playlist.length > 1) {
      this.nextTrack();
    } else {
      this.isPlaying = false;
      this.playBtn.textContent = '▶';
      this.updateStatus('Playlist finished');
    }
  }

  handleError(error) {
    console.error('Audio error:', error);
    this.updateStatus('Error loading audio file');
    this.isPlaying = false;
    this.playBtn.textContent = '▶';
  }

  formatTime(seconds) {
    if (!isFinite(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateStatus(message) {
    this.status.textContent = message;
    setTimeout(() => {
      if (this.isPlaying && this.currentTrack) {
        this.status.textContent = `Playing: ${this.currentTrack.name}`;
      } else if (this.playlist.length > 0) {
        this.status.textContent = `Ready - ${this.playlist.length} song(s) loaded`;
      } else {
        this.status.textContent = 'Ready to add music files';
      }
    }, 3000);
  }

  saveState() {
    const state = {
      isPlaying: this.isPlaying,
      currentTime: this.audio.currentTime,
      volume: this.audio.volume,
      isLooping: this.isLooping,
      isShuffling: this.isShuffling,
      currentIndex: this.currentIndex,
      trackName: this.currentTrack ? this.currentTrack.name : null
    };
    
    chrome.storage.local.set({ musicPlayerState: state });
  }

  savePlaylist() {
    // Save playlist metadata (without file objects)
    const playlistData = this.playlist.map(track => ({
      name: track.name,
      size: track.size,
      duration: track.duration,
      id: track.id
    }));
    
    chrome.storage.local.set({ musicPlaylist: playlistData });
  }

  loadPlaylist() {
    chrome.storage.local.get(['musicPlaylist'], (result) => {
      if (result.musicPlaylist && result.musicPlaylist.length > 0) {
        // Note: We can't restore file URLs as they're temporary
        // This shows the user what was previously loaded
        this.updateStatus(`Previously had ${result.musicPlaylist.length} songs loaded. Please re-add files.`);
      }
    });
  }

  loadState() {
    chrome.storage.local.get(['musicPlayerState'], (result) => {
      if (result.musicPlayerState) {
        const state = result.musicPlayerState;
        
        this.volumeSlider.value = (state.volume || 0.7) * 100;
        this.setVolume(this.volumeSlider.value);
        
        if (state.isLooping) {
          this.toggleLoop();
        }
        
        if (state.isShuffling) {
          this.toggleShuffle();
        }
        
        // Restore current index if available
        if (state.currentIndex !== undefined) {
          this.currentIndex = state.currentIndex;
        }
      }
    });
  }
}

// Initialize the music player when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  new MusicPlayer();
});
