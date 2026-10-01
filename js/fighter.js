/**
 * Classe Fighter e Renderizador Cartunesco para Mordecai e Rigby
 * Suporta animações vetoriais dinâmicas, detecção de colisões, combos, estados e golpes especiais!
 */

import { audio } from "./audio.js";

export class Fighter {
    constructor({
        id = 1,
        character = "mordecai",
        name = "Mordecai",
        x = 150,
        y = 380,
        facing = 1,
        groundY = 480
    }) {
        this.id = id;
        this.character = character;
        this.name = name;

        // Dimensões específicas do personagem
        this.width = character === "mordecai" ? 64 : 58;
        this.height = character === "mordecai" ? 130 : 96;

        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.facing = facing; // 1 = direita, -1 = esquerda
        this.groundY = groundY;

        this.speed = character === "mordecai" ? 4.8 : 5.8;
        this.jumpForce = character === "mordecai" ? -14.5 : -15.5;
        this.gravity = 0.65;
        this.isGrounded = false;

        // Atributos de Vida e Vantagens da Pergunta
        this.maxHp = 100;
        this.hp = 100;
        this.shieldHp = 0;
        this.damageMultiplier = 1.0;
        this.hasSpecialUnlocked = false;
        this.specialMeter = 0; // 0 a 100

        // Estados
        this.state = "idle"; // idle, walk, jump, punch, kick, block, special, hurt, stunned, dead, victory
        this.stateTimer = 0;
        this.invulnerableTimer = 0;
        this.stunTimer = 0;
        this.isBlocking = false;

        // Hitbox de ataque ativo
        this.hitbox = null;
        this.hasHitEnemyThisAttack = false;

        // Efeito de projétil ou golpe especial
        this.specialProjectiles = [];

        // Efeito de partículas locais
        this.particles = [];
        this.comicTexts = [];
    }

    resetForRound(x, facing) {
        this.x = x;
        this.y = this.groundY - this.height;
        this.vx = 0;
        this.vy = 0;
        this.facing = facing;
        this.state = "idle";
        this.stateTimer = 0;
        this.invulnerableTimer = 0;
        this.stunTimer = 0;
        this.isBlocking = false;
        this.hitbox = null;
        this.hasHitEnemyThisAttack = false;
        this.specialProjectiles = [];
        this.particles = [];
        this.comicTexts = [];
        this.hp = this.maxHp;
        this.shieldHp = 0;
        this.damageMultiplier = 1.0;
        this.hasSpecialUnlocked = false;
    }

    // Aplica as vantagens ou desvantagens ganhas no Show de Perguntas
    applyTriviaResult({ answeredCorrectly, isFirstToAnswer, isOpponentWrong }) {
        if (answeredCorrectly) {
            // Ganha bônus de vida/escudo e dano extra
            this.shieldHp = 25;
            this.damageMultiplier = 1.35;
            this.hasSpecialUnlocked = true;
            this.specialMeter = 100;

            if (isFirstToAnswer) {
                this.damageMultiplier = 1.5;
                this.shieldHp = 35;
            }

            this.addComicText("VANTAGEM!", "#2ecc71");
        } else {
            // Errou a pergunta: penalidade
            this.hp = Math.max(70, this.hp - 15);
            this.stunTimer = 85; // Começa atordoado por ~1.4 segundos!
            this.state = "stunned";
            this.addComicText("PENALIDADE!", "#e74c3c");
        }
    }

    update(arenaWidth = 960) {
        this.stateTimer++;
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;

        // Atualiza atordoamento
        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.state = "stunned";
            this.vx = 0;
            if (this.stunTimer <= 0) {
                this.state = "idle";
            }
        }

        // Aplica gravidade
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        // Fricção no solo
        if (this.isGrounded) {
            this.vx *= 0.82;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Colisão com o chão
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

        // Limites da arena
        if (this.x < 30) this.x = 30;
        if (this.x + this.width > arenaWidth - 30) this.x = arenaWidth - 30 - this.width;

        // Transição de estados de ataque
        if (this.state === "punch" && this.stateTimer > 18) {
            this.state = "idle";
            this.hitbox = null;
        } else if (this.state === "kick" && this.stateTimer > 24) {
            this.state = "idle";
            this.hitbox = null;
        } else if (this.state === "special" && this.stateTimer > 40) {
            this.state = "idle";
            this.hitbox = null;
        } else if (this.state === "hurt" && this.stateTimer > 16) {
            this.state = "idle";
        }

        // Atualiza hitbox ativo durante a janela de ataque
        this.updateHitbox();

        // Atualiza partículas e textos da pancadaria
        this.updateParticles();
        this.updateProjectiles(arenaWidth);
    }

