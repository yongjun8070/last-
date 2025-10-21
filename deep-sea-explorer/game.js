// 심해 탐험 게임
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 게임 상태
const game = {
    running: false,
    player: null,
    creatures: [],
    ruins: [],
    particles: [],
    discovered: new Set(),
    maxDepth: 0,
    lightOn: true,
    keys: {},
    camera: { x: 0, y: 0 }
};

// 깊이 존 정의
const ZONES = [
    { depth: 0, name: '표층 - Epipelagic Zone', color: '#0a7bc4' },
    { depth: 200, name: '중층 - Mesopelagic Zone', color: '#064273' },
    { depth: 1000, name: '심층 - Bathypelagic Zone', color: '#031633' },
    { depth: 4000, name: '심해층 - Abyssopelagic Zone', color: '#020a1a' },
    { depth: 6000, name: '초심해층 - Hadal Zone', color: '#000508' }
];

// 생물 타입 정의
const CREATURE_TYPES = {
    // 표층 (0-200m)
    fish: {
        minDepth: 0, maxDepth: 300, size: 20, color: '#FFD700', speed: 2,
        name: '물고기', pattern: 'normal', scary: false
    },
    jellyfish: {
        minDepth: 50, maxDepth: 400, size: 30, color: '#FF69B4', speed: 0.5,
        name: '해파리', pattern: 'floating', scary: false
    },
    turtle: {
        minDepth: 0, maxDepth: 250, size: 50, color: '#2E8B57', speed: 1,
        name: '바다거북', pattern: 'slow', scary: false
    },

    // 중층 (200-1000m)
    lanternfish: {
        minDepth: 200, maxDepth: 1200, size: 25, color: '#00FFFF', speed: 2.5,
        name: '초롱아귀', pattern: 'glow', scary: false
    },
    squid: {
        minDepth: 300, maxDepth: 1500, size: 60, color: '#FF4500', speed: 3,
        name: '오징어', pattern: 'tentacles', scary: true
    },
    hatchetfish: {
        minDepth: 200, maxDepth: 1000, size: 18, color: '#C0C0C0', speed: 2,
        name: '손도끼물고기', pattern: 'silver', scary: false
    },

    // 심층 (1000-4000m)
    anglerfish: {
        minDepth: 1000, maxDepth: 4500, size: 70, color: '#8B4513', speed: 1,
        name: '아귀', pattern: 'predator', scary: true
    },
    viperfish: {
        minDepth: 1000, maxDepth: 4000, size: 55, color: '#4B0082', speed: 3.5,
        name: '바이퍼피쉬', pattern: 'fangs', scary: true
    },
    gulpereel: {
        minDepth: 1500, maxDepth: 5000, size: 90, color: '#2F4F4F', speed: 1.5,
        name: '주머니장어', pattern: 'eel', scary: true
    },

    // 심해층 (4000-6000m)
    giantisopod: {
        minDepth: 4000, maxDepth: 7000, size: 80, color: '#696969', speed: 0.8,
        name: '대왕심해등각류', pattern: 'crawler', scary: true
    },
    vampiresquid: {
        minDepth: 4000, maxDepth: 6500, size: 100, color: '#8B0000', speed: 2,
        name: '뱀파이어오징어', pattern: 'vampire', scary: true
    },
    spiderfish: {
        minDepth: 4500, maxDepth: 7000, size: 75, color: '#483D8B', speed: 2.5,
        name: '거미물고기', pattern: 'spider', scary: true
    },

    // 초심해층 (6000m+)
    abyssalserpent: {
        minDepth: 6000, maxDepth: 10000, size: 200, color: '#000000', speed: 1.5,
        name: '심연의 뱀', pattern: 'serpent', scary: true
    },
    leviathan: {
        minDepth: 7000, maxDepth: 12000, size: 400, color: '#0F0F0F', speed: 1,
        name: '리바이어던', pattern: 'leviathan', scary: true
    },
    elderthing: {
        minDepth: 8000, maxDepth: 15000, size: 500, color: '#1C1C1C', speed: 0.5,
        name: '고대의 존재', pattern: 'eldritch', scary: true
    }
};

