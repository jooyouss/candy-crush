class LevelManager {
    constructor() {
        this.levels = [
            // 第1关 - 教程关卡
            {
                targetScore: 1000,
                moves: 20,
                timeLimit: 0, // 0表示无时间限制
                gridSize: 6,
                specialCandyChance: 0.1,
                objectives: {
                    score: 1000
                }
            },
            // 第2关
            {
                targetScore: 2000,
                moves: 25,
                timeLimit: 0,
                gridSize: 7,
                specialCandyChance: 0.15,
                objectives: {
                    score: 2000,
                    redCandies: 10
                }
            },
            // 第3关
            {
                targetScore: 3000,
                moves: 30,
                timeLimit: 120,
                gridSize: 7,
                specialCandyChance: 0.2,
                objectives: {
                    score: 3000,
                    specialCandies: 5
                }
            },
            // 第4关
            {
                targetScore: 4000,
                moves: 25,
                timeLimit: 180,
                gridSize: 8,
                specialCandyChance: 0.2,
                objectives: {
                    score: 4000,
                    wrappedCandies: 3
                }
            },
            // 第5关
            {
                targetScore: 5000,
                moves: 30,
                timeLimit: 240,
                gridSize: 8,
                specialCandyChance: 0.25,
                objectives: {
                    score: 5000,
                    stripedCandies: 5,
                    bombCandies: 2
                }
            }
            // 可以继续添加更多关卡...
        ];
    }

    getLevel(levelNumber) {
        return this.levels[levelNumber - 1] || this.generateRandomLevel(levelNumber);
    }

    generateRandomLevel(levelNumber) {
        // 生成随机关卡配置
        const baseScore = 1000 * levelNumber;
        const baseMoves = 20 + Math.floor(levelNumber / 2) * 5;
        const baseTime = levelNumber > 5 ? 180 + (levelNumber - 5) * 30 : 0;

        return {
            targetScore: baseScore,
            moves: baseMoves,
            timeLimit: baseTime,
            gridSize: Math.min(8, 6 + Math.floor(levelNumber / 3)),
            specialCandyChance: Math.min(0.4, 0.1 + levelNumber * 0.03),
            objectives: {
                score: baseScore,
                specialCandies: Math.floor(levelNumber / 2),
                // 随机添加其他目标
                ...(Math.random() < 0.5 && {
                    redCandies: 5 + levelNumber * 2
                }),
                ...(Math.random() < 0.3 && {
                    wrappedCandies: Math.floor(levelNumber / 2)
                }),
                ...(Math.random() < 0.3 && {
                    stripedCandies: Math.floor(levelNumber / 2)
                })
            }
        };
    }

    isLevelComplete(level, gameState) {
        const objectives = this.getLevel(level).objectives;
        
        // 检查所有目标是否达成
        for (const [objective, target] of Object.entries(objectives)) {
            const current = gameState[objective] || 0;
            if (current < target) return false;
        }

        return true;
    }

    calculateStars(level, score) {
        const levelConfig = this.getLevel(level);
        const targetScore = levelConfig.targetScore;

        if (score >= targetScore * 1.5) return 3;
        if (score >= targetScore * 1.2) return 2;
        if (score >= targetScore) return 1;
        return 0;
    }
}

// 创建全局关卡管理器实例
window.levelManager = new LevelManager(); 