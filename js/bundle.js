/**
 * Apenas Um Show: Pancadaria - Edição Roster Completo (6 Lutadores, Tela de Seleção e Suporte Total P2)
 * Mordecai, Rigby, Benson, Pairulito, Musculoso e Saltitão!
 * Super Otimizado para 60 FPS locked, Sem Travamentos e Controles Instantâneos!
 */

(function () {
    "use strict";

    // =========================================================================
    // 1. MOTOR DE ÁUDIO ULTRA LEVE (Zero Lag, Sem Loops de Intervalo)
    // =========================================================================
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.isMuted = false;
            this.volume = 0.6;
        }

        init() {
            if (this.ctx) return;
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            } catch (e) {}
        }

        resume() {
            if (this.ctx && this.ctx.state === "suspended") {
                this.ctx.resume().catch(() => {});
            }
        }

        toggleMute() {
            this.isMuted = !this.isMuted;
            return this.isMuted;
        }

        playTone(freq, duration, type = "triangle", endFreq = null) {
            if (this.isMuted || !this.ctx) return;
            this.resume();

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            if (endFreq) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
            }

            gain.gain.setValueAtTime(this.volume * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        }

        playPunch() { this.playTone(180, 0.1, "triangle", 50); }
        playKick() { this.playTone(220, 0.14, "sine", 35); }
        playBlock() { this.playTone(320, 0.08, "square", 160); }
        playJump() { this.playTone(150, 0.12, "sine", 420); }
        playSpecial() {
            this.playTone(120, 0.35, "sawtooth", 900);
            setTimeout(() => this.playTone(160, 0.45, "triangle", 30), 100);
        }
        playKO() { this.playTone(110, 0.8, "triangle", 25); }
        playVictory() {
            const notes = [392, 440, 523, 659];
            notes.forEach((n, i) => {
                setTimeout(() => this.playTone(n, 0.25, "triangle"), i * 110);
            });
        }
        playGong() {
            this.playTone(95, 1.2, "sawtooth", 40);
            setTimeout(() => this.playTone(190, 0.8, "triangle", 60), 60);
        }
        playTick() {
            this.playTone(520, 0.04, "sine", 260);
        }
        playChampion() {
            const notes = [261, 329, 392, 523, 659, 784, 1046];
            notes.forEach((n, i) => {
                setTimeout(() => this.playTone(n, 0.35, "triangle"), i * 120);
            });
        }
    }

    const audio = new SoundEngine();

    // =========================================================================
    // 2. LUTADORES (FIGHTER) - 6 Personagens Únicos
    // =========================================================================
    class Fighter {
        constructor({
            id = 1,
            character = "mordecai",
            name = "Mordecai",
            x = 180,
            y = 350,
            facing = 1,
            groundY = 480
        }) {
            this.id = id;
            this.groundY = groundY;
            this.setCharacter(character, name);

            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
            this.facing = facing;

            this.state = "idle";
            this.stateTimer = 0;
            this.invulnerableTimer = 0;
            this.isBlocking = false;

            this.hitbox = null;
            this.hasHitEnemyThisAttack = false;

            this.specialProjectiles = [];
            this.comicTexts = [];
        }

        setCharacter(charKey, customName = null, isBoss = false) {
            this.character = charKey;
            this.isBoss = isBoss;

            // Atributos específicos de cada personagem
            switch (charKey) {
                case "rigby":
                    this.name = customName || "Rigby";
                    this.width = 56;
                    this.height = 92;
                    this.speed = 6.4;
                    this.jumpForce = -16.2;
                    this.gravity = 0.68;
                    this.maxHp = 95;
                    this.specialName = "Hamboning Cósmico";
                    break;
                case "benson":
                    this.name = customName || "Benson";
                    this.width = 62;
                    this.height = 120;
                    this.speed = 5.6;
                    this.jumpForce = -15.2;
                    this.gravity = 0.68;
                    this.maxHp = 105;
                    this.specialName = "Estão Demitidos!";
                    break;
                case "pairulito":
                    this.name = customName || "Pairulito";
                    this.width = 66;
                    this.height = 124;
                    this.speed = 5.0;
                    this.jumpForce = -16.8;
                    this.gravity = 0.58; // Pulo flutuante
                    this.maxHp = 95;
                    this.specialName = "Fúria Cósmica";
                    break;
                case "musculoso":
                    this.name = customName || "Musculoso";
                    this.width = 72;
                    this.height = 110;
                    this.speed = 4.8;
                    this.jumpForce = -14.2;
                    this.gravity = 0.72;
                    this.maxHp = 115;
                    this.specialName = "Giro da Camisa";
                    break;
                case "saltitao":
                    this.name = customName || "Saltitão";
                    this.width = 74;
                    this.height = 126;
                    this.speed = 5.1;
                    this.jumpForce = -14.8;
                    this.gravity = 0.70;
                    this.maxHp = 120;
                    this.specialName = "Pancada Imortal";
                    break;
                case "mordecai":
                default:
                    this.name = customName || "Mordecai";
                    this.width = 64;
                    this.height = 126;
                    this.speed = 5.4;
                    this.jumpForce = -15.0;
                    this.gravity = 0.68;
                    this.maxHp = 100;
                    this.specialName = "Soco Mortal";
                    break;
            }

            this.hp = this.maxHp;
            this.specialMeter = 50;
        }

        reset(x, facing) {
            this.x = x;
            this.y = this.groundY - this.height;
            this.vx = 0;
            this.vy = 0;
            this.facing = facing;
            this.state = "idle";
            this.stateTimer = 0;
            this.invulnerableTimer = 0;
            this.isBlocking = false;
            this.hitbox = null;
            this.hasHitEnemyThisAttack = false;
            this.specialProjectiles = [];
            this.comicTexts = [];
            this.hp = this.maxHp;
            this.specialMeter = Math.max(50, this.specialMeter);
        }

        update(arenaWidth = 960) {
            this.stateTimer++;
            if (this.invulnerableTimer > 0) this.invulnerableTimer--;

            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;

            if (this.isGrounded) {
                this.vx *= 0.82;
                if (Math.abs(this.vx) < 0.1) this.vx = 0;
            }

            if (this.y + this.height >= this.groundY) {
                this.y = this.groundY - this.height;
                this.vy = 0;
                this.isGrounded = true;
                if (this.state === "jump") {
                    this.state = "idle";
                }
            } else {
                this.isGrounded = false;
            }

            if (this.x < 25) this.x = 25;
            if (this.x + this.width > arenaWidth - 25) this.x = arenaWidth - 25 - this.width;

            if (this.state === "punch" && this.stateTimer > 16) {
                this.state = "idle";
                this.hitbox = null;
            } else if (this.state === "kick" && this.stateTimer > 20) {
                this.state = "idle";
                this.hitbox = null;
            } else if (this.state === "special" && this.stateTimer > 35) {
                this.state = "idle";
                this.hitbox = null;
            } else if (this.state === "hurt" && this.stateTimer > 14) {
                this.state = "idle";
            }

            this.updateHitbox();
            this.updateParticles();
            this.updateProjectiles(arenaWidth);
        }

        updateHitbox() {
            if (this.state === "punch" && this.stateTimer >= 3 && this.stateTimer <= 12) {
                const reach = this.width * 0.9;
                this.hitbox = {
                    x: this.facing === 1 ? this.x + this.width - 5 : this.x - reach + 5,
                    y: this.y + this.height * 0.28,
                    width: reach,
                    height: 28,
                    damage: this.character === "saltitao" ? 11 : 9,
                    knockbackX: this.facing * 5,
                    knockbackY: -2.5,
                    type: "punch"
                };
            } else if (this.state === "kick" && this.stateTimer >= 5 && this.stateTimer <= 16) {
                const reach = this.width * 1.1;
                this.hitbox = {
                    x: this.facing === 1 ? this.x + this.width - 5 : this.x - reach + 5,
                    y: this.y + this.height * 0.45,
                    width: reach,
                    height: 32,
                    damage: this.character === "musculoso" ? 17 : 15,
                    knockbackX: this.facing * 9,
                    knockbackY: -4.5,
                    type: "kick"
                };
            } else if (this.state === "special" && this.stateTimer >= 6 && this.stateTimer <= 26) {
                const reach = 95;
                this.hitbox = {
                    x: this.facing === 1 ? this.x + this.width - 10 : this.x - reach + 10,
                    y: this.y + this.height * 0.2,
                    width: reach,
                    height: 65,
                    damage: 30,
                    knockbackX: this.facing * 14,
                    knockbackY: -7,
                    type: "special"
                };
            } else if (this.state !== "punch" && this.state !== "kick" && this.state !== "special") {
                this.hitbox = null;
            }
        }

        move(direction) {
            if (this.state === "hurt" || this.state === "dead" || this.state === "victory") return;
            if (this.state === "punch" || this.state === "kick" || this.state === "special") return;

            this.vx = direction * this.speed;
            this.facing = direction;

            if (this.isGrounded && this.state !== "block") {
                this.state = "walk";
            }
        }

        stopMoving() {
            if (this.state === "walk") {
                this.state = "idle";
            }
        }

        jump() {
            if (this.state === "hurt" || this.state === "dead" || this.state === "victory") return;
            if (!this.isGrounded) return;

            this.vy = this.jumpForce;
            this.isGrounded = false;
            this.state = "jump";
            audio.playJump();
        }

        startBlock() {
            if (this.state === "hurt" || this.state === "dead" || this.state === "victory") return;
            if (this.isGrounded) {
                this.state = "block";
                this.isBlocking = true;
                this.vx = 0;
            }
        }

        stopBlock() {
            if (this.state === "block") {
                this.state = "idle";
                this.isBlocking = false;
            }
        }

        punch() {
            if (this.state === "hurt" || this.state === "dead" || this.state === "victory") return;
            if (this.state === "punch" || this.state === "kick" || this.state === "special") return;

            this.state = "punch";
            this.stateTimer = 0;
            this.hasHitEnemyThisAttack = false;
            audio.playPunch();
        }

        kick() {
            if (this.state === "hurt" || this.state === "dead" || this.state === "victory") return;
            if (this.state === "punch" || this.state === "kick" || this.state === "special") return;

            this.state = "kick";
            this.stateTimer = 0;
            this.hasHitEnemyThisAttack = false;
            audio.playKick();
        }

        special() {
            if (this.state === "hurt" || this.state === "dead" || this.state === "victory") return false;
            if (this.state === "punch" || this.state === "kick" || this.state === "special") return false;

            if (this.specialMeter < 100) {
                this.addComicText("ESPECIAL BLOQUEADO!", "#e74c3c");
                audio.playBlock();
                return false;
            }

            this.state = "special";
            this.stateTimer = 0;
            this.hasHitEnemyThisAttack = false;
            this.specialMeter = 0; // Consome a barra

            audio.playSpecial();

            // Dispara projétil / onda de choque de acordo com o personagem
            if (this.character === "rigby") {
                // Hamboning sonic ring
                this.specialProjectiles.push({
                    x: this.facing === 1 ? this.x + this.width : this.x,
                    y: this.y + this.height * 0.35,
                    vx: this.facing * 8.5,
                    radius: 22,
                    damage: 26,
                    life: 35,
                    color: "#f39c12"
                });
            } else if (this.character === "benson") {
                // Red shout sonic shockwave
                this.specialProjectiles.push({
                    x: this.facing === 1 ? this.x + this.width : this.x,
                    y: this.y + this.height * 0.25,
                    vx: this.facing * 9.5,
                    radius: 26,
                    damage: 28,
                    life: 35,
                    color: "#e74c3c"
                });
            } else if (this.character === "pairulito") {
                // Celestial starburst shockwave
                this.specialProjectiles.push({
                    x: this.facing === 1 ? this.x + this.width : this.x,
                    y: this.y + this.height * 0.3,
                    vx: this.facing * 8,
                    radius: 28,
                    damage: 28,
                    life: 36,
                    color: "#f1c40f"
                });
            } else if (this.character === "musculoso") {
                // Shirt spin dash
                this.vx = this.facing * 12;
            } else if (this.character === "saltitao") {
                // Ground slam jump
                this.vx = this.facing * 9;
                this.vy = -6;
            } else {
                // Mordecai Death Punch dash
                this.vx = this.facing * 11;
            }

            return true;
        }

        updateProjectiles(arenaWidth) {
            for (let i = this.specialProjectiles.length - 1; i >= 0; i--) {
                const p = this.specialProjectiles[i];
                p.x += p.vx;
                p.life--;
                if (p.life <= 0 || p.x < 0 || p.x > arenaWidth) {
                    this.specialProjectiles.splice(i, 1);
                }
            }
        }

        takeHit(damage, knockbackX, knockbackY, hitType = "punch") {
            if (this.invulnerableTimer > 0 || this.state === "dead") return false;

            if (this.isBlocking) {
                damage *= 0.2;
                audio.playBlock();
                this.addComicText("BLOQUEOU!", "#3498db");
            } else {
                if (hitType === "kick") {
                    this.addComicText("WHAM!", "#e67e22");
                } else if (hitType === "special") {
                    this.addComicText("KAPOW!", "#e74c3c");
                } else {
                    this.addComicText("POW!", "#f1c40f");
                }

                this.state = "hurt";
                this.stateTimer = 0;
                this.vx = knockbackX;
                this.vy = knockbackY;
                this.invulnerableTimer = 16;
            }

            this.hp = Math.max(0, this.hp - damage);
            this.specialMeter = Math.min(100, this.specialMeter + 16);

            if (this.hp <= 0) {
                this.state = "dead";
                this.vx = knockbackX * 1.4;
                this.vy = -6;
                audio.playKO();
            }

            return true;
        }

        addComicText(text, color = "#ffffff") {
            this.comicTexts.push({
                text,
                x: this.x + this.width / 2,
                y: this.y - 12,
                vy: -1.4,
                opacity: 1.0,
                color
            });
        }

        updateParticles() {
            for (let i = this.comicTexts.length - 1; i >= 0; i--) {
                const t = this.comicTexts[i];
                t.y += t.vy;
                t.opacity -= 0.04;
                if (t.opacity <= 0) {
                    this.comicTexts.splice(i, 1);
                }
            }
        }

        render(ctx) {
            ctx.save();

            if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 3) % 2 === 0) {
                ctx.globalAlpha = 0.45;
            }

            if (this.specialMeter >= 100) {
                ctx.strokeStyle = this.id === 1 ? "#00e1ff" : "#ff007f";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.7, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.translate(this.x + this.width / 2, this.y + this.height);
            ctx.scale(this.facing, 1);

            switch (this.character) {
                case "rigby":
                    this.drawRigby(ctx);
                    break;
                case "benson":
                    this.drawBenson(ctx);
                    break;
                case "pairulito":
                    this.drawPairulito(ctx);
                    break;
                case "musculoso":
                    this.drawMusculoso(ctx);
                    break;
                case "saltitao":
                    this.drawSaltitao(ctx);
                    break;
                case "mordecai":
                default:
                    this.drawMordecai(ctx);
                    break;
            }

            ctx.restore();

            // Renderiza projéteis
            for (const p of this.specialProjectiles) {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Renderiza textos HQ
            for (const t of this.comicTexts) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, t.opacity);
                ctx.font = "bold 20px 'Impact', sans-serif";
                ctx.textAlign = "center";
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 4;
                ctx.strokeText(t.text, t.x, t.y);
                ctx.fillStyle = t.color;
                ctx.fillText(t.text, t.x, t.y);
                ctx.restore();
            }
        }

        // --- 1. MORDECAI ---
        drawMordecai(ctx) {
            const h = this.height;
            const w = this.width;
            const isPunch = this.state === "punch";
            const isKick = this.state === "kick";
            const isBlock = this.state === "block";

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#111";

            // Pernas pretas
            ctx.lineWidth = 4;
            if (isKick) {
                ctx.beginPath();
                ctx.moveTo(-10, -h * 0.35);
                ctx.lineTo(-12, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(5, -h * 0.35);
                ctx.lineTo(w * 0.9, -h * 0.42);
                ctx.stroke();
            } else {
                const legW = this.state === "walk" ? Math.sin(this.stateTimer * 0.35) * 10 : 0;
                ctx.beginPath();
                ctx.moveTo(-8, -h * 0.35);
                ctx.lineTo(-10 + legW, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(8, -h * 0.35);
                ctx.lineTo(8 - legW, 0);
                ctx.stroke();
            }

            ctx.lineWidth = 2.5;

            // Tronco azul
            ctx.fillStyle = "#3498db";
            ctx.fillRect(-w * 0.35, -h * 0.7, w * 0.7, h * 0.38);
            ctx.strokeRect(-w * 0.35, -h * 0.7, w * 0.7, h * 0.38);

            // Peito branco
            ctx.fillStyle = "#fff";
            ctx.fillRect(-w * 0.1, -h * 0.65, w * 0.35, h * 0.25);

            // Cabeça e crista
            ctx.fillStyle = "#3498db";
            ctx.beginPath();
            ctx.arc(0, -h * 0.8, w * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-w * 0.2, -h * 0.88);
            ctx.lineTo(-w * 0.52, -h * 0.94);
            ctx.lineTo(-w * 0.22, -h * 0.78);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Olhos e bico
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(-2, -h * 0.82, 6, 0, Math.PI * 2);
            ctx.arc(8, -h * 0.82, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(0, -h * 0.82, 2.5, 0, Math.PI * 2);
            ctx.arc(10, -h * 0.82, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#2c3e50";
            ctx.beginPath();
            ctx.moveTo(12, -h * 0.82);
            ctx.lineTo(w * 0.52, -h * 0.78);
            ctx.lineTo(12, -h * 0.74);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Braço / Asa
            ctx.lineWidth = 3;
            ctx.fillStyle = "#3498db";
            if (isPunch) {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.6);
                ctx.lineTo(w * 0.82, -h * 0.6);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(w * 0.82, -h * 0.6, 11, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (isBlock) {
                ctx.beginPath();
                ctx.moveTo(-10, -h * 0.6);
                ctx.lineTo(14, -h * 0.7);
                ctx.lineTo(14, -h * 0.5);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.6);
                ctx.lineTo(10, -h * 0.45);
                ctx.stroke();
            }
        }

        // --- 2. RIGBY ---
        drawRigby(ctx) {
            const h = this.height;
            const w = this.width;
            const isPunch = this.state === "punch";
            const isKick = this.state === "kick";
            const isBlock = this.state === "block";

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#111";

            // Cauda listrada
            ctx.fillStyle = "#8b5a2b";
            ctx.fillRect(-w * 0.65, -h * 0.35, 24, 10);
            ctx.strokeRect(-w * 0.65, -h * 0.35, 24, 10);
            ctx.fillStyle = "#2c1d11";
            ctx.fillRect(-w * 0.5, -h * 0.35, 5, 10);

            // Pernas curtas
            ctx.lineWidth = 4;
            if (isKick) {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.3);
                ctx.lineTo(w * 0.75, -h * 0.35);
                ctx.stroke();
            } else {
                const legW = this.state === "walk" ? Math.sin(this.stateTimer * 0.4) * 8 : 0;
                ctx.beginPath();
                ctx.moveTo(-8, -h * 0.3);
                ctx.lineTo(-8 + legW, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(8, -h * 0.3);
                ctx.lineTo(8 - legW, 0);
                ctx.stroke();
            }

            ctx.lineWidth = 2.5;

            // Tronco marrom
            ctx.fillStyle = "#9c6634";
            ctx.fillRect(-w * 0.35, -h * 0.65, w * 0.7, h * 0.4);
            ctx.strokeRect(-w * 0.35, -h * 0.65, w * 0.7, h * 0.4);

            // Barriga bege
            ctx.fillStyle = "#e0b686";
            ctx.fillRect(-w * 0.1, -h * 0.6, w * 0.35, h * 0.28);

            // Cabeça
            ctx.fillStyle = "#9c6634";
            ctx.beginPath();
            ctx.arc(-10, -h * 0.85, 5, 0, Math.PI * 2);
            ctx.arc(10, -h * 0.85, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, -h * 0.75, w * 0.32, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Máscara escura dos olhos
            ctx.fillStyle = "#3d2212";
            ctx.fillRect(-w * 0.28, -h * 0.8, w * 0.56, 12);

            // Olhos
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(-6, -h * 0.75, 6, 0, Math.PI * 2);
            ctx.arc(6, -h * 0.75, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(-4, -h * 0.75, 2.5, 0, Math.PI * 2);
            ctx.arc(8, -h * 0.75, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Focinho
            ctx.fillStyle = "#e0b686";
            ctx.fillRect(10, -h * 0.72, 8, 6);
            ctx.fillStyle = "#111";
            ctx.fillRect(15, -h * 0.73, 4, 4);

            // Braços
            ctx.lineWidth = 3;
            if (isPunch) {
                ctx.beginPath();
                ctx.moveTo(5, -h * 0.55);
                ctx.lineTo(w * 0.75, -h * 0.55);
                ctx.stroke();
            } else if (isBlock) {
                ctx.beginPath();
                ctx.moveTo(-6, -h * 0.6);
                ctx.lineTo(10, -h * 0.65);
                ctx.lineTo(10, -h * 0.45);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(2, -h * 0.55);
                ctx.lineTo(10, -h * 0.42);
                ctx.stroke();
            }
        }

        // --- 3. BENSON ---
        drawBenson(ctx) {
            const h = this.height;
            const w = this.width;
            const isPunch = this.state === "punch";
            const isKick = this.state === "kick";
            const isBlock = this.state === "block";
            const isRage = this.state === "special";

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#111";

            // Pernas cilíndricas prateadas
            ctx.lineWidth = 4;
            if (isKick) {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.35);
                ctx.lineTo(w * 0.85, -h * 0.4);
                ctx.stroke();
            } else {
                const legW = this.state === "walk" ? Math.sin(this.stateTimer * 0.35) * 8 : 0;
                ctx.beginPath();
                ctx.moveTo(-8, -h * 0.35);
                ctx.lineTo(-8 + legW, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(8, -h * 0.35);
                ctx.lineTo(8 - legW, 0);
                ctx.stroke();
            }

            ctx.lineWidth = 2.5;

            // Base metálica do corpo
            ctx.fillStyle = isRage ? "#c0392b" : "#bdc3c7";
            ctx.fillRect(-w * 0.3, -h * 0.65, w * 0.6, h * 0.35);
            ctx.strokeRect(-w * 0.3, -h * 0.65, w * 0.6, h * 0.35);

            // Gravata borboleta rosa do Benson
            ctx.fillStyle = "#ff007f";
            ctx.beginPath();
            ctx.moveTo(-6, -h * 0.62);
            ctx.lineTo(6, -h * 0.62);
            ctx.lineTo(0, -h * 0.58);
            ctx.closePath();
            ctx.fill();

            // Cúpula de chicletes de vidro
            ctx.fillStyle = isRage ? "rgba(231, 76, 60, 0.85)" : "rgba(220, 240, 255, 0.65)";
            ctx.beginPath();
            ctx.arc(0, -h * 0.78, w * 0.34, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Chicletes coloridos dentro da cúpula
            const gumballColors = ["#e74c3c", "#3498db", "#f1c40f", "#9b59b6", "#e67e22"];
            gumballColors.forEach((color, i) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                const gx = Math.cos(i * 1.3) * (w * 0.16);
                const gy = -h * 0.77 + Math.sin(i * 1.3) * (w * 0.14);
                ctx.arc(gx, gy, 4, 0, Math.PI * 2);
                ctx.fill();
            });

            // Olhos do Benson
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(-6, -h * 0.82, 5, 0, Math.PI * 2);
            ctx.arc(6, -h * 0.82, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(-5, -h * 0.82, 2, 0, Math.PI * 2);
            ctx.arc(7, -h * 0.82, 2, 0, Math.PI * 2);
            ctx.fill();

            // Distribuidor de moedas (nariz)
            ctx.fillStyle = "#7f8c8d";
            ctx.fillRect(-4, -h * 0.75, 8, 5);
            ctx.strokeRect(-4, -h * 0.75, 8, 5);

            // Braço mecânico
            ctx.lineWidth = 3;
            if (isPunch) {
                ctx.beginPath();
                ctx.moveTo(5, -h * 0.58);
                ctx.lineTo(w * 0.8, -h * 0.58);
                ctx.stroke();
                ctx.fillStyle = "#bdc3c7";
                ctx.fillRect(w * 0.78, -h * 0.63, 10, 10);
            } else if (isBlock) {
                ctx.beginPath();
                ctx.moveTo(-6, -h * 0.6);
                ctx.lineTo(10, -h * 0.65);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(2, -h * 0.58);
                ctx.lineTo(10, -h * 0.44);
                ctx.stroke();
            }
        }

        // --- 4. PAIRULITO (POPS) ---
        drawPairulito(ctx) {
            const h = this.height;
            const w = this.width;
            const isPunch = this.state === "punch";
            const isKick = this.state === "kick";

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#111";

            // Pernas magras com sapatos pretos
            ctx.lineWidth = 3;
            if (isKick) {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.35);
                ctx.lineTo(w * 0.8, -h * 0.4);
                ctx.stroke();
            } else {
                const legW = this.state === "walk" ? Math.sin(this.stateTimer * 0.3) * 8 : 0;
                ctx.beginPath();
                ctx.moveTo(-6, -h * 0.35);
                ctx.lineTo(-8 + legW, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(6, -h * 0.35);
                ctx.lineTo(6 - legW, 0);
                ctx.stroke();
            }

            ctx.lineWidth = 2.5;

            // Tronco elegante de terno
            ctx.fillStyle = "#e8d8c8";
            ctx.fillRect(-w * 0.22, -h * 0.6, w * 0.44, h * 0.28);
            ctx.strokeRect(-w * 0.22, -h * 0.6, w * 0.44, h * 0.28);

            // Gravata preta
            ctx.fillStyle = "#111";
            ctx.fillRect(-2, -h * 0.58, 4, 10);

            // Cabeça gigante redonda de pirulito
            ctx.fillStyle = "#fce4d6";
            ctx.beginPath();
            ctx.arc(0, -h * 0.75, w * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Cartola elegante
            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(-w * 0.3, -h * 0.98, w * 0.6, 6); // Aba
            ctx.fillRect(-w * 0.18, -h * 1.12, w * 0.36, 18); // Topo
            ctx.strokeRect(-w * 0.18, -h * 1.12, w * 0.36, 18);
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(-w * 0.18, -h * 1.0, w * 0.36, 4); // Fita da cartola

            // Olhos gentis
            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(-8, -h * 0.77, 3, 0, Math.PI * 2);
            ctx.arc(8, -h * 0.77, 3, 0, Math.PI * 2);
            ctx.fill();

            // Bigodinho clássico do Pairulito
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10, -h * 0.72);
            ctx.quadraticCurveTo(0, -h * 0.68, 10, -h * 0.72);
            ctx.stroke();

            // Boca sorrindo
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -h * 0.69, 5, 0, Math.PI);
            ctx.stroke();

            // Braço com luva branca
            ctx.lineWidth = 3;
            if (isPunch) {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.52);
                ctx.lineTo(w * 0.85, -h * 0.52);
                ctx.stroke();
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.arc(w * 0.85, -h * 0.52, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(2, -h * 0.52);
                ctx.lineTo(12, -h * 0.4);
                ctx.stroke();
            }
        }

        // --- 5. MUSCULOSO ---
        drawMusculoso(ctx) {
            const h = this.height;
            const w = this.width;
            const isPunch = this.state === "punch";
            const isKick = this.state === "kick";
            const isSpecial = this.state === "special";

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#111";

            // Calça jeans azul escura
            ctx.lineWidth = 4;
            if (isKick) {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.35);
                ctx.lineTo(w * 0.8, -h * 0.4);
                ctx.stroke();
            } else {
                const legW = this.state === "walk" ? Math.sin(this.stateTimer * 0.35) * 8 : 0;
                ctx.beginPath();
                ctx.moveTo(-10, -h * 0.35);
                ctx.lineTo(-12 + legW, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(10, -h * 0.35);
                ctx.lineTo(10 - legW, 0);
                ctx.stroke();
            }

            ctx.lineWidth = 2.5;

            // Tronco e barriga verde
            ctx.fillStyle = "#82b74b";
            ctx.beginPath();
            ctx.ellipse(0, -h * 0.55, w * 0.4, h * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Umbigo
            ctx.fillStyle = "#5c8a32";
            ctx.beginPath();
            ctx.arc(2, -h * 0.48, 3, 0, Math.PI * 2);
            ctx.fill();

            // Cabeça verde com cabelo comprido escuro
            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(-w * 0.35, -h * 0.86, w * 0.7, 18); // Cabelo atrás

            ctx.fillStyle = "#82b74b";
            ctx.beginPath();
            ctx.arc(0, -h * 0.75, w * 0.28, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Olhos miúdos e nariz grande
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(-6, -h * 0.77, 4, 0, Math.PI * 2);
            ctx.arc(6, -h * 0.77, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(-5, -h * 0.77, 2, 0, Math.PI * 2);
            ctx.arc(7, -h * 0.77, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#5c8a32";
            ctx.beginPath();
            ctx.arc(0, -h * 0.72, 5, 0, Math.PI * 2);
            ctx.fill();

            // Braço forte girando camisa se especial ou socando
            ctx.lineWidth = 4;
            if (isSpecial) {
                // Camisa girando no alto!
                ctx.strokeStyle = "#2980b9";
                const spin = (this.stateTimer * 0.6) % (Math.PI * 2);
                ctx.beginPath();
                ctx.ellipse(0, -h * 0.95, 24, 8, spin, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = "#111";
            } else if (isPunch) {
                ctx.beginPath();
                ctx.moveTo(5, -h * 0.58);
                ctx.lineTo(w * 0.85, -h * 0.58);
                ctx.stroke();
                ctx.fillStyle = "#82b74b";
                ctx.beginPath();
                ctx.arc(w * 0.85, -h * 0.58, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(5, -h * 0.58);
                ctx.lineTo(14, -h * 0.44);
                ctx.stroke();
            }
        }

        // --- 6. SALTITÃO (SKIPS) ---
        drawSaltitao(ctx) {
            const h = this.height;
            const w = this.width;
            const isPunch = this.state === "punch";
            const isKick = this.state === "kick";

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#111";

            // Pernas com calça jeans (Saltitando)
            ctx.lineWidth = 4;
            if (isKick) {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.35);
                ctx.lineTo(w * 0.85, -h * 0.4);
                ctx.stroke();
            } else {
                // Perna saltitante do Saltitão
                const skipHop = this.state === "walk" ? Math.abs(Math.sin(this.stateTimer * 0.4)) * 12 : 0;
                ctx.beginPath();
                ctx.moveTo(-10, -h * 0.35);
                ctx.lineTo(-10, -skipHop);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(10, -h * 0.35);
                ctx.lineTo(10, 0);
                ctx.stroke();
            }

            ctx.lineWidth = 2.5;

            // Tronco branco peludo super musculoso
            ctx.fillStyle = "#ecf0f1";
            ctx.beginPath();
            ctx.ellipse(0, -h * 0.58, w * 0.42, h * 0.24, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Cinto marrom
            ctx.fillStyle = "#795548";
            ctx.fillRect(-w * 0.3, -h * 0.38, w * 0.6, 7);

            // Cabeça peluda branca com rosto sério
            ctx.fillStyle = "#ecf0f1";
            ctx.beginPath();
            ctx.arc(0, -h * 0.78, w * 0.28, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Rosto / Nariz de gorila
            ctx.fillStyle = "#bdc3c7";
            ctx.beginPath();
            ctx.ellipse(0, -h * 0.76, 12, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Olhos calmos
            ctx.fillStyle = "#111";
            ctx.fillRect(-8, -h * 0.82, 4, 3);
            ctx.fillRect(4, -h * 0.82, 4, 3);

            // Narinas
            ctx.fillRect(-3, -h * 0.74, 2, 3);
            ctx.fillRect(1, -h * 0.74, 2, 3);

            // Braço enorme de gorila
            ctx.lineWidth = 4;
            if (isPunch) {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.6);
                ctx.lineTo(w * 0.9, -h * 0.6);
                ctx.stroke();
                ctx.fillStyle = "#ecf0f1";
                ctx.beginPath();
                ctx.arc(w * 0.9, -h * 0.6, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(5, -h * 0.6);
                ctx.lineTo(16, -h * 0.42);
                ctx.stroke();
            }
        }
    }

    // =========================================================================
    // 3. INTELIGÊNCIA ARTIFICIAL (AI)
    // =========================================================================
    class FighterAI {
        constructor(fighter, difficulty = "normal") {
            this.fighter = fighter;
            this.difficulty = difficulty;
            this.timer = 0;
            this.delay = 10;
        }

        setDifficulty(diff) {
            this.difficulty = diff;
        }

        update(opponent) {
            if (this.fighter.state === "hurt" || this.fighter.state === "dead") return;

            this.timer++;
            if (this.timer < this.delay) return;
            this.timer = 0;
            this.delay = Math.floor(Math.random() * 8) + 6;

            const dx = (opponent.x + opponent.width / 2) - (this.fighter.x + this.fighter.width / 2);
            const dist = Math.abs(dx);
            const dir = dx > 0 ? 1 : -1;

            this.fighter.facing = dir;

            if (this.fighter.specialMeter >= 100 && dist < 170) {
                if (Math.random() < 0.7) {
                    this.fighter.special();
                    return;
                }
            }

            const isAtk = opponent.state === "punch" || opponent.state === "kick";
            const blockRate = this.difficulty === "facil" ? 0.15 : (this.difficulty === "normal" ? 0.35 : 0.65);
            if (isAtk && dist < 100 && Math.random() < blockRate) {
                this.fighter.startBlock();
                setTimeout(() => this.fighter.stopBlock(), 220);
                return;
            }

            if (dist > 180) {
                this.fighter.move(dir);
                if (Math.random() < 0.2 && this.fighter.isGrounded) {
                    this.fighter.jump();
                }
            } else if (dist > 75) {
                if (Math.random() < 0.6) {
                    this.fighter.move(dir);
                } else {
                    this.fighter.stopMoving();
                    if (Math.random() < 0.4) this.fighter.kick();
                }
            } else {
                this.fighter.stopMoving();
                const roll = Math.random();
                if (roll < 0.5) {
                    this.fighter.punch();
                } else if (roll < 0.8) {
                    this.fighter.kick();
                } else {
                    this.fighter.move(-dir);
                    setTimeout(() => this.fighter.stopMoving(), 120);
                }
            }
        }
    }

    // =========================================================================
    // 4. MOTOR PRINCIPAL DO JOGO (Tela de Escolha, Dual Controls P1 & P2, 60 FPS)
    // =========================================================================
    class GameEngine {
        constructor() {
            this.canvas = document.getElementById("game-canvas");
            this.ctx = this.canvas.getContext("2d", { alpha: false });

            this.bgCanvas = document.createElement("canvas");
            this.bgCtx = this.bgCanvas.getContext("2d");

            this.screenStart = document.getElementById("screen-start");
            this.screenSelect = document.getElementById("screen-select");
            this.screenFightHud = document.getElementById("fight-hud");
            this.screenRoundBanner = document.getElementById("round-banner");
            this.screenMatchOver = document.getElementById("screen-match-over");

            this.bannerMainText = document.getElementById("banner-main-text");
            this.bannerSubText = document.getElementById("banner-sub-text");

            this.p1HpFill = document.getElementById("p1-hp-fill");
            this.p1SpecialBadge = document.getElementById("p1-special-badge");
            this.p1RoundsEl = document.getElementById("p1-rounds");
            this.p1NameEl = document.getElementById("p1-name");

            this.p2HpFill = document.getElementById("p2-hp-fill");
            this.p2SpecialBadge = document.getElementById("p2-special-badge");
            this.p2RoundsEl = document.getElementById("p2-rounds");
            this.p2NameEl = document.getElementById("p2-name");

            this.p1VControls = document.getElementById("p1-vcontrols");
            this.p2VControls = document.getElementById("p2-vcontrols");

            this.mode = "1P"; // "1P" ou "2P"
            this.difficulty = "normal";
            this.maxRoundsToWin = 2;

            // Personagens selecionados
            this.p1Char = "mordecai";
            this.p2Char = "rigby";
            this.selectTurn = 1; // 1 = escolhendo P1, 2 = escolhendo P2

            this.state = "MENU"; // MENU, SELECT, FIGHT, ROUND_END, MATCH_OVER
            this.currentRound = 1;
            this.p1Score = 0;
            this.p2Score = 0;
            this.p1Damage = 0;
            this.p2Damage = 0;

            this.groundY = 480;
            this.p1 = new Fighter({ id: 1, character: "mordecai", name: "Mordecai", x: 180, y: 350, facing: 1, groundY: this.groundY });
            this.p2 = new Fighter({ id: 2, character: "rigby", name: "Rigby", x: 720, y: 350, facing: -1, groundY: this.groundY });

            this.ai = new FighterAI(this.p2, this.difficulty);

            this.keys = {};
            this.screenShake = 0;
        }

        init() {
            this.canvas.width = 960;
            this.canvas.height = 540;
            this.bgCanvas.width = 960;
            this.bgCanvas.height = 540;

            this.preRenderBackground();
            this.setupControls();
            this.setupUI();

            this.showScreen("start");
            this.startLoop();
        }

        preRenderBackground() {
            const ctx = this.bgCtx;
            const w = 960;
            const h = 540;

            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "#100624");
            grad.addColorStop(0.7, "#281248");
            grad.addColorStop(1, "#0a0316");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = "#15092a";
            for (let x = 20; x < w; x += 45) {
                ctx.beginPath();
                ctx.arc(x, this.groundY - 50, 18, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = "rgba(241, 196, 15, 0.5)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, this.groundY - 75);
            ctx.lineTo(w, this.groundY - 75);
            ctx.moveTo(0, this.groundY - 40);
            ctx.lineTo(w, this.groundY - 40);
            ctx.stroke();

            ctx.fillStyle = "#962d22";
            ctx.fillRect(0, this.groundY, w, h - this.groundY);

            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, this.groundY);
            ctx.lineTo(w, this.groundY);
            ctx.stroke();
        }

        showScreen(name) {
            this.screenStart.classList.add("hidden");
            this.screenSelect.classList.add("hidden");
            this.screenMatchOver.classList.add("hidden");
            this.screenFightHud.classList.add("hidden");

            if (name === "start") {
                this.screenStart.classList.remove("hidden");
                this.p2VControls.classList.add("hidden");
            } else if (name === "select") {
                this.screenSelect.classList.remove("hidden");
                this.p2VControls.classList.add("hidden");
            } else if (name === "fight") {
                this.screenFightHud.classList.remove("hidden");
                if (this.mode === "2P") {
                    this.p2VControls.classList.remove("hidden");
                } else {
                    this.p2VControls.classList.add("hidden");
                }
            } else if (name === "match-over") {
                this.screenMatchOver.classList.remove("hidden");
                this.p2VControls.classList.add("hidden");
            }
        }

        setupUI() {
            // Botões do Menu Inicial
            document.getElementById("btn-mode-1p").addEventListener("click", () => {
                audio.init();
                audio.resume();
                this.mode = "1P";
                this.openCharacterSelect();
            });

            document.getElementById("btn-mode-2p").addEventListener("click", () => {
                audio.init();
                audio.resume();
                this.mode = "2P";
                this.openCharacterSelect();
            });

            // Seleção de Dificuldade
            const diffBtns = document.querySelectorAll(".diff-btn");
            diffBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    diffBtns.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    this.difficulty = btn.dataset.diff;
                    this.ai.setDifficulty(this.difficulty);
                });
            });

            // Mudo / Som
            document.getElementById("btn-toggle-sound").addEventListener("click", (e) => {
                audio.init();
                const isMuted = audio.toggleMute();
                e.currentTarget.textContent = isMuted ? "🔇 Som: Desligado" : "🔊 Som: Ligado";
            });

            // Tela de Escolha: Seleção de cartas de personagens
            const charCards = document.querySelectorAll(".char-card");
            charCards.forEach(card => {
                card.addEventListener("click", () => {
                    const charKey = card.dataset.char;
                    this.handleCharacterCardClick(charKey);
                });
            });

            // Botão Entrar na Arena
            document.getElementById("btn-start-fight").addEventListener("click", () => {
                this.startMatch();
            });

            // Botão Voltar da Seleção
            document.getElementById("btn-back-to-menu").addEventListener("click", () => {
                this.state = "MENU";
                this.showScreen("start");
            });

            // Fim de Partida
            document.getElementById("btn-rematch").addEventListener("click", () => {
                this.startMatch();
            });

            document.getElementById("btn-menu-from-end").addEventListener("click", () => {
                this.state = "MENU";
                this.showScreen("start");
            });
        }

        openCharacterSelect() {
            this.state = "SELECT";
            this.selectTurn = 1;
            this.showScreen("select");

            const subtitle = document.getElementById("select-subtitle");
            const diffPanel = document.getElementById("select-diff-panel");

            if (this.mode === "1P") {
                subtitle.textContent = "Clique no lutador do Jogador 1 (Você)";
                diffPanel.classList.remove("hidden");
            } else {
                subtitle.textContent = "Jogador 1: Escolha seu lutador";
                diffPanel.classList.add("hidden");
            }

            this.updateCharacterCardsUI();
        }

        handleCharacterCardClick(charKey) {
            audio.playTone(360, 0.08, "triangle");

            if (this.mode === "1P") {
                this.p1Char = charKey;
                // No 1P, se escolheu o mesmo da CPU, troca a CPU para outro aleatório
                if (this.p2Char === this.p1Char) {
                    const pool = ["mordecai", "rigby", "benson", "pairulito", "musculoso", "saltitao"].filter(c => c !== this.p1Char);
                    this.p2Char = pool[Math.floor(Math.random() * pool.length)];
                }
            } else {
                // Modo 2P: alternado
                if (this.selectTurn === 1) {
                    this.p1Char = charKey;
                    this.selectTurn = 2;
                    document.getElementById("select-subtitle").textContent = "Jogador 2: Agora escolha seu lutador!";
                } else {
                    this.p2Char = charKey;
                    this.selectTurn = 1;
                    document.getElementById("select-subtitle").textContent = "Personagens Prontos! Clique em Entrar na Arena!";
                }
            }

            this.updateCharacterCardsUI();
        }

        updateCharacterCardsUI() {
            const cards = document.querySelectorAll(".char-card");
            cards.forEach(card => {
                const c = card.dataset.char;
                card.classList.remove("selected-p1", "selected-p2", "selected-both");
                const badge = card.querySelector(".char-badge");
                badge.className = "char-badge hidden";
                badge.textContent = "";

                const isP1 = this.p1Char === c;
                const isP2 = this.p2Char === c;

                if (isP1 && isP2) {
                    card.classList.add("selected-both");
                    badge.className = "char-badge badge-both";
                    badge.textContent = "P1 & P2";
                } else if (isP1) {
                    card.classList.add("selected-p1");
                    badge.className = "char-badge badge-p1";
                    badge.textContent = "P1";
                } else if (isP2) {
                    card.classList.add("selected-p2");
                    badge.className = "char-badge badge-p2";
                    badge.textContent = "P2";
                }
            });
        }

        setupControls() {
            window.addEventListener("keydown", (e) => {
                audio.init();
                audio.resume();

                const code = e.code;
                const key = (e.key || "").toLowerCase();

                this.keys[code] = true;
                this.keys[key] = true;

                if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) {
                    e.preventDefault();
                }

                if (this.state === "MENU") {
                    if (code === "Enter" || code === "Space" || key === "1") {
                        this.mode = "1P";
                        this.openCharacterSelect();
                    } else if (key === "2") {
                        this.mode = "2P";
                        this.openCharacterSelect();
                    }
                    return;
                }

                if (this.state === "SELECT") {
                    if (code === "Enter" || code === "Space") {
                        this.startMatch();
                    }
                    return;
                }

                if (this.state === "FIGHT") {
                    const is1P = this.mode === "1P";

                    // ==========================================
                    // COMANDOS DO JOGADOR 1 (P1)
                    // ==========================================
                    // P1 Pulo: W, Seta Cima (no 1P), Espaço
                    if (code === "KeyW" || key === "w" || (is1P && (code === "ArrowUp" || key === "arrowup")) || code === "Space") {
                        this.p1.jump();
                    }

                    // P1 Soco: F, J, Z, 1
                    if (code === "KeyF" || key === "f" || (is1P && (code === "KeyJ" || key === "j")) || code === "KeyZ" || key === "z" || key === "1") {
                        this.p1.punch();
                    }

                    // P1 Chute: G, K, X, 2
                    if (code === "KeyG" || key === "g" || (is1P && (code === "KeyK" || key === "k")) || code === "KeyX" || key === "x" || key === "2") {
                        this.p1.kick();
                    }

                    // P1 Especial: H, L, C, 3
                    if (code === "KeyH" || key === "h" || (is1P && (code === "KeyL" || key === "l")) || code === "KeyC" || key === "c" || key === "3") {
                        this.p1.special();
                    }

                    // ==========================================
                    // COMANDOS DO JOGADOR 2 (P2) - NO MODO 2P
                    // ==========================================
                    if (!is1P) {
                        // P2 Pulo: Seta Cima ou NumPad 8
                        if (code === "ArrowUp" || key === "arrowup" || code === "Numpad8") {
                            this.p2.jump();
                        }

                        // P2 Soco: K, J, U, Numpad 1, Numpad 4, Vírgula (,)
                        if (
                            code === "KeyK" || key === "k" ||
                            code === "KeyJ" || key === "j" ||
                            code === "KeyU" || key === "u" ||
                            code === "Numpad1" || code === "Numpad4" ||
                            key === "," || key === "4"
                        ) {
                            this.p2.punch();
                        }

                        // P2 Chute: L, I, Numpad 2, Numpad 5, Ponto (.)
                        if (
                            code === "KeyL" || key === "l" ||
                            code === "KeyI" || key === "i" ||
                            code === "Numpad2" || code === "Numpad5" ||
                            key === "." || key === "5"
                        ) {
                            this.p2.kick();
                        }

                        // P2 Especial: P, O, Ponto e Vírgula (;), Numpad 3, Numpad 6, Barra (/)
                        if (
                            code === "KeyP" || key === "p" ||
                            code === "KeyO" || key === "o" ||
                            key === ";" || key === "/" ||
                            code === "Numpad3" || code === "Numpad6" ||
                            key === "6"
                        ) {
                            this.p2.special();
                        }
                    }
                }
            });

            window.addEventListener("keyup", (e) => {
                const code = e.code;
                const key = (e.key || "").toLowerCase();
                this.keys[code] = false;
                this.keys[key] = false;
            });

            window.addEventListener("blur", () => {
                this.keys = {};
            });

            // Helper de binding para botões virtuais na tela
            const bindBtn = (id, onDown, onUp) => {
                const el = document.getElementById(id);
                if (!el) return;
                const start = (e) => {
                    e.preventDefault();
                    audio.init();
                    audio.resume();
                    onDown();
                };
                const end = (e) => {
                    e.preventDefault();
                    if (onUp) onUp();
                };
                el.addEventListener("mousedown", start);
                el.addEventListener("mouseup", end);
                el.addEventListener("mouseleave", end);
                el.addEventListener("touchstart", start, { passive: false });
                el.addEventListener("touchend", end, { passive: false });
                el.addEventListener("touchcancel", end, { passive: false });
            };

            // CONTROLES VIRTUAIS P1
            bindBtn("vbtn-p1-left", () => { this.keys["KeyA"] = true; this.keys["a"] = true; }, () => { this.keys["KeyA"] = false; this.keys["a"] = false; });
            bindBtn("vbtn-p1-right", () => { this.keys["KeyD"] = true; this.keys["d"] = true; }, () => { this.keys["KeyD"] = false; this.keys["d"] = false; });
            bindBtn("vbtn-p1-jump", () => this.p1.jump());
            bindBtn("vbtn-p1-block", () => { this.keys["KeyS"] = true; this.keys["s"] = true; }, () => { this.keys["KeyS"] = false; this.keys["s"] = false; });
            bindBtn("vbtn-p1-punch", () => this.p1.punch());
            bindBtn("vbtn-p1-kick", () => this.p1.kick());
            bindBtn("vbtn-p1-special", () => this.p1.special());

            // CONTROLES VIRTUAIS P2 (100% FUNCIONANDO!)
            bindBtn("vbtn-p2-left", () => { this.keys["ArrowLeft"] = true; this.keys["arrowleft"] = true; }, () => { this.keys["ArrowLeft"] = false; this.keys["arrowleft"] = false; });
            bindBtn("vbtn-p2-right", () => { this.keys["ArrowRight"] = true; this.keys["arrowright"] = true; }, () => { this.keys["ArrowRight"] = false; this.keys["arrowright"] = false; });
            bindBtn("vbtn-p2-jump", () => this.p2.jump());
            bindBtn("vbtn-p2-block", () => { this.keys["ArrowDown"] = true; this.keys["arrowdown"] = true; }, () => { this.keys["ArrowDown"] = false; this.keys["arrowdown"] = false; });
            bindBtn("vbtn-p2-punch", () => this.p2.punch());
            bindBtn("vbtn-p2-kick", () => this.p2.kick());
            bindBtn("vbtn-p2-special", () => this.p2.special());

            // Clique do Mouse no Canvas para atacar
            this.canvas.addEventListener("mousedown", (e) => {
                audio.init();
                audio.resume();
                if (this.state === "FIGHT") {
                    if (e.button === 0) {
                        this.p1.punch();
                    } else if (e.button === 2) {
                        e.preventDefault();
                        this.p1.kick();
                    }
                }
            });
            this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
        }

        startMatch() {
            this.currentRound = 1;
            this.p1Score = 0;
            this.p2Score = 0;
            this.p1Damage = 0;
            this.p2Damage = 0;

            // Configura os lutadores selecionados
            this.p1.setCharacter(this.p1Char);
            this.p2.setCharacter(this.p2Char);

            // Atualiza nomes na tela
            this.p1NameEl.textContent = this.p1.name;
            this.p2NameEl.textContent = this.p2.name;

            const p1Tag = document.querySelector(".p1-tag");
            const p2Tag = document.querySelector(".p2-tag");
            if (p1Tag) p1Tag.textContent = `P1 (${this.p1.name})`;
            if (p2Tag) p2Tag.textContent = `P2 (${this.p2.name})`;

            this.startRound();
        }

        async startRound() {
            this.p1.reset(180, 1);
            this.p2.reset(720, -1);

            this.showScreen("fight");
            this.updateHUD();

            await this.showBanner(`ROUND ${this.currentRound}`, "LUTE!", 900);
            this.state = "FIGHT";
        }

        showBanner(main, sub, duration = 900) {
            this.bannerMainText.textContent = main;
            this.bannerSubText.textContent = sub;
            this.screenRoundBanner.classList.remove("hidden");
            this.screenRoundBanner.classList.add("banner-animate");

            return new Promise(resolve => {
                setTimeout(() => {
                    this.screenRoundBanner.classList.add("hidden");
                    this.screenRoundBanner.classList.remove("banner-animate");
                    resolve();
                }, duration);
            });
        }

        updateFight() {
            const is1P = this.mode === "1P";

            // P1 Movimento
            const p1Left = this.keys["KeyA"] || this.keys["a"] || (is1P && (this.keys["ArrowLeft"] || this.keys["arrowleft"]));
            const p1Right = this.keys["KeyD"] || this.keys["d"] || (is1P && (this.keys["ArrowRight"] || this.keys["arrowright"]));
            const p1Block = this.keys["KeyS"] || this.keys["s"] || (is1P && (this.keys["ArrowDown"] || this.keys["arrowdown"]));

            if (p1Left && !p1Right) {
                this.p1.move(-1);
            } else if (p1Right && !p1Left) {
                this.p1.move(1);
            } else {
                this.p1.stopMoving();
            }

            if (p1Block) {
                this.p1.startBlock();
            } else {
                this.p1.stopBlock();
            }

            // P2 Movimento (2P ou IA)
            if (!is1P) {
                const p2Left = this.keys["ArrowLeft"] || this.keys["arrowleft"];
                const p2Right = this.keys["ArrowRight"] || this.keys["arrowright"];
                const p2Block = this.keys["ArrowDown"] || this.keys["arrowdown"];

                if (p2Left && !p2Right) {
                    this.p2.move(-1);
                } else if (p2Right && !p2Left) {
                    this.p2.move(1);
                } else {
                    this.p2.stopMoving();
                }

                if (p2Block) {
                    this.p2.startBlock();
                } else {
                    this.p2.stopBlock();
                }
            } else {
                this.ai.update(this.p1);
            }

            this.p1.update(this.canvas.width);
            this.p2.update(this.canvas.width);

            // Colisões de ataque
            this.checkCollisions();
            this.updateHUD();

            // Verificação de KO
            if (this.p1.hp <= 0 || this.p2.hp <= 0) {
                this.handleRoundKO();
            }
        }

        checkCollisions() {
            // P1 batendo no P2
            if (this.p1.hitbox && !this.p1.hasHitEnemyThisAttack) {
                if (this.isColliding(this.p1.hitbox, this.p2)) {
                    this.p2.takeHit(this.p1.hitbox.damage, this.p1.hitbox.knockbackX, this.p1.hitbox.knockbackY, this.p1.hitbox.type);
                    this.p1.hasHitEnemyThisAttack = true;
                    this.p1Damage += this.p1.hitbox.damage;
                    this.p1.specialMeter = Math.min(100, this.p1.specialMeter + 14);
                    this.screenShake = 6;
                }
            }

            // P2 batendo no P1
            if (this.p2.hitbox && !this.p2.hasHitEnemyThisAttack) {
                if (this.isColliding(this.p2.hitbox, this.p1)) {
                    this.p1.takeHit(this.p2.hitbox.damage, this.p2.hitbox.knockbackX, this.p2.hitbox.knockbackY, this.p2.hitbox.type);
                    this.p2.hasHitEnemyThisAttack = true;
                    this.p2Damage += this.p2.hitbox.damage;
                    this.p2.specialMeter = Math.min(100, this.p2.specialMeter + 14);
                    this.screenShake = 6;
                }
            }

            // Projéteis do P1
            for (let i = this.p1.specialProjectiles.length - 1; i >= 0; i--) {
                const p = this.p1.specialProjectiles[i];
                if (p.x > this.p2.x && p.x < this.p2.x + this.p2.width && p.y > this.p2.y && p.y < this.p2.y + this.p2.height) {
                    this.p2.takeHit(p.damage, this.p1.facing * 10, -5, "special");
                    this.p1.specialProjectiles.splice(i, 1);
                    this.screenShake = 10;
                }
            }

            // Projéteis do P2
            for (let i = this.p2.specialProjectiles.length - 1; i >= 0; i--) {
                const p = this.p2.specialProjectiles[i];
                if (p.x > this.p1.x && p.x < this.p1.x + this.p1.width && p.y > this.p1.y && p.y < this.p1.y + this.p1.height) {
                    this.p1.takeHit(p.damage, this.p2.facing * 10, -5, "special");
                    this.p2.specialProjectiles.splice(i, 1);
                    this.screenShake = 10;
                }
            }
        }

        isColliding(rect, fighter) {
            return (
                rect.x < fighter.x + fighter.width &&
                rect.x + rect.width > fighter.x &&
                rect.y < fighter.y + fighter.height &&
                rect.y + rect.height > fighter.y
            );
        }

        updateHUD() {
            this.p1HpFill.style.width = `${Math.max(0, (this.p1.hp / this.p1.maxHp) * 100)}%`;
            this.p2HpFill.style.width = `${Math.max(0, (this.p2.hp / this.p2.maxHp) * 100)}%`;

            if (this.p1.specialMeter >= 100) {
                this.p1SpecialBadge.classList.add("special-active");
                this.p1SpecialBadge.textContent = "ESPECIAL PRONTO! [H]";
            } else {
                this.p1SpecialBadge.classList.remove("special-active");
                this.p1SpecialBadge.textContent = `ESPECIAL: ${Math.floor(this.p1.specialMeter)}%`;
            }

            if (this.p2.specialMeter >= 100) {
                this.p2SpecialBadge.classList.add("special-active");
                this.p2SpecialBadge.textContent = "ESPECIAL PRONTO! [P]";
            } else {
                this.p2SpecialBadge.classList.remove("special-active");
                this.p2SpecialBadge.textContent = `ESPECIAL: ${Math.floor(this.p2.specialMeter)}%`;
            }

            this.renderDots(this.p1RoundsEl, this.p1Score);
            this.renderDots(this.p2RoundsEl, this.p2Score);
        }

        renderDots(el, count) {
            el.innerHTML = "";
            for (let i = 0; i < this.maxRoundsToWin; i++) {
                const s = document.createElement("span");
                s.className = `round-dot ${i < count ? "won" : ""}`;
                el.appendChild(s);
            }
        }

        async handleRoundKO() {
            this.state = "ROUND_END";

            const p1Won = this.p2.hp <= 0 && this.p1.hp > 0;
            const p2Won = this.p1.hp <= 0 && this.p2.hp > 0;

            if (p1Won) {
                this.p1Score++;
                this.p1.state = "victory";
                await this.showBanner("K.O.!", `${this.p1.name.toUpperCase()} VENCEU!`, 1400);
            } else if (p2Won) {
                this.p2Score++;
                this.p2.state = "victory";
                await this.showBanner("K.O.!", `${this.p2.name.toUpperCase()} VENCEU!`, 1400);
            } else {
                await this.showBanner("DOUBLE K.O.!", "EMPATE!", 1400);
            }

            if (this.p1Score >= this.maxRoundsToWin || this.p2Score >= this.maxRoundsToWin) {
                this.finishMatch();
            } else {
                this.currentRound++;
                this.startRound();
            }
        }

        finishMatch() {
            this.state = "MATCH_OVER";
            const winner = this.p1Score >= this.maxRoundsToWin ? this.p1 : this.p2;

            audio.playVictory();
            this.showScreen("match-over");

            const title = document.getElementById("match-winner-title");
            const sub = document.getElementById("match-winner-subtitle");
            const statsP1 = document.getElementById("stats-p1");
            const statsP2 = document.getElementById("stats-p2");

            title.textContent = `${winner.name.toUpperCase()} VENCEU! 🏆`;
            sub.textContent = this.mode === "1P"
                ? (winner.id === 1 ? `Você dominou a arena com ${winner.name}!` : `A máquina venceu com ${winner.name}!`)
                : `Vitória espetacular de ${winner.name}!`;

            statsP1.innerHTML = `
                <h3>${this.p1.name} (P1)</h3>
                <p><strong>Rounds Ganhos:</strong> ${this.p1Score}</p>
                <p><strong>Dano Causado:</strong> ${Math.floor(this.p1Damage)}</p>
            `;

            statsP2.innerHTML = `
                <h3>${this.p2.name} (P2)</h3>
                <p><strong>Rounds Ganhos:</strong> ${this.p2Score}</p>
                <p><strong>Dano Causado:</strong> ${Math.floor(this.p2Damage)}</p>
            `;
        }

        render() {
            const ctx = this.ctx;

            // Fundo pré-renderizado instantâneo
            ctx.drawImage(this.bgCanvas, 0, 0);

            if (this.screenShake > 0) {
                const sx = (Math.random() - 0.5) * this.screenShake;
                const sy = (Math.random() - 0.5) * this.screenShake;
                ctx.save();
                ctx.translate(sx, sy);
                this.p1.render(ctx);
                this.p2.render(ctx);
                ctx.restore();
                this.screenShake *= 0.8;
                if (this.screenShake < 0.5) this.screenShake = 0;
            } else {
                this.p1.render(ctx);
                this.p2.render(ctx);
            }
        }

        startLoop() {
            const loop = () => {
                if (this.state === "FIGHT") {
                    this.updateFight();
                }
                this.render();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            const game = new GameEngine();
            game.init();
        });
    } else {
        const game = new GameEngine();
        game.init();
    }
})();
