class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.musicVolume = 0.5;
        this.soundVolume = 0.5;
        this.isMuted = false;

        // 初始化音效
        this.initSounds();
        this.initMusic();
        this.bindEvents();
    }

    initSounds() {
        const soundFiles = {
            match: 'assets/sounds/match.mp3',
            swap: 'assets/sounds/swap.mp3',
            invalid: 'assets/sounds/invalid.mp3',
            special: 'assets/sounds/special.mp3',
            levelComplete: 'assets/sounds/level-complete.mp3',
            gameOver: 'assets/sounds/game-over.mp3',
            click: 'assets/sounds/click.mp3'
        };

        for (const [name, path] of Object.entries(soundFiles)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.sounds[name] = audio;
        }
    }

    initMusic() {
        this.music = new Audio('assets/sounds/background-music.mp3');
        this.music.loop = true;
        this.setMusicVolume(this.musicVolume);
    }

    bindEvents() {
        const musicSlider = document.getElementById('musicVolume');
        const soundSlider = document.getElementById('soundVolume');

        musicSlider.addEventListener('input', (e) => {
            this.setMusicVolume(e.target.value / 100);
        });

        soundSlider.addEventListener('input', (e) => {
            this.setSoundVolume(e.target.value / 100);
        });
    }

    playSound(name) {
        if (this.isMuted || !this.sounds[name]) return;
        
        const sound = this.sounds[name].cloneNode();
        sound.volume = this.soundVolume;
        sound.play().catch(e => console.log('Error playing sound:', e));
    }

    playMusic() {
        if (this.isMuted) return;
        this.music.play().catch(e => console.log('Error playing music:', e));
    }

    pauseMusic() {
        this.music.pause();
    }

    setMusicVolume(volume) {
        this.musicVolume = volume;
        this.music.volume = volume;
    }

    setSoundVolume(volume) {
        this.soundVolume = volume;
    }

    mute() {
        this.isMuted = true;
        this.pauseMusic();
    }

    unmute() {
        this.isMuted = false;
        this.playMusic();
    }
}

// 创建全局音频管理器实例
window.audioManager = new AudioManager(); 