// 플레이어 클래스
class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = 100;
        this.width = 60;
        this.height = 40;
        this.vx = 0;
        this.vy = 0;
        this.depth = 0;
        this.oxygen = 100;
        this.light = 100;
        this.maxSpeed = 5;
    }

    update() {
        // 키 입력 처리
        if (game.keys['ArrowLeft'] || game.keys['a']) this.vx -= 0.5;
        if (game.keys['ArrowRight'] || game.keys['d']) this.vx += 0.5;
        if (game.keys['ArrowUp'] || game.keys['w']) this.vy -= 0.3;
        if (game.keys['ArrowDown'] || game.keys['s']) this.vy += 0.3;

        // 속도 제한
        this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));
        this.vy = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vy));

        // 마찰
        this.vx *= 0.95;
        this.vy *= 0.95;

        // 위치 업데이트
        this.x += this.vx;
        this.y += this.vy;

        // 화면 경계
        this.x = Math.max(this.width, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(50, this.y);

        // 깊이 계산
        this.depth = Math.max(0, this.y - 100);
        game.maxDepth = Math.max(game.maxDepth, this.depth);

        // 수면으로 귀환 (ESC)
        if (game.keys['Escape']) {
            this.y = Math.max(50, this.y - 5);
        }

        // 자원 소모
        if (this.depth > 0) {
            this.oxygen -= 0.01;
            if (game.lightOn) {
                this.light -= 0.05;
            }
        }

        // 수면에서 자원 회복
        if (this.depth < 50) {
            this.oxygen = Math.min(100, this.oxygen + 0.5);
            this.light = Math.min(100, this.light + 0.3);
        }

        // 게임 오버
        if (this.oxygen <= 0) {
            gameOver('산소 부족!');
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 잠수정 본체
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 창문
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(-10, -5, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -5, 12, 0, Math.PI * 2);
        ctx.fill();

        // 창문 반사
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-12, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -8, 5, 0, Math.PI * 2);
        ctx.fill();

        // 조명
        if (game.lightOn && this.light > 0) {
            const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 300, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // 기포 생성
        if (Math.random() < 0.3) {
            game.particles.push(new Bubble(this.x, this.y + 20));
        }
    }
}

// 생물 클래스
class Creature {
    constructor(type, depth) {
        this.type = type;
        this.data = CREATURE_TYPES[type];
        this.x = Math.random() * canvas.width;
        this.y = depth + (Math.random() - 0.5) * 200;
        this.z = Math.random() * 500; // 깊이감
        this.vx = (Math.random() - 0.5) * this.data.speed;
        this.vy = (Math.random() - 0.5) * this.data.speed * 0.5;
        this.angle = Math.random() * Math.PI * 2;
        this.phase = Math.random() * Math.PI * 2;
        this.discovered = false;
    }

