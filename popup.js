
class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.loopBtn = document.getElementById('loopBtn');
        this.progressBar = document.getElementById('progressBar');
        this.volumeBar = document.getElementById('volumeBar');
        this.currentTimeSpan = document.getElementById('currentTime');
        this.durationSpan = document.getElementById('duration');
        this.trackName = document.getElementById('trackName');
        this.playerSection = document.getElementById('playerSection');
        this.themeToggle = document.getElementById('themeToggle');
        this.container = document.getElementById('container');
        
        this.isPlaying = false;
        this.isLooping = false;
        this.isDragging = false;
        
        this.initializeEventListeners();
        this.loadTheme();
    }

    initializeEventListeners() {
        // File input
        document.getElementById('audioFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadAudioFile(file);
            }
        });

        // URL input
        document.getElementById('loadUrl').addEventListener('click', () => {
            const url = document.getElementById('audioUrl').value;
            if (url) {
                this.loadAudioUrl(url);
            }
        });

        // Audio controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.loopBtn.addEventListener('click', () => this.toggleLoop());

        // Progress bar
        this.progressBar.addEventListener('mousedown', () => this.isDragging = true);
        this.progressBar.addEventListener('mouseup', () => this.isDragging = false);
        this.progressBar.addEventListener('input', () => this.seekTo());

        // Volume control
        this.volumeBar.addEventListener('input', () => this.setVolume());

        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.onAudioLoaded());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onAudioEnded());

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    loadAudioFile(file) {
        const url = URL.createObjectURL(file);
        this.audio.src = url;
        this.trackName.textContent = file.name;
        this.playerSection.style.display = 'block';
    }

    loadAudioUrl(url) {
        this.audio.src = url;
        this.trackName.textContent = 'Audio from URL';
        this.playerSection.style.display = 'block';
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.audio.pause();
            this.playPauseBtn.textContent = '▶️';
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.playPauseBtn.textContent = '⏸️';
            this.isPlaying = true;
        }
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.playPauseBtn.textContent = '▶️';
        this.isPlaying = false;
        this.updateProgress();
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.audio.loop = this.isLooping;
        this.loopBtn.classList.toggle('active', this.isLooping);
    }

    seekTo() {
        if (this.audio.duration) {
            const seekTime = (this.progressBar.value / 100) * this.audio.duration;
            this.audio.currentTime = seekTime;
        }
    }

    setVolume() {
        this.audio.volume = this.volumeBar.value / 100;
    }

    onAudioLoaded() {
        this.durationSpan.textContent = this.formatTime(this.audio.duration);
        this.audio.volume = this.volumeBar.value / 100;
    }

    updateProgress() {
        if (!this.isDragging && this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.value = progress;
            this.currentTimeSpan.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    onAudioEnded() {
        if (!this.isLooping) {
            this.playPauseBtn.textContent = '▶️';
            this.isPlaying = false;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark');
        this.themeToggle.textContent = isDark ? '☀️' : '🌙';
        chrome.storage.sync.set({ darkMode: isDark });
    }

    loadTheme() {
        chrome.storage.sync.get(['darkMode'], (result) => {
            if (result.darkMode) {
                document.body.classList.add('dark');
                this.themeToggle.textContent = '☀️';
            }
        });
    }
}

// Initialize the music player when popup loads
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
