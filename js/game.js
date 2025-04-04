class CandyCrushGame {
    constructor() {
        // 初始化游戏属性
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 60;
        this.gridSize = 8; // 默认网格大小
        this.board = [];
        this.score = 0;
        this.moves = 20;
        this.selectedTile = null;
        this.currentLevel = 1;
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            timeLeft: 60
        };
        this.touchStartPos = null;  // 添加触摸起始位置属性

        // 设置画布大小
        this.canvas.width = this.gridSize * this.tileSize;
        this.canvas.height = this.gridSize * this.tileSize;

        // 绑定事件监听器
        this.bindEventListeners();
        
        // 启动游戏循环
        this.gameLoop();
    }

    bindEventListeners() {
        // 绑定鼠标事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // 绑定触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((touch.clientX - rect.left) / this.tileSize);
            const y = Math.floor((touch.clientY - rect.top) / this.tileSize);
            this.handleClick({ clientX: touch.clientX, clientY: touch.clientY });
        });
    }

    startGame(level) {
        console.log('Starting game at level:', level);
        this.currentLevel = level;
        
        // 获取关卡配置
        const levelConfig = window.levelManager.getLevel(level);
        console.log('Level config:', levelConfig);
        
        // 重置游戏状态
        this.score = 0;
        this.moves = levelConfig.moves || 20; // 如果关卡配置中没有指定移动次数，使用默认值20
        console.log('Initial moves:', this.moves);
        this.selectedTile = null;
        this.gameState = {
            isPlaying: true,
            isPaused: false,
            timeLeft: levelConfig.timeLimit || 0
        };

        // 更新网格大小
        this.gridSize = levelConfig.gridSize || 8; // 如果没有指定网格大小，使用默认值8
        this.canvas.width = this.gridSize * this.tileSize;
        this.canvas.height = this.gridSize * this.tileSize;

        // 更新UI显示
        document.getElementById('currentLevel').textContent = level;
        document.getElementById('targetScore').textContent = levelConfig.targetScore;
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('timer').textContent = this.gameState.timeLeft;
        
        // 显示或隐藏计时器
        const timerContainer = document.getElementById('timerContainer');
        timerContainer.style.display = levelConfig.timeLimit > 0 ? 'inline' : 'none';

        // 初始化游戏板
        this.initializeBoard();
        
        // 开始计时器（如果有时间限制）
        if (levelConfig.timeLimit > 0) {
            this.startTimer();
        }

        // 播放背景音乐
        window.audioManager?.playBackgroundMusic();
    }

    initializeBoard() {
        console.log('Initializing board...');
        this.board = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.board[i][j] = {
                    type: this.getRandomCandyType(),
                    x: j,
                    y: i
                };
            }
        }
        // 确保初始板上没有匹配
        while (this.findMatches().length > 0) {
            this.initializeBoard();
        }
        console.log('Board initialized:', this.board);
    }

    getRandomCandyType() {
        const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF'];
        return {
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }

    handleClick(e) {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor(((e.clientX - rect.left) * scaleX) / this.tileSize);
        const y = Math.floor(((e.clientY - rect.top) * scaleY) / this.tileSize);

        if (!this.isValidPosition(x, y)) return;

        if (!this.selectedTile) {
            this.selectedTile = {x, y};
        } else {
            if (this.isAdjacent(this.selectedTile, {x, y})) {
                // 获取起始和目标位置的糖果
                const startTile = this.board[this.selectedTile.y][this.selectedTile.x];
                const endTile = this.board[y][x];
                this.swapTilesAndCheck(startTile, endTile);
            }
            this.selectedTile = null;
        }
    }

    async handleSwipe(startX, startY, endX, endY) {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;

        // 将触摸坐标转换为网格坐标
        const rect = this.canvas.getBoundingClientRect();
        const gridStartX = Math.floor((startX - rect.left) / this.tileSize);
        const gridStartY = Math.floor((startY - rect.top) / this.tileSize);
        const gridEndX = Math.floor((endX - rect.left) / this.tileSize);
        const gridEndY = Math.floor((endY - rect.top) / this.tileSize);

        // 检查坐标是否在网格范围内
        if (!this.isValidPosition(gridStartX, gridStartY) || 
            !this.isValidPosition(gridEndX, gridEndY)) {
            return;
        }

        // 计算滑动方向
        const dx = gridEndX - gridStartX;
        const dy = gridEndY - gridStartY;

        // 只处理水平或垂直方向的滑动，且只能移动一格
        if (Math.abs(dx) === 1 && dy === 0 || Math.abs(dy) === 1 && dx === 0) {
            // 获取起始和目标位置的糖果
            const startTile = this.board[gridStartY][gridStartX];
            const endTile = this.board[gridEndY][gridEndX];
            await this.swapTilesAndCheck(startTile, endTile);
        }
    }

    async swapTilesAndCheck(tile1, tile2) {
        if (!tile1 || !tile2) return;

        // 交换糖果
        this.swapTiles(tile1, tile2);
        
        // 检查是否有匹配
        const matches = this.findMatches();
        
        if (matches.length === 0) {
            // 如果没有匹配，交换回来并播放无效音效
            this.swapTiles(tile1, tile2);
            window.audioManager?.playSound('invalid');
            return;
        }

        // 如果有匹配，播放交换音效
        window.audioManager?.playSound('swap');

        // 更新移动次数
        this.moves--;
        document.getElementById('moves').textContent = this.moves;

        // 处理匹配
        await this.handleMatches(matches);
    }

    async handleMatches(matches) {
        // 播放消除音效
        if (matches.length >= 4) {
            window.audioManager?.playSound('special');
        } else {
            window.audioManager?.playSound('match');
        }

        // 计算得分
        const matchScore = matches.length * 10;
        this.score += matchScore;
        document.getElementById('score').textContent = this.score;

        // 移除匹配的糖果
        matches.forEach(pos => {
            this.board[pos.y][pos.x] = null;
        });

        // 等待一小段时间让玩家看到消除效果
        await new Promise(resolve => setTimeout(resolve, 200));

        // 处理糖果下落和填充
        await this.handleFallingAndFilling();

        // 检查是否达到目标分数
        const levelConfig = window.levelManager.getLevel(this.currentLevel);
        if (this.score >= levelConfig.targetScore) {
            this.gameOver(true);
            return;
        }

        // 检查是否有新的匹配
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            await this.handleMatches(newMatches);
            return;
        }

        // 检查是否有可能的移动
        if (!this.hasValidMoves()) {
            console.log('没有可能的移动，重新打乱游戏板...');
            this.reshuffleBoard();
            return;
        }

        // 只在没有新的匹配时，并且moves为0时才检查游戏状态
        if (this.moves <= 0) {
            this.checkGameState();
        }
    }

    async handleFallingAndFilling() {
        let hasMoved;
        do {
            hasMoved = false;
            // 从底部向上处理每一列
            for (let col = 0; col < this.gridSize; col++) {
                for (let row = this.gridSize - 1; row > 0; row--) {
                    if (!this.board[row][col]) {
                        // 找到上方最近的糖果
                        for (let above = row - 1; above >= 0; above--) {
                            if (this.board[above][col]) {
                                // 移动糖果
                                this.board[row][col] = this.board[above][col];
                                this.board[above][col] = null;
                                // 更新糖果位置
                                this.board[row][col].y = row;
                                hasMoved = true;
                                break;
                            }
                        }
                    }
                }
            }

            // 填充顶部空缺
            for (let col = 0; col < this.gridSize; col++) {
                for (let row = 0; row < this.gridSize; row++) {
                    if (!this.board[row][col]) {
                        this.board[row][col] = {
                            type: this.getRandomCandyType(),
                            x: col,
                            y: row
                        };
                        hasMoved = true;
                    }
                }
            }

            // 等待一小段时间让动画效果更流畅
            await new Promise(resolve => setTimeout(resolve, 100));

        } while (hasMoved);
    }

    checkGameState() {
        // 获取当前关卡配置
        const levelConfig = window.levelManager.getLevel(this.currentLevel);
        
        // 检查是否达到目标分数
        if (this.score >= levelConfig.targetScore) {
            this.gameOver(true);
            return;
        }

        // 检查是否还有移动次数
        if (this.moves <= 0) {
            // 如果已经达到目标分数，仍然算作胜利
            if (this.score >= levelConfig.targetScore) {
                this.gameOver(true);
            } else {
                this.gameOver(false);
            }
            return;
        }

        // 检查时间限制（如果有）
        if (levelConfig.timeLimit > 0 && this.gameState.timeLeft <= 0) {
            // 如果已经达到目标分数，仍然算作胜利
            if (this.score >= levelConfig.targetScore) {
                this.gameOver(true);
            } else {
                this.gameOver(false);
            }
            return;
        }

        // 检查是否还有可能的移动
        if (!this.hasValidMoves()) {
            // 重新打乱游戏板，保持分数和移动次数不变
            this.reshuffleBoard();
        }
    }

    hasValidMoves() {
        // 检查每个位置
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                // 检查水平交换
                if (j < this.gridSize - 1) {
                    // 临时交换
                    const temp = this.board[i][j].type;
                    this.board[i][j].type = this.board[i][j + 1].type;
                    this.board[i][j + 1].type = temp;

                    // 检查是否有匹配
                    const hasMatch = this.findMatches().length > 0;

                    // 交换回来
                    this.board[i][j + 1].type = this.board[i][j].type;
                    this.board[i][j].type = temp;

                    if (hasMatch) {
                        console.log('找到可能的水平移动:', i, j);
                        return true;
                    }
                }
                
                // 检查垂直交换
                if (i < this.gridSize - 1) {
                    // 临时交换
                    const temp = this.board[i][j].type;
                    this.board[i][j].type = this.board[i + 1][j].type;
                    this.board[i + 1][j].type = temp;

                    // 检查是否有匹配
                    const hasMatch = this.findMatches().length > 0;

                    // 交换回来
                    this.board[i + 1][j].type = this.board[i][j].type;
                    this.board[i][j].type = temp;

                    if (hasMatch) {
                        console.log('找到可能的垂直移动:', i, j);
                        return true;
                    }
                }
            }
        }
        console.log('没有找到可能的移动');
        return false;
    }

    reshuffleBoard() {
        console.log('重新打乱游戏板...');
        
        // 保存当前分数和移动次数
        const currentScore = this.score;
        const currentMoves = this.moves;
        
        // 创建新的游戏板
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            // 重新初始化游戏板
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    this.board[i][j].type = this.getRandomCandyType();
                }
            }
            attempts++;
            
            // 如果尝试次数过多，调整糖果类型的分布
            if (attempts >= maxAttempts / 2) {
                console.log('调整糖果分布以增加匹配机会...');
            }
            
        } while ((!this.hasValidMoves() || this.findMatches().length > 0) && attempts < maxAttempts);
        
        // 如果maxAttempts次尝试后仍然没有找到有效的布局，强制生成一个有效的布局
        if (attempts >= maxAttempts) {
            console.log('达到最大尝试次数，强制生成有效布局...');
            this.forceValidBoard();
        }
        
        // 恢复分数和移动次数
        this.score = currentScore;
        this.moves = currentMoves;
        
        // 更新UI显示
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
        
        // 播放重新打乱的音效
        window.audioManager?.playSound('shuffle');
        
        console.log('游戏板已重新打乱，当前分数:', this.score, '剩余步数:', this.moves);
    }

    forceValidBoard() {
        // 强制生成一个有效的游戏板
        const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF'];
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                // 获取相邻的颜色
                const adjacentColors = new Set();
                if (i > 1 && this.board[i-1][j] && this.board[i-2][j]) {
                    if (this.board[i-1][j].type.color === this.board[i-2][j].type.color) {
                        adjacentColors.add(this.board[i-1][j].type.color);
                    }
                }
                if (j > 1 && this.board[i][j-1] && this.board[i][j-2]) {
                    if (this.board[i][j-1].type.color === this.board[i][j-2].type.color) {
                        adjacentColors.add(this.board[i][j-1].type.color);
                    }
                }

                // 选择一个不会形成匹配的颜色
                const availableColors = colors.filter(color => !adjacentColors.has(color));
                const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
                
                this.board[i][j].type = {
                    color: randomColor
                };
            }
        }
    }

    gameLoop() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景网格
        this.drawGrid();

        // 绘制所有糖果
        if (this.board.length > 0) {
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    const candy = this.board[i][j];
                    if (candy) {
                        // 计算实际位置
                        const x = j * this.tileSize;
                        const y = i * this.tileSize;

                        // 绘制糖果
                        this.ctx.fillStyle = candy.type.color;
                        this.ctx.beginPath();
                        this.ctx.roundRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8, 10);
                        this.ctx.fill();
                        
                        // 添加高光效果
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        this.ctx.beginPath();
                        this.ctx.ellipse(
                            x + this.tileSize / 3,
                            y + this.tileSize / 3,
                            this.tileSize / 8,
                            this.tileSize / 12,
                            -Math.PI / 4,
                            0,
                            2 * Math.PI
                        );
                        this.ctx.fill();

                        // 如果是选中的糖果，绘制高亮边框
                        if (this.selectedTile && 
                            this.selectedTile.x === j && 
                            this.selectedTile.y === i) {
                            this.ctx.strokeStyle = '#FFFFFF';
                            this.ctx.lineWidth = 4;
                            this.ctx.beginPath();
                            this.ctx.roundRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4, 10);
                            this.ctx.stroke();
                        }
                    }
                }
            }
        }

        // 继续游戏循环
        requestAnimationFrame(() => this.gameLoop());
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.canvas.width, i * this.tileSize);
            this.ctx.stroke();
        }
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.gameState.isPaused && this.gameState.isPlaying) {
                this.gameState.timeLeft--;
                document.getElementById('timer').textContent = this.gameState.timeLeft;
                
                if (this.gameState.timeLeft <= 0) {
                    clearInterval(this.timerInterval);
                    this.gameOver();
                }
            }
        }, 1000);
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }

    isAdjacent(tile1, tile2) {
        const dx = Math.abs(tile1.x - tile2.x);
        const dy = Math.abs(tile1.y - tile2.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    swapTiles(tile1, tile2) {
        if (!tile1 || !tile2) return;

        // 交换两个糖果的类型
        const tempType = tile1.type;
        tile1.type = tile2.type;
        tile2.type = tempType;

        // gameLoop 会自动处理重绘
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
                    candy2.type.color === candy3.type.color) {
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
                    candy2.type.color === candy3.type.color) {
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

    gameOver(isWin) {
        this.gameState.isPlaying = false;
        clearInterval(this.timerInterval);

        // 获取当前关卡配置
        const levelConfig = window.levelManager.getLevel(this.currentLevel);
        
        // 计算星级
        const stars = window.levelManager.calculateStars(this.currentLevel, this.score);
        
        // 更新UI
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('stars').textContent = '★'.repeat(stars);
        
        // 显示游戏结束菜单
        document.getElementById('gameUI').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.remove('hidden');
        
        // 根据胜负显示/隐藏"下一关"按钮
        const nextLevelButton = document.getElementById('nextLevelButton');
        if (isWin) {
            // 解锁下一关
            const currentUnlocked = parseInt(localStorage.getItem('unlockedLevels') || '1');
            if (this.currentLevel === currentUnlocked) {
                localStorage.setItem('unlockedLevels', (this.currentLevel + 1).toString());
            }
            nextLevelButton.style.display = 'block';
            window.audioManager?.playSound('level-complete');
        } else {
            nextLevelButton.style.display = 'none';
            window.audioManager?.playSound('game-over');
        }
    }

    nextLevel() {
        this.startGame(this.currentLevel + 1);
    }

    restartLevel() {
        this.startGame(this.currentLevel);
    }
}

// 创建全局游戏实例
window.game = new CandyCrushGame();

// 当文档加载完成后启动游戏
document.addEventListener('DOMContentLoaded', () => {
    const gameUI = document.getElementById('gameUI');
    const mainMenu = document.getElementById('mainMenu');
    const startButton = document.getElementById('startGame');
    
    startButton.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        gameUI.classList.remove('hidden');
        window.game.startGame(1);
    });
}); 