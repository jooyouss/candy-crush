class CandyType {
    constructor(color, special = false, points = 10) {
        this.color = color;
        this.special = special;
        this.points = points;
    }
}

class CandyManager {
    constructor() {
        // 基础糖果类型
        this.basicTypes = {
            red: new CandyType('#ff0000'),
            green: new CandyType('#00ff00'),
            blue: new CandyType('#0000ff'),
            yellow: new CandyType('#ffff00'),
            purple: new CandyType('#ff00ff'),
            cyan: new CandyType('#00ffff')
        };

        // 特殊糖果类型
        this.specialTypes = {
            striped: {
                horizontal: (color) => new CandyType(color, 'striped-h', 30),
                vertical: (color) => new CandyType(color, 'striped-v', 30)
            },
            wrapped: (color) => new CandyType(color, 'wrapped', 60),
            bomb: (color) => new CandyType(color, 'bomb', 100),
            rainbow: new CandyType('#ffffff', 'rainbow', 200)
        };

        // 加载糖果图片
        this.images = {};
        this.loadImages();
    }

    loadImages() {
        const imageFiles = {
            'red': 'assets/images/candy-red.png',
            'green': 'assets/images/candy-green.png',
            'blue': 'assets/images/candy-blue.png',
            'yellow': 'assets/images/candy-yellow.png',
            'purple': 'assets/images/candy-purple.png',
            'cyan': 'assets/images/candy-cyan.png',
            'striped-h': 'assets/images/candy-striped-h.png',
            'striped-v': 'assets/images/candy-striped-v.png',
            'wrapped': 'assets/images/candy-wrapped.png',
            'bomb': 'assets/images/candy-bomb.png',
            'rainbow': 'assets/images/candy-rainbow.png'
        };

        for (const [name, path] of Object.entries(imageFiles)) {
            const img = new Image();
            img.src = path;
            this.images[name] = img;
        }
    }

    getRandomBasicType() {
        const types = Object.values(this.basicTypes);
        return types[Math.floor(Math.random() * types.length)];
    }

    createSpecialCandy(matchLength, color, direction = null) {
        if (matchLength >= 5) {
            return this.specialTypes.bomb(color);
        } else if (matchLength === 4) {
            return this.specialTypes.striped[direction || (Math.random() < 0.5 ? 'horizontal' : 'vertical')](color);
        } else if (matchLength === 3 && Math.random() < 0.1) { // 10%概率创建包装糖果
            return this.specialTypes.wrapped(color);
        }
        return null;
    }

    drawCandy(ctx, candy, x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size * 0.4;

        // 绘制基础糖果
        ctx.fillStyle = candy.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // 绘制特殊效果
        if (candy.special) {
            switch (candy.special) {
                case 'striped-h':
                    this.drawStripedEffect(ctx, x, y, size, true);
                    break;
                case 'striped-v':
                    this.drawStripedEffect(ctx, x, y, size, false);
                    break;
                case 'wrapped':
                    this.drawWrappedEffect(ctx, centerX, centerY, radius);
                    break;
                case 'bomb':
                    this.drawBombEffect(ctx, centerX, centerY, radius);
                    break;
                case 'rainbow':
                    this.drawRainbowEffect(ctx, centerX, centerY, radius);
                    break;
            }
        }
    }

    drawStripedEffect(ctx, x, y, size, horizontal) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        const gap = 6;
        const count = Math.floor(size / gap);

        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            if (horizontal) {
                const yPos = y + i * gap;
                ctx.moveTo(x, yPos);
                ctx.lineTo(x + size, yPos);
            } else {
                const xPos = x + i * gap;
                ctx.moveTo(xPos, y);
                ctx.lineTo(xPos, y + size);
            }
        }
        ctx.stroke();
    }

    drawWrappedEffect(ctx, x, y, radius) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        
        // 绘制外圈
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2);
        ctx.stroke();

        // 绘制内圈
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawBombEffect(ctx, x, y, radius) {
        // 绘制炸弹效果
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRainbowEffect(ctx, x, y, radius) {
        // 创建彩虹渐变
        const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.2, '#ffff00');
        gradient.addColorStop(0.4, '#00ff00');
        gradient.addColorStop(0.6, '#00ffff');
        gradient.addColorStop(0.8, '#0000ff');
        gradient.addColorStop(1, '#ff00ff');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 创建全局糖果管理器实例
window.candyManager = new CandyManager(); 