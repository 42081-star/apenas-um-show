/**
 * Motor Principal do Jogo "Apenas Um Show: Pancadaria"
 * Loop de renderização 60 FPS, gerenciamento de estados, colisões, inputs e transições
 */

import { audio } from "./audio.js";
import { getQuestionDeck } from "./questions.js";
import { Fighter } from "./fighter.js";
import { FighterAI } from "./ai.js";
import { UIManager } from "./ui.js";

class GameEngine {
    constructor() {
        this.canvas = document.getElementById("game-canvas");
        this.ctx = this.canvas.getContext("2d");

        this.ui = new UIManager();

        // Configurações do Jogo
        this.mode = "1P"; // "1P" ou "2P"
        this.difficulty = "normal";
        this.category = "todas";
        this.maxRoundsToWin = 2; // Melhor de 3

        // Estado do Jogo
        this.state = "MENU"; // MENU, TRIVIA, TRANSITION, FIGHT, ROUND_END, MATCH_OVER
        this.currentRound = 1;
        this.p1Score = 0;
        this.p2Score = 0;

        // Estatísticas para o Placar Final
        this.p1Stats = { name: "Mordecai", questionsAnswered: 0, questionsCorrect: 0, accuracy: 0, damageDealt: 0, specialsUsed: 0 };
        this.p2Stats = { name: "Rigby", questionsAnswered: 0, questionsCorrect: 0, accuracy: 0, damageDealt: 0, specialsUsed: 0 };

        // Lutadores
        this.groundY = 490;
        this.p1 = new Fighter({ id: 1, character: "mordecai", name: "Mordecai", x: 180, y: 350, facing: 1, groundY: this.groundY });
        this.p2 = new Fighter({ id: 2, character: "rigby", name: "Rigby", x: 700, y: 350, facing: -1, groundY: this.groundY });

        // IA
        this.ai = new FighterAI(this.p2, this.difficulty);

        // Deck de perguntas da partida
        this.questionsDeck = [];
        this.currentQuestion = null;

        // Controle do cronômetro da pergunta
        this.triviaTimer = null;
        this.triviaTimeLeft = 12;
        this.p1Answered = false;
        this.p2Answered = false;
        this.firstAnswerId = null;

        // Controle de entrada (Teclado)
        this.keys = {};

        // Efeitos visuais da arena
        this.screenShake = 0;
        this.audienceAnimTimer = 0;

        // Loop de animação
        this.lastTime = 0;
        this.animationFrameId = null;
    }

    init() {
        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());

        this.setupKeyboardInput();
        this.setupVirtualControls();
        this.setupUIEvents();

