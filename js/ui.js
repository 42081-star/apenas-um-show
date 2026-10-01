/**
 * Gerenciador de Interface de Usuário (UI), Auditório com Benson e Telas do Jogo
 */

import { audio } from "./audio.js";

export class UIManager {
    constructor() {
        // Elementos de Telas
        this.screenStart = document.getElementById("screen-start");
        this.screenCategory = document.getElementById("screen-category");
        this.screenTrivia = document.getElementById("screen-trivia");
        this.screenFightHud = document.getElementById("fight-hud");
        this.screenRoundBanner = document.getElementById("round-banner");
        this.screenMatchOver = document.getElementById("screen-match-over");
        this.screenLeaderboard = document.getElementById("screen-leaderboard");

        // Elementos do Show de Perguntas
        this.questionCategoryBadge = document.getElementById("trivia-category-badge");
        this.questionRoundBadge = document.getElementById("trivia-round-badge");
        this.questionText = document.getElementById("trivia-question-text");
        this.optionsContainer = document.getElementById("trivia-options");
        this.timerBar = document.getElementById("trivia-timer-bar");
        this.timerNumber = document.getElementById("trivia-timer-number");
        this.bensonSpeech = document.getElementById("benson-speech-text");
        this.bensonHead = document.getElementById("benson-head-svg");
        this.bensonGumballs = document.getElementById("benson-gumballs-group");
        this.triviaFeedback = document.getElementById("trivia-feedback-overlay");
        this.triviaFactText = document.getElementById("trivia-fact-text");

        // Elementos do HUD de Combate
        this.p1HpFill = document.getElementById("p1-hp-fill");
        this.p1HpShield = document.getElementById("p1-hp-shield");
        this.p1Name = document.getElementById("p1-name");
        this.p1SpecialBadge = document.getElementById("p1-special-badge");
        this.p1RoundsEl = document.getElementById("p1-rounds");

        this.p2HpFill = document.getElementById("p2-hp-fill");
        this.p2HpShield = document.getElementById("p2-hp-shield");
        this.p2Name = document.getElementById("p2-name");
        this.p2SpecialBadge = document.getElementById("p2-special-badge");
        this.p2RoundsEl = document.getElementById("p2-rounds");

        // Benson quotes
        this.bensonQuotesIntro = [
            "Se vocês dois destruírem o parque de novo, ESTÃO DEMITIDOS!",
            "Hora do Show! Quem acertar ganha vantagem na porrada!",
            "Prestem atenção nas perguntas ou vão limpar as folhas do parque!",
            "Valendo o especial cósmico! Mostrem que não são dois preguiçosos!"
        ];

        this.bensonQuotesCorrect = [
            "FINALMENTE ALGUÉM COM CÉREBRO!",
            "ACERTOU! AGORA VAI LÁ E DETONA!",
            "Belo palpite! Leve essa vantagem para o ringue!",
            "Muito bem! Especial liberado para a pancadaria!"
        ];

        this.bensonQuotesWrong = [
            "VOCÊS SÃO INACREDITÁVEIS! COMO ERRARAM ISSO?!",
            "ERRADO! VÃO COMEÇAR A LUTA COM UMA DOR DE CABEÇA!",
            "PATÉTICO! MAIS CINCO SEGUNDOS E EU MESMO DEMITO VOCÊS!",
            "QUE RESPOSTA HORRÍVEL! PENALIDADE NA ARENA!"
        ];
    }

