/**
 * Inteligência Artificial para oponente controlado pelo computador (CPU)
 * Simula tempo de resposta humano no Quiz e táticas de luta dinâmicas na Arena!
 */

export class FighterAI {
    constructor(fighter, difficulty = "normal") {
        this.fighter = fighter;
        this.difficulty = difficulty; // "facil", "normal", "dificil"
        this.actionTimer = 0;
        this.nextDecisionDelay = 15;
        this.triviaTimer = null;
    }

    setDifficulty(diff) {
        this.difficulty = diff;
    }

    // --- DECISÃO NA FASE DO SHOW DE PERGUNTAS ---
    planTriviaAnswer(correctAnswerIndex, optionsCount, onAnswerChosen) {
        // Cancela agendamento anterior
        if (this.triviaTimer) {
            clearTimeout(this.triviaTimer);
            this.triviaTimer = null;
        }

        let minDelay = 4000;
        let maxDelay = 9000;
        let accuracy = 0.70;

        if (this.difficulty === "facil") {
            minDelay = 6000;
            maxDelay = 11000;
            accuracy = 0.45;
        } else if (this.difficulty === "dificil") {
            minDelay = 2500;
            maxDelay = 6000;
            accuracy = 0.90;
        }

        const thinkingTime = Math.random() * (maxDelay - minDelay) + minDelay;

        this.triviaTimer = setTimeout(() => {
            const willGetRight = Math.random() < accuracy;
            let chosenOption = correctAnswerIndex;

            if (!willGetRight) {
                // Escolhe uma opção errada aleatória
                const wrongOptions = [];
                for (let i = 0; i < optionsCount; i++) {
                    if (i !== correctAnswerIndex) wrongOptions.push(i);
                }
                chosenOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            }

            onAnswerChosen(chosenOption, willGetRight);
        }, thinkingTime);
    }

    cancelTriviaPlan() {
        if (this.triviaTimer) {
            clearTimeout(this.triviaTimer);
            this.triviaTimer = null;
        }
    }

    // --- COMPORTAMENTO TÁTICO NA ARENA DE LUTA ---
    update(opponent) {
        if (this.fighter.state === "hurt" || this.fighter.state === "stunned" || this.fighter.state === "dead") {
            return;
        }

        this.actionTimer++;
        if (this.actionTimer < this.nextDecisionDelay) {
            return;
        }

        this.actionTimer = 0;
        this.nextDecisionDelay = Math.floor(Math.random() * 8) + 8; // reavalia a cada 100-250ms

        const dx = (opponent.x + opponent.width / 2) - (this.fighter.x + this.fighter.width / 2);
        const dist = Math.abs(dx);
        const desiredFacing = dx > 0 ? 1 : -1;

        // Sempre vira na direção do oponente
        this.fighter.facing = desiredFacing;

        // Se o oponente estiver atordoado, rush total para finalizar!
        if (opponent.state === "stunned") {
            if (dist > 70) {
                this.fighter.move(desiredFacing);
            } else {
                this.fighter.stopMoving();
                if (this.fighter.hasSpecialUnlocked || this.fighter.specialMeter >= 100) {
                    this.fighter.special();
                } else {
                    Math.random() < 0.5 ? this.fighter.punch() : this.fighter.kick();
                }
            }
            return;
        }

        // Se tiver o Especial desbloqueado pela pergunta e estiver em alcance, dispara!
        if ((this.fighter.hasSpecialUnlocked || this.fighter.specialMeter >= 100) && dist < 180) {
            if (Math.random() < 0.75) {
                this.fighter.special();
                return;
            }
        }

        // Se o oponente está atacando e está perto, chance de defender
        const isOpponentAttacking = opponent.state === "punch" || opponent.state === "kick" || opponent.state === "special";
        const blockChance = this.difficulty === "facil" ? 0.2 : (this.difficulty === "normal" ? 0.45 : 0.75);

        if (isOpponentAttacking && dist < 110 && Math.random() < blockChance) {
            this.fighter.startBlock();
            setTimeout(() => {
                this.fighter.stopBlock();
            }, 300);
            return;
        }

        // Distância Longe (> 240px)
        if (dist > 220) {
            this.fighter.move(desiredFacing);

            // Chance de pular para encurtar distância
            if (Math.random() < 0.25 && this.fighter.isGrounded) {
                this.fighter.jump();
            }
        }
        // Distância Média (90px - 220px)
        else if (dist > 85) {
            if (Math.random() < 0.65) {
                this.fighter.move(desiredFacing);
            } else {
                this.fighter.stopMoving();
                // Chute longo de aproximação
                if (Math.random() < 0.3) {
                    this.fighter.kick();
                }
            }
        }
        // Corpo a Corpo (< 85px)
        else {
            this.fighter.stopMoving();
            const actionRoll = Math.random();

            if (actionRoll < 0.45) {
                this.fighter.punch();
            } else if (actionRoll < 0.75) {
                this.fighter.kick();
            } else if (actionRoll < 0.90) {
                this.fighter.startBlock();
                setTimeout(() => this.fighter.stopBlock(), 250);
            } else {
                // Pequeno recuo tático
                this.fighter.move(-desiredFacing);
                setTimeout(() => this.fighter.stopMoving(), 180);
            }
        }
    }
}