        // Inicia na tela de Menu
        this.ui.showScreen("start");
        this.startLoop();
    }

    resizeCanvas() {
        // Mantém proporção interna 960x540
        this.canvas.width = 960;
        this.canvas.height = 540;
    }

    // --- EVENTOS DE INTERFACE E BOTÕES ---
    setupUIEvents() {
        // Botão 1 Jogador
        document.getElementById("btn-mode-1p").addEventListener("click", () => {
            audio.init();
            audio.resume();
            this.mode = "1P";
            this.ui.showScreen("category");
        });

        // Botão 2 Jogadores
        document.getElementById("btn-mode-2p").addEventListener("click", () => {
            audio.init();
            audio.resume();
            this.mode = "2P";
            this.ui.showScreen("category");
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

        // Seleção de Categoria e Início de Partida
        const catCards = document.querySelectorAll(".category-card");
        catCards.forEach(card => {
            card.addEventListener("click", () => {
                catCards.forEach(c => c.classList.remove("selected"));
                card.classList.add("selected");
                this.category = card.dataset.category;
            });
        });

        document.getElementById("btn-start-match").addEventListener("click", () => {
            this.startNewMatch();
        });

        document.getElementById("btn-back-menu").addEventListener("click", () => {
            this.ui.showScreen("start");
        });

        // Botão Mudo / Som
        document.getElementById("btn-toggle-sound").addEventListener("click", (e) => {
            audio.init();
            const isMuted = audio.toggleMute();
            e.currentTarget.textContent = isMuted ? "🔇 Som: Desligado" : "🔊 Som: Ligado";
        });

        // Botão Ver Ranking
        document.getElementById("btn-view-leaderboard").addEventListener("click", () => {
            this.ui.loadLeaderboard();
            this.ui.showScreen("leaderboard");
        });

        document.getElementById("btn-back-from-leaderboard").addEventListener("click", () => {
            this.ui.showScreen("start");
        });

        // Pular direto para a luta
        const skipBtn = document.getElementById("btn-skip-to-fight");
        if (skipBtn) {
            skipBtn.addEventListener("click", () => {
                if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
                this.transitionToFight();
            });
        }
    }

    // --- CONTROLE DE TECLADO ---
    setupKeyboardInput() {
        window.addEventListener("keydown", (e) => {
            audio.init();
            audio.resume();

            const code = e.code;
            const key = (e.key || "").toLowerCase();

            this.keys[code] = true;
            this.keys[key] = true;

            // Evita que as setas e espaço rolem a tela do navegador
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) {
                e.preventDefault();
            }

            // MENU PRINCIPAL
            if (this.state === "MENU") {
                if (code === "Enter" || code === "Space" || key === "1") {
                    this.mode = "1P";
                    this.state = "CATEGORY";
                    this.ui.showScreen("category");
                } else if (key === "2") {
                    this.mode = "2P";
                    this.state = "CATEGORY";
                    this.ui.showScreen("category");
                }
                return;
            }

            // TELA DE CATEGORIA
            if (this.state === "CATEGORY") {
                if (code === "Enter" || code === "Space") {
                    this.startNewMatch();
                }
                return;
            }

            // TELA DE TRIVIA
            if (this.state === "TRIVIA") {
                // Pressionar tecla numérica (1, 2, 3, 4)
                if (["Digit1", "Numpad1"].includes(code) || key === "1") this.handleP1Answer(0);
                if (["Digit2", "Numpad2"].includes(code) || key === "2") this.handleP1Answer(1);
                if (["Digit3", "Numpad3"].includes(code) || key === "3") this.handleP1Answer(2);
                if (["Digit4", "Numpad4"].includes(code) || key === "4") this.handleP1Answer(3);

                // Pressionar tecla alfabética (A, B, C, D)
                if (code === "KeyA" || key === "a") this.handleP1Answer(0);
                if (code === "KeyB" || key === "b") this.handleP1Answer(1);
                if (code === "KeyC" || key === "c") this.handleP1Answer(2);
                if (code === "KeyD" || key === "d") this.handleP1Answer(3);

                // P2 no modo 2P
                if (this.mode === "2P") {
                    if (["Digit7", "Numpad7"].includes(code) || key === "7" || key === "u") this.handleP2Answer(0);
                    if (["Digit8", "Numpad8"].includes(code) || key === "8" || key === "i") this.handleP2Answer(1);
                    if (["Digit9", "Numpad9"].includes(code) || key === "9" || key === "o") this.handleP2Answer(2);
                    if (["Digit0", "Numpad0"].includes(code) || key === "0" || key === "p") this.handleP2Answer(3);
                }
                return;
            }

            // TRANSIÇÃO (Permite pular direto para a luta)
            if (this.state === "TRANSITION") {
                if (code === "Space" || code === "Enter" || key === "f" || key === "g") {
                    this.ui.hideBanner();
                    this.state = "FIGHT";
                }
                return;
            }

            // COMBATE (FIGHT)
            if (this.state === "FIGHT") {
                const is1P = this.mode === "1P";

                // P1 Pulo: W, Seta Cima (no 1P), Espaço
                if (code === "KeyW" || key === "w" || (is1P && (code === "ArrowUp" || key === "arrowup")) || code === "Space" || key === " ") {
                    this.p1.jump();
                }

                // P1 Soco: F, J, Z, 1
                if (code === "KeyF" || key === "f" || (is1P && (code === "KeyJ" || key === "j")) || code === "KeyZ" || key === "z" || key === "1") {
                    this.p1.punch();
                    this.p1Stats.damageDealt += 1;
                }

                // P1 Chute: G, K, X, 2
                if (code === "KeyG" || key === "g" || (is1P && (code === "KeyK" || key === "k")) || code === "KeyX" || key === "x" || key === "2") {
                    this.p1.kick();
                    this.p1Stats.damageDealt += 1;
                }

                // P1 Especial: H, L, C, 3, E
                if (code === "KeyH" || key === "h" || (is1P && (code === "KeyL" || key === "l")) || code === "KeyC" || key === "c" || key === "e" || key === "3") {
                    if (this.p1.special()) this.p1Stats.specialsUsed++;
                }

                // P2 no modo 2P
                if (!is1P) {
                    if (code === "ArrowUp" || key === "arrowup") this.p2.jump();
                    if (code === "KeyK" || key === "k" || code === "Numpad1") {
                        this.p2.punch();
                        this.p2Stats.damageDealt += 1;
                    }
                    if (code === "KeyL" || key === "l" || code === "Numpad2") {
                        this.p2.kick();
                        this.p2Stats.damageDealt += 1;
                    }
                    if (code === "KeyP" || key === "p" || code === "Numpad3") {
                        if (this.p2.special()) this.p2Stats.specialsUsed++;
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
    }

    // --- CONTROLES VIRTUAIS NA TELA (MOBILE / MOUSE) ---
    setupVirtualControls() {
        const bindBtn = (id, onDown, onUp) => {
            const el = document.getElementById(id);
            if (!el) return;
            const start = (e) => {
                e.preventDefault();
                e.stopPropagation();
                audio.init();
                audio.resume();
                onDown();
            };
            const end = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onUp) onUp();
            };
            el.addEventListener("mousedown", start);
            el.addEventListener("mouseup", end);
            el.addEventListener("mouseleave", end);
            el.addEventListener("touchstart", start, { passive: false });
            el.addEventListener("touchend", end, { passive: false });
            el.addEventListener("touchcancel", end, { passive: false });
        };

        bindBtn("vbtn-p1-left", () => { this.keys["KeyA"] = true; this.keys["a"] = true; }, () => { this.keys["KeyA"] = false; this.keys["a"] = false; });
        bindBtn("vbtn-p1-right", () => { this.keys["KeyD"] = true; this.keys["d"] = true; }, () => { this.keys["KeyD"] = false; this.keys["d"] = false; });
        bindBtn("vbtn-p1-jump", () => this.p1.jump());
        bindBtn("vbtn-p1-block", () => { this.keys["KeyS"] = true; this.keys["s"] = true; }, () => { this.keys["KeyS"] = false; this.keys["s"] = false; });
        bindBtn("vbtn-p1-punch", () => { this.p1.punch(); this.p1Stats.damageDealt += 1; });
        bindBtn("vbtn-p1-kick", () => { this.p1.kick(); this.p1Stats.damageDealt += 1; });
        bindBtn("vbtn-p1-special", () => { if (this.p1.special()) this.p1Stats.specialsUsed++; });
    }

    setupCanvasClicks() {
        this.canvas.addEventListener("mousedown", (e) => {
            audio.init();
            audio.resume();
            if (this.state === "FIGHT") {
                if (e.button === 0) { // Clique esquerdo: Soco
                    this.p1.punch();
                    this.p1Stats.damageDealt += 1;
                } else if (e.button === 2) { // Clique direito: Chute
                    e.preventDefault();
                    this.p1.kick();
                    this.p1Stats.damageDealt += 1;
                }
            }
        });

        this.canvas.addEventListener("contextmenu", (e) => {
            if (this.state === "FIGHT") e.preventDefault();
        });
    }

    // --- CICLO DA PARTIDA ---
    startNewMatch() {
        this.questionsDeck = getQuestionDeck(this.category);
        this.currentRound = 1;
        this.p1Score = 0;
        this.p2Score = 0;

        this.p1Stats = { name: "Mordecai", questionsAnswered: 0, questionsCorrect: 0, accuracy: 0, damageDealt: 0, specialsUsed: 0 };
        this.p2Stats = { name: "Rigby", questionsAnswered: 0, questionsCorrect: 0, accuracy: 0, damageDealt: 0, specialsUsed: 0 };

        this.startTriviaRound();
    }

    // --- FASE 1: AUDITÓRIO DE PERGUNTAS DO BENSON ---
    startTriviaRound() {
        this.state = "TRIVIA";
        audio.startBgm("quiz");

        // Seleciona pergunta
        if (this.questionsDeck.length === 0) {
            this.questionsDeck = getQuestionDeck(this.category);
        }
        this.currentQuestion = this.questionsDeck.pop();

        this.p1Answered = false;
        this.p2Answered = false;
        this.firstAnswerId = null;
        this.p1TriviaCorrect = false;
        this.p2TriviaCorrect = false;

        this.ui.showScreen("trivia");
        this.ui.setupTriviaUI(
            this.currentQuestion,
            this.currentRound,
            (optIdx) => this.handleP1Answer(optIdx),
            (optIdx) => this.handleP2Answer(optIdx),
            this.mode === "2P"
        );

        // Dispara IA para a resposta no modo 1P
        if (this.mode === "1P") {
            this.ai.planTriviaAnswer(
                this.currentQuestion.answer,
                this.currentQuestion.options.length,
                (chosenOption, willGetRight) => {
                    if (this.state === "TRIVIA" && !this.p2Answered) {
                        this.handleP2Answer(chosenOption);
                    }
                }
            );
        }

        // Inicia contagem regressiva de 12 segundos
        this.triviaTimeLeft = 12;
        this.ui.updateTimerDisplay(this.triviaTimeLeft);

        if (this.triviaTimer) clearInterval(this.triviaTimer);

        this.triviaTimer = setInterval(() => {
            this.triviaTimeLeft -= 0.1;
            this.ui.updateTimerDisplay(this.triviaTimeLeft);

            // Som de tique-taque a cada segundo
            if (Math.abs(Math.round(this.triviaTimeLeft) - this.triviaTimeLeft) < 0.06) {
                const urgency = this.triviaTimeLeft <= 4 ? 1.6 : 1.0;
                audio.playCountdownTick(urgency);
            }

            if (this.triviaTimeLeft <= 0) {
                clearInterval(this.triviaTimer);
                this.resolveTriviaRound();
            }
        }, 100);
    }

    handleP1Answer(optionIndex) {
        if (this.p1Answered || this.state !== "TRIVIA") return;
        this.p1Answered = true;
        this.p1Stats.questionsAnswered++;

        if (!this.firstAnswerId) this.firstAnswerId = 1;

        const isCorrect = optionIndex === this.currentQuestion.answer;
        this.p1TriviaCorrect = isCorrect;

        if (isCorrect) {
            audio.playBuzzerCorrect();
            this.p1Stats.questionsCorrect++;
        } else {
            audio.playBuzzerWrong();
        }

        // Destaca botão escolhido
        this.highlightOptionButton(optionIndex, isCorrect, "P1");

        // Se ambos responderam (ou no 1P se o player já respondeu), resolve
        if (this.mode === "1P" || this.p2Answered) {
            clearInterval(this.triviaTimer);
            setTimeout(() => this.resolveTriviaRound(), 800);
        }
    }

    handleP2Answer(optionIndex) {
        if (this.p2Answered || this.state !== "TRIVIA") return;
        this.p2Answered = true;
        this.p2Stats.questionsAnswered++;

        if (!this.firstAnswerId) this.firstAnswerId = 2;

        const isCorrect = optionIndex === this.currentQuestion.answer;
        this.p2TriviaCorrect = isCorrect;

        if (isCorrect) {
            audio.playBuzzerCorrect();
            this.p2Stats.questionsCorrect++;
        } else {
            audio.playBuzzerWrong();
        }

        this.highlightOptionButton(optionIndex, isCorrect, "P2");

        if (this.p1Answered) {
            clearInterval(this.triviaTimer);
            setTimeout(() => this.resolveTriviaRound(), 800);
        }
    }

    highlightOptionButton(idx, isCorrect, playerLabel) {
        const btn = document.querySelector(`.trivia-option-btn[data-index="${idx}"]`);
        if (!btn) return;
        btn.classList.add(isCorrect ? "option-correct" : "option-wrong");
        const badge = document.createElement("span");
        badge.className = `player-badge ${playerLabel.toLowerCase()}`;
        badge.textContent = playerLabel;
        btn.appendChild(badge);
    }

    resolveTriviaRound() {
        if (this.triviaTimer) clearInterval(this.triviaTimer);
        this.ai.cancelTriviaPlan();

        // Determina quem ganhou vantagem
        let winnerName = "";
        let isP1Winner = false;
        let isDraw = false;

        if (this.p1TriviaCorrect && !this.p2TriviaCorrect) {
            winnerName = this.p1.name;
            isP1Winner = true;
        } else if (!this.p1TriviaCorrect && this.p2TriviaCorrect) {
            winnerName = this.p2.name;
            isP1Winner = false;
        } else if (this.p1TriviaCorrect && this.p2TriviaCorrect) {
            // Ambos acertaram: desempate pelo primeiro a responder
            if (this.firstAnswerId === 1) {
                winnerName = `${this.p1.name} (Mais Rápido!)`;
                isP1Winner = true;
            } else {
                winnerName = `${this.p2.name} (Mais Rápido!)`;
                isP1Winner = false;
            }
        } else {
            isDraw = true;
        }

        // Aplica vantagens aos lutadores
        this.p1.resetForRound(180, 1);
        this.p2.resetForRound(700, -1);

        if (!isDraw) {
            if (isP1Winner) {
                this.p1.applyTriviaResult({ answeredCorrectly: true, isFirstToAnswer: true, isOpponentWrong: !this.p2TriviaCorrect });
                this.p2.applyTriviaResult({ answeredCorrectly: false, isFirstToAnswer: false, isOpponentWrong: false });
            } else {
                this.p2.applyTriviaResult({ answeredCorrectly: true, isFirstToAnswer: true, isOpponentWrong: !this.p1TriviaCorrect });
                this.p1.applyTriviaResult({ answeredCorrectly: false, isFirstToAnswer: false, isOpponentWrong: false });
            }
        }

        this.ui.showTriviaResult({
            winnerName,
            isP1Winner,
            factText: this.currentQuestion.fact,
            isDraw
        });

        // Transição para o combate
        if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
        this.transitionTimeout = setTimeout(() => {
            this.transitionToFight();
        }, 2200);
    }

    // --- FASE 2: TRANSIÇÃO PARA A ARENA ---
    async transitionToFight() {
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }

        this.state = "TRANSITION";
        this.ui.showScreen("fight");
        audio.stopBgm();
        audio.playRegularShowOoh();

        await this.ui.showBanner(`ROUND ${this.currentRound}`, "HORA DA PANCADARIA!", 1100);
        audio.startBgm("fight");
        this.state = "FIGHT";
    }

    // --- FASE 3: COMBATE 2D BRAWLER ---
    updateFight() {
        const is1P = this.mode === "1P";

        // P1 Movimentação: suporta WASD ou Setas (no 1P)
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

        // P2 (se 2P) ou Inteligência Artificial (se 1P)
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
            // IA do P2
            this.ai.update(this.p1);
        }

        // Atualiza física e estados dos lutadores
        this.p1.update(this.canvas.width);
        this.p2.update(this.canvas.width);

        // Detecção de Colisões de Golpes (Hitbox vs Hurtbox)
        this.checkCombatCollisions();

        // Atualiza HUD de combate (HP e Especiais)
        this.ui.updateFightHUD(this.p1, this.p2, this.p1Score, this.p2Score, this.maxRoundsToWin);

        // Verifica vitória por KO
        if (this.p1.hp <= 0 || this.p2.hp <= 0) {
            this.handleRoundKO();
        }
    }

    checkCombatCollisions() {
        // P1 atacando P2
        if (this.p1.hitbox && !this.p1.hasHitEnemyThisAttack) {
            if (this.isBoxColliding(this.p1.hitbox, this.p2)) {
                this.p2.takeHit(this.p1.hitbox.damage, this.p1.hitbox.knockbackX, this.p1.hitbox.knockbackY, this.p1.hitbox.type);
                this.p1.hasHitEnemyThisAttack = true;
                this.triggerScreenShake(7);
            }
        }

        // P2 atacando P1
        if (this.p2.hitbox && !this.p2.hasHitEnemyThisAttack) {
            if (this.isBoxColliding(this.p2.hitbox, this.p1)) {
                this.p1.takeHit(this.p2.hitbox.damage, this.p2.hitbox.knockbackX, this.p2.hitbox.knockbackY, this.p2.hitbox.type);
                this.p2.hasHitEnemyThisAttack = true;
                this.triggerScreenShake(7);
            }
        }

        // Projéteis do Especial de P1
        for (let i = this.p1.specialProjectiles.length - 1; i >= 0; i--) {
            const p = this.p1.specialProjectiles[i];
            if (this.isCircleBoxColliding(p, this.p2)) {
                this.p2.takeHit(p.damage, this.p1.facing * 10, -6, "special");
                this.p1.specialProjectiles.splice(i, 1);
                this.triggerScreenShake(12);
            }
        }

        // Projéteis do Especial de P2
        for (let i = this.p2.specialProjectiles.length - 1; i >= 0; i--) {
            const p = this.p2.specialProjectiles[i];
            if (this.isCircleBoxColliding(p, this.p1)) {
                this.p1.takeHit(p.damage, this.p2.facing * 10, -6, "special");
                this.p2.specialProjectiles.splice(i, 1);
                this.triggerScreenShake(12);
            }
        }
    }

    isBoxColliding(hit, fighter) {
        return (
            hit.x < fighter.x + fighter.width &&
            hit.x + hit.width > fighter.x &&
            hit.y < fighter.y + fighter.height &&
            hit.y + hit.height > fighter.y
        );
    }

    isCircleBoxColliding(c, fighter) {
        const closestX = Math.max(fighter.x, Math.min(c.x, fighter.x + fighter.width));
        const closestY = Math.max(fighter.y, Math.min(c.y, fighter.y + fighter.height));
        const dx = c.x - closestX;
        const dy = c.y - closestY;
        return (dx * dx + dy * dy) < (c.radius * c.radius);
    }

    triggerScreenShake(intensity = 8) {
        this.screenShake = intensity;
    }

    // --- FIM DE ROUND & TRANSIÇÃO DE PARTIDA ---
    async handleRoundKO() {
        this.state = "ROUND_END";
        audio.stopBgm();

        const p1Won = this.p2.hp <= 0 && this.p1.hp > 0;
        const p2Won = this.p1.hp <= 0 && this.p2.hp > 0;

        if (p1Won) {
            this.p1Score++;
            this.p1.state = "victory";
            this.triggerScreenShake(14);
            await this.ui.showBanner("K.O.!", `${this.p1.name.toUpperCase()} VENCEU O ROUND!`, 2200);
        } else if (p2Won) {
            this.p2Score++;
            this.p2.state = "victory";
            this.triggerScreenShake(14);
            await this.ui.showBanner("K.O.!", `${this.p2.name.toUpperCase()} VENCEU O ROUND!`, 2200);
        } else {
            // Empate duplo
            await this.ui.showBanner("DOUBLE K.O.!", "NINGUÉM PONTUA!", 2200);
        }

        // Verifica se a partida terminou (melhor de 3)
        if (this.p1Score >= this.maxRoundsToWin || this.p2Score >= this.maxRoundsToWin) {
            this.finishMatch();
        } else {
            // Próximo round
            this.currentRound++;
            this.startTriviaRound();
        }
    }

    finishMatch() {
        this.state = "MATCH_OVER";
        const winner = this.p1Score >= this.maxRoundsToWin ? this.p1 : this.p2;

        // Calcula taxa de acerto
        this.p1Stats.accuracy = this.p1Stats.questionsAnswered > 0
            ? Math.round((this.p1Stats.questionsCorrect / this.p1Stats.questionsAnswered) * 100)
            : 0;
        this.p2Stats.accuracy = this.p2Stats.questionsAnswered > 0
            ? Math.round((this.p2Stats.questionsCorrect / this.p2Stats.questionsAnswered) * 100)
            : 0;

        this.ui.showMatchOver({
            winner,
            p1Stats: this.p1Stats,
            p2Stats: this.p2Stats,
            is2PMode: this.mode === "2P"
        });
    }

    // --- RENDERIZAÇÃO DA ARENA E AMBIENTAÇÃO ---
    renderArena() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();

        // Aplica Screen Shake
        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.screenShake;
            const sy = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(sx, sy);
            this.screenShake *= 0.88;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        // Fundo estilo Show de TV dos anos 80 (Gradiente Roxo/Azul escuro)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, "#120826");
        bgGrad.addColorStop(0.5, "#2a144e");
        bgGrad.addColorStop(0.85, "#1f0938");
        bgGrad.addColorStop(1, "#0d041a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Holofotes de Auditório
        this.audienceAnimTimer += 0.03;
        ctx.save();
        ctx.globalCompositeOperation = "screen";

        const light1 = Math.sin(this.audienceAnimTimer) * 180 + w * 0.3;
        const beamGrad1 = ctx.createRadialGradient(light1, 0, 20, light1, h * 0.7, 300);
        beamGrad1.addColorStop(0, "rgba(255, 230, 100, 0.28)");
        beamGrad1.addColorStop(1, "rgba(255, 230, 100, 0)");
        ctx.fillStyle = beamGrad1;
        ctx.beginPath();
        ctx.moveTo(w * 0.2, 0);
        ctx.lineTo(light1 - 150, h * 0.85);
        ctx.lineTo(light1 + 150, h * 0.85);
        ctx.closePath();
        ctx.fill();

        const light2 = -Math.sin(this.audienceAnimTimer * 0.8) * 180 + w * 0.7;
        const beamGrad2 = ctx.createRadialGradient(light2, 0, 20, light2, h * 0.7, 300);
        beamGrad2.addColorStop(0, "rgba(0, 225, 255, 0.24)");
        beamGrad2.addColorStop(1, "rgba(0, 225, 255, 0)");
        ctx.fillStyle = beamGrad2;
        ctx.beginPath();
        ctx.moveTo(w * 0.8, 0);
        ctx.lineTo(light2 - 150, h * 0.85);
        ctx.lineTo(light2 + 150, h * 0.85);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Plateia animada ao fundo (Silhuetas vibrando com olhos cartoon)
        this.drawAudience(ctx, w, h);

        // Chão da Arena de Luta (Ringue / Palco)
        const stageGrad = ctx.createLinearGradient(0, this.groundY, 0, h);
        stageGrad.addColorStop(0, "#e74c3c");
        stageGrad.addColorStop(0.1, "#c0392b");
        stageGrad.addColorStop(0.3, "#7f1d1d");
        stageGrad.addColorStop(1, "#3c0a0a");
        ctx.fillStyle = stageGrad;
        ctx.fillRect(0, this.groundY, w, h - this.groundY);

        // Linha de neon dourada na borda do ringue
        ctx.strokeStyle = "#f39c12";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(w, this.groundY);
        ctx.stroke();

        // Cordas do ringue / Barreiras no fundo
        ctx.strokeStyle = "rgba(241, 196, 15, 0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY - 45);
        ctx.lineTo(w, this.groundY - 45);
        ctx.moveTo(0, this.groundY - 85);
        ctx.lineTo(w, this.groundY - 85);
        ctx.stroke();

        // Renderiza os lutadores no ringue
        this.p1.render(ctx);
        this.p2.render(ctx);

        ctx.restore();
    }

    drawAudience(ctx, w, h) {
        ctx.save();
        ctx.fillStyle = "#0c0517";

        // Fileira de trás
        for (let x = 20; x < w; x += 55) {
            const bob = Math.sin(this.audienceAnimTimer * 2 + x) * 4;
            ctx.beginPath();
            ctx.arc(x, this.groundY - 75 + bob, 18, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fileira da frente
        ctx.fillStyle = "#180a2e";
        for (let x = 45; x < w; x += 65) {
            const bob = Math.cos(this.audienceAnimTimer * 2.5 + x) * 6;
            ctx.beginPath();
            ctx.arc(x, this.groundY - 50 + bob, 22, 0, Math.PI * 2);
            ctx.fill();

            // Olhos brilhando na multidão
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x - 5, this.groundY - 54 + bob, 3, 3);
            ctx.fillRect(x + 2, this.groundY - 54 + bob, 3, 3);
            ctx.fillStyle = "#180a2e";
        }

        ctx.restore();
    }

    // --- LOOP PRINCIPAL DO JOGO (60 FPS) ---
    startLoop() {
        const loop = (timestamp) => {
            if (this.state === "FIGHT" || this.state === "TRANSITION" || this.state === "ROUND_END") {
                if (this.state === "FIGHT") {
                    this.updateFight();
                }
                this.renderArena();
            }
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }
}

// Inicia o jogo assim que a página carregar
window.addEventListener("DOMContentLoaded", () => {
    const game = new GameEngine();
    game.init();
});