    updateHitbox() {
        if (this.state === "punch" && this.stateTimer >= 5 && this.stateTimer <= 13) {
            const reach = this.character === "mordecai" ? 48 : 38;
            this.hitbox = {
                x: this.facing === 1 ? this.x + this.width - 5 : this.x - reach + 5,
                y: this.y + this.height * 0.28,
                width: reach,
                height: 26,
                damage: (this.character === "mordecai" ? 9 : 8) * this.damageMultiplier,
                knockbackX: this.facing * 4,
                knockbackY: -2,
                type: "punch"
            };
        } else if (this.state === "kick" && this.stateTimer >= 7 && this.stateTimer <= 18) {
            const reach = this.character === "mordecai" ? 58 : 46;
            this.hitbox = {
                x: this.facing === 1 ? this.x + this.width - 5 : this.x - reach + 5,
                y: this.y + this.height * 0.45,
                width: reach,
                height: 32,
                damage: (this.character === "mordecai" ? 15 : 14) * this.damageMultiplier,
                knockbackX: this.facing * 8.5,
                knockbackY: -5,
                type: "kick"
            };
        } else if (this.state === "special" && this.stateTimer >= 10 && this.stateTimer <= 30) {
            const reach = 85;
            this.hitbox = {
                x: this.facing === 1 ? this.x + this.width - 10 : this.x - reach + 10,
                y: this.y + this.height * 0.2,
                width: reach,
                height: 55,
                damage: 30 * this.damageMultiplier,
                knockbackX: this.facing * 14,
                knockbackY: -8,
                type: "special"
            };
        } else if (this.state !== "punch" && this.state !== "kick" && this.state !== "special") {
            this.hitbox = null;
        }
    }

    // --- ENTRADAS DE COMANDO ---

    move(direction) {
        if (this.state === "hurt" || this.state === "stunned" || this.state === "dead" || this.state === "victory") return;
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
        if (this.state === "hurt" || this.state === "stunned" || this.state === "dead" || this.state === "victory") return;
        if (!this.isGrounded) return;

        this.vy = this.jumpForce;
        this.isGrounded = false;
        this.state = "jump";
        audio.playJump();
    }

    startBlock() {
        if (this.state === "hurt" || this.state === "stunned" || this.state === "dead" || this.state === "victory") return;
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
        if (this.state === "hurt" || this.state === "stunned" || this.state === "dead" || this.state === "victory") return;
        if (this.state === "punch" || this.state === "kick" || this.state === "special") return;

        this.state = "punch";
        this.stateTimer = 0;
        this.hasHitEnemyThisAttack = false;
        audio.playPunch();
    }

    kick() {
        if (this.state === "hurt" || this.state === "stunned" || this.state === "dead" || this.state === "victory") return;
        if (this.state === "punch" || this.state === "kick" || this.state === "special") return;

        this.state = "kick";
        this.stateTimer = 0;
        this.hasHitEnemyThisAttack = false;
        audio.playKick();
    }

    special() {
        if (this.state === "hurt" || this.state === "stunned" || this.state === "dead" || this.state === "victory") return false;
        if (this.state === "punch" || this.state === "kick" || this.state === "special") return false;

        // Só pode usar se acertou a pergunta OU se acumulou energia cheia!
        if (!this.hasSpecialUnlocked && this.specialMeter < 100) {
            this.addComicText("ESPECIAL BLOQUEADO!", "#e74c3c");
            audio.playBlock();
            return false;
        }

        this.state = "special";
        this.stateTimer = 0;
        this.hasHitEnemyThisAttack = false;
        this.specialMeter = 0;
        this.hasSpecialUnlocked = false; // consome o uso especial concedido pela pergunta

        audio.playSpecialAttack();

        // Dispara projétil / onda de choque se for Rigby
        if (this.character === "rigby") {
            this.createHamboningShockwave();
        } else {
            // Mordecai: Soco Mortal com dash de impacto
            this.vx = this.facing * 9;
        }

        return true;
    }

