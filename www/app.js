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
        this.musicAudio = null;
        this.currentMusicIndex = -1;
        this.iosPlaybackUnlocked = false;
        this.musicTracks = [
            {
                title: '勃拉姆斯摇篮曲',
                subtitle: 'Brahms Lullaby (Instrumental)',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/55/d7/d3/55d7d304-f1a3-43ab-5a8e-d29f01e8c478/mzaf_1283052914341102402.plus.aac.p.m4a'
            },
            {
                title: 'Canon In D - Pachelbel',
                subtitle: 'Canon in D (Piano Version)',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/0f/a2/eb/0fa2eb13-3ba0-45e3-5951-6895fbd1276c/mzaf_7775935010953823655.plus.aac.p.m4a'
            },
            {
                title: '舒伯特小夜曲',
                subtitle: 'Schubert Serenade',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/b8/e2/dd/b8e2dda8-96d0-d6be-c714-71ea5756859f/mzaf_11752488472823576992.plus.aac.p.m4a'
            },
            {
                title: '德彪西 月光',
                subtitle: 'Clair de lune (Piano)',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/d7/9b/60/d79b60be-d4a4-4fa4-9a5e-d4816fbf21c1/mzaf_5469805616228469371.plus.aac.p.m4a'
            },
            {
                title: '萨蒂 Gymnopedie No.1',
                subtitle: 'Gymnopedie No.1',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/37/76/1e/37761ecb-6bda-ac5a-2c40-d1b378a23e30/mzaf_15716201396115900232.plus.aac.p.m4a'
            },
            {
                title: '巴赫 G弦上的咏叹调',
                subtitle: 'Air on the G String',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/c4/13/ce/c413ced2-c02a-510d-16bf-06a35513d744/mzaf_10995439643064779193.plus.aac.p.m4a'
            },
            {
                title: '肖邦 夜曲 Op.9 No.2',
                subtitle: 'Nocturne Op.9 No.2',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/d5/c6/b7/d5c6b726-f344-d0b6-4289-661b948b870d/mzaf_9984648612855440043.plus.aac.p.m4a'
            },
            {
                title: '舒曼 梦幻曲',
                subtitle: 'Traumerei (Kinderszenen)',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/f0/05/60/f0056002-b395-d633-e518-1f8584c8c762/mzaf_30035179335371066.plus.aac.p.m4a'
            },
            {
                title: '圣桑 天鹅',
                subtitle: 'The Swan',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/bd/9d/36/bd9d3694-6fc8-fbef-4283-c431eea838f0/mzaf_11411301538877085598.plus.aac.p.m4a'
            },
            {
                title: '莫扎特 摇篮曲',
                subtitle: 'Mozart Lullaby',
                url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/30/ea/26/30ea26ee-99a3-f09a-f453-be98ae8c06b5/mzaf_6709180713786063716.plus.aac.p.m4a'
            }
        ];

        // DOM Elements
        this.soundCards = document.querySelectorAll('.sound-card');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeValue = document.getElementById('volume-value');
        this.timerButtons = document.querySelectorAll('.timer-btn');
        this.timerValue = document.getElementById('timer-value');
        this.countdownDisplay = document.getElementById('countdown-display');
        this.countdownText = document.getElementById('countdown-text');
        this.playButton = document.getElementById('play-button');
        this.openMusicModalButton = document.getElementById('open-music-modal');
        this.musicModalOverlay = document.getElementById('music-modal-overlay');
        this.musicCloseButton = document.getElementById('music-close-btn');
        this.musicTrackList = document.getElementById('music-track-list');

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
        this.initMusicTracks();
        this.setupIOSSilentModeWorkaround();
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
            if (this.musicAudio) {
                this.musicAudio.volume = volume / 100;
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

        if (this.openMusicModalButton) {
            this.openMusicModalButton.addEventListener('click', () => {
                this.musicModalOverlay.classList.add('active');
            });
        }

        if (this.musicCloseButton) {
            this.musicCloseButton.addEventListener('click', () => {
                this.musicModalOverlay.classList.remove('active');
            });
        }

        if (this.musicModalOverlay) {
            this.musicModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.musicModalOverlay) {
                    this.musicModalOverlay.classList.remove('active');
                }
            });
        }
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

        this.stopMusicPlayback();
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

    initMusicTracks() {
        if (!this.musicTrackList) return;

        this.musicTrackList.innerHTML = '';
        this.musicTracks.forEach((track, index) => {
            const row = document.createElement('div');
            row.className = 'music-track-item';
            row.innerHTML = `
                <div class="music-track-meta">
                    <div class="music-track-title">${track.title}</div>
                    <div class="music-track-subtitle">${track.subtitle}</div>
                </div>
                <button class="music-track-play" data-index="${index}">播放</button>
            `;
            this.musicTrackList.appendChild(row);
        });

        this.musicTrackList.addEventListener('click', (e) => {
            const button = e.target.closest('.music-track-play');
            if (!button) return;
            const index = parseInt(button.dataset.index, 10);
            this.playMusicTrack(index);
        });
    }

    getMusicAudio() {
        if (!this.musicAudio) {
            this.musicAudio = new Audio();
            this.musicAudio.loop = true;
            this.musicAudio.preload = 'none';
            this.musicAudio.playsInline = true;
            this.musicAudio.setAttribute('playsinline', 'true');
            this.musicAudio.setAttribute('webkit-playsinline', 'true');
            this.musicAudio.addEventListener('pause', () => this.updateMusicTrackButtons());
            this.musicAudio.addEventListener('ended', () => this.updateMusicTrackButtons());
            this.musicAudio.addEventListener('error', () => {
                this.updateMusicTrackButtons();
                alert('当前音乐加载失败，请稍后重试。');
            });
        }
        return this.musicAudio;
    }

    async playMusicTrack(index) {
        const track = this.musicTracks[index];
        if (!track) return;

        const audio = this.getMusicAudio();
        if (this.currentMusicIndex === index && !audio.paused) {
            audio.pause();
            return;
        }

        if (this.isPlaying) {
            this.stop();
        }

        this.currentMusicIndex = index;
        audio.src = track.url;
        audio.volume = this.volumeSlider.value / 100;

        try {
            await audio.play();
        } catch (error) {
            console.error('Music play failed:', error);
            alert('播放失败，请先和页面进行一次交互后再试。');
        }

        this.updateMusicTrackButtons();
    }

    stopMusicPlayback() {
        if (!this.musicAudio) return;
        this.musicAudio.pause();
        this.currentMusicIndex = -1;
        this.updateMusicTrackButtons();
    }

    updateMusicTrackButtons() {
        if (!this.musicTrackList) return;
        const buttons = this.musicTrackList.querySelectorAll('.music-track-play');
        buttons.forEach((button) => {
            const index = parseInt(button.dataset.index, 10);
            const active = this.musicAudio && !this.musicAudio.paused && this.currentMusicIndex === index;
            button.classList.toggle('playing', active);
            button.textContent = active ? '暂停' : '播放';
        });
    }

    setupIOSSilentModeWorkaround() {
        const ua = navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (!isIOS) return;

        const unlock = async () => {
            if (this.iosPlaybackUnlocked) return;
            this.iosPlaybackUnlocked = true;

            try {
                if (navigator.audioSession && navigator.audioSession.type !== 'playback') {
                    navigator.audioSession.type = 'playback';
                }
            } catch (error) {
                console.warn('audioSession API not available:', error);
            }

            try {
                await this.initAudioContext();
                const buffer = this.audioContext.createBuffer(1, 1, 22050);
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                source.start(0);
                source.stop(0.001);
            } catch (error) {
                console.warn('iOS audio unlock failed:', error);
            }
        };

        document.addEventListener('touchstart', unlock, { once: true, passive: true });
        document.addEventListener('click', unlock, { once: true, passive: true });
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
            this.stopMusicPlayback();
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
