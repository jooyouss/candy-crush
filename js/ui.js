class UIManager {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.screens = {
            mainMenu: document.getElementById('mainMenu'),
            levelSelect: document.getElementById('levelSelectMenu'),
            settings: document.getElementById('settingsMenu'),
            game: document.getElementById('gameUI'),
            pause: document.getElementById('pauseMenu'),
            gameOver: document.getElementById('gameOverMenu')
        };

        this.bindEvents();
        this.initLevelGrid();
    }

    bindEvents() {
        // 主菜单按钮
        document.getElementById('startGame').addEventListener('click', () => {
            this.showScreen('game');
            window.game.startGame(1); // 从第一关开始
        });

        document.getElementById('levelSelect').addEventListener('click', () => {
            this.showScreen('levelSelect');
        });

        document.getElementById('settings').addEventListener('click', () => {
            this.showScreen('settings');
        });

        // 返回按钮
        document.querySelectorAll('.back-button').forEach(button => {
            button.addEventListener('click', () => {
                this.showScreen('mainMenu');
            });
        });

        // 游戏控制按钮
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.showScreen('pause');
            window.game.pauseGame();
        });

        document.getElementById('restartButton').addEventListener('click', () => {
            window.game.restartLevel();
        });

        document.getElementById('quitButton').addEventListener('click', () => {
            this.showScreen('mainMenu');
            window.game.quitGame();
        });

        // 暂停菜单按钮
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.showScreen('game');
            window.game.resumeGame();
        });

        document.getElementById('restartLevelButton').addEventListener('click', () => {
            this.showScreen('game');
            window.game.restartLevel();
        });

        document.getElementById('quitToMenuButton').addEventListener('click', () => {
            this.showScreen('mainMenu');
            window.game.quitGame();
        });

        // 游戏结束菜单按钮
        document.getElementById('retryButton').addEventListener('click', () => {
            this.showScreen('game');
            window.game.restartLevel();
        });

        document.getElementById('nextLevelButton').addEventListener('click', () => {
            this.showScreen('game');
            window.game.nextLevel();
        });

        document.getElementById('menuButton').addEventListener('click', () => {
            this.showScreen('mainMenu');
            window.game.quitGame();
        });

        // 移动设备触摸事件
        this.addTouchSupport();
    }

    showScreen(screenName) {
        this.currentScreen = screenName;
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        this.screens[screenName].classList.remove('hidden');

        // 播放切换音效
        window.audioManager.playSound('click');
    }

    initLevelGrid() {
        const levelGrid = document.getElementById('levelGrid');
        const totalLevels = 20; // 总关卡数
        const unlockedLevels = parseInt(localStorage.getItem('unlockedLevels') || '1');

        for (let i = 1; i <= totalLevels; i++) {
            const levelButton = document.createElement('div');
            levelButton.className = `level-button ${i > unlockedLevels ? 'locked' : ''}`;
            levelButton.textContent = i;

            if (i <= unlockedLevels) {
                levelButton.addEventListener('click', () => {
                    this.showScreen('game');
                    window.game.startGame(i);
                });
            }

            levelGrid.appendChild(levelButton);
        }
    }

    updateScore(score) {
        document.getElementById('score').textContent = score;
    }

    updateMoves(moves) {
        document.getElementById('moves').textContent = moves;
    }

    updateTimer(time) {
        document.getElementById('timer').textContent = time;
    }

    updateLevel(level) {
        document.getElementById('currentLevel').textContent = level;
    }

    updateTargetScore(score) {
        document.getElementById('targetScore').textContent = score;
    }

    showGameOver(score, stars) {
        document.getElementById('finalScore').textContent = score;
        document.getElementById('stars').textContent = '★'.repeat(stars);
        this.showScreen('gameOver');
    }

    addTouchSupport() {
        let startX, startY;
        const canvas = document.getElementById('gameCanvas');

        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            e.preventDefault();
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;

            // 计算滑动距离
            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // 如果滑动距离太小，不处理
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;

            // 调用游戏的滑动处理方法
            window.game.handleSwipe(startX, startY, endX, endY);
            
            // 重置起始位置
            startX = null;
            startY = null;
            
            e.preventDefault();
        });
    }
}

// 创建全局UI管理器实例
window.uiManager = new UIManager(); 