    update() {
        // 이동
        this.x += this.vx;
        this.y += this.vy + Math.sin(this.phase) * 0.5;
        this.phase += 0.05;

        // 화면 밖으로 나가면 반대편으로
        if (this.x < -100) this.x = canvas.width + 100;
        if (this.x > canvas.width + 100) this.x = -100;

        // 플레이어와의 거리 체크
        const dx = this.x - game.player.x;
        const dy = this.y - game.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 발견
        if (dist < 200 && !this.discovered) {
            this.discovered = true;
            game.discovered.add(this.type);
        }

        // 큰 생물은 플레이어를 쫓아옴
        if (this.data.size > 150 && dist < 400) {
            this.vx += (game.player.x - this.x) * 0.001;
            this.vy += (game.player.y - this.y) * 0.001;
        }

        // 속도 제한
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.data.speed) {
            this.vx = (this.vx / speed) * this.data.speed;
            this.vy = (this.vy / speed) * this.data.speed;
        }
    }

    draw() {
        // 3D 원근 효과
        const scale = 1 - this.z / 1000;
        const size = this.data.size * scale;
        const alpha = scale;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);

        // 방향
        if (this.vx < 0) {
            ctx.scale(-1, 1);
        }

        // 패턴별 그리기
        switch (this.data.pattern) {
            case 'normal':
                this.drawFish(size);
                break;
            case 'floating':
                this.drawJellyfish(size);
                break;
            case 'glow':
                this.drawGlowingFish(size);
                break;
            case 'tentacles':
            case 'vampire':
                this.drawSquid(size);
                break;
            case 'predator':
            case 'fangs':
                this.drawPredator(size);
                break;
            case 'eel':
                this.drawEel(size);
                break;
            case 'serpent':
                this.drawSerpent(size);
                break;
            case 'leviathan':
                this.drawLeviathan(size);
                break;
            case 'eldritch':
                this.drawEldritchHorror(size);
                break;
            default:
                this.drawFish(size);
        }

        ctx.restore();
    }

    drawFish(size) {
        ctx.fillStyle = this.data.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 꼬리
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(-size * 1.5, -size * 0.5);
        ctx.lineTo(-size * 1.5, size * 0.5);
        ctx.closePath();
        ctx.fill();
    }

    drawJellyfish(size) {
        ctx.fillStyle = this.data.color;
        ctx.globalAlpha = 0.6;

        // 머리
        ctx.beginPath();
        ctx.arc(0, 0, size, Math.PI, 0);
        ctx.fill();

        // 촉수
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(-size + i * (size / 4), 0);
            const wave = Math.sin(this.phase + i) * 10;
            ctx.quadraticCurveTo(
                -size + i * (size / 4) + wave,
                size,
                -size + i * (size / 4),
                size * 2
            );
            ctx.strokeStyle = this.data.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    drawGlowingFish(size) {
        // 발광 효과
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
        gradient.addColorStop(0, this.data.color);
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
        ctx.fill();

        this.drawFish(size);
    }

    drawSquid(size) {
        ctx.fillStyle = this.data.color;

        // 몸통
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 촉수
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            const angle = (i / 10) * Math.PI * 2;
            const wave = Math.sin(this.phase + i) * 20;
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle) * (size * 2 + wave),
                Math.sin(angle) * (size * 2 + wave) + size
            );
            ctx.strokeStyle = this.data.color;
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    }

    drawPredator(size) {
        ctx.fillStyle = this.data.color;

        // 몸
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 날카로운 이빨
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(size * 0.5 - i * 5, -size * 0.3);
            ctx.lineTo(size * 0.5 - i * 5, size * 0.3);
            ctx.lineTo(size * 0.7 - i * 5, 0);
            ctx.closePath();
            ctx.fill();
        }

        // 발광 미끼 (아귀)
        if (this.data.name === '아귀') {
            const gradient = ctx.createRadialGradient(size, -size * 0.8, 0, size, -size * 0.8, 20);
            gradient.addColorStop(0, '#FFFF00');
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(size, -size * 0.8, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawEel(size) {
        ctx.strokeStyle = this.data.color;
        ctx.lineWidth = size * 0.4;
        ctx.beginPath();

        for (let i = 0; i < 10; i++) {
            const x = i * (size / 5);
            const y = Math.sin(this.phase + i * 0.5) * size * 0.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.stroke();

        // 거대한 입
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(size * 2, 0, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSerpent(size) {
        ctx.strokeStyle = this.data.color;
        ctx.lineWidth = size * 0.3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FF0000';

        ctx.beginPath();
        for (let i = 0; i < 20; i++) {
            const x = i * (size / 10);
            const y = Math.sin(this.phase + i * 0.3) * size * 0.3;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 빛나는 눈
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(size * 1.8, -10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 1.8, 10, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawLeviathan(size) {
        ctx.fillStyle = this.data.color;
        ctx.shadowBlur = 50;
        ctx.shadowColor = this.data.color;

        // 거대한 몸체
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 지느러미
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.6 - i * 30);
            ctx.lineTo(-size * 0.5, -size - i * 30);
            ctx.lineTo(size * 0.5, -size - i * 30);
            ctx.closePath();
            ctx.fill();
        }

        // 무시무시한 입
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(size * 0.7, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawEldritchHorror(size) {
        ctx.shadowBlur = 80;
        ctx.shadowColor = '#9400D3';

        // 불가사의한 형태
        ctx.fillStyle = this.data.color;
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2 + this.phase;
            const radius = size * (0.8 + Math.sin(this.phase * 3 + i) * 0.2);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // 여러 개의 빛나는 눈
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x = Math.cos(angle) * size * 0.6;
            const y = Math.sin(angle) * size * 0.6;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
            gradient.addColorStop(0, '#FF00FF');
            gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // 촉수
        for (let i = 0; i < 20; i++) {
            ctx.strokeStyle = this.data.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            const angle = (i / 20) * Math.PI * 2;
            const wave = Math.sin(this.phase + i * 0.5) * 50;
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                Math.cos(angle) * size * 2,
                Math.sin(angle) * size * 2 + wave,
                Math.cos(angle) * size * 3,
                Math.sin(angle) * size * 3
            );
            ctx.stroke();
        }
    }
}

// 유적 클래스
class Ruin {
    constructor(y) {
        this.x = Math.random() * canvas.width;
        this.y = y;
        this.type = Math.random() < 0.5 ? 'pillar' : 'statue';
        this.size = 100 + Math.random() * 200;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#4A4A4A';
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00FFFF';

        if (this.type === 'pillar') {
            // 기둥
            ctx.fillRect(this.x - 20, this.y - this.size, 40, this.size);
            ctx.strokeRect(this.x - 20, this.y - this.size, 40, this.size);

            // 상단 장식
            ctx.fillRect(this.x - 30, this.y - this.size - 20, 60, 20);
            ctx.strokeRect(this.x - 30, this.y - this.size - 20, 60, 20);
        } else {
            // 석상
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size);
            ctx.lineTo(this.x - this.size / 3, this.y - this.size / 2);
            ctx.lineTo(this.x - this.size / 4, this.y);
            ctx.lineTo(this.x + this.size / 4, this.y);
            ctx.lineTo(this.x + this.size / 3, this.y - this.size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 눈
            ctx.fillStyle = '#00FFFF';
            ctx.beginPath();
            ctx.arc(this.x - 15, this.y - this.size * 0.7, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y - this.size * 0.7, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// 파티클 클래스 (기포)
class Bubble {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y;
        this.radius = 2 + Math.random() * 5;
        this.vy = -1 - Math.random() * 2;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.life = 100;
    }

    update() {
        this.y += this.vy;
        this.x += this.vx;
        this.life--;
        return this.life > 0 && this.y > 0;
    }

    draw() {
        ctx.globalAlpha = this.life / 100;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// 생물 생성
function spawnCreatures() {
    const playerDepth = game.player.depth;

    // 현재 깊이 근처의 생물 생성
    for (const [type, data] of Object.entries(CREATURE_TYPES)) {
        if (playerDepth >= data.minDepth - 200 && playerDepth <= data.maxDepth + 200) {
            // 해당 타입의 생물이 충분하지 않으면 생성
            const count = game.creatures.filter(c => c.type === type).length;
            if (count < 3 && Math.random() < 0.02) {
                game.creatures.push(new Creature(type, game.player.y));
            }
        }
    }

    // 너무 멀리 떨어진 생물 제거
    game.creatures = game.creatures.filter(c =>
        Math.abs(c.y - game.player.y) < 1000
    );
}

// 유적 생성
function spawnRuins() {
    const playerDepth = game.player.depth;

    // 깊은 곳에만 유적 생성
    if (playerDepth > 5000) {
        const count = game.ruins.filter(r =>
            Math.abs(r.y - game.player.y) < 500
        ).length;

        if (count < 2 && Math.random() < 0.005) {
            game.ruins.push(new Ruin(game.player.y + 400));
        }
    }

    // 너무 멀리 떨어진 유적 제거
    game.ruins = game.ruins.filter(r =>
        Math.abs(r.y - game.player.y) < 1000
    );
}

// 배경 그리기
function drawBackground() {
    const depth = game.player.depth;

    // 깊이에 따른 색상
    let zone = ZONES[0];
    for (const z of ZONES) {
        if (depth >= z.depth) zone = z;
    }

    // 그라디언트 배경
    const nextZone = ZONES[ZONES.findIndex(z => z === zone) + 1];
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, zone.color);
    gradient.addColorStop(1, nextZone ? nextZone.color : zone.color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 수면 (플레이어가 얕은 곳에 있을 때)
    if (game.player.y < canvas.height / 2) {
        const surfaceY = 100 - game.player.y + game.player.y;
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, Math.max(0, surfaceY));

        // 수면 파도
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
            const y = surfaceY + Math.sin(x * 0.05 + Date.now() * 0.001) * 5;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // 깊이에 따른 어둠
    const darkness = Math.min(0.9, depth / 10000);
    ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 해양 눈 (Marine snow)
    if (depth > 200) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = (Math.random() * canvas.height + Date.now() * 0.02) % canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// HUD 업데이트
function updateHUD() {
    document.getElementById('depth').textContent = Math.floor(game.player.depth) + 'm';
    document.getElementById('pressure').textContent =
        (1 + game.player.depth / 1000).toFixed(1) + ' atm';

    document.getElementById('oxygen-bar').style.width = game.player.oxygen + '%';
    document.getElementById('light-bar').style.width = game.player.light + '%';

    // 현재 존 표시
    let zone = ZONES[0];
    for (const z of ZONES) {
        if (game.player.depth >= z.depth) zone = z;
    }
    document.getElementById('zone-indicator').textContent = zone.name;

    // 발견한 생물 수
    document.getElementById('creature-count').textContent = game.discovered.size;
}

// 게임 루프
function gameLoop() {
    if (!game.running) return;

    // 배경 그리기
    drawBackground();

    // 유적 그리기
    game.ruins.forEach(ruin => ruin.draw());

    // 생물 업데이트 및 그리기
    game.creatures.forEach(creature => {
        creature.update();
        creature.draw();
    });

    // 파티클 업데이트 및 그리기
    game.particles = game.particles.filter(p => {
        const alive = p.update();
        if (alive) p.draw();
        return alive;
    });

    // 플레이어 업데이트 및 그리기
    game.player.update();
    game.player.draw();

    // 생물 및 유적 생성
    spawnCreatures();
    spawnRuins();

    // HUD 업데이트
    updateHUD();

    requestAnimationFrame(gameLoop);
}

// 게임 시작
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    game.running = true;
    game.player = new Player();
    game.creatures = [];
    game.ruins = [];
    game.particles = [];
    game.discovered = new Set();
    game.maxDepth = 0;

    gameLoop();
}

// 게임 오버
function gameOver(reason) {
    game.running = false;
    document.getElementById('gameover-title').textContent = reason;
    document.getElementById('max-depth').textContent = Math.floor(game.maxDepth);
    document.getElementById('final-creature-count').textContent = game.discovered.size;
    document.getElementById('gameover-screen').classList.remove('hidden');
}

// 키 입력 처리
window.addEventListener('keydown', (e) => {
    game.keys[e.key] = true;

    // 조명 토글
    if (e.key === ' ') {
        e.preventDefault();
        game.lightOn = !game.lightOn;
    }
});

window.addEventListener('keyup', (e) => {
    game.keys[e.key] = false;
});

// 버튼 이벤트
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('gameover-screen').classList.add('hidden');
    startGame();
});

// 초기 배경 그리기
drawBackground();