    // --- TROCA DE TELAS ---
    showScreen(screenName) {
        const screens = [
            this.screenStart,
            this.screenCategory,
            this.screenTrivia,
            this.screenMatchOver,
            this.screenLeaderboard
        ];

        screens.forEach(s => {
            if (s) s.classList.add("hidden");
        });

        if (screenName === "start" && this.screenStart) {
            this.screenStart.classList.remove("hidden");
            this.screenFightHud.classList.add("hidden");
        } else if (screenName === "category" && this.screenCategory) {
            this.screenCategory.classList.remove("hidden");
            this.screenFightHud.classList.add("hidden");
        } else if (screenName === "trivia" && this.screenTrivia) {
            this.screenTrivia.classList.remove("hidden");
            this.screenFightHud.classList.add("hidden");
        } else if (screenName === "fight") {
            this.screenFightHud.classList.remove("hidden");
        } else if (screenName === "match-over" && this.screenMatchOver) {
            this.screenMatchOver.classList.remove("hidden");
            this.screenFightHud.classList.add("hidden");
        } else if (screenName === "leaderboard" && this.screenLeaderboard) {
            this.screenLeaderboard.classList.remove("hidden");
        }
    }

    // --- APRESENTADOR BENSON ---
    setBensonMood(mood = "normal", customText = null) {
        if (!this.bensonHead) return;

        if (mood === "angry") {
            this.bensonHead.style.fill = "#e74c3c"; // Vermelho furioso!
            const quote = customText || this.bensonQuotesWrong[Math.floor(Math.random() * this.bensonQuotesWrong.length)];
            this.bensonSpeech.textContent = `"${quote}"`;
            this.bensonSpeech.parentElement.classList.add("bubble-shake");
            setTimeout(() => this.bensonSpeech.parentElement.classList.remove("bubble-shake"), 600);
        } else if (mood === "happy") {
            this.bensonHead.style.fill = "#3498db"; // Azul contente
            const quote = customText || this.bensonQuotesCorrect[Math.floor(Math.random() * this.bensonQuotesCorrect.length)];
            this.bensonSpeech.textContent = `"${quote}"`;
        } else {
            this.bensonHead.style.fill = "#bdc3c7"; // Prateado padrão de máquina de chiclete
            const quote = customText || this.bensonQuotesIntro[Math.floor(Math.random() * this.bensonQuotesIntro.length)];
            this.bensonSpeech.textContent = `"${quote}"`;
        }
    }

    // --- CONFIGURAÇÃO DA FASE DE PERGUNTAS ---
    setupTriviaUI(questionObj, roundNum, onSelectOptionP1, onSelectOptionP2, is2PMode = false) {
        this.triviaFeedback.classList.add("hidden");
        this.questionRoundBadge.textContent = `ROUND ${roundNum} - PROVA DO AUDITÓRIO`;
        this.questionCategoryBadge.textContent = questionObj.category ? questionObj.category.toUpperCase().replace("_", " ") : "GERAL";
        this.questionText.textContent = questionObj.question;

        this.setBensonMood("normal");

        this.optionsContainer.innerHTML = "";
        const letters = ["A", "B", "C", "D"];

        questionObj.options.forEach((optText, idx) => {
            const btn = document.createElement("button");
            btn.className = "trivia-option-btn";
            btn.dataset.index = idx;

            const keyP1 = idx + 1;
            const keyP2 = [7, 8, 9, 0][idx];

            btn.innerHTML = `
                <span class="option-letter">${letters[idx]}</span>
                <span class="option-text">${optText}</span>
                <div class="option-key-hints">
                    <span class="key-hint p1-key">[${keyP1}]</span>
                    ${is2PMode ? `<span class="key-hint p2-key">[${keyP2}]</span>` : ""}
                </div>
            `;

            btn.addEventListener("click", () => {
                onSelectOptionP1(idx);
            });

            this.optionsContainer.appendChild(btn);
        });
    }

    updateTimerDisplay(timeLeft, totalTime = 12) {
        const pct = Math.max(0, (timeLeft / totalTime) * 100);
        this.timerBar.style.width = `${pct}%`;
        this.timerNumber.textContent = Math.ceil(timeLeft);

        if (timeLeft <= 4) {
            this.timerBar.classList.add("timer-urgent");
            this.timerNumber.classList.add("timer-urgent-text");
            this.setBensonMood("angry", "O TEMPO ESTÁ ACABANDO, SEUS PREGUIÇOSOS!");
        } else {
            this.timerBar.classList.remove("timer-urgent");
            this.timerNumber.classList.remove("timer-urgent-text");
        }
    }

