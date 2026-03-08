import { Boss } from './Boss.js';
import { Enemy } from './BaseEnemy.js';
import { AetherSentinel } from './AetherSentinel.js';
import { getCachedImage } from '../utils.js';
import { spawnProjectile, spawnExplosion } from '../skills/common.js';

class AetherDrone extends Enemy {
    constructor(game, owner, index) {
        // Essential stats for Enemy constructor to avoid NaN
        const droneHp = 150;
        const droneSpeed = 0;
        super(game, 0, 0, 24, 24, '#00ffff', droneHp, droneSpeed, null, 0);
        this.width = 24;
        this.height = 24;
        this.isSpawning = false; // Bypass invulnerability

        this.owner = owner;
        this.index = index;
        this.image = owner.bitImage;
        this.isDrone = true;
        this.isBoss = false;
        this.canDrop = false; // Drones should not drop items
        this.currentAngleForDraw = 0; // Initialize to avoid NaN in draw
    }

    update(dt) {
        if (!this.owner || this.owner.markedForDeletion) {
            this.markedForDeletion = true;
            return;
        }
        // Handle invulnerable timer decay
        super.update(dt);
    }

    draw(ctx) {
        // Managed by AetherPrime for better layering
    }

    takeDamage(amount, color, aether, crit, kx, ky, kd, silent, source) {
        // Pass to standard behavior without knockback
        const res = super.takeDamage(amount, color, aether, crit, 0, 0, kd, silent, source);
        if (this.hp <= 0) {
            spawnExplosion(this.game, this.x + this.width / 2, this.y + this.height / 2, '#00ffff', 0.5);
        }
        return res;
    }
}

export class AetherPrime extends Boss {
    constructor(game, x, y) {
        super(game, x, y);
        this.width = 120;
        this.height = 120;
        this.hp = 5000;
        this.maxHp = 5000;
        this.speed = 15;
        this.displayName = "AETHER PRIME";
        this.score = 5000;

        this.floatPhase = 0;
        this.bitCount = 6;
        this.shieldAngle = 0;
        this.shieldRotationSpeed = 1.0;
        this.isOmniShield = true;

        this.attackCooldown = 5.0;
        this.phase = 1;
        this.stunTimer = 0;
        this.droneEntities = [];

        this.image = getCachedImage('assets/enemies/aether_prime/aether_prime.png');
        this.bitImage = getCachedImage('assets/enemies/aether_prime_drone.png');

        this.spawnDrones();
    }

    spawnDrones() {
        // Clean up any existing drone references safely
        if (this.droneEntities) {
            this.droneEntities.forEach(d => {
                if (d) d.markedForDeletion = true;
            });
        }
        this.droneEntities = [];

        for (let i = 0; i < this.bitCount; i++) {
            const drone = new AetherDrone(this.game, this, i);
            if (this.game && this.game.enemies) {
                this.game.enemies.push(drone);
            }
            this.droneEntities.push(drone);
        }
    }

    update(dt) {
        if (this.isSpawning) {
            super.update(dt);
            return;
        }

        // Stun Logic
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            this.vx = 0;
            this.vy = 0;
            this.isOmniShield = false;
            this.floatPhase += dt * 0.5;

            if (this.stunTimer <= 0) {
                this.stunTimer = 0;
                this.isOmniShield = true;
                this.spawnDrones();
                if (this.game && this.game.logToScreen) {
                    this.game.logToScreen("AETHER PRIME RECOVERED!");
                }
            }
            return;
        }

        // Shield status check
        const aliveDrones = this.droneEntities.filter(d => d && !d.markedForDeletion);
        if (aliveDrones.length === 0 && this.stunTimer <= 0) {
            this.stunTimer = 15.0;
            if (this.game) {
                if (this.game.logToScreen) this.game.logToScreen("SHIELD DOWN! AETHER PRIME STUNNED!");
                if (this.game.camera) this.game.camera.shake(0.3, 10);
            }
            return;
        }
        this.isOmniShield = aliveDrones.length > 0;

