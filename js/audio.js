/**
 * Motor de Áudio Procedural via Web Audio API
 * Efeitos sonoros de alta fidelidade e trilha sonora sintetizada sem dependências externas!
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.masterVolume = 0.8;
        this.bgmVolume = 0.35;
        this.sfxVolume = 0.7;
        this.currentBgm = null;
        this.bgmTimer = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.isInitialized = true;
        } catch (e) {
            console.warn("Web Audio API não suportada neste navegador.", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBgm();
        }
        return this.isMuted;
    }

    // --- CRIAÇÃO DE RUÍDO BRANCO (Pancadas, Chutes, Pratos) ---
    createNoiseBuffer(duration = 0.5) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // --- EFEITOS SONOROS (SFX) ---

    // Tique-taque tenso da pergunta
    playCountdownTick(urgency = 1) {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const baseFreq = 600 * urgency;

        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // Buzzer de Resposta Correta (Chime brilhante)
    playBuzzerCorrect() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde C Maior
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = this.ctx.currentTime + idx * 0.08;

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.4 * this.sfxVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.35);
        });
    }

    // Buzzer de Resposta Incorreta (Buzzer clássico de Game Show)
    playBuzzerWrong() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = "sawtooth";
        osc2.type = "sawtooth";
        osc1.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
        osc2.frequency.setValueAtTime(138.59, this.ctx.currentTime); // C#3 (dissonância forte)

        gain.gain.setValueAtTime(0.45 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 0.45);
        osc2.stop(this.ctx.currentTime + 0.45);
    }

    // Benson zangado / grito de apito
    playBensonAngry() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(450, this.ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    // Soco Rápido
    playPunch() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Punch thud
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

        gain.gain.setValueAtTime(0.6 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);

        // Estalo do soco
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.06);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1200;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noise.start(now);
    }

    // Chute Pesado
    playKick() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

        gain.gain.setValueAtTime(0.7 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);

        // Whoosh de vento antes do golpe
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.12);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.45 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noise.start(now);
    }

    // Bloqueio / Defesa
    playBlock() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

        gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Pulo
    playJump() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);

        gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Golpe Especial Cósmico (Explosão / Raio Mortal)
    playSpecialAttack() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;

        // Laser subindo
        const laser = this.ctx.createOscillator();
        const laserGain = this.ctx.createGain();
        laser.type = "sawtooth";
        laser.frequency.setValueAtTime(120, now);
        laser.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        laserGain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
        laserGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        laser.connect(laserGain);
        laserGain.connect(this.ctx.destination);
        laser.start(now);
        laser.stop(now + 0.3);

        // Explosão grave
        const boomOsc = this.ctx.createOscillator();
        const boomGain = this.ctx.createGain();
        boomOsc.type = "triangle";
        boomOsc.frequency.setValueAtTime(180, now + 0.2);
        boomOsc.frequency.exponentialRampToValueAtTime(30, now + 0.7);
        boomGain.gain.setValueAtTime(0.7 * this.sfxVolume, now + 0.2);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        boomOsc.connect(boomGain);
        boomGain.connect(this.ctx.destination);
        boomOsc.start(now + 0.2);
        boomOsc.stop(now + 0.7);
    }

    // Clássico grito do Mordecai e Rigby: "OOOOOOOOOOOOH!"
    playOooooh() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const chords = [392, 440, 523.25, 587.33, 659.25];
        chords.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = this.ctx.currentTime + idx * 0.07;

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.linearRampToValueAtTime(freq * 1.05, startTime + 0.4);

            gain.gain.setValueAtTime(0.25 * this.sfxVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.5);
        });
    }

    // KO / Fim de Round
    playKO() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 1.2);

        gain.gain.setValueAtTime(0.8 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
    }

    // Aplausos da plateia
    playCheer() {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(1.5);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1000;
        filter.Q.value = 1.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume, this.ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    // --- SINTETIZADOR DE MÚSICA DE FUNDO (BGM CHIPTUNE DINÂMICA) ---

    stopBgm() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
        this.currentBgm = null;
    }

    startBgm(type = "fight") {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        if (this.currentBgm === type) return;

        this.stopBgm();
        this.currentBgm = type;

        let step = 0;
        // BGM de Luta: Ritmo rápido de Rock/Synthwave
        const fightBass = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
        const fightLead = [440, 0, 523.25, 0, 659.25, 587.33, 523.25, 440];

        // BGM de Quiz: Suspense com compasso marcado
        const quizBass = [98, 0, 98, 123.47, 98, 0, 116.54, 98];
        const quizLead = [392, 0, 440, 0, 392, 329.63, 349.23, 0];

        // BGM de Menu: Chill 80s groove
        const menuBass = [130.81, 0, 164.81, 0, 196, 0, 164.81, 0];
        const menuLead = [261.63, 329.63, 392, 523.25, 392, 329.63, 261.63, 0];

        const tempoMs = type === "fight" ? 140 : (type === "quiz" ? 190 : 220);

        this.bgmTimer = setInterval(() => {
            if (this.isMuted || !this.ctx) return;

            const now = this.ctx.currentTime;
            let bassNote = 0;
            let leadNote = 0;

            if (type === "fight") {
                bassNote = fightBass[step % fightBass.length];
                leadNote = fightLead[step % fightLead.length];
            } else if (type === "quiz") {
                bassNote = quizBass[step % quizBass.length];
                leadNote = quizLead[step % quizLead.length];
            } else {
                bassNote = menuBass[step % menuBass.length];
                leadNote = menuLead[step % menuLead.length];
            }

            // Sintetizador do Baixo
            if (bassNote > 0) {
                const bassOsc = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bassOsc.type = "sawtooth";
                bassOsc.frequency.setValueAtTime(bassNote, now);
                bassGain.gain.setValueAtTime(0.18 * this.bgmVolume, now);
                bassGain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 0.9);

                bassOsc.connect(bassGain);
                bassGain.connect(this.ctx.destination);
                bassOsc.start(now);
                bassOsc.stop(now + (tempoMs / 1000) * 0.9);
            }

            // Sintetizador da Melodia
            if (leadNote > 0) {
                const leadOsc = this.ctx.createOscillator();
                const leadGain = this.ctx.createGain();
                leadOsc.type = "square";
                leadOsc.frequency.setValueAtTime(leadNote, now);
                leadGain.gain.setValueAtTime(0.12 * this.bgmVolume, now);
                leadGain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 0.7);

                leadOsc.connect(leadGain);
                leadGain.connect(this.ctx.destination);
                leadOsc.start(now);
                leadOsc.stop(now + (tempoMs / 1000) * 0.7);
            }

            // Bumbo / Caixa no tempo
            if (step % 2 === 0) {
                // Kick drum
                const kickOsc = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kickOsc.type = "sine";
                kickOsc.frequency.setValueAtTime(120, now);
                kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
                kickGain.gain.setValueAtTime(0.25 * this.bgmVolume, now);
                kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

                kickOsc.connect(kickGain);
                kickGain.connect(this.ctx.destination);
                kickOsc.start(now);
                kickOsc.stop(now + 0.08);
            } else if (type === "fight") {
                // Snare noise
                const snare = this.ctx.createBufferSource();
                snare.buffer = this.createNoiseBuffer(0.05);
                const filter = this.ctx.createBiquadFilter();
                filter.type = "highpass";
                filter.frequency.value = 1500;

                const snareGain = this.ctx.createGain();
                snareGain.gain.setValueAtTime(0.15 * this.bgmVolume, now);
                snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                snare.connect(filter);
                filter.connect(snareGain);
                snareGain.connect(this.ctx.destination);
                snare.start(now);
            }

            step++;
        }, tempoMs);
    }
}

export const audio = new SoundEngine();
