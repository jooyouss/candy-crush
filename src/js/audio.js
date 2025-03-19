class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.music = null;
        this.musicVolume = 0.5;
        this.soundVolume = 0.5;
        this.isMuted = false;

        // 初始化音效
        this.loadSounds();
        this.initMusic();
        this.bindEvents();
    }

    // 加载所有音效
    async loadSounds() {
        const soundFiles = [
            'click',
            'swap',
            'match',
            'invalid',
            'special',
            'level-complete',
            'game-over',
            'background-music'
        ];

        for (const sound of soundFiles) {
            try {
                const response = await fetch(`assets/sounds/${sound}.mp3`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioBuffer(arrayBuffer);
                this.sounds[sound] = audioBuffer;
            } catch (error) {
                console.log(`无法加载音效: ${sound}`);
                // 创建临时音效
                this.sounds[sound] = this.createTemporarySound(sound);
            }
        }
    }

    // 创建临时音效
    createTemporarySound(type) {
        const duration = 0.1; // 音效持续时间（秒）
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        switch (type) {
            case 'click':
                // 生成点击音效（短促的高音）
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.sin(i * 0.05) * Math.exp(-4 * i / buffer.length);
                }
                break;

            case 'swap':
                // 生成交换音效（上升音调）
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.sin(i * 0.03 * (1 + i / buffer.length)) * Math.exp(-3 * i / buffer.length);
                }
                break;

            case 'match':
                // 生成消除音效（下降音调）
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.sin(i * 0.04 * (1 - i / buffer.length)) * Math.exp(-2 * i / buffer.length);
                }
                break;

            case 'invalid':
                // 生成无效移动音效（低音）
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.sin(i * 0.02) * Math.exp(-4 * i / buffer.length);
                }
                break;

            case 'special':
                // 生成特殊糖果音效（上升和下降音调）
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.sin(i * 0.06 * Math.sin(i / buffer.length * Math.PI)) * Math.exp(-2 * i / buffer.length);
                }
                break;

            case 'level-complete':
                // 生成通关音效（欢快的音调）
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.sin(i * 0.04) * Math.sin(i * 0.02) * Math.exp(-2 * i / buffer.length);
                }
                break;

            case 'game-over':
                // 生成游戏结束音效（低沉的音调）
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.sin(i * 0.01) * Math.exp(-3 * i / buffer.length);
                }
                break;

            case 'background-music':
                // 生成简单的背景音乐（循环音调）
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.sin(i * 0.02) * 0.3;
                }
                break;
        }

        return buffer;
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

    playSound(type) {
        if (this.isMuted || !this.sounds[type]) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[type];
        source.connect(this.audioContext.destination);
        source.start();
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