        // Phase Transition
        if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
            this.phase = 2;
            this.bitCount = 8;
            this.shieldRotationSpeed = 2.0;
            if (this.game) {
                if (this.game.camera) this.game.camera.shake(0.5, 15);
                if (this.game.logToScreen) this.game.logToScreen("AETHER PRIME OVERLOADED!");
                if (this.game.spawnParticles) {
                    this.game.spawnParticles(this.x + this.width / 2, this.y + this.height / 2, 50, '#00ffff');
                }
            }
            this.spawnDrones();
        }

        // Movement (Safety check for player)
        if (this.game && this.game.player) {
            const dx = this.game.player.x - this.x;
            const dy = this.game.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 150) {
                this.vx += (dx / dist) * this.speed * dt;
                this.vy += (dy / dist) * this.speed * dt;
            } else if (dist < 100 && dist > 0) {
                this.vx -= (dx / dist) * this.speed * dt;
                this.vy -= (dy / dist) * this.speed * dt;
            }
        }

        // Safety: NaN guard for velocity
        if (isNaN(this.vx)) this.vx = 0;
        if (isNaN(this.vy)) this.vy = 0;
        this.vx *= 0.95;
        this.vy *= 0.95;

        this.floatPhase += dt * 2.0;
        this.shieldAngle += this.shieldRotationSpeed * dt;

        // Update Drones Swarm
        const time = Date.now() / 1000;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        this.droneEntities.forEach((d, i) => {
            if (!d || d.markedForDeletion) return;

            // Normal Orbit Logic (always maintain during attack now)
            const orbitDist = 80 + Math.sin(time * 1.2 + i) * 10;
            const angle = time * 0.5 * (1 + (i % 2 === 0 ? 0.2 : -0.2)) + (i / this.bitCount) * Math.PI * 2;
            const floatX = Math.sin(time * 2.1 + i) * 15;
            const floatY = Math.cos(time * 1.7 + i) * 15;

            const targetX = cx + Math.cos(angle) * orbitDist + floatX - d.width / 2;
            const targetY = cy + Math.sin(angle) * orbitDist + floatY - d.height / 2;

            d.x = targetX;
            d.y = targetY;

            // Direction Logic
            if (this.isTelegraphing && this.currentAttack === 'syncShot') {
                // Aim at player during telegraph
                d.currentAngleForDraw = Math.atan2(this.game.player.y - (d.y + d.height / 2), this.game.player.x - (d.x + d.width / 2));
            } else {
                // Face movement direction
                d.currentAngleForDraw = angle;
            }
        });

        // Sync Shot Charging VFX
        if (this.isTelegraphing && this.currentAttack === 'syncShot' && this.game) {
            this.droneEntities.forEach((d, i) => {
                if (!d || d.markedForDeletion) return;
                if (Math.random() < 0.2) {
                    const dcx = d.x + d.width / 2;
                    const dcy = d.y + d.height / 2;
                    this.game.spawnParticles(dcx, dcy, 1, '#00ffff', (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, { size: 2 });
                }
            });
        }

        // Beam Charging VFX
        if (this.isTelegraphing && this.currentAttack === 'beam' && this.game) {
            const chargeProgress = 1.0 - (this.telegraphTimer / 1.5);
            if (Math.random() < 0.3 + chargeProgress * 0.4) {
                const angle = Math.random() * Math.PI * 2;
                const d = 60 + Math.random() * 60;
                this.game.animations.push({
                    type: 'particle',
                    x: cx + Math.cos(angle) * d,
                    y: cy + Math.sin(angle) * d,
                    targetX: cx, targetY: cy,
                    life: 0.4, maxLife: 0.4,
                    color: '#00ffff',
                    speed: 5 + chargeProgress * 10,
                    update: function (dt) {
                        this.life -= dt;
                        const dx = this.targetX - this.x;
                        const dy = this.targetY - this.y;
                        this.x += dx * this.speed * dt;
                        this.y += dy * this.speed * dt;
                    },
                    draw: function (ctx) {
                        ctx.fillStyle = this.color;
                        ctx.globalAlpha = this.life / this.maxLife;
                        ctx.fillRect(this.x, this.y, 3, 3);
                    }
                });
            }
        }

        super.update(dt);
    }

    decideAttack() {
        if (this.stunTimer > 0) return;

        let picked = 'summon';
        const r = Math.random();
        if (this.phase === 1) {
            if (r < 0.4) picked = 'summon';
            else if (r < 0.7) picked = 'syncShot';
            else picked = 'beam';
        } else {
            if (r < 0.2) picked = 'summon';
            else if (r < 0.5) picked = 'nova';
            else if (r < 0.8) picked = 'syncShot';
            else picked = 'beam';
        }

        this.currentAttack = picked;
        if (picked === 'beam') {
            this.beamTargetAngle = null;
            this.startTelegraph(1.5);
        } else if (picked === 'nova') {
            this.startTelegraph(1.2);
        } else if (picked === 'syncShot') {
            this.startTelegraph(1.5);
        } else {
            this.executeAttack();
        }
        this.attackCooldown = 1.0;
    }

    executeAttack() {
        if (this.stunTimer > 0) return;

        if (this.currentAttack === 'beam') this.attackBeam();
        else if (this.currentAttack === 'nova') this.attackNova();
        else if (this.currentAttack === 'summon') this.attackSummon();
        else if (this.currentAttack === 'syncShot') this.attackSyncShot();

        this.attackCooldown = this.phase === 1 ? (6.0 + Math.random() * 2) : (4.0 + Math.random() * 2);
    }

    attackSyncShot() {
        if (!this.game || !this.game.player) return;
        this.droneEntities.forEach(d => {
            if (!d || d.markedForDeletion) return;
            const dcx = d.x + d.width / 2;
            const dcy = d.y + d.height / 2;
            const angle = Math.atan2(this.game.player.y - dcy, this.game.player.x - dcx);
            this.spawnOrb(dcx, dcy, angle, { speed: 450, size: 30, color: '#00ffff', damage: 15, isBeam: true });
        });
    }

    attackNova() {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        for (let i = 0; i < 12; i++) {
            this.spawnOrb(cx, cy, (i / 12) * Math.PI * 2);
        }
    }

    attackBeam() {
        if (!this.game || !this.game.player) return;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const targetAngle = this.beamTargetAngle !== null ? this.beamTargetAngle : Math.atan2(this.game.player.y - cy, this.game.player.x - cx);
        const beamLength = 800;
        const x2 = cx + Math.cos(targetAngle) * beamLength;
        const y2 = cy + Math.sin(targetAngle) * beamLength;
        const beamWidth = 40;

        if (this.checkBeamHit(this.game.player.x + this.game.player.width / 2, this.game.player.y + this.game.player.height / 2, 15, cx, cy, x2, y2, beamWidth)) {
            this.game.player.takeDamage(40);
        }

        this.game.animations.push({
            type: 'flash_line',
            x1: cx, y1: cy, x2: x2, y2: y2, width: beamWidth,
            color: '#00ffff', life: 0.5, maxLife: 0.5,
            draw: function (ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                const grad = ctx.createLinearGradient(this.x1, this.y1, this.x2, this.y2);
                const shift = (Date.now() / 150) % 1.0;
                grad.addColorStop(0, '#00ffff');
                grad.addColorStop((0.2 + shift) % 1.0, '#ffffff');
                grad.addColorStop((0.5 + shift) % 1.0, '#00eeff');
                grad.addColorStop((0.8 + shift) % 1.0, '#ffffff');
                grad.addColorStop(1, '#00ffff');
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = grad;
                ctx.lineWidth = this.width * (0.8 + Math.sin(Date.now() / 40) * 0.2);
                ctx.beginPath();
                ctx.moveTo(this.x1, this.y1); ctx.lineTo(this.x2, this.y2);
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    checkBeamHit(px, py, pr, x1, y1, x2, y2, beamWidth) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return false;
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        return (px - closestX) ** 2 + (py - closestY) ** 2 < (pr + beamWidth / 2) ** 2;
    }

    attackSummon() {
        if (!this.game || !this.game.enemies || !this.game.map) return;
        const sentinels = this.game.enemies.filter(e => e instanceof AetherSentinel && !e.markedForDeletion);
        const limit = this.phase === 1 ? 2 : 4;
        if (sentinels.length < limit) {
            const offset = 120;
            const points = [
                { x: this.x - offset, y: this.y }, { x: this.x + this.width + offset, y: this.y },
                { x: this.x, y: this.y - offset }, { x: this.x, y: this.y + this.height + offset }
            ];
            let spawned = 0;
            for (const pt of points) {
                if (spawned >= Math.min(2, limit - sentinels.length)) break;
                if (!this.game.map.isWall(pt.x + 15, pt.y + 15)) {
                    const s = new AetherSentinel(this.game, pt.x, pt.y);
                    s.canDrop = false;
                    this.game.enemies.push(s);
                    spawned++;
                }
            }
        }
    }

    spawnOrb(x, y, angle, options = {}) {
        if (!this.game || !this.game.enemyProjectiles) return;
        const speed = options.speed || 200;
        const size = options.size || 25;
        const damage = options.damage || 20;
        const color = options.color || '#00ffff';

        this.game.enemyProjectiles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            width: size, height: size, damage: damage, life: 5.0, color: color,
            update: function (dt, game) {
                this.x += this.vx * dt; this.y += this.vy * dt;
                this.life -= dt;
                if (game.player && Math.hypot(game.player.x - this.x, game.player.y - this.y) < size * 0.8) {
                    game.player.takeDamage(this.damage);
                    this.life = 0;
                }
            },
            draw: function (ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Math.atan2(this.vy, this.vx));

                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;

                if (options.isBeam) {
                    // Slender rectangle shape
                    const length = size;
                    const thickness = 4;
                    ctx.fillRect(-length / 2, -thickness / 2, length, thickness);

                    // Core white line
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(-length / 2, -thickness / 4, length, thickness / 2);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }
        });
    }

    takeDamage(amount, color, aether, crit, kx, ky, kd, silent, source) {
        if (this.isOmniShield) amount *= 0.2;
        return super.takeDamage(amount, color, aether, crit, 0, 0, kd, silent, source);
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        let rotationAngle = (this.floatPhase || 0) * 0.5;

        if (this.isTelegraphing && this.currentAttack === 'beam' && this.stunTimer <= 0) {
            const chargeProgress = 1.0 - (this.telegraphTimer / 1.5);
            rotationAngle = (Date.now() / 1000) * (0.5 + Math.pow(chargeProgress, 2) * 35.0);
            const pulse = 1.0 + Math.sin(Date.now() / 20) * 0.15 * chargeProgress;
            ctx.scale(pulse, pulse);

            const orbSize = 5 + chargeProgress * 30;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbSize);
            grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, '#00ffff'); grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(0, 0, orbSize, 0, Math.PI * 2); ctx.fill();
        }

        ctx.rotate(rotationAngle);
        if (this.image && this.image.complete) {
            if (this.stunTimer > 0) ctx.filter = 'grayscale(100%) opacity(70%)';
            ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            if (this.stunTimer > 0) ctx.filter = 'none';
        } else {
            ctx.fillStyle = '#006666';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        ctx.restore();

        // Draw Drones
        if (this.droneEntities) {
            this.droneEntities.forEach((d, i) => {
                if (!d || d.markedForDeletion) return;
                ctx.save();
                ctx.translate(d.x + d.width / 2, d.y + d.height / 2);

                const droneAngle = (d.currentAngleForDraw || 0) + Math.PI / 2 + (this.currentAttack === 'syncShot' ? 0 : Math.sin(Date.now() / 1000 + i) * 0.5);
                ctx.rotate(droneAngle);

                // Attack Highlight
                if (this.isTelegraphing && this.currentAttack === 'syncShot') {
                    const pulse = 0.5 + Math.sin(Date.now() / 100) * 0.5;
                    ctx.shadowBlur = 15 * pulse;
                    ctx.shadowColor = '#00ffff';
                    // Cyan aura overlay
                    ctx.fillStyle = `rgba(0, 255, 255, ${0.2 * pulse})`;
                    ctx.beginPath();
                    ctx.arc(0, 0, 15, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (this.bitImage && this.bitImage.complete) {
                    ctx.drawImage(this.bitImage, -12, -12, 24, 24);
                } else {
                    ctx.fillStyle = '#00ffff';
                    ctx.fillRect(-10, -10, 20, 20);
                }
                ctx.restore();

                // --- Drone HP Bar ---
                if (d.hp < d.maxHp) {
                    const bw = 24;
                    const bh = 3;
                    const bx = d.x + d.width / 2 - bw / 2;
                    const by = d.y - 6;

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(bx, by, bw, bh);

                    const hpPct = Math.max(0, d.hp / d.maxHp);
                    ctx.fillStyle = '#ff3333';
                    ctx.fillRect(bx, by, bw * hpPct, bh);

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(bx, by, bw, bh);
                }
            });
        }

        if (this.isOmniShield) {
            const pulse = 1.0 + Math.sin(Date.now() / 200) * 0.05;
            const grad = ctx.createRadialGradient(cx, cy, 60, cx, cy, 100 * pulse);
            grad.addColorStop(0, 'rgba(0, 255, 255, 0)'); grad.addColorStop(1, 'rgba(0, 255, 255, 0.3)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(cx, cy, 100 * pulse, 0, Math.PI * 2); ctx.fill();
        }

        if (this.isTelegraphing && this.currentAttack === 'beam' && this.game && this.game.player) {
            if (this.telegraphTimer > 0.5) {
                this.beamTargetAngle = Math.atan2(this.game.player.y - cy, this.game.player.x - cx);
            }
            ctx.save();
            ctx.translate(cx, cy); ctx.rotate(this.beamTargetAngle);
            ctx.fillStyle = `rgba(255, 0, 0, ${0.2 + Math.sin(Date.now() / 100) * 0.1})`;
            ctx.fillRect(0, -20, 800, 40);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'; ctx.lineWidth = 1; ctx.setLineDash([10, 5]);
            ctx.strokeRect(0, -20, 800, 40);
            ctx.restore();
        }

    }
}
