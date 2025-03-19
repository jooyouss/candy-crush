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
        // 绑定鼠标点击事件监听器
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameState.isPlaying || this.gameState.isPaused) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.tileSize);
            const y = Math.floor((e.clientY - rect.top) / this.tileSize);
            
            this.handleClick(x, y);
        });

        // 添加触摸事件支持
        let touchStartX = null;
        let touchStartY = null;
        let touchStartTime = null;

        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.gameState.isPlaying || this.gameState.isPaused) return;
            e.preventDefault(); // 防止页面滚动

            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            touchStartX = Math.floor((touch.clientX - rect.left) / this.tileSize);
            touchStartY = Math.floor((touch.clientY - rect.top) / this.tileSize);
            touchStartTime = Date.now();

            // 处理点击选择
            this.handleClick(touchStartX, touchStartY);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.gameState.isPlaying || this.gameState.isPaused) return;
            e.preventDefault(); // 防止页面滚动
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (!this.gameState.isPlaying || this.gameState.isPaused) return;
            if (touchStartX === null || touchStartY === null) return;
            e.preventDefault(); // 防止页面滚动

            const rect = this.canvas.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const touchEndX = Math.floor((touch.clientX - rect.left) / this.tileSize);
            const touchEndY = Math.floor((touch.clientY - rect.top) / this.tileSize);
            const touchEndTime = Date.now();

            // 如果触摸时间小于200ms且起点终点相同，视为点击
            if (touchEndTime - touchStartTime < 200 && 
                touchEndX === touchStartX && 
                touchEndY === touchStartY) {
                // 点击已经在touchstart中处理
                return;
            }

            // 如果起点和终点相邻，视为滑动
            if (this.isValidPosition(touchEndX, touchEndY) &&
                this.isAdjacent({x: touchStartX, y: touchStartY}, {x: touchEndX, y: touchEndY})) {
                this.swapTiles(
                    {x: touchStartX, y: touchStartY},
                    {x: touchEndX, y: touchEndY}
                );
                this.moves--;
                window.uiManager.updateMoves(this.moves);
                this.selectedTile = null;
            }

            // 重置触摸状态
            touchStartX = null;
            touchStartY = null;
            touchStartTime = null;
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
                // 如果点击的不是相邻位置，更新选中的糖果
                this.selectedTile = {x, y};
                window.audioManager.playSound('click');
            }
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

        // 临时交换位置以检查是否有匹配
        this.board[tile1.y][tile1.x] = candy2;
        this.board[tile2.y][tile2.x] = candy1;

        // 检查是否有匹配
        const matches = this.findMatches();

        // 先恢复原位置
        this.board[tile1.y][tile1.x] = candy1;
        this.board[tile2.y][tile2.x] = candy2;

        if (matches.length === 0) {
            // 如果没有匹配，播放无效音效并返回
            window.audioManager.playSound('invalid');
            return;
        }

        // 如果有匹配，执行交换动画
        window.audioManager.playSound('swap');

        // 动画过渡
        await Promise.all([
            window.animationManager.animate(candy1, {
                x: tile2.x,
                y: tile2.y
            }, 200, 'easeOutBack'),
            window.animationManager.animate(candy2, {
                x: tile1.x,
                y: tile1.y
            }, 200, 'easeOutBack')
        ]);

        // 实际交换位置
        this.board[tile1.y][tile1.x] = candy2;
        this.board[tile2.y][tile2.x] = candy1;

        // 处理匹配
        if (isCheckingMatch) {
            await this.handleMatches(matches);
            this.checkGameState();
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
                
                if (candy1 && candy2 && candy3 &&
                    candy1.type.color === candy2.type.color && 
                    candy1.type.color === candy3.type.color) {
                    matches.add(`${i},${j}`);
                    matches.add(`${i},${j+1}`);
                    matches.add(`${i},${j+2}`);
                }
            }
        }

        // 检查垂直匹配
        for (let j = 0; j < this.gridSize; j++) {
            for (let i = 0; i < this.gridSize - 2; i++) {
                const candy1 = this.board[i][j];
                const candy2 = this.board[i+1][j];
                const candy3 = this.board[i+2][j];
                
                if (candy1 && candy2 && candy3 &&
                    candy1.type.color === candy2.type.color && 
                    candy1.type.color === candy3.type.color) {
                    matches.add(`${i},${j}`);
                    matches.add(`${i+1},${j}`);
                    matches.add(`${i+2},${j}`);
                }
            }
        }

        return Array.from(matches).map(pos => {
            const [i, j] = pos.split(',').map(Number);
            return {x: j, y: i};
        });
    }

    async handleMatches(matches) {
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
                // 将匹配的位置设为null
                this.board[pos.y][pos.x] = null;
            }
        });

        // 计算分数
        let scoreToAdd = 0;
        const consecutiveMatches = this.findConsecutiveMatches(matches);
        consecutiveMatches.forEach(count => {
            if (count === 3) scoreToAdd += 5;
            else if (count === 4) scoreToAdd += 10;
            else if (count >= 5) scoreToAdd += 15;
        });

        this.score += scoreToAdd;
        window.uiManager.updateScore(this.score);
        window.audioManager.playSound('match');

        // 等待消除动画完成
        await new Promise(resolve => setTimeout(resolve, 300));

        // 应用重力效果
        await this.applyGravity();

        // 填充新的糖果
        await this.fillEmptySpaces();

        // 检查新的匹配
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            await this.handleMatches(newMatches);
        }
    }

    findConsecutiveMatches(matches) {
        const consecutiveCounts = [];
        const visited = new Set();
        
        // 检查水平连续
        for (let i = 0; i < this.gridSize; i++) {
            let count = 0;
            let lastColor = null;
            
            for (let j = 0; j < this.gridSize; j++) {
                const key = `${i},${j}`;
                if (matches.some(m => m.x === j && m.y === i)) {
                    const currentColor = this.board[i][j].type.color;
                    if (lastColor === null || lastColor === currentColor) {
                        count++;
                        visited.add(key);
                    } else {
                        if (count >= 3) consecutiveCounts.push(count);
                        count = 1;
                    }
                    lastColor = currentColor;
                } else {
                    if (count >= 3) consecutiveCounts.push(count);
                    count = 0;
                    lastColor = null;
                }
            }
            if (count >= 3) consecutiveCounts.push(count);
        }

        // 检查垂直连续
        for (let j = 0; j < this.gridSize; j++) {
            let count = 0;
            let lastColor = null;
            
            for (let i = 0; i < this.gridSize; i++) {
                const key = `${i},${j}`;
                if (matches.some(m => m.x === j && m.y === i) && !visited.has(key)) {
                    const currentColor = this.board[i][j].type.color;
                    if (lastColor === null || lastColor === currentColor) {
                        count++;
                    } else {
                        if (count >= 3) consecutiveCounts.push(count);
                        count = 1;
                    }
                    lastColor = currentColor;
                } else {
                    if (count >= 3) consecutiveCounts.push(count);
                    count = 0;
                    lastColor = null;
                }
            }
            if (count >= 3) consecutiveCounts.push(count);
        }

        return consecutiveCounts;
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

    async fillEmptySpaces() {
        const animations = [];
        
        // 遍历每一列
        for (let j = 0; j < this.gridSize; j++) {
            // 计算这一列有多少个空位
            let emptyCount = 0;
            for (let i = 0; i < this.gridSize; i++) {
                if (this.board[i][j] === null) {
                    emptyCount++;
                }
            }

            // 如果有空位，从上方生成新的糖果
            if (emptyCount > 0) {
                // 将现有的糖果向下移动
                for (let i = this.gridSize - 1; i >= 0; i--) {
                    if (this.board[i][j] === null) {
                        // 创建新的糖果
                        const newCandy = {
                            type: window.candyManager.getRandomBasicType(),
                            x: j,
                            y: i - emptyCount,
                            falling: true
                        };
                        this.board[i][j] = newCandy;

                        // 添加下落动画
                        animations.push(
                            window.animationManager.animate(newCandy, {
                                y: i
                            }, 300, 'easeInQuad')
                        );
                    }
                }
            }
        }

        // 等待所有动画完成
        if (animations.length > 0) {
            await Promise.all(animations);
            
            // 重置所有糖果的falling状态
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    if (this.board[i][j]) {
                        this.board[i][j].falling = false;
                    }
                }
            }
        }
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