    showTriviaResult({ winnerName, isP1Winner, factText, isDraw = false }) {
        this.triviaFeedback.classList.remove("hidden");
        const titleEl = document.getElementById("trivia-feedback-title");
        const descEl = document.getElementById("trivia-feedback-desc");

        if (isDraw) {
            titleEl.textContent = "TEMPO ESGOTADO OU ERRO DUPLO!";
            titleEl.style.color = "#e67e22";
            descEl.textContent = "Nenhum lutador ganhou vantagens para este round. Que vergonha!";
            this.setBensonMood("angry", "INÚTEIS! NINGUÉM PONTUOU!");
        } else {
            titleEl.textContent = `${winnerName.toUpperCase()} ACERTOU!`;
            titleEl.style.color = isP1Winner ? "#3498db" : "#e67e22";
            descEl.innerHTML = `<strong>VANTAGEM CONCEDIDA:</strong> +Escudo de Vida, +50% de Dano e <strong>GOLPE ESPECIAL LIBERADO!</strong>`;
            this.setBensonMood("happy");
        }

        this.triviaFactText.innerHTML = `<em>Curiosidade:</em> ${factText}`;
    }

    // --- HUD DE COMBATE ---
    updateFightHUD(p1, p2, p1Rounds, p2Rounds, maxRoundsToWin = 2) {
        // P1 Barra de Vida
        const p1Pct = Math.max(0, (p1.hp / p1.maxHp) * 100);
        this.p1HpFill.style.width = `${p1Pct}%`;
        this.p1HpShield.style.width = `${Math.min(100, (p1.shieldHp / 35) * 100)}%`;
        this.p1Name.textContent = p1.name;

        // P2 Barra de Vida
        const p2Pct = Math.max(0, (p2.hp / p2.maxHp) * 100);
        this.p2HpFill.style.width = `${p2Pct}%`;
        this.p2HpShield.style.width = `${Math.min(100, (p2.shieldHp / 35) * 100)}%`;
        this.p2Name.textContent = p2.name;

        // Badge Especial
        if (p1.hasSpecialUnlocked || p1.specialMeter >= 100) {
            this.p1SpecialBadge.classList.add("special-active");
            this.p1SpecialBadge.textContent = "ESPECIAL PRONTO! [H]";
        } else {
            this.p1SpecialBadge.classList.remove("special-active");
            this.p1SpecialBadge.textContent = `ESPECIAL: ${Math.floor(p1.specialMeter)}%`;
        }

        if (p2.hasSpecialUnlocked || p2.specialMeter >= 100) {
            this.p2SpecialBadge.classList.add("special-active");
            this.p2SpecialBadge.textContent = "ESPECIAL PRONTO! [P]";
        } else {
            this.p2SpecialBadge.classList.remove("special-active");
            this.p2SpecialBadge.textContent = `ESPECIAL: ${Math.floor(p2.specialMeter)}%`;
        }

        // Marcadores de Rounds
        this.renderRoundDots(this.p1RoundsEl, p1Rounds, maxRoundsToWin);
        this.renderRoundDots(this.p2RoundsEl, p2Rounds, maxRoundsToWin);
    }

    renderRoundDots(container, wonCount, totalRequired) {
        container.innerHTML = "";
        for (let i = 0; i < totalRequired; i++) {
            const dot = document.createElement("span");
            dot.className = `round-dot ${i < wonCount ? "won" : ""}`;
            container.appendChild(dot);
        }
    }

