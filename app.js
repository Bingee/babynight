/**
 * 婴儿睡眠白噪音模拟器
 * Baby Sleep White Noise Simulator
 */

class WhiteNoiseApp {
    constructor() {
        this.storageKey = 'baby-white-noise-settings';
        this.activeView = 'noise';
        this.audioAssetBaseUrl = this.getAudioAssetBaseUrl();

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
        this.loadingMusicIndex = -1;
        this.isIOSDevice = this.detectIOSDevice();
        this.iosPlaybackUnlocked = false;
        this.themeMediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') || null;
        this.themeMode = 'system';
        this.musicTracks = [
            {
                title: 'Moonstone',
                subtitle: '钢琴独奏 · 4分15秒',
                url: './audio/selected/Moonstone.mp3',
                image: './images/music/moonstone.png'
            },
            {
                title: 'Kalimba Relaxation Music',
                subtitle: '卡林巴与氛围铺底 · 7分08秒',
                url: './audio/selected/Kalimba%20Relaxation%20Music.mp3',
                image: './images/music/kalimba-relaxation-music.png'
            },
            {
                title: 'Morning',
                subtitle: '竖琴与长笛 · 2分33秒',
                url: './audio/selected/Morning.mp3',
                image: './images/music/morning.png'
            },
            {
                title: 'Evening',
                subtitle: '吉他与双簧管 · 3分06秒',
                url: './audio/selected/Evening.mp3',
                image: './images/music/evening.png'
            },
            {
                title: 'Fresh Air',
                subtitle: '纯钢琴即兴 · 4分54秒',
                url: './audio/selected/Fresh%20Air.mp3',
                image: './images/music/fresh-air.png'
            },
            {
                title: 'Dreamer',
                subtitle: '柔和钢琴与轻打击 · 3分24秒',
                url: './audio/selected/Dreamer.mp3',
                image: './images/music/dreamer.png'
            },
            {
                title: 'Immersed',
                subtitle: '钢琴与弦乐氛围 · 4分09秒',
                url: './audio/selected/Immersed.mp3',
                image: './images/music/immersed.png'
            },
            {
                title: 'River Flute',
                subtitle: '长笛与溪流环境声 · 20分28秒',
                url: './audio/selected/River%20Flute.mp3',
                image: './images/music/river-flute.png'
            }
        ];

        // DOM Elements
        this.soundGrid = document.querySelector('.sound-grid');
        this.topBar = document.querySelector('.top-bar');
        this.noisePanel = document.getElementById('noise-panel');
        this.musicPanel = document.getElementById('music-panel');
        this.viewTabs = document.querySelectorAll('.mode-tab');
        this.soundCards = document.querySelectorAll('.sound-card');
        this.soundActionButtons = document.querySelectorAll('.sound-card-action');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeValue = document.getElementById('volume-value');
        this.timerButtons = document.querySelectorAll('.timer-btn');
        this.timerValue = document.getElementById('timer-value');
        this.countdownDisplay = document.getElementById('countdown-display');
        this.countdownText = document.getElementById('countdown-text');
        this.bottomSheet = document.getElementById('bottom-sheet');
        this.bottomSheetHandle = document.getElementById('bottom-sheet-handle');
        this.bottomSheetScroll = document.getElementById('bottom-sheet-scroll');
        this.themeSwitch = document.getElementById('theme-switch');
        this.musicTrackList = document.getElementById('music-track-list');
        this.musicCount = document.getElementById('music-count');
        this.modeSwitch = document.querySelector('.mode-switch');
        this.authorLink = document.getElementById('author-link');
        this.blessingOverlay = document.getElementById('blessing-overlay');
        this.blessingCloseButton = document.getElementById('blessing-close');
        this.blessingDismissButton = document.getElementById('blessing-dismiss');
        this.cardImages = document.querySelectorAll('.card-image img');
        this.previouslyFocusedElement = null;
        this.isRestoringState = false;
        this.isBottomSheetExpanded = false;
        this.currentTheme = 'light';

        // Initialize
        this.init();
    }

    init() {
        this.isRestoringState = true;
        this.selectSound('rain');
        this.setTimer(0);
        this.setupEventListeners();
        this.setupSystemThemeListener();
        this.setupSwipeGestures();
        this.setupBottomSheet();
        this.initMusicTracks();
        this.setActiveView('noise');
        this.setupBlessingDialog();
        this.setupImageFallbacks();
        this.setupIOSSilentModeWorkaround();
        this.restoreState();
        this.isRestoringState = false;
        this.persistState();
        this.updateSoundActionButtons();
        this.registerServiceWorker();
    }

