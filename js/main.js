document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏
    const game = new Game();
    window.game = game;

    // 主菜单按钮事件
    const startGameBtn = document.getElementById('startGame');
    const levelSelectBtn = document.getElementById('levelSelect');
    const settingsBtn = document.getElementById('settings');
    const muteBtn = document.getElementById('muteButton');

    // 游戏界面按钮事件
    const pauseBtn = document.getElementById('pauseButton');
    const restartBtn = document.getElementById('restartButton');
    const quitBtn = document.getElementById('quitButton');
    const muteGameBtn = document.getElementById('muteGameButton');

    // 添加点击事件来恢复音频上下文
    document.addEventListener('click', async () => {
        console.log('尝试恢复音频上下文');
        if (window.audioManager) {
            await window.audioManager.resumeAudioContext();
            console.log('音频上下文已恢复');
        } else {
            console.warn('audioManager 不存在');
        }
    }, { once: true });

    // 主菜单按钮事件处理
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            console.log('点击开始游戏按钮');
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }
            document.getElementById('mainMenu').classList.add('hidden');
            document.getElementById('gameUI').classList.remove('hidden');
            game.start();
        });
    }

    if (levelSelectBtn) {
        levelSelectBtn.addEventListener('click', () => {
            window.audioManager?.playSound('click');
            document.getElementById('mainMenu').classList.add('hidden');
            document.getElementById('levelSelectMenu').classList.remove('hidden');
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.audioManager?.playSound('click');
            document.getElementById('mainMenu').classList.add('hidden');
            document.getElementById('settingsMenu').classList.remove('hidden');
        });
    }

    // 音频控制事件
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            if (window.audioManager?.isMuted) {
                window.audioManager.unmute();
                muteBtn.textContent = '🔊';
                muteGameBtn.textContent = '🔊';
            } else {
                window.audioManager?.mute();
                muteBtn.textContent = '🔇';
                muteGameBtn.textContent = '🔇';
            }
        });
    }

    if (muteGameBtn) {
        muteGameBtn.addEventListener('click', () => {
            if (window.audioManager?.isMuted) {
                window.audioManager.unmute();
                muteBtn.textContent = '🔊';
                muteGameBtn.textContent = '🔊';
            } else {
                window.audioManager?.mute();
                muteBtn.textContent = '🔇';
                muteGameBtn.textContent = '🔇';
            }
        });
    }

    // 返回按钮事件
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            window.audioManager?.playSound('click');
            document.querySelectorAll('.screen').forEach(screen => {
                if (!screen.id.includes('mainMenu')) {
                    screen.classList.add('hidden');
                }
            });
            document.getElementById('mainMenu').classList.remove('hidden');
        });
    });

    // 游戏控制按钮事件
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            window.audioManager?.playSound('click');
            game.pause();
            document.getElementById('pauseMenu').classList.remove('hidden');
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            window.audioManager?.playSound('click');
            game.restart();
        });
    }

    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            window.audioManager?.playSound('click');
            game.quit();
            document.getElementById('gameUI').classList.add('hidden');
            document.getElementById('mainMenu').classList.remove('hidden');
        });
    }
}); 