/**
 * 婴儿睡眠白噪音模拟器
 * Baby Sleep White Noise Simulator
 */

class WhiteNoiseApp {
    constructor() {
        // Audio context
        this.audioContext = null;
        this.masterGainNode = null;
        this.currentSound = null;
        this.isPlaying = false;

        // Timer
        this.timerMinutes = 0;
        this.timerEndTime = null;
        this.timerInterval = null;

        // Sound nodes
        this.soundNodes = {};

        // DOM Elements
        this.soundCards = document.querySelectorAll('.sound-card');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeValue = document.getElementById('volume-value');
        this.timerButtons = document.querySelectorAll('.timer-btn');
        this.timerValue = document.getElementById('timer-value');
        this.countdownDisplay = document.getElementById('countdown-display');
        this.countdownText = document.getElementById('countdown-text');
        this.playButton = document.getElementById('play-button');

        // Initialize
        this.init();
    }

    init() {
        // Select first sound by default
        this.currentSound = 'rain';
        this.soundCards[0].classList.add('selected');

        // Set default timer button
        this.timerButtons[0].classList.add('active');

        // Event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Sound card selection
        this.soundCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectSound(card.dataset.sound);

                // If already playing, switch to new sound
                if (this.isPlaying) {
                    this.stopCurrentSound();
                    this.playSound(this.currentSound);
                }
            });
        });

        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            this.volumeValue.textContent = `${volume}%`;
            if (this.masterGainNode) {
                this.masterGainNode.gain.setValueAtTime(volume / 100, this.audioContext.currentTime);
            }
        });

        // Timer buttons
        this.timerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTimer(parseInt(btn.dataset.minutes));
            });
        });

        // Play button
        this.playButton.addEventListener('click', () => {
            this.togglePlay();
        });
    }

    selectSound(soundName) {
        this.currentSound = soundName;

        // Update UI
        this.soundCards.forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.sound === soundName) {
                card.classList.add('selected');
            }
        });
    }

    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.setValueAtTime(this.volumeSlider.value / 100, this.audioContext.currentTime);
        }

        // Resume if suspended (iOS requirement)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    async play() {
        await this.initAudioContext();

        this.isPlaying = true;
        this.playSound(this.currentSound);
        this.updatePlayButton();
        this.startTimer();

        // Update playing card
        this.soundCards.forEach(card => {
            if (card.dataset.sound === this.currentSound) {
                card.classList.add('playing');
            }
        });
    }

    stop() {
        this.isPlaying = false;
        this.stopCurrentSound();
        this.updatePlayButton();
        this.stopTimer();

        // Remove playing state from all cards
        this.soundCards.forEach(card => {
            card.classList.remove('playing');
        });
    }

    updatePlayButton() {
        if (this.isPlaying) {
            this.playButton.classList.add('playing');
            this.playButton.querySelector('.play-icon').textContent = '⏹️';
            this.playButton.querySelector('.play-text').textContent = '停止播放';
        } else {
            this.playButton.classList.remove('playing');
            this.playButton.querySelector('.play-icon').textContent = '▶️';
            this.playButton.querySelector('.play-text').textContent = '开始播放';
        }
    }

    playSound(soundName) {
        this.stopCurrentSound();

        switch (soundName) {
            case 'rain':
                this.soundNodes.current = this.createRainSound();
                break;
            case 'ocean':
                this.soundNodes.current = this.createOceanSound();
                break;
            case 'wind':
                this.soundNodes.current = this.createWindSound();
                break;
            case 'heartbeat':
                this.soundNodes.current = this.createHeartbeatSound();
                break;
            case 'whitenoise':
                this.soundNodes.current = this.createWhiteNoise();
                break;
            case 'forest':
                this.soundNodes.current = this.createForestSound();
                break;
            case 'night':
                this.soundNodes.current = this.createNightSound();
                break;
            case 'clock':
                this.soundNodes.current = this.createClockSound();
                break;
            case 'water':
                this.soundNodes.current = this.createWaterSound();
                break;
            case 'shush':
                this.soundNodes.current = this.createShushSound();
                break;
        }
    }

    stopCurrentSound() {
        if (this.soundNodes.current) {
            this.soundNodes.current.stop();
            this.soundNodes.current = null;
        }
    }

    // ===== Sound Generators =====

    createWhiteNoise() {
        const bufferSize = 8 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Blend white/pink/brown noise for smoother and less piercing tone.
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        let brown = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;

            brown = (brown + 0.02 * white) / 1.02;
            const mixed = white * 0.45 + pink * 0.6 + brown * 1.1;
            output[i] = Math.max(-1, Math.min(1, mixed)) * 0.18;
        }

        const now = this.audioContext.currentTime;
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const highPass = this.audioContext.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.setValueAtTime(45, now);

        const lowPass = this.audioContext.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.setValueAtTime(5200, now);
        lowPass.Q.setValueAtTime(0.6, now);

        const toneGain = this.audioContext.createGain();
        toneGain.gain.setValueAtTime(0.22, now);

        const movementLfo = this.audioContext.createOscillator();
        const movementDepth = this.audioContext.createGain();
        movementLfo.type = 'sine';
        movementLfo.frequency.setValueAtTime(0.12, now);
        movementDepth.gain.setValueAtTime(0.04, now);
        movementLfo.connect(movementDepth);
        movementDepth.connect(toneGain.gain);

        // Fade in to avoid pop on start.
        const outputGain = this.audioContext.createGain();
        outputGain.gain.setValueAtTime(0, now);
        outputGain.gain.linearRampToValueAtTime(1, now + 0.35);

        whiteNoise.connect(highPass);
        highPass.connect(lowPass);
        lowPass.connect(toneGain);
        toneGain.connect(outputGain);
        outputGain.connect(this.masterGainNode);

        movementLfo.start();
        whiteNoise.start();

        let stopped = false;
        return {
            stop: () => {
                if (stopped) return;
                stopped = true;

                const stopNow = this.audioContext.currentTime;
                const stopAt = stopNow + 0.3;
                outputGain.gain.cancelScheduledValues(stopNow);
                outputGain.gain.setTargetAtTime(0, stopNow, 0.06);

                movementLfo.stop(stopAt);
                whiteNoise.stop(stopAt);

                setTimeout(() => {
                    movementLfo.disconnect();
                    movementDepth.disconnect();
                    whiteNoise.disconnect();
                    highPass.disconnect();
                    lowPass.disconnect();
                    toneGain.disconnect();
                    outputGain.disconnect();
                }, 380);
            }
        };
    }

    createRainSound() {
        // Pink noise for rain base
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }

        const rainNoise = this.audioContext.createBufferSource();
        rainNoise.buffer = buffer;
        rainNoise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);

        rainNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGainNode);
        rainNoise.start();

        return {
            stop: () => {
                rainNoise.stop();
                rainNoise.disconnect();
            }
        };
    }

    createOceanSound() {
        // Modulated pink noise for waves
        const bufferSize = 4 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;

            // Wave modulation
            const wavePhase = (i / this.audioContext.sampleRate) * 0.1;
            const waveMod = (Math.sin(wavePhase * Math.PI * 2) + 1) * 0.4 + 0.2;

            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11 * waveMod;
            b6 = white * 0.115926;
        }

        const oceanNoise = this.audioContext.createBufferSource();
        oceanNoise.buffer = buffer;
        oceanNoise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.6, this.audioContext.currentTime);

        oceanNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGainNode);
        oceanNoise.start();

        return {
            stop: () => {
                oceanNoise.stop();
                oceanNoise.disconnect();
            }
        };
    }

    createWindSound() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99765 * b0 + white * 0.0990460;
            b1 = 0.96300 * b1 + white * 0.2965164;
            b2 = 0.57000 * b2 + white * 1.0526913;
            output[i] = (b0 + b1 + b2) * 0.08;
        }

        const windNoise = this.audioContext.createBufferSource();
        windNoise.buffer = buffer;
        windNoise.loop = true;

        // Modulating filter for wind effect
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(0.3, this.audioContext.currentTime);

        // LFO for filter modulation
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.setValueAtTime(0.2, this.audioContext.currentTime);
        lfoGain.gain.setValueAtTime(300, this.audioContext.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        filter.frequency.setValueAtTime(500, this.audioContext.currentTime);
        lfo.start();

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);

        windNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGainNode);
        windNoise.start();

        return {
            stop: () => {
                lfo.stop();
                windNoise.stop();
                lfo.disconnect();
                windNoise.disconnect();
            }
        };
    }

    createHeartbeatSound() {
        const createBeat = () => {
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(60, this.audioContext.currentTime);
            osc2.frequency.setValueAtTime(80, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(this.masterGainNode);

            osc1.start();
            osc2.start();

            return { osc1, osc2, gainNode };
        };

        const { osc1, osc2, gainNode } = createBeat();

        // Schedule heartbeat pattern
        const scheduleHeartbeat = () => {
            const now = this.audioContext.currentTime;

            // First beat (lub)
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            // Second beat (dub)
            gainNode.gain.setValueAtTime(0.01, now + 0.2);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.25);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

            // Silence until next beat
            gainNode.gain.setValueAtTime(0, now + 0.4);
        };

        scheduleHeartbeat();
        const interval = setInterval(scheduleHeartbeat, 900); // ~67 BPM

        return {
            stop: () => {
                clearInterval(interval);
                osc1.stop();
                osc2.stop();
                osc1.disconnect();
                osc2.disconnect();
            }
        };
    }

    createForestSound() {
        // Base ambient with bird-like chirps
        const bufferSize = 4 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Gentle pink noise background
        let b0 = 0, b1 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99 * b0 + white * 0.1;
            b1 = 0.9 * b1 + white * 0.2;
            output[i] = (b0 + b1) * 0.05;
        }

        const ambientNoise = this.audioContext.createBufferSource();
        ambientNoise.buffer = buffer;
        ambientNoise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);

        ambientNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGainNode);
        ambientNoise.start();

        // Bird chirp oscillator
        const createChirp = () => {
            const chirpOsc = this.audioContext.createOscillator();
            const chirpGain = this.audioContext.createGain();

            chirpOsc.type = 'sine';
            chirpGain.gain.setValueAtTime(0, this.audioContext.currentTime);

            chirpOsc.connect(chirpGain);
            chirpGain.connect(this.masterGainNode);
            chirpOsc.start();

            const scheduleChirp = () => {
                if (Math.random() > 0.3) return; // Random chirps

                const now = this.audioContext.currentTime;
                const freq = 2000 + Math.random() * 2000;

                chirpOsc.frequency.setValueAtTime(freq, now);
                chirpOsc.frequency.linearRampToValueAtTime(freq * 1.2, now + 0.05);
                chirpOsc.frequency.linearRampToValueAtTime(freq * 0.8, now + 0.1);

                chirpGain.gain.setValueAtTime(0, now);
                chirpGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
                chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            };

            const interval = setInterval(scheduleChirp, 500 + Math.random() * 1500);

            return { chirpOsc, chirpGain, interval };
        };

        const chirp = createChirp();

        return {
            stop: () => {
                clearInterval(chirp.interval);
                chirp.chirpOsc.stop();
                ambientNoise.stop();
                chirp.chirpOsc.disconnect();
                ambientNoise.disconnect();
            }
        };
    }

    createNightSound() {
        // Cricket-like sounds with ambient
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Very soft ambient
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.02;
        }

        const ambientNoise = this.audioContext.createBufferSource();
        ambientNoise.buffer = buffer;
        ambientNoise.loop = true;

        const lowpass = this.audioContext.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(400, this.audioContext.currentTime);

        ambientNoise.connect(lowpass);
        lowpass.connect(this.masterGainNode);
        ambientNoise.start();

        // Cricket oscillator
        const cricketOsc = this.audioContext.createOscillator();
        const cricketGain = this.audioContext.createGain();

        cricketOsc.type = 'sine';
        cricketOsc.frequency.setValueAtTime(4000, this.audioContext.currentTime);
        cricketGain.gain.setValueAtTime(0, this.audioContext.currentTime);

        cricketOsc.connect(cricketGain);
        cricketGain.connect(this.masterGainNode);
        cricketOsc.start();

        let cricketPhase = 0;
        const cricketInterval = setInterval(() => {
            const now = this.audioContext.currentTime;
            cricketPhase = (cricketPhase + 1) % 10;

            if (cricketPhase < 5) {
                cricketGain.gain.setValueAtTime(0.04, now);
                cricketGain.gain.setValueAtTime(0, now + 0.02);
            }
        }, 50);

        return {
            stop: () => {
                clearInterval(cricketInterval);
                cricketOsc.stop();
                ambientNoise.stop();
                cricketOsc.disconnect();
                ambientNoise.disconnect();
            }
        };
    }

    createClockSound() {
        const tickOsc = this.audioContext.createOscillator();
        const tickGain = this.audioContext.createGain();

        tickOsc.type = 'sine';
        tickOsc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        tickGain.gain.setValueAtTime(0, this.audioContext.currentTime);

        tickOsc.connect(tickGain);
        tickGain.connect(this.masterGainNode);
        tickOsc.start();

        let isTick = true;
        const tickInterval = setInterval(() => {
            const now = this.audioContext.currentTime;
            const freq = isTick ? 800 : 600;

            tickOsc.frequency.setValueAtTime(freq, now);
            tickGain.gain.setValueAtTime(0, now);
            tickGain.gain.linearRampToValueAtTime(0.15, now + 0.01);
            tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            isTick = !isTick;
        }, 500);

        return {
            stop: () => {
                clearInterval(tickInterval);
                tickOsc.stop();
                tickOsc.disconnect();
            }
        };
    }

    createWaterSound() {
        // Mountain spring / trickling brook sound - distinct from ocean
        // Uses higher frequencies and random bubbling effects

        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Create base noise with more high-frequency content
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.3;
        }

        const streamNoise = this.audioContext.createBufferSource();
        streamNoise.buffer = buffer;
        streamNoise.loop = true;

        // Higher bandpass for clearer, lighter water sound
        const filter1 = this.audioContext.createBiquadFilter();
        filter1.type = 'bandpass';
        filter1.frequency.setValueAtTime(2500, this.audioContext.currentTime);
        filter1.Q.setValueAtTime(0.5, this.audioContext.currentTime);

        // Second filter for even higher frequencies (sparkle)
        const filter2 = this.audioContext.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.setValueAtTime(1500, this.audioContext.currentTime);

        // Fast LFO for trickling/bubbling effect
        const lfo1 = this.audioContext.createOscillator();
        const lfo1Gain = this.audioContext.createGain();
        lfo1.frequency.setValueAtTime(8, this.audioContext.currentTime);
        lfo1Gain.gain.setValueAtTime(400, this.audioContext.currentTime);
        lfo1.connect(lfo1Gain);
        lfo1Gain.connect(filter1.frequency);
        lfo1.start();

        // Slower LFO for gentle flow variation
        const lfo2 = this.audioContext.createOscillator();
        const lfo2Gain = this.audioContext.createGain();
        lfo2.frequency.setValueAtTime(0.5, this.audioContext.currentTime);
        lfo2Gain.gain.setValueAtTime(200, this.audioContext.currentTime);
        lfo2.connect(lfo2Gain);
        lfo2Gain.connect(filter1.frequency);
        lfo2.start();

        const mainGain = this.audioContext.createGain();
        mainGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);

        // Connect stream sound
        streamNoise.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(mainGain);
        mainGain.connect(this.masterGainNode);
        streamNoise.start();

        // Add random bubble/drip sounds
        const bubbleOsc = this.audioContext.createOscillator();
        const bubbleGain = this.audioContext.createGain();
        bubbleOsc.type = 'sine';
        bubbleGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        bubbleOsc.connect(bubbleGain);
        bubbleGain.connect(this.masterGainNode);
        bubbleOsc.start();

        const bubbleInterval = setInterval(() => {
            if (Math.random() > 0.4) return;

            const now = this.audioContext.currentTime;
            const freq = 800 + Math.random() * 1200;

            bubbleOsc.frequency.setValueAtTime(freq, now);
            bubbleOsc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);

            bubbleGain.gain.setValueAtTime(0, now);
            bubbleGain.gain.linearRampToValueAtTime(0.06, now + 0.02);
            bubbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        }, 150);

        return {
            stop: () => {
                clearInterval(bubbleInterval);
                lfo1.stop();
                lfo2.stop();
                bubbleOsc.stop();
                streamNoise.stop();
                lfo1.disconnect();
                lfo2.disconnect();
                bubbleOsc.disconnect();
                streamNoise.disconnect();
            }
        };
    }

    createShushSound() {
        // Gentle "shhhh" with smoother high-frequency texture.
        const bufferSize = 6 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        let prevWhite = 0;
        let body = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            const airy = white - prevWhite * 0.85;
            prevWhite = white;

            body = (body + 0.015 * white) / 1.015;
            output[i] = (airy * 0.62 + body * 0.2) * 0.5;
        }

        const now = this.audioContext.currentTime;
        const shushNoise = this.audioContext.createBufferSource();
        shushNoise.buffer = buffer;
        shushNoise.loop = true;

        const airFilter = this.audioContext.createBiquadFilter();
        airFilter.type = 'bandpass';
        airFilter.frequency.setValueAtTime(2800, now);
        airFilter.Q.setValueAtTime(0.8, now);

        const warmthFilter = this.audioContext.createBiquadFilter();
        warmthFilter.type = 'lowpass';
        warmthFilter.frequency.setValueAtTime(1100, now);
        warmthFilter.Q.setValueAtTime(0.6, now);

        const airGain = this.audioContext.createGain();
        airGain.gain.setValueAtTime(0.28, now);

        const warmthGain = this.audioContext.createGain();
        warmthGain.gain.setValueAtTime(0.18, now);

        const shushGain = this.audioContext.createGain();
        shushGain.gain.setValueAtTime(0.2, now);

        // Slow breathing motion keeps the shush natural without sharp pumping.
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.22, now);
        lfoGain.gain.setValueAtTime(0.08, now);
        lfo.connect(lfoGain);
        lfoGain.connect(shushGain.gain);

        const compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-25, now);
        compressor.knee.setValueAtTime(18, now);
        compressor.ratio.setValueAtTime(3.5, now);
        compressor.attack.setValueAtTime(0.008, now);
        compressor.release.setValueAtTime(0.22, now);

        // Fade in to avoid click.
        const outputGain = this.audioContext.createGain();
        outputGain.gain.setValueAtTime(0, now);
        outputGain.gain.linearRampToValueAtTime(1, now + 0.28);

        shushNoise.connect(airFilter);
        airFilter.connect(airGain);
        airGain.connect(shushGain);

        shushNoise.connect(warmthFilter);
        warmthFilter.connect(warmthGain);
        warmthGain.connect(shushGain);

        shushGain.connect(compressor);
        compressor.connect(outputGain);
        outputGain.connect(this.masterGainNode);

        lfo.start();
        shushNoise.start();

        let stopped = false;
        return {
            stop: () => {
                if (stopped) return;
                stopped = true;

                const stopNow = this.audioContext.currentTime;
                const stopAt = stopNow + 0.25;
                outputGain.gain.cancelScheduledValues(stopNow);
                outputGain.gain.setTargetAtTime(0, stopNow, 0.05);

                lfo.stop(stopAt);
                shushNoise.stop(stopAt);

                setTimeout(() => {
                    lfo.disconnect();
                    lfoGain.disconnect();
                    shushNoise.disconnect();
                    airFilter.disconnect();
                    warmthFilter.disconnect();
                    airGain.disconnect();
                    warmthGain.disconnect();
                    shushGain.disconnect();
                    compressor.disconnect();
                    outputGain.disconnect();
                }, 340);
            }
        };
    }

    // ===== Timer Functions =====

    setTimer(minutes) {
        this.timerMinutes = minutes;

        // Update UI
        this.timerButtons.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.minutes) === minutes) {
                btn.classList.add('active');
            }
        });

        if (minutes === 0) {
            this.timerValue.textContent = '关闭';
            this.countdownDisplay.classList.remove('active');
            this.timerEndTime = null;

            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            this.timerValue.textContent = hours > 0 ? `${hours}小时${mins > 0 ? mins + '分' : ''}` : `${mins}分钟`;

            // If playing, start/restart timer
            if (this.isPlaying) {
                this.startTimer();
            }
        }
    }

    startTimer() {
        if (this.timerMinutes === 0) return;

        // Clear existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerEndTime = Date.now() + this.timerMinutes * 60 * 1000;
        this.countdownDisplay.classList.add('active');

        this.updateCountdown();
        this.timerInterval = setInterval(() => this.updateCountdown(), 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.countdownDisplay.classList.remove('active');
    }

    updateCountdown() {
        if (!this.timerEndTime) return;

        const remaining = this.timerEndTime - Date.now();

        if (remaining <= 0) {
            this.stop();
            this.countdownText.textContent = '00:00';
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        this.countdownText.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WhiteNoiseApp();
});