    createHamboningShockwave() {
        this.specialProjectiles.push({
            x: this.facing === 1 ? this.x + this.width : this.x,
            y: this.y + this.height * 0.35,
            vx: this.facing * 8,
            radius: 20,
            maxRadius: 45,
            damage: 22 * this.damageMultiplier,
            life: 40,
            color: "#f39c12"
        });
    }

    updateProjectiles(arenaWidth) {
        for (let i = this.specialProjectiles.length - 1; i >= 0; i--) {
            const p = this.specialProjectiles[i];
            p.x += p.vx;
            p.radius = Math.min(p.maxRadius, p.radius + 0.6);
            p.life--;

            if (p.life <= 0 || p.x < 0 || p.x > arenaWidth) {
                this.specialProjectiles.splice(i, 1);
            }
        }
    }

    takeHit(damage, knockbackX, knockbackY, hitType = "punch") {
        if (this.invulnerableTimer > 0 || this.state === "dead") return false;

        // Se estiver bloqueando, absorve 80% do dano e anula knockback
        if (this.isBlocking) {
            damage *= 0.2;
            audio.playBlock();
            this.addComicText("BLOQUEOU!", "#3498db");
            this.createSparks(this.x + this.width / 2, this.y + this.height / 2, "#3498db", 6);
        } else {
            // Dano normal
            if (hitType === "kick") {
                this.addComicText("WHAM!", "#e67e22");
            } else if (hitType === "special") {
                this.addComicText("KAPOW!", "#e74c3c");
            } else {
                this.addComicText("POW!", "#f1c40f");
            }

            this.createSparks(this.x + this.width / 2, this.y + this.height / 2, "#f1c40f", 12);

            this.state = "hurt";
            this.stateTimer = 0;
            this.vx = knockbackX;
            this.vy = knockbackY;
            this.invulnerableTimer = 18;
        }

        // Aplica dano primeiro no escudo (se houver)
        if (this.shieldHp > 0) {
            if (this.shieldHp >= damage) {
                this.shieldHp -= damage;
                damage = 0;
            } else {
                damage -= this.shieldHp;
                this.shieldHp = 0;
            }
        }

        this.hp = Math.max(0, this.hp - damage);

        // Aumenta barra de fúria ao tomar dano
        this.specialMeter = Math.min(100, this.specialMeter + damage * 0.8);

        if (this.hp <= 0) {
            this.state = "dead";
            this.vx = knockbackX * 1.5;
            this.vy = -7;
            audio.playKO();
        }

        return true;
    }

