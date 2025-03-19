class CandyType {
    constructor(color) {
        this.color = color;
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

        // 加载糖果图片
        this.images = {};
        this.loadImages();
    }

    loadImages() {
        const imageFiles = {
            'red': 'assets/images/candy-red.svg',
            'green': 'assets/images/candy-green.svg',
            'blue': 'assets/images/candy-blue.svg',
            'yellow': 'assets/images/candy-yellow.svg',
            'purple': 'assets/images/candy-purple.svg',
            'cyan': 'assets/images/candy-cyan.svg'
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

    drawCandy(ctx, candy, x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size * 0.4;

        // 绘制基础糖果
        ctx.fillStyle = candy.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // 添加高光效果
        const gradient = ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            radius * 0.1,
            centerX,
            centerY,
            radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 创建全局糖果管理器实例
window.candyManager = new CandyManager(); 