    showBanner(mainText, subText = "", duration = 1200) {
        const title = document.getElementById("banner-main-text");
        const subtitle = document.getElementById("banner-sub-text");

        title.textContent = mainText;
        subtitle.textContent = subText;

        this.screenRoundBanner.classList.remove("hidden");
        this.screenRoundBanner.classList.add("banner-animate");

        return new Promise(resolve => {
            this.bannerResolve = resolve;
            setTimeout(() => {
                this.hideBanner();
            }, duration);
        });
    }

    hideBanner() {
        if (this.screenRoundBanner) {
            this.screenRoundBanner.classList.add("hidden");
            this.screenRoundBanner.classList.remove("banner-animate");
        }
        if (this.bannerResolve) {
            const res = this.bannerResolve;
            this.bannerResolve = null;
            res();
        }
    }

    // --- TELA FINAL DE RESULTADOS ---
    showMatchOver({ winner, p1Stats, p2Stats, is2PMode }) {
        this.showScreen("match-over");
        audio.stopBgm();
        audio.playCheer();
        audio.playOooooh();

        const winnerTitle = document.getElementById("match-winner-title");
        const winnerSubtitle = document.getElementById("match-winner-subtitle");
        const statsP1El = document.getElementById("stats-p1");
        const statsP2El = document.getElementById("stats-p2");

        winnerTitle.textContent = `${winner.name.toUpperCase()} VENCEU!`;
        winnerSubtitle.textContent = is2PMode
            ? "Uma vitória espetacular digna de hora extra no parque!"
            : (winner.id === 1 ? "Você derrotou a máquina e salvou o parque da demissão!" : "A CPU levou a melhor! Hora de varrer as folhas!");

        statsP1El.innerHTML = `
            <h3>${p1Stats.name}</h3>
            <p><strong>Perguntas Respondidas:</strong> ${p1Stats.questionsAnswered}</p>
            <p><strong>Perguntas Corretas:</strong> ${p1Stats.questionsCorrect} (${p1Stats.accuracy}%)</p>
            <p><strong>Dano Total Causado:</strong> ${Math.floor(p1Stats.damageDealt)}</p>
            <p><strong>Especiais Executados:</strong> ${p1Stats.specialsUsed}</p>
        `;

        statsP2El.innerHTML = `
            <h3>${p2Stats.name}</h3>
            <p><strong>Perguntas Respondidas:</strong> ${p2Stats.questionsAnswered}</p>
            <p><strong>Perguntas Corretas:</strong> ${p2Stats.questionsCorrect} (${p2Stats.accuracy}%)</p>
            <p><strong>Dano Total Causado:</strong> ${Math.floor(p2Stats.damageDealt)}</p>
            <p><strong>Especiais Executados:</strong> ${p2Stats.specialsUsed}</p>
        `;

        // Salva no ranking do localStorage
        this.saveMatchScore({
            winner: winner.name,
            accuracy: p1Stats.accuracy,
            date: new Date().toLocaleDateString("pt-BR")
        });
    }

    saveMatchScore(record) {
        try {
            const raw = localStorage.getItem("apenas_um_show_ranking") || "[]";
            const list = JSON.parse(raw);
            list.unshift(record);
            if (list.length > 8) list.pop();
            localStorage.setItem("apenas_um_show_ranking", JSON.stringify(list));
        } catch (e) {
            console.warn("Falha ao salvar no localStorage", e);
        }
    }

    loadLeaderboard() {
        const tableBody = document.getElementById("leaderboard-body");
        if (!tableBody) return;
        tableBody.innerHTML = "";

        try {
            const raw = localStorage.getItem("apenas_um_show_ranking") || "[]";
            const list = JSON.parse(raw);

            if (list.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhuma partida registrada ainda! Vá lutar!</td></tr>`;
                return;
            }

            list.forEach((item, idx) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>#${idx + 1}</td>
                    <td><strong>${item.winner}</strong></td>
                    <td>${item.accuracy}%</td>
                    <td>${item.date}</td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (e) {
            tableBody.innerHTML = `<tr><td colspan="4">Erro ao carregar ranking local.</td></tr>`;
        }
    }
}
