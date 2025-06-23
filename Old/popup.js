
class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio');
        this.playBtn = document.getElementById('playBtn');
        this.loopBtn = document.getElementById('loopBtn');
        this.volume = document.getElementById('volume');
        this.player = document.getElementById('player');
        
        this.isPlaying = false;
        this.isLooping = false;
        
        this.init();
    }

    init() {
        document.getElementById('audioFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadFile(file);
            }
        });

        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.loopBtn.addEventListener('click', () => this.toggleLoop());
        this.volume.addEventListener('input', () => this.setVolume());
        
        this.audio.addEventListener('ended', () => {
            if (!this.isLooping) {
                this.playBtn.textContent = '▶️';
                this.isPlaying = false;
            }
        });
    }

    loadFile(file) {
        this.audio.src = URL.createObjectURL(file);
        this.player.style.display = 'block';
        this.audio.volume = this.volume.value / 100;
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
            this.playBtn.textContent = '▶️';
        } else {
            this.audio.play();
            this.playBtn.textContent = '⏸️';
        }
        this.isPlaying = !this.isPlaying;
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.audio.loop = this.isLooping;
        this.loopBtn.classList.toggle('loop-active', this.isLooping);
    }

    setVolume() {
        this.audio.volume = this.volume.value / 100;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
