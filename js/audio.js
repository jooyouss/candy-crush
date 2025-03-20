class AudioManager {
    constructor() {
        console.log('初始化 AudioManager');
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('音频上下文状态:', this.audioContext.state);
            
            // 音频状态
            this.isMuted = false;
            this.isMusicEnabled = true;
            this.musicVolume = 0.5;
            this.soundVolume = 0.5;
            
            // 音频缓存
            this.audioBuffers = {};
            this.musicSource = null;
            
            // 音量控制节点
            this.musicGain = this.audioContext.createGain();
            this.soundGain = this.audioContext.createGain();
            this.musicGain.connect(this.audioContext.destination);
            this.soundGain.connect(this.audioContext.destination);
            
            // 设置初始音量
            this.musicGain.gain.value = this.musicVolume;
            this.soundGain.gain.value = this.soundVolume;
            
            // 加载音频资源
            this.loadAudioFiles();
            
            // 绑定音量控制
            this.bindVolumeControls();

            // 添加点击事件监听器来恢复音频上下文
            document.addEventListener('click', () => this.resumeAudioContext(), { once: true });

            // 绑定音乐开关按钮
            this.bindMusicToggle();
        } catch (error) {
            console.error('AudioManager 初始化失败:', error);
        }
    }

    async loadAudioFiles() {
        console.log('开始加载音频文件');
        const audioFiles = {
            'background-music': 'assets/sounds/background-music.mp3',
            'match': 'assets/sounds/match.mp3',
            'swap': 'assets/sounds/swap.mp3',
            'invalid': 'assets/sounds/invalid.mp3',
            'special': 'assets/sounds/special.mp3',
            'click': 'assets/sounds/click.mp3',
            'level-complete': 'assets/sounds/level-complete.mp3',
            'game-over': 'assets/sounds/game-over.mp3'
        };

        for (const [name, path] of Object.entries(audioFiles)) {
            try {
                console.log(`尝试加载音频: ${path}`);
                
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                    throw new Error('加载的音频数据为空');
                }
                
                console.log(`音频数据大小: ${arrayBuffer.byteLength} 字节`);
                
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers[name] = audioBuffer;
                console.log(`音频 ${name} 加载成功`);
                
                // 如果是背景音乐且尚未开始播放，则开始播放
                if (name === 'background-music' && !this.musicSource && this.audioContext.state === 'running') {
                    console.log('尝试播放背景音乐');
                    this.playBackgroundMusic();
                }
            } catch (error) {
                console.error(`加载音频文件失败 ${name} (${path}):`, error);
            }
        }
    }

    playBackgroundMusic() {
        if (!this.isMusicEnabled) return;
        
        try {
            if (this.musicSource) {
                this.musicSource.stop();
                this.musicSource = null;
            }

            if (this.audioBuffers['background-music']) {
                this.musicSource = this.audioContext.createBufferSource();
                this.musicSource.buffer = this.audioBuffers['background-music'];
                this.musicSource.connect(this.musicGain);
                this.musicSource.loop = true;
                this.musicSource.start();
                console.log('背景音乐开始播放');
            } else {
                console.warn('背景音乐尚未加载完成');
            }
        } catch (error) {
            console.error('播放背景音乐失败:', error);
        }
    }

    playSound(name) {
        console.log(`尝试播放音效: ${name}`);
        console.log('静音状态:', this.isMuted);
        console.log(`音效缓存状态: ${!!this.audioBuffers[name]}`);
        
        if (this.isMuted || !this.audioBuffers[name]) {
            console.log(`无法播放音效 ${name}: `, this.isMuted ? '已静音' : '音效未加载');
            return;
        }

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.audioBuffers[name];
            source.connect(this.soundGain);
            source.start(0);
            console.log(`音效 ${name} 播放成功`);
        } catch (error) {
            console.error(`播放音效 ${name} 时出错:`, error);
        }
    }

    bindVolumeControls() {
        console.log('绑定音量控制');
        
        // 主菜单音量控制
        const mainMusicVolume = document.getElementById('mainMusicVolume');
        const mainSoundVolume = document.getElementById('mainSoundVolume');
        
        // 设置菜单音量控制
        const settingsMusicVolume = document.getElementById('settingsMusicVolume');
        const settingsSoundVolume = document.getElementById('settingsSoundVolume');

        // 绑定主菜单音量控制
        if (mainMusicVolume) {
            mainMusicVolume.value = this.musicVolume * 100;
            mainMusicVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setMusicVolume(volume);
                if (settingsMusicVolume) {
                    settingsMusicVolume.value = e.target.value;
                }
            });
            console.log('主菜单音乐音量控制已绑定');
        }

        if (mainSoundVolume) {
            mainSoundVolume.value = this.soundVolume * 100;
            mainSoundVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setSoundVolume(volume);
                if (settingsSoundVolume) {
                    settingsSoundVolume.value = e.target.value;
                }
            });
            console.log('主菜单音效音量控制已绑定');
        }

        // 绑定设置菜单音量控制
        if (settingsMusicVolume) {
            settingsMusicVolume.value = this.musicVolume * 100;
            settingsMusicVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setMusicVolume(volume);
                if (mainMusicVolume) {
                    mainMusicVolume.value = e.target.value;
                }
            });
            console.log('设置菜单音乐音量控制已绑定');
        }

        if (settingsSoundVolume) {
            settingsSoundVolume.value = this.soundVolume * 100;
            settingsSoundVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setSoundVolume(volume);
                if (mainSoundVolume) {
                    mainSoundVolume.value = e.target.value;
                }
            });
            console.log('设置菜单音效音量控制已绑定');
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = volume;
        this.musicGain.gain.value = volume;
    }

    setSoundVolume(volume) {
        this.soundVolume = volume;
        this.soundGain.gain.value = volume;
    }

    mute() {
        this.isMuted = true;
        if (this.musicSource) {
            this.musicSource.stop();
            this.musicSource = null;
        }
    }

    unmute() {
        this.isMuted = false;
        this.playBackgroundMusic();
    }

    async resumeAudioContext() {
        console.log('尝试恢复音频上下文');
        console.log('当前状态:', this.audioContext.state);
        
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('音频上下文已恢复');
                // 重新加载音频文件
                await this.loadAudioFiles();
            } catch (error) {
                console.error('恢复音频上下文时出错:', error);
            }
        }
    }

    bindMusicToggle() {
        const toggleButton = document.getElementById('toggleMusicButton');
        if (!toggleButton) return;

        toggleButton.addEventListener('click', () => {
            this.isMusicEnabled = !this.isMusicEnabled;
            
            if (this.isMusicEnabled) {
                this.playBackgroundMusic();
                toggleButton.textContent = '🎵 音乐开';
                toggleButton.classList.remove('muted');
            } else {
                if (this.musicSource) {
                    this.musicSource.stop();
                    this.musicSource = null;
                }
                toggleButton.textContent = '🎵 音乐关';
                toggleButton.classList.add('muted');
            }
        });
    }
}

// 创建全局音频管理器实例
window.audioManager = new AudioManager(); 