class CandyCrushGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 60;
        this.board = [];
        this.score = 0;
        this.moves = 0;
        this.selectedTile = null;
        this.currentLevel = 1;
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            timeLeft: 0
        };

        // 初始化游戏
        this.initializeGame();
    }

    initializeGame() {
        // 绑定事件监听器
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameState.isPlaying || this.gameState.isPaused) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.tileSize);
            const y = Math.floor((e.clientY - rect.top) / this.tileSize);
            
            this.handleClick(x, y);
        });

        // 启动游戏循环
        this.gameLoop();
    }

    startGame(level) {
        this.currentLevel = level;
        const levelConfig = window.levelManager.getLevel(level);
        
        // 设置游戏参数
        this.gridSize = levelConfig.gridSize;
        this.moves = levelConfig.moves;
        this.score = 0;
        this.gameState.timeLeft = levelConfig.timeLimit;
        this.gameState.isPlaying = true;
        this.gameState.isPaused = false;

        // 设置画布大小
        this.canvas.width = this.gridSize * this.tileSize;
        this.canvas.height = this.gridSize * this.tileSize;

        // 更新UI
        window.uiManager.updateLevel(level);
        window.uiManager.updateTargetScore(levelConfig.targetScore);
        window.uiManager.updateMoves(this.moves);
        window.uiManager.updateScore(this.score);
        window.uiManager.updateTimer(this.gameState.timeLeft);

        // 初始化游戏板
        this.initializeBoard();

        // 播放背景音乐
        window.audioManager.playMusic();

        // 启动计时器
        if (this.gameState.timeLeft > 0) {
            this.startTimer();
        }
    }

    initializeBoard() {
        this.board = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.board[i][j] = {
                    type: window.candyManager.getRandomBasicType(),
                    x: j,
                    y: i,
                    falling: false
                };
            }
        }
        // 确保初始板上没有匹配
        while (this.findMatches().length > 0) {
            this.initializeBoard();
        }
    }

    handleClick(x, y) {
        if (!this.isValidPosition(x, y)) return;

        if (!this.selectedTile) {
            this.selectedTile = {x, y};
            window.audioManager.playSound('click');
        } else {
            if (this.isAdjacent(this.selectedTile, {x, y})) {
                this.swapTiles(this.selectedTile, {x, y});
                this.moves--;
                window.uiManager.updateMoves(this.moves);
            } else {
                window.audioManager.playSound('invalid');
            }
            this.selectedTile = null;
        }
    }

    handleSwipe(startX, startY, endX, endY) {
        if (this.isValidPosition(startX, startY) && this.isValidPosition(endX, endY)) {
            if (this.isAdjacent({x: startX, y: startY}, {x: endX, y: endY})) {
                this.swapTiles({x: startX, y: startY}, {x: endX, y: endY});
                this.moves--;
                window.uiManager.updateMoves(this.moves);
            }
        }
    }

    async swapTiles(tile1, tile2, isCheckingMatch = true) {
        const candy1 = this.board[tile1.y][tile1.x];
        const candy2 = this.board[tile2.y][tile2.x];

        // 动画过渡
        await window.animationManager.animate(candy1, {
            x: tile2.x,
            y: tile2.y
        }, 200, 'easeOutBack');

        await window.animationManager.animate(candy2, {
            x: tile1.x,
            y: tile1.y
        }, 200, 'easeOutBack');

        // 交换位置
        this.board[tile1.y][tile1.x] = candy2;
        this.board[tile2.y][tile2.x] = candy1;

        // 只在检查匹配时进行匹配检查
        if (isCheckingMatch) {
            // 检查是否有匹配
            const matches = this.findMatches();
            if (matches.length === 0) {
                // 如果没有匹配，交换回来
                window.audioManager.playSound('invalid');
                
                // 直接交换位置，不再递归调用
                this.board[tile1.y][tile1.x] = candy1;
                this.board[tile2.y][tile2.x] = candy2;
                
                // 动画过渡回原位置
                await window.animationManager.animate(candy1, {
                    x: tile1.x,
                    y: tile1.y
                }, 200, 'easeOutBack');

                await window.animationManager.animate(candy2, {
                    x: tile2.x,
                    y: tile2.y
                }, 200, 'easeOutBack');
            } else {
                window.audioManager.playSound('swap');
                await this.handleMatches(matches);
                this.checkGameState();
            }
        }
    }

    findMatches() {
        const matches = new Set();

        // 检查水平匹配
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize - 2; j++) {
                const candy1 = this.board[i][j];
                const candy2 = this.board[i][j+1];
                const candy3 = this.board[i][j+2];
                
                if (candy1 && candy2 && candy3) {
                    // 检查普通匹配
                    if (candy1.type.color === candy2.type.color && 
                        candy1.type.color === candy3.type.color) {
                        matches.add(`${i},${j}`);
                        matches.add(`${i},${j+1}`);
                        matches.add(`${i},${j+2}`);
                    }
                    
                    // 检查彩虹糖匹配
                    if (candy1.type.special === 'rainbow' ||
                        candy2.type.special === 'rainbow' ||
                        candy3.type.special === 'rainbow') {
                        matches.add(`${i},${j}`);
                        matches.add(`${i},${j+1}`);
                        matches.add(`${i},${j+2}`);
                    }
                }
            }
        }

        // 检查垂直匹配
        for (let j = 0; j < this.gridSize; j++) {
            for (let i = 0; i < this.gridSize - 2; i++) {
                const candy1 = this.board[i][j];
                const candy2 = this.board[i+1][j];
                const candy3 = this.board[i+2][j];
                
                if (candy1 && candy2 && candy3) {
                    // 检查普通匹配
                    if (candy1.type.color === candy2.type.color && 
                        candy1.type.color === candy3.type.color) {
                        matches.add(`${i},${j}`);
                        matches.add(`${i+1},${j}`);
                        matches.add(`${i+2},${j}`);
                    }
                    
                    // 检查彩虹糖匹配
                    if (candy1.type.special === 'rainbow' ||
                        candy2.type.special === 'rainbow' ||
                        candy3.type.special === 'rainbow') {
                        matches.add(`${i},${j}`);
                        matches.add(`${i+1},${j}`);
                        matches.add(`${i+2},${j}`);
                    }
                }
            }
        }

        // 检查特殊糖果
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const candy = this.board[i][j];
                if (candy && candy.type.special) {
                    switch (candy.type.special) {
                        case 'striped-h':
                            // 添加整行
                            for (let x = 0; x < this.gridSize; x++) {
                                matches.add(`${i},${x}`);
                            }
                            break;
                        case 'striped-v':
                            // 添加整列
                            for (let y = 0; y < this.gridSize; y++) {
                                matches.add(`${y},${j}`);
                            }
                            break;
                        case 'wrapped':
                            // 添加3x3范围
                            for (let y = i-1; y <= i+1; y++) {
                                for (let x = j-1; x <= j+1; x++) {
                                    if (this.isValidPosition(x, y)) {
                                        matches.add(`${y},${x}`);
                                    }
                                }
                            }
                            break;
                        case 'bomb':
                            // 添加5x5范围
                            for (let y = i-2; y <= i+2; y++) {
                                for (let x = j-2; x <= j+2; x++) {
                                    if (this.isValidPosition(x, y)) {
                                        matches.add(`${y},${x}`);
                                    }
                                }
                            }
                            break;
                    }
                }
            }
        }

        return Array.from(matches).map(pos => {
            const [i, j] = pos.split(',').map(Number);
            return {x: j, y: i};
        });
    }

    async handleMatches(matches) {
        // 创建特殊糖果
        const specialCandy = this.createSpecialCandy(matches);
        if (specialCandy) {
            const pos = matches[Math.floor(matches.length / 2)];
            this.board[pos.y][pos.x] = {
                type: specialCandy,
                x: pos.x,
                y: pos.y,
                falling: false
            };
            matches = matches.filter(m => m.x !== pos.x || m.y !== pos.y);
            window.audioManager.playSound('special');
        }

        // 移除匹配的糖果
        matches.forEach(pos => {
            const candy = this.board[pos.y][pos.x];
            if (candy) {
                // 创建消除效果
                window.animationManager.createParticleSystem(
                    pos.x * this.tileSize + this.tileSize / 2,
                    pos.y * this.tileSize + this.tileSize / 2,
                    candy.type.color
                );
                this.board[pos.y][pos.x] = null;
            }
        });

        // 增加分数
        this.score += matches.length * 10;
        window.uiManager.updateScore(this.score);
        window.audioManager.playSound('match');

        // 等待动画完成
        await new Promise(resolve => setTimeout(resolve, 300));

        // 应用重力效果
        await this.applyGravity();

        // 填充新的糖果
        this.fillBoard();

        // 检查新的匹配
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            await this.handleMatches(newMatches);
        }
    }

    createSpecialCandy(matches) {
        if (matches.length < 3) return null;

        const matchPositions = matches.map(m => `${m.y},${m.x}`);
        const horizontalMatches = new Set();
        const verticalMatches = new Set();

        // 分析匹配方向
        for (let i = 0; i < this.gridSize; i++) {
            let consecutiveH = 0;
            let consecutiveV = 0;
            for (let j = 0; j < this.gridSize; j++) {
                // 水平检查
                if (matchPositions.includes(`${i},${j}`)) {
                    consecutiveH++;
                    if (consecutiveH >= 3) {
                        for (let k = j-consecutiveH+1; k <= j; k++) {
                            horizontalMatches.add(`${i},${k}`);
                        }
                    }
                } else {
                    consecutiveH = 0;
                }

                // 垂直检查
                if (matchPositions.includes(`${j},${i}`)) {
                    consecutiveV++;
                    if (consecutiveV >= 3) {
                        for (let k = j-consecutiveV+1; k <= j; k++) {
                            verticalMatches.add(`${k},${i}`);
                        }
                    }
                } else {
                    consecutiveV = 0;
                }
            }
        }

        // 检查是否形成L形或T形
        const intersections = new Set([...horizontalMatches].filter(x => verticalMatches.has(x)));
        if (intersections.size > 0) {
            // 创建包装糖果
            return window.candyManager.specialTypes.wrapped(
                this.board[matches[0].y][matches[0].x].type.color
            );
        }

        // 检查长度为5或更多
        if (matches.length >= 5) {
            return window.candyManager.specialTypes.bomb(
                this.board[matches[0].y][matches[0].x].type.color
            );
        }

        // 检查长度为4
        if (matches.length === 4) {
            const isHorizontal = horizontalMatches.size >= 4;
            return window.candyManager.specialTypes.striped[isHorizontal ? 'horizontal' : 'vertical'](
                this.board[matches[0].y][matches[0].x].type.color
            );
        }

        // 随机生成包装糖果（较低概率）
        if (matches.length === 3 && Math.random() < 0.05) {
            return window.candyManager.specialTypes.wrapped(
                this.board[matches[0].y][matches[0].x].type.color
            );
        }

        return null;
    }

    async applyGravity() {
        let moved = false;
        const fallingCandies = new Set();

        // 从底部向上检查
        for (let j = 0; j < this.gridSize; j++) {
            for (let i = this.gridSize - 1; i >= 0; i--) {
                if (this.board[i][j] === null) {
                    // 找到上方最近的糖果
                    let k = i - 1;
                    while (k >= 0 && this.board[k][j] === null) {
                        k--;
                    }
                    if (k >= 0) {
                        // 移动糖果
                        this.board[i][j] = this.board[k][j];
                        this.board[k][j] = null;
                        this.board[i][j].falling = true;
                        fallingCandies.add(this.board[i][j]);
                        moved = true;
                    }
                }
            }
        }

        // 如果有糖果移动，等待动画完成
        if (moved) {
            const animations = Array.from(fallingCandies).map(candy => {
                return window.animationManager.animate(candy, {
                    y: candy.y
                }, 300, 'easeInQuad');
            });

            // 等待所有动画完成
            await Promise.all(animations);

            // 重置falling状态
            fallingCandies.forEach(candy => {
                candy.falling = false;
            });
        }

        return moved;
    }

    fillBoard() {
        let filled = false;
        
        // 填充空位
        for (let j = 0; j < this.gridSize; j++) {
            for (let i = 0; i < this.gridSize; i++) {
                if (this.board[i][j] === null) {
                    this.board[i][j] = {
                        type: window.candyManager.getRandomBasicType(),
                        x: j,
                        y: i,
                        falling: true
                    };
                    filled = true;
                }
            }
        }

        // 如果有新填充的糖果，创建下落动画
        if (filled) {
            const animations = [];
            for (let j = 0; j < this.gridSize; j++) {
                for (let i = 0; i < this.gridSize; i++) {
                    const candy = this.board[i][j];
                    if (candy.falling) {
                        // 从上方开始下落
                        candy.y = -1;
                        animations.push(
                            window.animationManager.animate(candy, {
                                y: i
                            }, 300, 'easeInQuad')
                        );
                    }
                }
            }

            // 等待所有动画完成
            return Promise.all(animations).then(() => {
                // 重置falling状态
                for (let i = 0; i < this.gridSize; i++) {
                    for (let j = 0; j < this.gridSize; j++) {
                        if (this.board[i][j]) {
                            this.board[i][j].falling = false;
                        }
                    }
                }
            });
        }

        return Promise.resolve();
    }

    checkGameState() {
        const levelConfig = window.levelManager.getLevel(this.currentLevel);

        // 检查是否达成目标
        if (window.levelManager.isLevelComplete(this.currentLevel, {
            score: this.score,
            moves: this.moves,
            timeLeft: this.gameState.timeLeft
        })) {
            this.levelComplete();
        }
        // 检查是否失败
        else if (this.moves <= 0 || (levelConfig.timeLimit > 0 && this.gameState.timeLeft <= 0)) {
            this.gameOver();
        }
    }

    levelComplete() {
        this.gameState.isPlaying = false;
        window.audioManager.playSound('levelComplete');

        // 计算星级
        const stars = window.levelManager.calculateStars(this.currentLevel, this.score);

        // 解锁下一关
        const unlockedLevels = parseInt(localStorage.getItem('unlockedLevels') || '1');
        if (this.currentLevel >= unlockedLevels) {
            localStorage.setItem('unlockedLevels', (this.currentLevel + 1).toString());
        }

        // 显示完成界面
        window.uiManager.showGameOver(this.score, stars);
    }

    gameOver() {
        this.gameState.isPlaying = false;
        window.audioManager.playSound('gameOver');
        window.uiManager.showGameOver(this.score, 0);
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (!this.gameState.isPaused && this.gameState.isPlaying) {
                this.gameState.timeLeft--;
                window.uiManager.updateTimer(this.gameState.timeLeft);
                
                if (this.gameState.timeLeft <= 0) {
                    clearInterval(this.timerInterval);
                    this.gameOver();
                }
            }
        }, 1000);
    }

    pauseGame() {
        this.gameState.isPaused = true;
        window.audioManager.pauseMusic();
    }

    resumeGame() {
        this.gameState.isPaused = false;
        window.audioManager.playMusic();
    }

    restartLevel() {
        this.startGame(this.currentLevel);
    }

    nextLevel() {
        this.startGame(this.currentLevel + 1);
    }

    quitGame() {
        this.gameState.isPlaying = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        window.audioManager.pauseMusic();
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }

    isAdjacent(tile1, tile2) {
        const dx = Math.abs(tile1.x - tile2.x);
        const dy = Math.abs(tile1.y - tile2.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制所有糖果
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const candy = this.board[i][j];
                if (candy) {
                    window.candyManager.drawCandy(
                        this.ctx,
                        candy.type,
                        j * this.tileSize,
                        i * this.tileSize,
                        this.tileSize
                    );
                }

                // 绘制选中效果
                if (this.selectedTile && this.selectedTile.x === j && this.selectedTile.y === i) {
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(
                        j * this.tileSize,
                        i * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }

        // 更新动画
        window.animationManager.update(this.ctx);
    }

    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 创建全局游戏实例
window.game = new CandyCrushGame(); 