    detectIOSDevice() {
        const ua = navigator.userAgent || '';
        return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    getAudioAssetBaseUrl() {
        if (window.location.hostname === 'bingee.github.io') {
            return 'https://cdn.jsdelivr.net/gh/Bingee/babynight@96a2f03e7095629ead365938f4f38e4c795fafb5';
        }

        return '';
    }

    resolveAudioUrl(assetPath) {
        if (!assetPath) return assetPath;

        const normalizedPath = assetPath.replace(/^\.\//, '');
        if (!this.audioAssetBaseUrl) {
            return `./${normalizedPath}`;
        }

        return `${this.audioAssetBaseUrl}/${normalizedPath}`;
    }

    setupEventListeners() {
        this.viewTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                this.resetModeSwitchDragState();
                this.setActiveView(tab.dataset.view);
            });
        });

        this.soundCards.forEach(card => {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-pressed', 'false');

            card.addEventListener('click', (event) => {
                if (event.target.closest('.sound-card-action')) {
                    return;
                }

                this.handleSoundSelection(card.dataset.sound);
            });

            card.addEventListener('keydown', (event) => {
                if (event.target !== card) {
                    return;
                }

                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();
                this.handleSoundSelection(card.dataset.sound);
            });
        });

        this.soundActionButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleSoundCardPlayback(button.closest('.sound-card')?.dataset.sound);
            });
        });

        this.volumeSlider.addEventListener('input', (e) => {
            this.applyVolume(e.target.value);
            this.persistState();
        });

        this.timerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTimer(parseInt(btn.dataset.minutes, 10));
            });
        });

        this.themeSwitch?.addEventListener('click', () => {
            this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark', { manual: true });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') {
                return;
            }

            if (this.blessingOverlay?.classList.contains('active')) {
                this.closeDialog(this.blessingOverlay);
            }
        });
    }

    resetModeSwitchDragState() {
        if (!this.modeSwitch) return;

        this.modeSwitch.classList.remove('dragging');
        this.modeSwitch.style.setProperty('--tab-drag-offset', '0px');
    }

    setupSwipeGestures() {
        const panels = [this.noisePanel, this.musicPanel].filter(Boolean);
        let startX = 0;
        let startY = 0;
        let trackingPointerId = null;
        let horizontalGesture = false;

        const resetTabDrag = () => {
            horizontalGesture = false;
            this.resetModeSwitchDragState();
        };

        const updateTabDrag = (deltaX) => {
            if (!this.modeSwitch) return;

            const tabTravel = Math.max(1, (this.modeSwitch.clientWidth - 4) / 2);
            const desiredOffset = -deltaX;
            const minOffset = this.activeView === 'music' ? -tabTravel : 0;
            const maxOffset = this.activeView === 'noise' ? tabTravel : 0;
            const offset = Math.max(minOffset, Math.min(maxOffset, desiredOffset));
            this.modeSwitch.style.setProperty('--tab-drag-offset', `${offset}px`);
        };

        const handleGestureStart = (clientX, clientY, pointerId = null) => {
            startX = clientX;
            startY = clientY;
            trackingPointerId = pointerId;
            resetTabDrag();
        };

        const handleGestureMove = (clientX, clientY, event = null, pointerId = null) => {
            if (trackingPointerId !== null && pointerId !== null && trackingPointerId !== pointerId) {
                return;
            }

            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            if (!horizontalGesture) {
                horizontalGesture = Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1;
            }

            if (!horizontalGesture) return;

            this.modeSwitch?.classList.add('dragging');
            updateTabDrag(deltaX);
            event?.preventDefault?.();
        };

        const handleGestureEnd = (clientX, clientY, pointerId = null) => {
            if (trackingPointerId !== null && pointerId !== null && trackingPointerId !== pointerId) {
                return;
            }

            trackingPointerId = null;
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            const horizontalSwipe = Math.abs(deltaX) > 56 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;
            resetTabDrag();
            if (!horizontalSwipe) return;

            if (deltaX < 0 && this.activeView === 'noise') {
                this.setActiveView('music');
            } else if (deltaX > 0 && this.activeView === 'music') {
                this.setActiveView('noise');
            }
        };

        panels.forEach((panel) => {
            panel.addEventListener('pointerdown', (event) => {
                if (event.button !== undefined && event.button !== 0) return;
                handleGestureStart(event.clientX, event.clientY, event.pointerId ?? null);
            });

            panel.addEventListener('pointermove', (event) => {
                handleGestureMove(event.clientX, event.clientY, event, event.pointerId ?? null);
            });

            panel.addEventListener('pointerup', (event) => {
                handleGestureEnd(event.clientX, event.clientY, event.pointerId ?? null);
            });

            panel.addEventListener('pointercancel', (event) => {
                trackingPointerId = null;
                resetTabDrag();
            });

            if (!window.PointerEvent) {
                panel.addEventListener('touchstart', (event) => {
                    const touch = event.changedTouches?.[0];
                    if (!touch) return;
                    handleGestureStart(touch.clientX, touch.clientY);
                }, { passive: true });

                panel.addEventListener('touchmove', (event) => {
                    const touch = event.changedTouches?.[0];
                    if (!touch) return;
                    handleGestureMove(touch.clientX, touch.clientY, event);
                }, { passive: false });

                panel.addEventListener('touchend', (event) => {
                    const touch = event.changedTouches?.[0];
                    if (!touch) return;
                    handleGestureEnd(touch.clientX, touch.clientY);
                }, { passive: true });
            }
        });
    }

    setupBottomSheet() {
        if (!this.bottomSheet || !this.bottomSheetHandle) return;

        this.setBottomSheetExpanded(false);

        let pointerStartY = 0;
        let pointerDeltaY = 0;
        let pointerMoved = false;

        const onPointerMove = (event) => {
            event.preventDefault();
            event.stopPropagation();
            pointerDeltaY = event.clientY - pointerStartY;
            pointerMoved = Math.abs(pointerDeltaY) > 16;
        };

        const onPointerEnd = (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.bottomSheetHandle.removeEventListener('pointermove', onPointerMove);
            this.bottomSheetHandle.removeEventListener('pointerup', onPointerEnd);
            this.bottomSheetHandle.removeEventListener('pointercancel', onPointerEnd);
            this.bottomSheet.classList.remove('dragging');

            if (pointerMoved) {
                this.setBottomSheetExpanded(pointerDeltaY < 0);
            } else {
                this.toggleBottomSheet();
            }

            if (typeof this.bottomSheetHandle.releasePointerCapture === 'function') {
                this.bottomSheetHandle.releasePointerCapture(event.pointerId);
            }
        };

        this.bottomSheetHandle.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            pointerStartY = event.clientY;
            pointerDeltaY = 0;
            pointerMoved = false;
            this.bottomSheet.classList.add('dragging');

            if (typeof this.bottomSheetHandle.setPointerCapture === 'function') {
                this.bottomSheetHandle.setPointerCapture(event.pointerId);
            }

            this.bottomSheetHandle.addEventListener('pointermove', onPointerMove);
            this.bottomSheetHandle.addEventListener('pointerup', onPointerEnd);
            this.bottomSheetHandle.addEventListener('pointercancel', onPointerEnd);
        });

        this.bottomSheetHandle.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();
            this.toggleBottomSheet();
        });

        this.bottomSheet.addEventListener('click', (event) => {
            if (this.isBottomSheetExpanded) {
                return;
            }

            if (event.target.closest('button, input, a, label')) {
                return;
            }

            this.setBottomSheetExpanded(true);
        });
    }

    setupSystemThemeListener() {
        if (!this.themeMediaQuery) return;

        const handleSystemThemeChange = () => {
            if (this.themeMode !== 'system') return;
            this.applyTheme('system', { persist: true });
        };

        if (typeof this.themeMediaQuery.addEventListener === 'function') {
            this.themeMediaQuery.addEventListener('change', handleSystemThemeChange);
        } else if (typeof this.themeMediaQuery.addListener === 'function') {
            this.themeMediaQuery.addListener(handleSystemThemeChange);
        }
    }

    setBottomSheetExpanded(expanded) {
        if (!this.bottomSheet || !this.bottomSheetHandle) return;

        this.isBottomSheetExpanded = Boolean(expanded);
        this.bottomSheet.classList.toggle('expanded', this.isBottomSheetExpanded);
        this.bottomSheet.classList.toggle('collapsed', !this.isBottomSheetExpanded);
        this.bottomSheetHandle.setAttribute('aria-expanded', String(this.isBottomSheetExpanded));
        document.body.dataset.sheetState = this.isBottomSheetExpanded ? 'expanded' : 'collapsed';

        if (!this.isBottomSheetExpanded && this.bottomSheetScroll) {
            this.bottomSheetScroll.scrollTop = 0;
        }
    }

    toggleBottomSheet() {
        this.setBottomSheetExpanded(!this.isBottomSheetExpanded);
    }

    setupBlessingDialog() {
        if (this.authorLink) {
            this.authorLink.addEventListener('click', () => {
                this.openDialog(this.blessingOverlay, this.blessingCloseButton);
            });
        }

        if (this.blessingCloseButton) {
            this.blessingCloseButton.addEventListener('click', () => {
                this.closeDialog(this.blessingOverlay);
            });
        }

        if (this.blessingDismissButton) {
            this.blessingDismissButton.addEventListener('click', () => {
                this.closeDialog(this.blessingOverlay);
            });
        }

        if (this.blessingOverlay) {
            this.blessingOverlay.addEventListener('click', (event) => {
                if (event.target === this.blessingOverlay) {
                    this.closeDialog(this.blessingOverlay);
                }
            });
        }
    }

    setupImageFallbacks() {
        this.cardImages.forEach((image) => {
            image.addEventListener('error', () => {
                image.hidden = true;
            }, { once: true });
        });
    }

    setActiveView(viewName) {
        this.activeView = viewName === 'music' ? 'music' : 'noise';
        const showMusic = this.activeView === 'music';
        document.body.dataset.activeView = this.activeView;

        this.viewTabs.forEach((tab) => {
            const active = tab.dataset.view === this.activeView;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
        });

        this.noisePanel.hidden = showMusic;
        this.noisePanel.classList.toggle('active', !showMusic);
        this.musicPanel.hidden = !showMusic;
        this.musicPanel.classList.toggle('active', showMusic);
        this.modeSwitch?.style.setProperty('--tab-active-index', showMusic ? '1' : '0');
        this.resetModeSwitchDragState();
        this.persistState();
    }

    registerServiceWorker() {
        const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
        if (!('serviceWorker' in navigator) || location.protocol === 'file:' || isLocalHost) {
            return;
        }

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch((error) => {
                console.warn('Service worker registration failed:', error);
            });
        }, { once: true });
    }

    restoreState() {
        const raw = window.localStorage.getItem(this.storageKey);
        if (!raw) {
            this.applyVolume(this.volumeSlider.value);
            this.themeMode = 'system';
            this.applyTheme('system');
            return;
        }

        try {
            const settings = JSON.parse(raw);
            const soundNames = new Set(Array.from(this.soundCards, (card) => card.dataset.sound));
            const savedVolume = Number(settings.volume);
            const savedTimer = Number(settings.timerMinutes);

            if (soundNames.has(settings.currentSound)) {
                this.selectSound(settings.currentSound);
            }

            if (Number.isFinite(savedVolume)) {
                const clampedVolume = Math.min(100, Math.max(0, savedVolume));
                this.applyVolume(clampedVolume);
            } else {
                this.applyVolume(this.volumeSlider.value);
            }

            if (Number.isFinite(savedTimer) && savedTimer >= 0) {
                this.setTimer(savedTimer);
            }

            if (settings.activeView) {
                this.setActiveView(settings.activeView);
            }

            if (settings.themeMode === 'system' || !settings.themeMode) {
                this.themeMode = 'system';
                this.applyTheme('system');
            } else if (settings.themeMode === 'manual' && settings.theme) {
                this.themeMode = 'manual';
                this.applyTheme(settings.theme);
            } else {
                this.themeMode = 'system';
                this.applyTheme('system');
            }
        } catch (error) {
            console.warn('Failed to restore settings:', error);
            this.applyVolume(this.volumeSlider.value);
            this.themeMode = 'system';
            this.applyTheme('system');
        }
    }

    persistState() {
        if (this.isRestoringState) {
            return;
        }

        const settings = {
            currentSound: this.currentSound,
            timerMinutes: this.timerMinutes,
            volume: Number(this.volumeSlider.value),
            activeView: this.activeView,
            theme: this.currentTheme,
            themeMode: this.themeMode
        };

        window.localStorage.setItem(this.storageKey, JSON.stringify(settings));
    }

    applyVolume(volume) {
        const normalizedVolume = Math.min(100, Math.max(0, Number(volume)));
        this.volumeSlider.value = normalizedVolume;
        this.volumeValue.textContent = `${normalizedVolume}%`;

        if (this.masterGainNode) {
            this.masterGainNode.gain.setValueAtTime(normalizedVolume / 100, this.audioContext.currentTime);
        }

        if (this.musicAudio) {
            this.musicAudio.volume = normalizedVolume / 100;
        }

        this.soundNodes.current?.setVolume?.(normalizedVolume / 100);
    }

    getSystemTheme() {
        return this.themeMediaQuery?.matches ? 'dark' : 'light';
    }

    setTheme(theme, options = {}) {
        if (options.manual) {
            this.themeMode = 'manual';
        }

        this.applyTheme(theme);
        this.persistState();
    }

    applyTheme(theme, options = {}) {
        const resolvedTheme = theme === 'system' ? this.getSystemTheme() : (theme === 'dark' ? 'dark' : 'light');
        this.currentTheme = resolvedTheme;
        document.documentElement.dataset.theme = resolvedTheme;
        document.documentElement.dataset.themeMode = this.themeMode;

        if (this.themeSwitch) {
            const dark = resolvedTheme === 'dark';
            this.themeSwitch.classList.toggle('active', dark);
            this.themeSwitch.setAttribute('aria-checked', String(dark));
        }

        const themeColor = resolvedTheme === 'dark' ? '#101623' : '#fff5ef';
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);

        if (options.persist) {
            this.persistState();
        }
    }

    handleSoundSelection(soundName) {
        this.selectSound(soundName);

        if (this.isPlaying) {
            this.stopCurrentSound();
            this.playSound(this.currentSound);
        }
    }

    openDialog(overlay, focusTarget) {
        if (!overlay) return;

        this.previouslyFocusedElement = document.activeElement;
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('dialog-open');

        if (focusTarget) {
            focusTarget.focus();
        }
    }

    closeDialog(overlay) {
        if (!overlay) return;

        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');

        if (!document.querySelector('.blessing-overlay.active')) {
            document.body.classList.remove('dialog-open');
        }

        if (this.previouslyFocusedElement instanceof HTMLElement) {
            this.previouslyFocusedElement.focus();
        }
    }

    selectSound(soundName) {
        this.currentSound = soundName;

        this.soundCards.forEach(card => {
            const selected = card.dataset.sound === soundName;
            card.classList.toggle('selected', selected);
            card.classList.toggle('playing', selected && this.isPlaying);
            card.setAttribute('aria-pressed', String(selected));
        });

        this.updateSoundActionButtons();
        this.persistState();
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

    toggleSoundCardPlayback(soundName) {
        if (!soundName) return;

        const isCurrentSound = this.currentSound === soundName;
        if (!isCurrentSound) {
            this.selectSound(soundName);
        }

        if (isCurrentSound && this.isPlaying) {
            this.stop();
            return;
        }

        this.play();
    }

    hasActivePlayback() {
        return this.isPlaying || this.isMusicPlaying();
    }

    isMusicPlaying() {
        return Boolean(this.musicAudio && !this.musicAudio.paused && this.currentMusicIndex >= 0);
    }

    async play() {
        await this.initAudioContext();

        this.setActiveView('noise');
        this.stopMusicPlayback();
        this.isPlaying = true;
        this.playSound(this.currentSound);
        this.updateSoundActionButtons();
        this.startTimer();

        this.soundCards.forEach(card => {
            if (card.dataset.sound === this.currentSound) {
                card.classList.add('playing');
            }
        });
    }

    stop() {
        this.isPlaying = false;
        this.stopCurrentSound();
        this.updateSoundActionButtons();
        this.stopTimer();

        // Remove playing state from all cards
        this.soundCards.forEach(card => {
            card.classList.remove('playing');
        });
    }

    updateSoundActionButtons() {
        this.soundCards.forEach((card) => {
            const button = card.querySelector('.sound-card-action');
            if (!button) return;

            const active = this.isPlaying && card.dataset.sound === this.currentSound;
            button.classList.toggle('playing', active);
            button.textContent = active ? '停止' : '播放';
            button.setAttribute('aria-label', active ? `停止${card.querySelector('.card-label')?.textContent || '声音'}播放` : `播放${card.querySelector('.card-label')?.textContent || '声音'}`);
        });
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

    createMediaLoopPlayback(url, volumeMultiplier = 1) {
        let stopped = false;
        const audio = new Audio(url);
        audio.loop = true;
        audio.preload = 'auto';
        audio.playsInline = true;
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        audio.volume = Math.min(1, (Number(this.volumeSlider.value) / 100) * volumeMultiplier);

        const playPromise = audio.play();
        if (playPromise?.catch) {
            playPromise.catch((error) => {
                if (stopped) return;
                console.error('Looping audio play failed:', error);
            });
        }

        return {
            stop: () => {
                if (stopped) return;
                stopped = true;
                audio.pause();
                audio.removeAttribute('src');
                audio.load();
            },
            setVolume: (volume) => {
                audio.volume = Math.min(1, volume * volumeMultiplier);
            }
        };
    }

    initMusicTracks() {
        if (!this.musicTrackList) return;

        if (this.musicCount) {
            this.musicCount.textContent = `${this.musicTracks.length}首`;
        }

        this.musicTrackList.innerHTML = '';
        this.musicTracks.forEach((track, index) => {
            const row = document.createElement('div');
            row.className = 'music-track-item';
            row.innerHTML = `
                <div class="music-track-art">
                    <img src="${track.image}" alt="${track.title} 封面图" decoding="async">
                </div>
                <div class="music-track-meta">
                    <div class="music-track-title">${track.title}</div>
                    <div class="music-track-subtitle">${track.subtitle}</div>
                </div>
                <button class="music-track-play" type="button" data-index="${index}">播放</button>
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
            this.musicAudio.preload = 'auto';
            this.musicAudio.playsInline = true;
            this.musicAudio.setAttribute('playsinline', 'true');
            this.musicAudio.setAttribute('webkit-playsinline', 'true');
            this.musicAudio.addEventListener('loadstart', () => {
                if (this.currentMusicIndex >= 0) {
                    this.loadingMusicIndex = this.currentMusicIndex;
                    this.updateMusicTrackButtons();
                }
            });
            this.musicAudio.addEventListener('waiting', () => {
                if (this.currentMusicIndex >= 0 && !this.musicAudio.paused) {
                    this.loadingMusicIndex = this.currentMusicIndex;
                    this.updateMusicTrackButtons();
                }
            });
            this.musicAudio.addEventListener('playing', () => {
                this.loadingMusicIndex = -1;
                this.updateMusicTrackButtons();
            });
            this.musicAudio.addEventListener('pause', () => {
                this.loadingMusicIndex = -1;
                this.updateMusicTrackButtons();
                if (!this.isPlaying) {
                    this.stopTimer();
                }
            });
            this.musicAudio.addEventListener('ended', () => {
                this.currentMusicIndex = -1;
                this.loadingMusicIndex = -1;
                this.updateMusicTrackButtons();
                if (!this.isPlaying) {
                    this.stopTimer();
                }
            });
            this.musicAudio.addEventListener('error', () => {
                this.currentMusicIndex = -1;
                this.loadingMusicIndex = -1;
                this.updateMusicTrackButtons();
                if (!this.isPlaying) {
                    this.stopTimer();
                }
                console.error('Music audio failed to load.');
            });
        }
        return this.musicAudio;
    }

    async playMusicTrack(index) {
        const track = this.musicTracks[index];
        if (!track) return;

        const audio = this.getMusicAudio();
        const trackUrl = new URL(this.resolveAudioUrl(track.url), window.location.href).href;
        const isSameTrack = this.currentMusicIndex === index && (audio.currentSrc === trackUrl || audio.src === trackUrl);

        if (isSameTrack && !audio.paused) {
            audio.pause();
            return;
        }

        if (this.isPlaying) {
            this.stop();
        }

        this.setActiveView('music');
        this.currentMusicIndex = index;
        this.loadingMusicIndex = index;
        if (!isSameTrack) {
            audio.src = trackUrl;
            audio.load();
        }
        audio.volume = this.volumeSlider.value / 100;
        audio.muted = false;
        this.updateMusicTrackButtons();

        try {
            this.setPlaybackSession();
            await audio.play();
            this.iosPlaybackUnlocked = true;
            this.loadingMusicIndex = -1;
            this.startTimer();
        } catch (error) {
            this.loadingMusicIndex = -1;
            this.currentMusicIndex = -1;
            console.error('Music play failed:', error);
        }

        this.updateMusicTrackButtons();
    }

    stopMusicPlayback() {
        if (!this.musicAudio) return;
        this.musicAudio.pause();
        this.currentMusicIndex = -1;
        this.loadingMusicIndex = -1;
        this.updateMusicTrackButtons();
        if (!this.isPlaying) {
            this.stopTimer();
        }
    }

    updateMusicTrackButtons() {
        if (!this.musicTrackList) return;
        const buttons = this.musicTrackList.querySelectorAll('.music-track-play');
        buttons.forEach((button) => {
            const index = parseInt(button.dataset.index, 10);
            const active = this.musicAudio && !this.musicAudio.paused && this.currentMusicIndex === index;
            const loading = this.loadingMusicIndex === index && this.currentMusicIndex === index && !active;
            button.classList.toggle('playing', active);
            button.classList.toggle('loading', loading);
            button.disabled = false;
            button.setAttribute('aria-busy', String(loading));
            button.textContent = active ? '停止' : (loading ? '加载中' : '播放');
            button.setAttribute('aria-label', active ? '停止睡眠音乐播放' : (loading ? '睡眠音乐加载中' : '播放睡眠音乐'));
        });
    }

    setupIOSSilentModeWorkaround() {
        if (!this.isIOSDevice) return;

        const unlock = async () => {
            try {
                await this.preparePlayback();
            } catch (error) {
                console.warn('iOS audio pre-unlock failed:', error);
            }
        };

        document.addEventListener('touchstart', unlock, { once: true, passive: true });
        document.addEventListener('click', unlock, { once: true, passive: true });
    }

    setPlaybackSession() {
        try {
            if (navigator.audioSession && navigator.audioSession.type !== 'playback') {
                navigator.audioSession.type = 'playback';
            }
        } catch (error) {
            console.warn('audioSession API not available:', error);
        }
    }

    async unlockWebAudioPlayback() {
        await this.initAudioContext();
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        source.stop(0.001);
    }

    async unlockMusicElement(trackUrl) {
        if (!this.isIOSDevice || this.iosPlaybackUnlocked || !trackUrl) {
            return;
        }

        const audio = this.getMusicAudio();
        const originalSrc = audio.currentSrc || audio.src;
        const originalVolume = audio.volume;
        const originalMuted = audio.muted;
        const unlockTrackPath = this.musicTracks[2]?.url || this.musicTracks[0]?.url || trackUrl;
        const unlockSourceUrl = new URL(this.resolveAudioUrl(unlockTrackPath), window.location.href).href;

        audio.src = unlockSourceUrl;
        audio.load();
        audio.volume = 0;
        audio.muted = true;

        try {
            await audio.play();
            audio.pause();
            audio.currentTime = 0;
            this.iosPlaybackUnlocked = true;
        } finally {
            audio.pause();
            audio.muted = originalMuted;
            audio.volume = originalVolume;
            if (originalSrc && originalSrc !== unlockSourceUrl) {
                audio.src = originalSrc;
            }
        }
    }

    async preparePlayback(trackUrl) {
        this.setPlaybackSession();
        await this.unlockWebAudioPlayback();
        await this.unlockMusicElement(trackUrl);
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
        // Enhanced pink noise for more realistic rain with density variation
        const bufferSize = 4 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Add density variation for more natural rain
            const densityMod = Math.sin(i / this.audioContext.sampleRate * 0.3) * 0.3 + 0.7;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.13 * densityMod;
            b6 = white * 0.115926;
        }

        const rainNoise = this.audioContext.createBufferSource();
        rainNoise.buffer = buffer;
        rainNoise.loop = true;

        // Dual filters for near and far rain layers
        const nearFilter = this.audioContext.createBiquadFilter();
        nearFilter.type = 'bandpass';
        nearFilter.frequency.setValueAtTime(2500, this.audioContext.currentTime);
        nearFilter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

        const farFilter = this.audioContext.createBiquadFilter();
        farFilter.type = 'lowpass';
        farFilter.frequency.setValueAtTime(1200, this.audioContext.currentTime);

        const nearGain = this.audioContext.createGain();
        nearGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);

        const farGain = this.audioContext.createGain();
        farGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);

        // Connect both layers
        rainNoise.connect(nearFilter);
        nearFilter.connect(nearGain);
        nearGain.connect(this.masterGainNode);

        rainNoise.connect(farFilter);
        farFilter.connect(farGain);
        farGain.connect(this.masterGainNode);

        rainNoise.start();

        return {
            stop: () => {
                rainNoise.stop();
                rainNoise.disconnect();
            }
        };
    }

    createOceanSound() {
        // Enhanced ocean waves with longer period and foam detail
        const bufferSize = 8 * this.audioContext.sampleRate;
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

            // Longer wave period with multiple harmonics
            const time = i / this.audioContext.sampleRate;
            const wave1 = Math.sin(time * 0.08 * Math.PI * 2);
            const wave2 = Math.sin(time * 0.13 * Math.PI * 2) * 0.5;
            const waveMod = ((wave1 + wave2) + 2) * 0.25 + 0.2;

            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12 * waveMod;
            b6 = white * 0.115926;
        }

        const oceanNoise = this.audioContext.createBufferSource();
        oceanNoise.buffer = buffer;
        oceanNoise.loop = true;

        const mainFilter = this.audioContext.createBiquadFilter();
        mainFilter.type = 'lowpass';
        mainFilter.frequency.setValueAtTime(900, this.audioContext.currentTime);

        // Add high-frequency foam detail
        const foamFilter = this.audioContext.createBiquadFilter();
        foamFilter.type = 'highpass';
        foamFilter.frequency.setValueAtTime(2000, this.audioContext.currentTime);

        const mainGain = this.audioContext.createGain();
        mainGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);

        const foamGain = this.audioContext.createGain();
        foamGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);

        oceanNoise.connect(mainFilter);
        mainFilter.connect(mainGain);
        mainGain.connect(this.masterGainNode);

        oceanNoise.connect(foamFilter);
        foamFilter.connect(foamGain);
        foamGain.connect(this.masterGainNode);

        oceanNoise.start();

        return {
            stop: () => {
                oceanNoise.stop();
                oceanNoise.disconnect();
            }
        };
    }

    createWindSound() {
        const bufferSize = 3 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Multi-layered wind with varying intensity
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            const gustMod = Math.sin(i / this.audioContext.sampleRate * 0.4) * 0.4 + 0.6;
            b0 = 0.99765 * b0 + white * 0.0990460;
            b1 = 0.96300 * b1 + white * 0.2965164;
            b2 = 0.57000 * b2 + white * 1.0526913;
            output[i] = (b0 + b1 + b2) * 0.09 * gustMod;
        }

        const windNoise = this.audioContext.createBufferSource();
        windNoise.buffer = buffer;
        windNoise.loop = true;

        // Multiple filters for depth
        const lowFilter = this.audioContext.createBiquadFilter();
        lowFilter.type = 'bandpass';
        lowFilter.frequency.setValueAtTime(400, this.audioContext.currentTime);
        lowFilter.Q.setValueAtTime(0.4, this.audioContext.currentTime);

        const midFilter = this.audioContext.createBiquadFilter();
        midFilter.type = 'bandpass';
        midFilter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        midFilter.Q.setValueAtTime(0.3, this.audioContext.currentTime);

        // Dual LFOs for more complex modulation
        const lfo1 = this.audioContext.createOscillator();
        const lfo1Gain = this.audioContext.createGain();
        lfo1.frequency.setValueAtTime(0.15, this.audioContext.currentTime);
        lfo1Gain.gain.setValueAtTime(250, this.audioContext.currentTime);
        lfo1.connect(lfo1Gain);
        lfo1Gain.connect(midFilter.frequency);
        lfo1.start();

        const lfo2 = this.audioContext.createOscillator();
        const lfo2Gain = this.audioContext.createGain();
        lfo2.frequency.setValueAtTime(0.08, this.audioContext.currentTime);
        lfo2Gain.gain.setValueAtTime(150, this.audioContext.currentTime);
        lfo2.connect(lfo2Gain);
        lfo2Gain.connect(lowFilter.frequency);
        lfo2.start();

        const lowGain = this.audioContext.createGain();
        lowGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        const midGain = this.audioContext.createGain();
        midGain.gain.setValueAtTime(0.25, this.audioContext.currentTime);

        windNoise.connect(lowFilter);
        lowFilter.connect(lowGain);
        lowGain.connect(this.masterGainNode);

        windNoise.connect(midFilter);
        midFilter.connect(midGain);
        midGain.connect(this.masterGainNode);

        windNoise.start();

        return {
            stop: () => {
                lfo1.stop();
                lfo2.stop();
                windNoise.stop();
                lfo1.disconnect();
                lfo2.disconnect();
                windNoise.disconnect();
            }
        };
    }

    createHeartbeatSound() {
        const createBeat = () => {
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Use higher, more audible frequencies
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(80, this.audioContext.currentTime);
            osc2.frequency.setValueAtTime(100, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

            // Add a low-pass filter for warmer sound
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(150, this.audioContext.currentTime);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGainNode);

            osc1.start();
            osc2.start();

            return { osc1, osc2, gainNode, filter };
        };

        const { osc1, osc2, gainNode, filter } = createBeat();

        // Schedule heartbeat pattern with higher gain
        const scheduleHeartbeat = () => {
            const now = this.audioContext.currentTime;

            // First beat (lub) - louder
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.8, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            // Second beat (dub)
            gainNode.gain.setValueAtTime(0.01, now + 0.2);
            gainNode.gain.linearRampToValueAtTime(0.6, now + 0.25);
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
        // Enhanced forest ambient with leaves rustling
        const bufferSize = 6 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Richer ambient with leaves rustling
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            const rustleMod = Math.sin(i / this.audioContext.sampleRate * 1.5) * 0.3 + 0.7;
            b0 = 0.99 * b0 + white * 0.1;
            b1 = 0.9 * b1 + white * 0.2;
            b2 = 0.8 * b2 + white * 0.15;
            output[i] = (b0 + b1 + b2) * 0.06 * rustleMod;
        }

        const ambientNoise = this.audioContext.createBufferSource();
        ambientNoise.buffer = buffer;
        ambientNoise.loop = true;

        const lowFilter = this.audioContext.createBiquadFilter();
        lowFilter.type = 'bandpass';
        lowFilter.frequency.setValueAtTime(600, this.audioContext.currentTime);
        lowFilter.Q.setValueAtTime(0.6, this.audioContext.currentTime);

        const highFilter = this.audioContext.createBiquadFilter();
        highFilter.type = 'highpass';
        highFilter.frequency.setValueAtTime(1500, this.audioContext.currentTime);

        const lowGain = this.audioContext.createGain();
        lowGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        const highGain = this.audioContext.createGain();
        highGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);

        ambientNoise.connect(lowFilter);
        lowFilter.connect(lowGain);
        lowGain.connect(this.masterGainNode);

        ambientNoise.connect(highFilter);
        highFilter.connect(highGain);
        highGain.connect(this.masterGainNode);

        ambientNoise.start();

        // Multiple bird types
        const createChirp = (baseFreq, variation) => {
            const chirpOsc = this.audioContext.createOscillator();
            const chirpGain = this.audioContext.createGain();

            chirpOsc.type = 'sine';
            chirpGain.gain.setValueAtTime(0, this.audioContext.currentTime);

            chirpOsc.connect(chirpGain);
            chirpGain.connect(this.masterGainNode);
            chirpOsc.start();

            const scheduleChirp = () => {
                if (Math.random() > 0.25) return;

                const now = this.audioContext.currentTime;
                const freq = baseFreq + Math.random() * variation;

                chirpOsc.frequency.setValueAtTime(freq, now);
                chirpOsc.frequency.linearRampToValueAtTime(freq * 1.15, now + 0.04);
                chirpOsc.frequency.linearRampToValueAtTime(freq * 0.85, now + 0.12);

                chirpGain.gain.setValueAtTime(0, now);
                chirpGain.gain.linearRampToValueAtTime(0.06, now + 0.02);
                chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            };

            const interval = setInterval(scheduleChirp, 800 + Math.random() * 2000);

            return { chirpOsc, chirpGain, interval };
        };

        const chirp1 = createChirp(2200, 1500);
        const chirp2 = createChirp(3500, 1000);

        return {
            stop: () => {
                clearInterval(chirp1.interval);
                clearInterval(chirp2.interval);
                chirp1.chirpOsc.stop();
                chirp2.chirpOsc.stop();
                ambientNoise.stop();
                chirp1.chirpOsc.disconnect();
                chirp2.chirpOsc.disconnect();
                ambientNoise.disconnect();
            }
        };
    }

    createNightSound() {
        const now = this.audioContext.currentTime;
        const bufferSize = 10 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        const timeouts = [];
        const crickets = [];

        let brown = 0;
        let breeze = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            brown = (brown + white * 0.018) / 1.018;
            breeze = 0.992 * breeze + white * 0.014;
            const sway = 0.72 + 0.28 * Math.sin((i / this.audioContext.sampleRate) * 0.11 * Math.PI * 2);
            output[i] = (brown * 0.72 + breeze * 0.35) * 0.06 * sway;
        }

        const ambientNoise = this.audioContext.createBufferSource();
        ambientNoise.buffer = buffer;
        ambientNoise.loop = true;

        const highPass = this.audioContext.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.setValueAtTime(120, now);

        const lowPass = this.audioContext.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.setValueAtTime(1600, now);
        lowPass.Q.setValueAtTime(0.5, now);

        const ambientGain = this.audioContext.createGain();
        ambientGain.gain.setValueAtTime(0.12, now);

        const motionLfo = this.audioContext.createOscillator();
        const motionDepth = this.audioContext.createGain();
        motionLfo.type = 'sine';
        motionLfo.frequency.setValueAtTime(0.045, now);
        motionDepth.gain.setValueAtTime(0.03, now);

        const outputGain = this.audioContext.createGain();
        outputGain.gain.setValueAtTime(0, now);
        outputGain.gain.linearRampToValueAtTime(1, now + 1.2);

        ambientNoise.connect(highPass);
        highPass.connect(lowPass);
        lowPass.connect(ambientGain);
        ambientGain.connect(outputGain);
        outputGain.connect(this.masterGainNode);

        motionLfo.connect(motionDepth);
        motionDepth.connect(ambientGain.gain);

        const createCricket = (baseFrequency, baseLevel, panDelayMs) => {
            const oscillator = this.audioContext.createOscillator();
            const bandPass = this.audioContext.createBiquadFilter();
            const voiceGain = this.audioContext.createGain();

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(baseFrequency, now);

            bandPass.type = 'bandpass';
            bandPass.frequency.setValueAtTime(baseFrequency, now);
            bandPass.Q.setValueAtTime(6, now);

            voiceGain.gain.setValueAtTime(0.0001, now);

            oscillator.connect(bandPass);
            bandPass.connect(voiceGain);
            voiceGain.connect(outputGain);

            oscillator.start();
            crickets.push({ oscillator, bandPass, voiceGain });

            const scheduleCluster = () => {
                if (!this.soundNodes.current) return;

                const startAt = this.audioContext.currentTime + panDelayMs / 1000;
                const chirpCount = 2 + Math.floor(Math.random() * 3);
                const chirpSpacing = 0.085 + Math.random() * 0.05;
                const peak = baseLevel * (0.9 + Math.random() * 0.25);

                for (let index = 0; index < chirpCount; index++) {
                    const chirpAt = startAt + index * chirpSpacing;
                    const chirpLength = 0.04 + Math.random() * 0.02;
                    const chirpFrequency = baseFrequency * (0.96 + Math.random() * 0.08);

                    oscillator.frequency.setValueAtTime(chirpFrequency, chirpAt);
                    oscillator.frequency.linearRampToValueAtTime(chirpFrequency * 1.06, chirpAt + chirpLength * 0.45);
                    oscillator.frequency.linearRampToValueAtTime(chirpFrequency * 0.93, chirpAt + chirpLength);

                    voiceGain.gain.setValueAtTime(0.0001, chirpAt);
                    voiceGain.gain.linearRampToValueAtTime(peak, chirpAt + 0.008);
                    voiceGain.gain.exponentialRampToValueAtTime(0.0001, chirpAt + chirpLength);
                }

                const nextDelayMs = 4200 + Math.random() * 3600;
                const timeoutId = window.setTimeout(scheduleCluster, nextDelayMs);
                timeouts.push(timeoutId);
            };

            const initialDelayMs = 900 + Math.random() * 2200;
            const timeoutId = window.setTimeout(scheduleCluster, initialDelayMs);
            timeouts.push(timeoutId);
        };

        createCricket(3600, 0.012, 0);
        createCricket(4200, 0.008, 180);

        motionLfo.start();
        ambientNoise.start();

        let stopped = false;
        return {
            stop: () => {
                if (stopped) return;
                stopped = true;

                timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));

                const stopNow = this.audioContext.currentTime;
                const stopAt = stopNow + 0.7;
                outputGain.gain.cancelScheduledValues(stopNow);
                outputGain.gain.setTargetAtTime(0, stopNow, 0.14);

                motionLfo.stop(stopAt);
                ambientNoise.stop(stopAt);
                crickets.forEach(({ oscillator }) => oscillator.stop(stopAt));

                window.setTimeout(() => {
                    ambientNoise.disconnect();
                    highPass.disconnect();
                    lowPass.disconnect();
                    ambientGain.disconnect();
                    motionLfo.disconnect();
                    motionDepth.disconnect();
                    outputGain.disconnect();
                    crickets.forEach(({ oscillator, bandPass, voiceGain }) => {
                        oscillator.disconnect();
                        bandPass.disconnect();
                        voiceGain.disconnect();
                    });
                }, 900);
            }
        };
    }

    createClockSound() {
        const now = this.audioContext.currentTime;
        const burstLength = Math.floor(this.audioContext.sampleRate * 0.16);
        const burstBuffer = this.audioContext.createBuffer(1, burstLength, this.audioContext.sampleRate);
        const burstData = burstBuffer.getChannelData(0);
        let tone = 0;

        for (let i = 0; i < burstLength; i++) {
            const white = Math.random() * 2 - 1;
            const decay = Math.exp(-i / (burstLength * 0.16));
            tone = 0.78 * tone + white * 0.22;
            burstData[i] = tone * decay * 0.5;
        }

        const outputGain = this.audioContext.createGain();
        outputGain.gain.setValueAtTime(0, now);
        outputGain.gain.linearRampToValueAtTime(1, now + 0.25);
        outputGain.connect(this.masterGainNode);

        let isTick = true;
        let tickTimeout = null;
        let stopped = false;

        const playStrike = (tick) => {
            const strikeTime = this.audioContext.currentTime;
            const attack = tick ? 0.055 : 0.07;
            const bodyFrequency = tick ? 1980 : 1620;
            const resonanceFrequency = tick ? 760 : 620;
            const noiseFilterFrequency = tick ? 2200 : 1800;
            const peak = tick ? 0.095 : 0.078;

            const noiseSource = this.audioContext.createBufferSource();
            const noiseFilter = this.audioContext.createBiquadFilter();
            const noiseGain = this.audioContext.createGain();
            const bodyOsc = this.audioContext.createOscillator();
            const bodyGain = this.audioContext.createGain();
            const resonanceOsc = this.audioContext.createOscillator();
            const resonanceGain = this.audioContext.createGain();

            noiseSource.buffer = burstBuffer;
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(noiseFilterFrequency, strikeTime);
            noiseFilter.Q.setValueAtTime(3, strikeTime);

            noiseGain.gain.setValueAtTime(peak * 0.55, strikeTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + attack);

            bodyOsc.type = 'triangle';
            bodyOsc.frequency.setValueAtTime(bodyFrequency, strikeTime);
            bodyGain.gain.setValueAtTime(0.0001, strikeTime);
            bodyGain.gain.linearRampToValueAtTime(peak, strikeTime + 0.004);
            bodyGain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + attack);

            resonanceOsc.type = 'sine';
            resonanceOsc.frequency.setValueAtTime(resonanceFrequency, strikeTime);
            resonanceGain.gain.setValueAtTime(0.0001, strikeTime);
            resonanceGain.gain.linearRampToValueAtTime(peak * 0.38, strikeTime + 0.012);
            resonanceGain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 0.17);

            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(outputGain);

            bodyOsc.connect(bodyGain);
            bodyGain.connect(outputGain);

            resonanceOsc.connect(resonanceGain);
            resonanceGain.connect(outputGain);

            noiseSource.start(strikeTime);
            noiseSource.stop(strikeTime + 0.2);
            bodyOsc.start(strikeTime);
            bodyOsc.stop(strikeTime + 0.22);
            resonanceOsc.start(strikeTime);
            resonanceOsc.stop(strikeTime + 0.24);

            window.setTimeout(() => {
                noiseSource.disconnect();
                noiseFilter.disconnect();
                noiseGain.disconnect();
                bodyOsc.disconnect();
                bodyGain.disconnect();
                resonanceOsc.disconnect();
                resonanceGain.disconnect();
            }, 320);
        };

        const scheduleTick = () => {
            if (stopped) return;

            playStrike(isTick);
            isTick = !isTick;
            tickTimeout = window.setTimeout(scheduleTick, 500 + (Math.random() - 0.5) * 14);
        };

        scheduleTick();

        return {
            stop: () => {
                if (stopped) return;
                stopped = true;

                if (tickTimeout) {
                    window.clearTimeout(tickTimeout);
                }

                const stopNow = this.audioContext.currentTime;
                outputGain.gain.cancelScheduledValues(stopNow);
                outputGain.gain.setTargetAtTime(0, stopNow, 0.08);

                window.setTimeout(() => {
                    outputGain.disconnect();
                }, 420);
            }
        };
    }

    createWaterSound() {
        return this.createMediaLoopPlayback(this.resolveAudioUrl('./audio/river.mp3'), 0.9);
    }

    createShushSound() {
        return this.createMediaLoopPlayback(this.resolveAudioUrl('./audio/xu.mp3'), 0.9);
    }

    // ===== Timer Functions =====

    setTimer(minutes) {
        this.timerMinutes = minutes;

        this.timerButtons.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.minutes, 10) === minutes) {
                btn.classList.add('active');
            }
        });

        if (minutes === 0) {
            this.timerValue.textContent = '关闭';
            this.stopTimer();
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            this.timerValue.textContent = hours > 0 ? `${hours}小时${mins > 0 ? mins + '分' : ''}` : `${mins}分钟`;

            if (this.hasActivePlayback()) {
                this.startTimer();
            }
        }

        this.persistState();
    }

    startTimer() {
        if (this.timerMinutes === 0) return;

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

        this.timerEndTime = null;
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
