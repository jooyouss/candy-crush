class AnimationManager {
    constructor() {
        this.animations = new Set();
        this.particleSystems = new Set();
    }

    animate(object, properties, duration, easing = 'linear') {
        const animation = {
            object,
            properties,
            startTime: performance.now(),
            duration,
            easing,
            initialValues: {},
            isComplete: false
        };

        // 记录初始值
        for (const prop in properties) {
            animation.initialValues[prop] = object[prop];
        }

        this.animations.add(animation);
        return new Promise(resolve => {
            animation.resolve = resolve;
        });
    }

    createParticleSystem(x, y, color, count = 10) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x,
                y,
                color,
                velocity: {
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 10
                },
                life: 1,
                size: Math.random() * 5 + 2
            });
        }

        const particleSystem = {
            particles,
            isComplete: false
        };

        this.particleSystems.add(particleSystem);
    }

    update(ctx) {
        const currentTime = performance.now();

        // 更新动画
        for (const animation of this.animations) {
            if (animation.isComplete) continue;

            const progress = Math.min((currentTime - animation.startTime) / animation.duration, 1);
            const easedProgress = this.getEasedProgress(progress, animation.easing);

            for (const prop in animation.properties) {
                const start = animation.initialValues[prop];
                const end = animation.properties[prop];
                animation.object[prop] = start + (end - start) * easedProgress;
            }

            if (progress >= 1) {
                animation.isComplete = true;
                animation.resolve();
            }
        }

        // 清理完成的动画
        this.animations = new Set([...this.animations].filter(a => !a.isComplete));

        // 更新粒子系统
        for (const system of this.particleSystems) {
            for (const particle of system.particles) {
                particle.x += particle.velocity.x;
                particle.y += particle.velocity.y;
                particle.velocity.y += 0.2; // 重力
                particle.life -= 0.02;
                particle.size *= 0.95;

                // 绘制粒子
                if (particle.life > 0) {
                    ctx.fillStyle = particle.color;
                    ctx.globalAlpha = particle.life;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // 检查粒子系统是否完成
            system.isComplete = system.particles.every(p => p.life <= 0);
        }

        // 清理完成的粒子系统
        this.particleSystems = new Set([...this.particleSystems].filter(s => !s.isComplete));

        ctx.globalAlpha = 1;
    }

    getEasedProgress(progress, easing) {
        switch (easing) {
            case 'easeOutBounce':
                if (progress < 1 / 2.75) {
                    return 7.5625 * progress * progress;
                } else if (progress < 2 / 2.75) {
                    const t = progress - 1.5 / 2.75;
                    return 7.5625 * t * t + 0.75;
                } else if (progress < 2.5 / 2.75) {
                    const t = progress - 2.25 / 2.75;
                    return 7.5625 * t * t + 0.9375;
                } else {
                    const t = progress - 2.625 / 2.75;
                    return 7.5625 * t * t + 0.984375;
                }
            case 'easeOutElastic':
                if (progress === 0 || progress === 1) return progress;
                return Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
            case 'easeOutBack':
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
            default: // linear
                return progress;
        }
    }
}

// 创建全局动画管理器实例
window.animationManager = new AnimationManager(); 