    createSparks(x, y, color = "#ffeb3b", count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color,
                life: 15 + Math.random() * 10
            });
        }
    }

    addComicText(text, color = "#ffffff") {
        this.comicTexts.push({
            text,
            x: this.x + this.width / 2,
            y: this.y - 15,
            vy: -1.5,
            opacity: 1.0,
            color,
            scale: 1.2
        });
    }

    updateParticles() {
        // Partículas de faíscas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Textos em estilo HQ ("POW!", "WHAM!")
        for (let i = this.comicTexts.length - 1; i >= 0; i--) {
            const t = this.comicTexts[i];
            t.y += t.vy;
            t.opacity -= 0.035;
            if (t.opacity <= 0) {
                this.comicTexts.splice(i, 1);
            }
        }
    }

    // --- RENDERIZAÇÃO GRÁFICA CARTUNESCA NO CANVAS ---

    render(ctx) {
        ctx.save();

        // Pisca quando invulnerável
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        // Renderiza Aura de Especial ou Escudo
        if (this.hasSpecialUnlocked || this.specialMeter >= 100) {
            this.renderSpecialAura(ctx);
        }
        if (this.shieldHp > 0) {
            this.renderShieldBubble(ctx);
        }

        // Espelha o canvas de acordo com o lado para o qual o lutador está virado
        ctx.translate(this.x + this.width / 2, this.y + this.height);
        ctx.scale(this.facing, 1);

        if (this.character === "mordecai") {
            this.drawMordecai(ctx);
        } else {
            this.drawRigby(ctx);
        }

        ctx.restore();

        // Renderiza projéteis
        this.renderProjectiles(ctx);

        // Renderiza partículas de impacto e textos HQ
        this.renderEffects(ctx);
    }

    renderSpecialAura(ctx) {
        ctx.save();
        const pulse = 0.6 + Math.sin(Date.now() * 0.008) * 0.35;
        ctx.strokeStyle = this.character === "mordecai" ? `rgba(0, 210, 255, ${pulse})` : `rgba(255, 165, 0, ${pulse})`;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.character === "mordecai" ? "#00e1ff" : "#ff9900";
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.8, this.height * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    renderShieldBubble(ctx) {
        ctx.save();
        ctx.strokeStyle = "rgba(46, 204, 113, 0.85)";
        ctx.fillStyle = "rgba(46, 204, 113, 0.15)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.85, this.height * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // --- DESENHO DETALHADO DO MORDECAI ---
    drawMordecai(ctx) {
        const h = this.height;
        const w = this.width;

        // Animação de respiração / bounce
        const breath = Math.sin(this.stateTimer * 0.1) * 2;
        const isPunching = this.state === "punch";
        const isKicking = this.state === "kick";
        const isHurt = this.state === "hurt";
        const isStunned = this.state === "stunned";
        const isBlocking = this.state === "block";

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#111111";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        // Pernas (finas e pretas, clássicas do Mordecai)
        ctx.strokeStyle = "#1b1b1b";
        ctx.lineWidth = 4;
        if (isKicking) {
            // Perna de apoio
            ctx.beginPath();
            ctx.moveTo(-10, -h * 0.35);
            ctx.lineTo(-12, 0);
            ctx.stroke();

            // Perna do chute chutando para frente!
            ctx.beginPath();
            ctx.moveTo(5, -h * 0.35);
            ctx.lineTo(w * 0.6, -h * 0.4);
            ctx.lineTo(w * 0.95, -h * 0.45);
            ctx.stroke();

            // Pé chutando
            ctx.fillStyle = "#1b1b1b";
            ctx.fillRect(w * 0.9, -h * 0.48, 16, 8);
        } else {
            // Perna esquerda
            const legLeftX = -12 + (this.state === "walk" ? Math.sin(this.stateTimer * 0.3) * 12 : 0);
            ctx.beginPath();
            ctx.moveTo(-8, -h * 0.35);
            ctx.lineTo(legLeftX, 0);
            ctx.stroke();
            // Pé esquerdo
            ctx.fillStyle = "#1b1b1b";
            ctx.fillRect(legLeftX - 6, -3, 16, 4);

            // Perna direita
            const legRightX = 6 + (this.state === "walk" ? -Math.sin(this.stateTimer * 0.3) * 12 : 0);
            ctx.beginPath();
            ctx.moveTo(8, -h * 0.35);
            ctx.lineTo(legRightX, 0);
            ctx.stroke();
            // Pé direito
            ctx.fillRect(legRightX - 4, -3, 16, 4);
        }

        // Cauda do pássaro atrás
        ctx.fillStyle = "#2880b9";
        ctx.beginPath();
        ctx.moveTo(-16, -h * 0.35);
        ctx.lineTo(-w * 0.65, -h * 0.28);
        ctx.lineTo(-12, -h * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tronco do Mordecai (azul com peito branco)
        ctx.fillStyle = "#3498db";
        ctx.beginPath();
        ctx.roundRect(-w * 0.38, -h * 0.72 + breath, w * 0.76, h * 0.42, 10);
        ctx.fill();
        ctx.stroke();

        // Peito Branco
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(2, -h * 0.52 + breath, w * 0.22, h * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cabeça e Crista do Mordecai
        ctx.fillStyle = "#3498db";
        ctx.beginPath();
        // Base da cabeça
        ctx.ellipse(0, -h * 0.82 + breath, w * 0.32, h * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crista de penas pontudas atrás da cabeça
        ctx.beginPath();
        ctx.moveTo(-w * 0.2, -h * 0.9 + breath);
        ctx.lineTo(-w * 0.55, -h * 0.95 + breath);
        ctx.lineTo(-w * 0.25, -h * 0.82 + breath);
        ctx.fillStyle = "#2980b9";
        ctx.fill();
        ctx.stroke();

        // Listras pretas na crista
        ctx.fillStyle = "#111111";
        ctx.beginPath();
        ctx.ellipse(-w * 0.1, -h * 0.88 + breath, 7, 2, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Olhos grandes cartunescos
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 2;

        // Olho esquerdo
        ctx.beginPath();
        ctx.arc(-2, -h * 0.85 + breath, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Olho direito
        ctx.beginPath();
        ctx.arc(9, -h * 0.85 + breath, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pupilas
        ctx.fillStyle = "#111111";
        if (isStunned) {
            // Olhos em espiral ou X
            ctx.fillText("X", -6, -h * 0.82 + breath);
            ctx.fillText("X", 5, -h * 0.82 + breath);
        } else {
            const lookDir = isHurt ? -2 : 2;
            ctx.beginPath();
            ctx.arc(-2 + lookDir, -h * 0.85 + breath, 2.5, 0, Math.PI * 2);
            ctx.arc(9 + lookDir, -h * 0.85 + breath, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Bico do Mordecai (preto / cinza escuro)
        ctx.fillStyle = "#2c3e50";
        ctx.beginPath();
        ctx.moveTo(12, -h * 0.85 + breath);
        ctx.lineTo(w * 0.52, -h * 0.81 + breath);
        ctx.lineTo(12, -h * 0.77 + breath);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Braço / Asa
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#111111";
        ctx.fillStyle = "#3498db";

        if (isPunching) {
            // Braço socando esticado
            ctx.beginPath();
            ctx.moveTo(0, -h * 0.65 + breath);
            ctx.lineTo(w * 0.5, -h * 0.65 + breath);
            ctx.lineTo(w * 0.85, -h * 0.65 + breath);
            ctx.stroke();

            // Punho fechado com listras pretas e brancas na ponta
            ctx.fillStyle = "#3498db";
            ctx.beginPath();
            ctx.arc(w * 0.85, -h * 0.65 + breath, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Listra branca e preta nos dedos da asa
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(w * 0.82, -h * 0.68 + breath, 4, 10);
            ctx.fillStyle = "#111111";
            ctx.fillRect(w * 0.86, -h * 0.68 + breath, 4, 10);
        } else if (isBlocking) {
            // Braços cruzados
            ctx.beginPath();
            ctx.moveTo(-10, -h * 0.65);
            ctx.lineTo(15, -h * 0.75);
            ctx.lineTo(15, -h * 0.55);
            ctx.stroke();
        } else {
            // Braço repousado com listras da asa
            ctx.beginPath();
            ctx.moveTo(-4, -h * 0.65 + breath);
            ctx.lineTo(10, -h * 0.55 + breath);
            ctx.lineTo(8, -h * 0.42 + breath);
            ctx.stroke();

            // Listras da asa do Mordecai
            ctx.fillStyle = "#111111";
            ctx.fillRect(4, -h * 0.5 + breath, 4, 6);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(4, -h * 0.44 + breath, 4, 5);
        }
    }

    // --- DESENHO DETALHADO DO RIGBY ---
    drawRigby(ctx) {
        const h = this.height;
        const w = this.width;

        const breath = Math.sin(this.stateTimer * 0.12) * 2;
        const isPunching = this.state === "punch";
        const isKicking = this.state === "kick";
        const isHurt = this.state === "hurt";
        const isStunned = this.state === "stunned";
        const isBlocking = this.state === "block";

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#111111";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        // Cauda listrada do guaxinim (icônica do Rigby)
        ctx.save();
        const tailWiggle = Math.sin(this.stateTimer * 0.15) * 6;
        ctx.translate(-14, -h * 0.35 + breath);
        ctx.rotate(-0.3 + (tailWiggle * Math.PI) / 180);

        // Corpo da cauda
        ctx.fillStyle = "#8b5a2b";
        ctx.beginPath();
        ctx.ellipse(-20, -10, 26, 12, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Listras pretas da cauda
        ctx.fillStyle = "#2c1d11";
        for (let s = -32; s <= -8; s += 10) {
            ctx.fillRect(s, -18, 5, 18);
        }
        ctx.restore();

        // Pernas curtas do Rigby
        ctx.fillStyle = "#8b5a2b";
        if (isKicking) {
            // Chute voador estilo dropkick
            ctx.beginPath();
            ctx.moveTo(0, -h * 0.3);
            ctx.lineTo(w * 0.8, -h * 0.35);
            ctx.lineWidth = 6;
            ctx.strokeStyle = "#8b5a2b";
            ctx.stroke();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#111111";

            // Patinha
            ctx.fillStyle = "#2c1d11";
            ctx.fillRect(w * 0.75, -h * 0.42, 12, 10);
        } else {
            const legLeftX = -10 + (this.state === "walk" ? Math.sin(this.stateTimer * 0.35) * 10 : 0);
            ctx.beginPath();
            ctx.moveTo(-6, -h * 0.3);
            ctx.lineTo(legLeftX, 0);
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#8b5a2b";
            ctx.stroke();
            // Pata
            ctx.fillStyle = "#2c1d11";
            ctx.fillRect(legLeftX - 6, -3, 12, 4);

            const legRightX = 6 + (this.state === "walk" ? -Math.sin(this.stateTimer * 0.35) * 10 : 0);
            ctx.beginPath();
            ctx.moveTo(6, -h * 0.3);
            ctx.lineTo(legRightX, 0);
            ctx.stroke();
            ctx.fillRect(legRightX - 3, -3, 12, 4);
        }

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#111111";

        // Tronco do Rigby (marrom peludo)
        ctx.fillStyle = "#9c6634";
        ctx.beginPath();
        ctx.roundRect(-w * 0.38, -h * 0.68 + breath, w * 0.76, h * 0.45, 12);
        ctx.fill();
        ctx.stroke();

        // Barriga bronzeada / bege clara
        ctx.fillStyle = "#e0b686";
        ctx.beginPath();
        ctx.ellipse(3, -h * 0.48 + breath, w * 0.22, h * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cabeça redonda com orelhas pontudas de guaxinim
        ctx.fillStyle = "#9c6634";

        // Orelha esquerda
        ctx.beginPath();
        ctx.arc(-14, -h * 0.88 + breath, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e0b686";
        ctx.beginPath();
        ctx.arc(-14, -h * 0.88 + breath, 4, 0, Math.PI * 2);
        ctx.fill();

        // Orelha direita
        ctx.fillStyle = "#9c6634";
        ctx.beginPath();
        ctx.arc(8, -h * 0.88 + breath, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e0b686";
        ctx.beginPath();
        ctx.arc(8, -h * 0.88 + breath, 4, 0, Math.PI * 2);
        ctx.fill();

        // Formato principal da cabeça
        ctx.fillStyle = "#9c6634";
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.78 + breath, w * 0.36, h * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Máscara escura dos olhos típica de guaxinim
        ctx.fillStyle = "#3d2212";
        ctx.beginPath();
        ctx.ellipse(-1, -h * 0.8 + breath, w * 0.34, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Olhos gigantes redondos do Rigby
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#111111";

        // Olho esquerdo
        ctx.beginPath();
        ctx.arc(-7, -h * 0.8 + breath, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Olho direito
        ctx.beginPath();
        ctx.arc(7, -h * 0.8 + breath, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pupilas
        ctx.fillStyle = "#111111";
        if (isStunned) {
            ctx.fillText("X", -11, -h * 0.77 + breath);
            ctx.fillText("X", 3, -h * 0.77 + breath);
        } else {
            const lookDir = isHurt ? -2 : 2;
            ctx.beginPath();
            ctx.arc(-7 + lookDir, -h * 0.8 + breath, 2.5, 0, Math.PI * 2);
            ctx.arc(7 + lookDir, -h * 0.8 + breath, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Focinho do Rigby (bege com nariz preto)
        ctx.fillStyle = "#e0b686";
        ctx.beginPath();
        ctx.ellipse(12, -h * 0.74 + breath, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nariz
        ctx.fillStyle = "#111111";
        ctx.beginPath();
        ctx.arc(17, -h * 0.75 + breath, 3, 0, Math.PI * 2);
        ctx.fill();

        // Braços
        ctx.fillStyle = "#9c6634";
        ctx.strokeStyle = "#111111";
        if (isPunching) {
            // Soco rápido duplo
            ctx.beginPath();
            ctx.roundRect(5, -h * 0.62 + breath, w * 0.65, 12, 6);
            ctx.fill();
            ctx.stroke();

            // Pata fechada
            ctx.fillStyle = "#2c1d11";
            ctx.beginPath();
            ctx.arc(w * 0.75, -h * 0.57 + breath, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (isBlocking) {
            ctx.beginPath();
            ctx.roundRect(0, -h * 0.65, 14, 25, 4);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.roundRect(-4, -h * 0.58 + breath, 12, 20, 5);
            ctx.fill();
            ctx.stroke();
        }
    }

    renderProjectiles(ctx) {
        for (const p of this.specialProjectiles) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();

            // Onda de choque ao redor
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }

    renderEffects(ctx) {
        // Partículas de faíscas
        for (const p of this.particles) {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Textos HQ ("POW!", "WHAM!")
        for (const t of this.comicTexts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, t.opacity);
            ctx.font = "bold 20px 'Impact', 'Arial Black', sans-serif";
            ctx.textAlign = "center";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 4;
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }
    }
}
