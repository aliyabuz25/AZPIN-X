export class SnowEffect {
    constructor() {
        this.canvas = document.getElementById('snow-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.flakes = [];
        this.resize();

        window.addEventListener('resize', () => this.resize());
        this.init();
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    init() {
        const flakeCount = 100;
        for (let i = 0; i < flakeCount; i++) {
            this.flakes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 3 + 1,
                density: Math.random() * flakeCount,
                speed: Math.random() * 1 + 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();

        for (let i = 0; i < this.flakes.length; i++) {
            const f = this.flakes[i];
            this.ctx.moveTo(f.x, f.y);
            this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2, true);
        }
        this.ctx.fill();
        this.update();
    }

    update() {
        for (let i = 0; i < this.flakes.length; i++) {
            const f = this.flakes[i];
            f.y += f.speed;
            f.x += Math.sin(f.y / 30) * 0.5;

            if (f.y > this.height) {
                this.flakes[i] = {
                    x: Math.random() * this.width,
                    y: -10,
                    radius: f.radius,
                    density: f.density,
                    speed: f.speed,
                    opacity: f.opacity
                };
            }
        }
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

export const initSnow = () => {
    new SnowEffect();
};
