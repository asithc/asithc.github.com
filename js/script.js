// Main JavaScript for animations and interactions

// Pre-load navigation click sound for instant playback
let clickAudioBuffer = null;
let audioContext = null;

// Initialize audio context and create click sound buffer
const initClickSound = () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a buffer for the light switch click sound
    const sampleRate = audioContext.sampleRate;
    const duration = 0.05; // 50ms
    const bufferSize = sampleRate * duration;
    clickAudioBuffer = audioContext.createBuffer(1, bufferSize, sampleRate);
    const channelData = clickAudioBuffer.getChannelData(0);
    
    // Generate light switch tap sound waveform
    for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;
        
        // High frequency click (800Hz -> 200Hz)
        const freq1 = 800 * Math.exp(-t * 30);
        const click = Math.sin(2 * Math.PI * freq1 * t) * 0.5;
        
        // Mid frequency body (300Hz -> 150Hz)
        const freq2 = 300 * Math.exp(-t * 20);
        const body = Math.sin(2 * Math.PI * freq2 * t) * 0.3;
        
        // Low frequency depth (100Hz)
        const depth = Math.sin(2 * Math.PI * 100 * t) * 0.2;
        
        // Apply envelope (quick decay)
        const envelope = Math.exp(-t * 40);
        
        channelData[i] = (click + body + depth) * envelope;
    }
};

// Play the pre-generated click sound
const playClickSound = () => {
    if (!audioContext || !clickAudioBuffer) {
        initClickSound();
    }
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = clickAudioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.4;
    
    source.start(0);
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClickSound);
} else {
    initClickSound();
}

// Add click sound to navigation links and elastic slide animation
const initNavSounds = () => {
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const updateActiveIndicator = (activeLink, instant = false) => {
        if (!activeLink || !nav) return;
        
        const linkRect = activeLink.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        
        // Calculate position accounting for nav padding
        const left = linkRect.left - navRect.left;
        const width = linkRect.width;
        
        // If instant (initial load), disable transition temporarily
        if (instant) {
            nav.style.setProperty('--transition-duration', '0s');
        } else {
            nav.style.setProperty('--transition-duration', '0.4s');
        }
        
        nav.style.setProperty('--active-left', `${left}px`);
        nav.style.setProperty('--active-width', `${width}px`);
        
        if (!nav.classList.contains('has-active')) {
            nav.classList.add('has-active');
        }
        
        // Re-enable transition after instant set
        if (instant) {
            requestAnimationFrame(() => {
                nav.style.setProperty('--transition-duration', '0.4s');
            });
        }
    };
    
    navLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            playClickSound();
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Update indicator position with elastic animation (not instant)
            updateActiveIndicator(link, false);
        });
    });
    
    // Initialize on page load (instant, no animation)
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
        setTimeout(() => updateActiveIndicator(activeLink, true), 100);
    }
    
    // Update on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const currentActive = document.querySelector('.nav-link.active');
            if (currentActive) updateActiveIndicator(currentActive, true);
        }, 250);
    });
};

// Intersection Observer for fade-in animations
const observeElements = () => {
    const options = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, options);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
};

// Lazy loading for work cards with staggered reveal
const initWorkCardLazyLoad = () => {
    const workCards = document.querySelectorAll('.work-card');
    if (workCards.length === 0) return;

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Stop observing once visible
                cardObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    workCards.forEach(card => {
        cardObserver.observe(card);
    });
};

// Lazy loading for project detail images
const initProjectImageLazyLoad = () => {
    const projectImages = document.querySelectorAll('.project-image-item');
    if (projectImages.length === 0) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                imageObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    projectImages.forEach(img => {
        imageObserver.observe(img);
    });
};

// Full-screen screenshot viewer for project pages
const initProjectScreenshotLightbox = () => {
    if (!document.body.classList.contains('project-detail-page')) return;

    const screenshotImages = Array.from(document.querySelectorAll('main img')).filter((img) => {
        if (!img.src) return false;
        if (img.classList.contains('wizpos-hero-symbol') || img.classList.contains('wizpos-wordmark')) return false;
        if (img.classList.contains('dgl-main-logo') || img.classList.contains('hopon-map-base-image')) return false;
        if (img.closest('.project-collage') || img.closest('.project-image-placeholder')) return false;

        const src = (img.currentSrc || img.src || '').toLowerCase();
        const isProjectAsset = src.includes('/images/projects/') || src.includes('../images/projects/');
        const isRasterImage = /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i.test(src);
        return isProjectAsset && isRasterImage;
    });

    if (screenshotImages.length === 0) return;

    const slides = screenshotImages.map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt || 'Project screenshot'
    }));

    const lightbox = document.createElement('div');
    lightbox.className = 'project-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML = `
        <button class="project-lightbox-close" type="button" aria-label="Close full screen viewer">Close</button>
        <div class="project-lightbox-inner">
            <button class="project-lightbox-nav project-lightbox-prev" type="button" aria-label="Previous screenshot">&#8592;</button>
            <div class="project-lightbox-stage">
                <img class="project-lightbox-image" alt="">
            </div>
            <button class="project-lightbox-nav project-lightbox-next" type="button" aria-label="Next screenshot">&#8594;</button>
        </div>
        <div class="project-lightbox-toolbar">
            <button class="project-lightbox-zoom-out" type="button" aria-label="Zoom out">-</button>
            <span class="project-lightbox-zoom-value">100%</span>
            <button class="project-lightbox-zoom-in" type="button" aria-label="Zoom in">+</button>
            <button class="project-lightbox-zoom-reset" type="button" aria-label="Reset zoom">Reset</button>
            <span class="project-lightbox-counter"></span>
        </div>
    `;

    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector('.project-lightbox-image');
    const closeButton = lightbox.querySelector('.project-lightbox-close');
    const prevButton = lightbox.querySelector('.project-lightbox-prev');
    const nextButton = lightbox.querySelector('.project-lightbox-next');
    const stage = lightbox.querySelector('.project-lightbox-stage');
    const counter = lightbox.querySelector('.project-lightbox-counter');
    const zoomInButton = lightbox.querySelector('.project-lightbox-zoom-in');
    const zoomOutButton = lightbox.querySelector('.project-lightbox-zoom-out');
    const zoomResetButton = lightbox.querySelector('.project-lightbox-zoom-reset');
    const zoomValue = lightbox.querySelector('.project-lightbox-zoom-value');

    let activeIndex = 0;
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let savedBodyOverflow = '';

    let isMouseDragging = false;
    let mouseStartX = 0;
    let mouseStartY = 0;
    let panStartX = 0;
    let panStartY = 0;

    let touchStartX = 0;
    let touchStartY = 0;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let isTouchPanning = false;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const getStageMetrics = () => {
        const stageWidth = stage.clientWidth || 1;
        const stageHeight = stage.clientHeight || 1;
        const naturalWidth = lightboxImage.naturalWidth || stageWidth;
        const naturalHeight = lightboxImage.naturalHeight || stageHeight;

        const imageRatio = naturalWidth / naturalHeight;
        const stageRatio = stageWidth / stageHeight;

        let displayWidth = stageWidth;
        let displayHeight = stageHeight;

        if (imageRatio > stageRatio) {
            displayHeight = stageWidth / imageRatio;
        } else {
            displayWidth = stageHeight * imageRatio;
        }

        return { stageWidth, stageHeight, displayWidth, displayHeight };
    };

    const clampPan = () => {
        if (scale <= 1) {
            panX = 0;
            panY = 0;
            return;
        }

        const { stageWidth, stageHeight, displayWidth, displayHeight } = getStageMetrics();
        const maxPanX = Math.max(0, ((displayWidth * scale) - stageWidth) / 2);
        const maxPanY = Math.max(0, ((displayHeight * scale) - stageHeight) / 2);

        panX = clamp(panX, -maxPanX, maxPanX);
        panY = clamp(panY, -maxPanY, maxPanY);
    };

    const updateTransform = () => {
        clampPan();
        lightboxImage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
        zoomValue.textContent = `${Math.round(scale * 100)}%`;
    };

    const setScale = (nextScale) => {
        scale = clamp(nextScale, 1, 4);
        if (scale === 1) {
            panX = 0;
            panY = 0;
        }
        updateTransform();
    };

    const resetZoom = () => {
        scale = 1;
        panX = 0;
        panY = 0;
        updateTransform();
    };

    const setSlide = (nextIndex) => {
        const total = slides.length;
        activeIndex = (nextIndex + total) % total;

        const slide = slides[activeIndex];
        counter.textContent = `${activeIndex + 1} / ${total}`;

        lightboxImage.classList.add('is-loading');
        lightboxImage.onload = () => {
            lightboxImage.classList.remove('is-loading');
            resetZoom();
        };
        lightboxImage.src = slide.src;
        lightboxImage.alt = slide.alt;
    };

    const showNext = () => setSlide(activeIndex + 1);
    const showPrev = () => setSlide(activeIndex - 1);

    const openLightbox = (index) => {
        savedBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        setSlide(index);
    };

    const closeLightbox = () => {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = savedBodyOverflow;
        resetZoom();
    };

    screenshotImages.forEach((img, index) => {
        img.classList.add('project-lightbox-trigger');
        img.setAttribute('role', 'button');
        img.setAttribute('tabindex', '0');
        img.setAttribute('aria-label', `Open screenshot ${index + 1} in full screen`);

        img.addEventListener('click', (event) => {
            event.preventDefault();
            openLightbox(index);
        });

        img.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLightbox(index);
            }
        });
    });

    closeButton.addEventListener('click', closeLightbox);
    prevButton.addEventListener('click', showPrev);
    nextButton.addEventListener('click', showNext);
    zoomInButton.addEventListener('click', () => setScale(scale + 0.25));
    zoomOutButton.addEventListener('click', () => setScale(scale - 0.25));
    zoomResetButton.addEventListener('click', resetZoom);

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox || event.target.classList.contains('project-lightbox-inner')) {
            closeLightbox();
        }
    });

    stage.addEventListener('click', (event) => {
        if (event.target === stage && scale === 1) {
            closeLightbox();
        }
    });

    stage.addEventListener('dblclick', () => {
        if (scale > 1) {
            resetZoom();
            return;
        }
        setScale(2);
    });

    stage.addEventListener('wheel', (event) => {
        event.preventDefault();
        const delta = event.deltaY < 0 ? 0.2 : -0.2;
        setScale(scale + delta);
    }, { passive: false });

    stage.addEventListener('mousedown', (event) => {
        if (scale <= 1) return;
        event.preventDefault();
        isMouseDragging = true;
        mouseStartX = event.clientX;
        mouseStartY = event.clientY;
        panStartX = panX;
        panStartY = panY;
        lightboxImage.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (event) => {
        if (!isMouseDragging) return;
        const deltaX = event.clientX - mouseStartX;
        const deltaY = event.clientY - mouseStartY;
        panX = panStartX + deltaX;
        panY = panStartY + deltaY;
        updateTransform();
    });

    window.addEventListener('mouseup', () => {
        if (!isMouseDragging) return;
        isMouseDragging = false;
        lightboxImage.classList.remove('is-dragging');
    });

    const getTouchDistance = (touches) => {
        if (touches.length < 2) return 0;
        const deltaX = touches[0].clientX - touches[1].clientX;
        const deltaY = touches[0].clientY - touches[1].clientY;
        return Math.hypot(deltaX, deltaY);
    };

    stage.addEventListener('touchstart', (event) => {
        if (event.touches.length === 2) {
            pinchStartDistance = getTouchDistance(event.touches);
            pinchStartScale = scale;
            return;
        }

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            panStartX = panX;
            panStartY = panY;
            isTouchPanning = scale > 1;
        }
    }, { passive: true });

    stage.addEventListener('touchmove', (event) => {
        if (event.touches.length === 2) {
            const distance = getTouchDistance(event.touches);
            if (!pinchStartDistance || !distance) return;
            event.preventDefault();
            setScale(pinchStartScale * (distance / pinchStartDistance));
            return;
        }

        if (event.touches.length === 1 && isTouchPanning) {
            event.preventDefault();
            const touch = event.touches[0];
            panX = panStartX + (touch.clientX - touchStartX);
            panY = panStartY + (touch.clientY - touchStartY);
            updateTransform();
        }
    }, { passive: false });

    stage.addEventListener('touchend', (event) => {
        if (event.touches.length < 2) {
            pinchStartDistance = 0;
        }

        if (event.touches.length !== 0) return;

        if (scale <= 1 && event.changedTouches.length > 0) {
            const changedTouch = event.changedTouches[0];
            const deltaX = changedTouch.clientX - touchStartX;
            const deltaY = changedTouch.clientY - touchStartY;
            if (Math.abs(deltaX) > 64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
                if (deltaX < 0) showNext();
                else showPrev();
            }
        }

        isTouchPanning = false;
    });

    document.addEventListener('keydown', (event) => {
        if (!lightbox.classList.contains('is-open')) return;

        if (event.key === 'Escape') {
            closeLightbox();
            return;
        }

        if (event.key === 'ArrowRight') {
            showNext();
            return;
        }

        if (event.key === 'ArrowLeft') {
            showPrev();
            return;
        }

        if (event.key === '+' || event.key === '=') {
            setScale(scale + 0.25);
            return;
        }

        if (event.key === '-' || event.key === '_') {
            setScale(scale - 0.25);
        }
    });

    window.addEventListener('resize', () => {
        if (lightbox.classList.contains('is-open')) {
            updateTransform();
        }
    });
};

// Custom HTML5 player controls for WizPos case-study video
const initWizposVideoPlayers = () => {
    const players = document.querySelectorAll('[data-wizpos-player]');
    if (players.length === 0) return;
    const autoplayStorageKey = 'wizpos-video-autoplay-enabled';

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
        const rounded = Math.floor(seconds);
        const mins = Math.floor(rounded / 60);
        const secs = rounded % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getFullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

    players.forEach((player) => {
        const video = player.querySelector('.wizpos-video-el');
        const controls = player.querySelector('.wizpos-video-controls');
        const toggleButton = player.querySelector('[data-action="toggle"]');
        const stopButton = player.querySelector('[data-action="stop"]');
        const autoplayButton = player.querySelector('[data-action="autoplay"]');
        const muteButton = player.querySelector('[data-action="mute"]');
        const fullscreenButton = player.querySelector('[data-action="fullscreen"]');
        const seekInput = player.querySelector('.wizpos-video-seek');
        const currentTimeEl = player.querySelector('[data-time-current]');
        const durationEl = player.querySelector('[data-time-duration]');
        const bufferingIndicator = player.querySelector('[data-buffering-indicator]');

        if (!video || !controls || !toggleButton || !muteButton || !fullscreenButton || !seekInput) return;

        let isScrubbing = false;
        let autoplayEnabled = false;

        const getBufferedEndTime = () => {
            const duration = Number.isFinite(video.duration) ? video.duration : 0;
            if (!duration || !video.buffered || video.buffered.length === 0) return 0;

            let bufferedEnd = 0;
            for (let i = 0; i < video.buffered.length; i += 1) {
                bufferedEnd = Math.max(bufferedEnd, video.buffered.end(i));
            }
            return Math.min(bufferedEnd, duration);
        };

        const syncSeekVisual = (previewTime = null) => {
            const duration = Number.isFinite(video.duration) ? video.duration : 0;
            if (!duration) {
                seekInput.style.setProperty('--seek-played', '0%');
                seekInput.style.setProperty('--seek-buffered', '0%');
                return;
            }

            const playedTime = Number.isFinite(previewTime) ? previewTime : video.currentTime;
            const playedPercent = Math.min(Math.max((playedTime / duration) * 100, 0), 100);
            const bufferedPercent = Math.max(
                playedPercent,
                Math.min(Math.max((getBufferedEndTime() / duration) * 100, 0), 100)
            );

            seekInput.style.setProperty('--seek-played', `${playedPercent}%`);
            seekInput.style.setProperty('--seek-buffered', `${bufferedPercent}%`);
        };

        const syncBufferingState = () => {
            if (!bufferingIndicator) return;
            const waitingForData = video.readyState < 3 && !video.paused && !video.ended;
            player.classList.toggle('is-buffering', waitingForData);
        };

        const syncTimeline = () => {
            const duration = Number.isFinite(video.duration) ? video.duration : 0;
            const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;

            seekInput.max = duration > 0 ? duration.toString() : '0';
            if (!isScrubbing) {
                seekInput.value = Math.min(current, duration || 0).toString();
                if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
            }
            if (durationEl) durationEl.textContent = formatTime(duration);
            syncSeekVisual();
        };

        const syncPlayState = () => {
            const isPlaying = !video.paused && !video.ended;
            const srText = toggleButton.querySelector('.sr-only');
            toggleButton.classList.toggle('is-active', isPlaying);
            toggleButton.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
            if (srText) srText.textContent = isPlaying ? 'Pause video' : 'Play video';
            player.classList.toggle('is-playing', isPlaying);
        };

        const syncMuteState = () => {
            const isMuted = video.muted || video.volume === 0;
            const srText = muteButton.querySelector('.sr-only');
            muteButton.classList.toggle('is-active', isMuted);
            muteButton.setAttribute('aria-label', isMuted ? 'Unmute video' : 'Mute video');
            if (srText) srText.textContent = isMuted ? 'Unmute video' : 'Mute video';
        };

        const syncFullscreenState = () => {
            const fullscreenElement = getFullscreenElement();
            const isFullscreen = fullscreenElement === player || fullscreenElement === video;
            const srText = fullscreenButton.querySelector('.sr-only');
            fullscreenButton.classList.toggle('is-active', isFullscreen);
            fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
            if (srText) srText.textContent = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
        };

        const syncAutoplayState = () => {
            if (!autoplayButton) return;
            const srText = autoplayButton.querySelector('.sr-only');
            autoplayButton.classList.toggle('is-active', autoplayEnabled);
            autoplayButton.setAttribute('aria-label', autoplayEnabled ? 'Disable autoplay' : 'Enable autoplay');
            if (srText) srText.textContent = autoplayEnabled ? 'Disable autoplay' : 'Enable autoplay';
        };

        const tryAutoplay = () => {
            if (!autoplayEnabled) return;
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        };

        const togglePlayback = () => {
            if (video.paused || video.ended) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        };

        const toggleFullscreen = () => {
            const fullscreenElement = getFullscreenElement();
            const isFullscreen = fullscreenElement === player || fullscreenElement === video;

            if (isFullscreen) {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
                return;
            }

            if (player.requestFullscreen) {
                player.requestFullscreen().catch(() => {});
            } else if (video.webkitEnterFullscreen) {
                video.webkitEnterFullscreen();
            }
        };

        const commitSeek = () => {
            const nextTime = Number(seekInput.value);
            if (Number.isFinite(nextTime)) {
                video.currentTime = nextTime;
            }
            isScrubbing = false;
            syncTimeline();
        };

        toggleButton.addEventListener('click', togglePlayback);
        if (stopButton) {
            stopButton.addEventListener('click', () => {
                video.pause();
                video.currentTime = 0;
                isScrubbing = false;
                syncTimeline();
                syncPlayState();
            });
        }
        if (autoplayButton) {
            autoplayButton.addEventListener('click', () => {
                autoplayEnabled = !autoplayEnabled;
                try {
                    window.localStorage.setItem(autoplayStorageKey, autoplayEnabled ? '1' : '0');
                } catch (error) {
                    // Ignore storage access issues (private mode / denied storage).
                }
                video.autoplay = autoplayEnabled;
                syncAutoplayState();
                if (autoplayEnabled) {
                    tryAutoplay();
                }
            });
        }
        muteButton.addEventListener('click', () => {
            video.muted = !video.muted;
            if (!video.muted && video.volume === 0) {
                video.volume = 0.8;
            }
        });
        fullscreenButton.addEventListener('click', toggleFullscreen);
        video.addEventListener('click', togglePlayback);

        seekInput.addEventListener('input', () => {
            isScrubbing = true;
            const previewTime = Number(seekInput.value);
            if (currentTimeEl && Number.isFinite(previewTime)) {
                currentTimeEl.textContent = formatTime(previewTime);
            }
            syncSeekVisual(previewTime);
        });
        seekInput.addEventListener('change', commitSeek);
        seekInput.addEventListener('pointerup', commitSeek);
        seekInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                commitSeek();
            }
        });

        video.addEventListener('loadedmetadata', syncTimeline);
        video.addEventListener('loadedmetadata', tryAutoplay);
        video.addEventListener('durationchange', syncTimeline);
        video.addEventListener('timeupdate', syncTimeline);
        video.addEventListener('progress', () => {
            syncSeekVisual();
            syncBufferingState();
        });
        video.addEventListener('canplay', syncBufferingState);
        video.addEventListener('canplaythrough', syncBufferingState);
        video.addEventListener('waiting', syncBufferingState);
        video.addEventListener('stalled', syncBufferingState);
        video.addEventListener('seeking', syncBufferingState);
        video.addEventListener('seeked', syncBufferingState);
        video.addEventListener('play', syncPlayState);
        video.addEventListener('play', syncBufferingState);
        video.addEventListener('pause', () => {
            syncPlayState();
            syncBufferingState();
        });
        video.addEventListener('ended', syncPlayState);
        video.addEventListener('ended', syncBufferingState);
        video.addEventListener('volumechange', syncMuteState);

        document.addEventListener('fullscreenchange', syncFullscreenState);
        document.addEventListener('webkitfullscreenchange', syncFullscreenState);

        player.setAttribute('tabindex', '0');
        player.addEventListener('keydown', (event) => {
            const tagName = event.target?.tagName?.toLowerCase();
            if (tagName === 'input' || tagName === 'button') return;

            if (event.key === ' ' || event.key.toLowerCase() === 'k') {
                event.preventDefault();
                togglePlayback();
                return;
            }

            if (event.key.toLowerCase() === 'm') {
                event.preventDefault();
                video.muted = !video.muted;
                return;
            }

            if (event.key.toLowerCase() === 'f') {
                event.preventDefault();
                toggleFullscreen();
                return;
            }

            if (event.key.toLowerCase() === 's') {
                event.preventDefault();
                video.pause();
                video.currentTime = 0;
                isScrubbing = false;
                syncTimeline();
                syncPlayState();
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                const duration = Number.isFinite(video.duration) ? video.duration : 0;
                video.currentTime = Math.min(video.currentTime + 5, duration || video.currentTime + 5);
                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                video.currentTime = Math.max(video.currentTime - 5, 0);
            }
        });

        video.controls = false;
        player.classList.add('is-enhanced');
        try {
            autoplayEnabled = window.localStorage.getItem(autoplayStorageKey) === '1';
        } catch (error) {
            autoplayEnabled = false;
        }
        video.autoplay = autoplayEnabled;
        syncTimeline();
        syncPlayState();
        syncMuteState();
        syncFullscreenState();
        syncAutoplayState();
        syncBufferingState();
    });
};

// Interactive Sri Lanka corridor map for HopOn case study
const initHopOnRouteMap = () => {
    const mapWidgets = document.querySelectorAll('.hopon-map-widget');
    if (mapWidgets.length === 0) return;

    mapWidgets.forEach((widget) => {
        const routeButtons = Array.from(widget.querySelectorAll('.hopon-destination-btn'));
        const layerButtons = Array.from(widget.querySelectorAll('.hopon-layer-btn'));
        const markers = Array.from(widget.querySelectorAll('.hopon-marker[data-destination]'));
        const routes = Array.from(widget.querySelectorAll('.hopon-route'));
        const mapLayers = Array.from(widget.querySelectorAll('.hopon-map-base-image[data-layer]'));

        const detailName = widget.querySelector('[data-map-detail="name"]');
        const detailFamous = widget.querySelector('[data-map-detail="famous"]');
        const detailDistance = widget.querySelector('[data-map-detail="distance"]');
        const detailTime = widget.querySelector('[data-map-detail="time"]');
        const detailCorridors = widget.querySelector('[data-map-detail="corridors"]');

        if (routeButtons.length === 0 || routes.length === 0) return;

        const updateDetailPanel = (button) => {
            if (!button) return;

            if (detailName) detailName.textContent = button.dataset.name || '';
            if (detailFamous) detailFamous.textContent = button.dataset.famous || '';
            if (detailDistance) detailDistance.textContent = button.dataset.distance || '';
            if (detailTime) detailTime.textContent = button.dataset.time || '';
            if (detailCorridors) detailCorridors.textContent = button.dataset.corridors || '';
        };

        const setActiveDestination = (destinationId) => {
            const activeButton = routeButtons.find((button) => button.dataset.destination === destinationId);
            if (!activeButton) return;

            routeButtons.forEach((button) => {
                button.classList.toggle('is-active', button.dataset.destination === destinationId);
            });

            markers.forEach((marker) => {
                marker.classList.toggle('is-active', marker.dataset.destination === destinationId);
            });

            routes.forEach((route) => {
                route.classList.toggle('is-active', route.dataset.route === destinationId);
            });

            updateDetailPanel(activeButton);
        };

        const setActiveMapLayer = (layerId) => {
            if (!layerId) return;

            layerButtons.forEach((button) => {
                button.classList.toggle('is-active', button.dataset.mapLayer === layerId);
            });

            mapLayers.forEach((layer) => {
                layer.classList.toggle('is-active', layer.dataset.layer === layerId);
            });
        };

        routeButtons.forEach((button) => {
            const destinationId = button.dataset.destination;
            button.addEventListener('click', () => setActiveDestination(destinationId));
        });

        markers.forEach((marker) => {
            const destinationId = marker.dataset.destination;
            marker.addEventListener('click', () => setActiveDestination(destinationId));
            marker.addEventListener('mouseenter', () => setActiveDestination(destinationId));
            marker.addEventListener('focus', () => setActiveDestination(destinationId));
        });

        layerButtons.forEach((button) => {
            const layerId = button.dataset.mapLayer;
            button.addEventListener('click', () => setActiveMapLayer(layerId));
        });

        const defaultDestination =
            routeButtons.find((button) => button.classList.contains('is-active'))?.dataset.destination ||
            routeButtons[0].dataset.destination;
        setActiveDestination(defaultDestination);

        const defaultLayer =
            layerButtons.find((button) => button.classList.contains('is-active'))?.dataset.mapLayer ||
            mapLayers[0]?.dataset.layer;
        setActiveMapLayer(defaultLayer);
    });
};

// Hover sound for WhatsApp widgets
const initWhatsAppHoverTone = () => {
    const widgets = document.querySelectorAll('.whatsapp-card, .whatsapp-single-widget');
    if (widgets.length === 0) return;

    const soundSrc = 'sounds/interface-soft-click.mp3';
    const hoverAudio = new Audio(soundSrc);
    hoverAudio.preload = 'auto';
    hoverAudio.volume = 0.5;

    let audioUnlocked = false;
    const unlockAudio = () => {
        if (audioUnlocked) return;
        audioUnlocked = true;
        hoverAudio.play().then(() => {
            hoverAudio.pause();
            hoverAudio.currentTime = 0;
        }).catch(() => {
            audioUnlocked = false;
        });
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('pointerdown', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    widgets.forEach(widget => {
        widget.addEventListener('mouseenter', () => {
            if (!audioUnlocked) return;
            hoverAudio.currentTime = 0;
            hoverAudio.play().catch(() => {});
        });
    });
};

// Hover sound for PlayStation widget
const initPlaystationHoverSound = () => {
    const widget = document.querySelector('.playstation-widget');
    if (!widget) return;

    const soundSrc = 'sounds/ui-gaming-animation.mp3';
    const hoverAudio = new Audio(soundSrc);
    hoverAudio.preload = 'auto';
    hoverAudio.volume = 0.5;

    let audioUnlocked = false;
    const unlockAudio = () => {
        if (audioUnlocked) return;
        audioUnlocked = true;
        hoverAudio.play().then(() => {
            hoverAudio.pause();
            hoverAudio.currentTime = 0;
        }).catch(() => {
            audioUnlocked = false;
        });
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('pointerdown', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    widget.addEventListener('mouseenter', () => {
        if (!audioUnlocked) return;
        hoverAudio.currentTime = 0;
        hoverAudio.play().catch(() => {});
    });
};

// Highlight @mentions in WhatsApp status text
const initWhatsAppMentions = () => {
    const statusEls = document.querySelectorAll('.whatsapp-status-text');
    if (statusEls.length === 0) return;

    const mentionRegex = /(^|\s)(@[\w.-]+)/g;

    statusEls.forEach(el => {
        const text = el.textContent || '';
        const html = text.replace(mentionRegex, '$1<span class="whatsapp-mention">$2</span>');
        el.innerHTML = html;
    });
};

// WhatsApp Status Viewer - auto-rotating statuses with progress bars
const initWhatsAppStatusViewer = () => {
    document.querySelectorAll('.wa-status-viewer').forEach(viewer => initSingleWhatsAppViewer(viewer));
};

const initSingleWhatsAppViewer = (viewer) => {
    if (!viewer) return;

    const progressContainer = viewer.querySelector('.wa-progress-container');
    const slides = viewer.querySelectorAll('.wa-slide');
    const timeLabel = viewer.querySelector('.whatsapp-profile-label');
    if (slides.length === 0) return;

    let currentIndex = 0;
    let timer = null;
    let isPaused = false;
    let fillStartTime = 0;
    let fillElapsed = 0;

    // Build progress bars
    progressContainer.innerHTML = '';
    slides.forEach((_, i) => {
        const bar = document.createElement('div');
        bar.className = 'wa-progress-bar';
        bar.innerHTML = '<div class="wa-progress-fill"></div>';
        bar.addEventListener('click', (e) => {
            e.stopPropagation();
            goToSlide(i);
        });
        progressContainer.appendChild(bar);
    });

    const bars = progressContainer.querySelectorAll('.wa-progress-fill');

    function getDuration(index) {
        const slide = slides[index];
        const dataDur = parseInt(slide.dataset.duration);
        if (dataDur) return dataDur;
        return 6000;
    }

    function updateTimeLabel() {
        const times = ['Feb 22, 10:23 AM', 'Feb 22, 2:15 PM', 'Feb 21, 8:11 PM'];
        timeLabel.textContent = times[currentIndex % times.length];
    }

    function startFill(index, elapsed = 0) {
        const duration = getDuration(index);
        const fill = bars[index];
        const remaining = duration - elapsed;

        // Set width to current progress instantly
        const startPercent = (elapsed / duration) * 100;
        fill.style.width = startPercent + '%';
        fill.classList.remove('filling');

        // Force reflow
        void fill.offsetWidth;

        // Animate to 100%
        fill.classList.add('filling');
        fill.style.transitionDuration = remaining + 'ms';
        fill.style.width = '100%';

        fillStartTime = performance.now();
        fillElapsed = elapsed;

        timer = setTimeout(() => {
            nextSlide();
        }, remaining);
    }

    function stopFill() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        const fill = bars[currentIndex];
        // Capture current progress
        const elapsed = fillElapsed + (performance.now() - fillStartTime);
        const duration = getDuration(currentIndex);
        const pct = Math.min((elapsed / duration) * 100, 100);

        fill.classList.remove('filling');
        fill.style.transitionDuration = '0ms';
        fill.style.width = pct + '%';
        fillElapsed = elapsed;
    }

    function showSlide(index, direction = 'next') {
        const prevIndex = currentIndex;

        // Deactivate previous
        slides[prevIndex].classList.remove('active');
        slides[prevIndex].classList.add('exiting');

        // Pause any video on previous slide
        const prevVideo = slides[prevIndex].querySelector('video');
        if (prevVideo) {
            prevVideo.pause();
            prevVideo.currentTime = 0;
        }

        setTimeout(() => {
            slides[prevIndex].classList.remove('exiting');
        }, 450);

        // Mark bars
        bars.forEach((b, i) => {
            if (i < index) {
                b.classList.add('done');
                b.classList.remove('filling');
                b.style.width = '100%';
            } else {
                b.classList.remove('done', 'filling');
                b.style.width = '0%';
            }
        });

        currentIndex = index;

        // Activate new slide
        slides[currentIndex].classList.add('active');

        // Play video if present
        const video = slides[currentIndex].querySelector('video');
        if (video) {
            video.currentTime = 0;
            video.muted = true;
            // Reset mute button
            const muteBtn = slides[currentIndex].querySelector('.wa-mute-toggle');
            if (muteBtn) muteBtn.classList.remove('unmuted');
            video.play().catch(() => {});
        }

        updateTimeLabel();
        fillElapsed = 0;
        startFill(currentIndex);
    }

    function nextSlide() {
        const next = (currentIndex + 1) % slides.length;
        showSlide(next);
    }

    function goToSlide(index) {
        if (index === currentIndex) return;
        stopFill();
        showSlide(index);
    }

    // Click left/right halves to navigate
    viewer.addEventListener('click', (e) => {
        const rect = viewer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        stopFill();
        if (x < rect.width * 0.3) {
            // Go back
            const prev = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
            showSlide(prev, 'prev');
        } else {
            nextSlide();
        }
    });

    // Pause on hover
    viewer.addEventListener('mouseenter', () => {
        isPaused = true;
        stopFill();
    });

    viewer.addEventListener('mouseleave', () => {
        isPaused = false;
        startFill(currentIndex, fillElapsed);
    });

    // Touch hold to pause (mobile)
    let touchTimer = null;
    viewer.addEventListener('touchstart', (e) => {
        touchTimer = setTimeout(() => {
            isPaused = true;
            stopFill();
        }, 200);
    }, { passive: true });

    viewer.addEventListener('touchend', () => {
        if (touchTimer) clearTimeout(touchTimer);
        if (isPaused) {
            isPaused = false;
            startFill(currentIndex, fillElapsed);
        }
    });

    // Mute toggle buttons
    viewer.querySelectorAll('.wa-mute-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slide = btn.closest('.wa-slide');
            const video = slide.querySelector('video');
            if (!video) return;
            video.muted = !video.muted;
            btn.classList.toggle('unmuted', !video.muted);
        });
    });

    // Video loading placeholder handling
    viewer.querySelectorAll('.wa-slide[data-type="video"]').forEach(slide => {
        const video = slide.querySelector('video');
        const placeholder = slide.querySelector('.wa-video-placeholder');
        if (!video || !placeholder) return;

        // Lazy-load video after page fully loads
        const loadVideo = () => {
            const src = video.dataset.src;
            if (!src) return;
            video.src = src;
            video.load();
        };

        video.addEventListener('canplay', () => {
            placeholder.classList.add('hidden');
            // Auto-play if this slide is currently active
            if (slide.classList.contains('active')) {
                video.muted = true;
                video.play().catch(() => {});
            }
        }, { once: true });

        // Start loading after page is fully loaded
        if (document.readyState === 'complete') {
            setTimeout(loadVideo, 500);
        } else {
            window.addEventListener('load', () => setTimeout(loadVideo, 500), { once: true });
        }
    });

    // Initialize first slide
    slides[0].classList.add('active');
    updateTimeLabel();
    startFill(0);
};

// Masonry-like layout for About page grid
const resizeAboutGridItems = () => {
    const container = document.querySelector('.about-container');
    if (!container) return;

    const styles = window.getComputedStyle(container);
    const rowHeight = parseFloat(styles.getPropertyValue('grid-auto-rows'));
    const rowGap = parseFloat(styles.getPropertyValue('grid-row-gap'));
    if (!rowHeight) return;

    Array.from(container.children).forEach(item => {
        const itemHeight = item.getBoundingClientRect().height;
        const span = Math.max(1, Math.ceil((itemHeight + rowGap) / (rowHeight + rowGap)));
        item.style.gridRowEnd = `span ${span}`;
    });
};

const initAboutMasonry = () => {
    const container = document.querySelector('.about-container');
    if (!container) return;

    resizeAboutGridItems();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeAboutGridItems, 150);
    });

    const images = container.querySelectorAll('img');
    images.forEach(img => {
        if (img.complete) return;
        img.addEventListener('load', resizeAboutGridItems);
    });
};

// Smooth scroll to top
const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
};

// Navigation active state
const updateActiveNav = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
};

// Parallax effect for scroll indicator
const initParallax = () => {
    window.addEventListener('scroll', () => {
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            const scrolled = window.pageYOffset;
            scrollIndicator.style.opacity = Math.max(0, 1 - scrolled / 300);
        }
    });
};

// Work item hover effects
const initWorkItemHovers = () => {
    document.querySelectorAll('.work-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
};

// Music player mock functionality
const initMusicPlayer = () => {
    const playButtons = document.querySelectorAll('.music-widget .play-btn, .podcast-widget .play-btn');
    
    playButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const currentSymbol = this.textContent;
            if (currentSymbol === '▶') {
                this.textContent = '⏸';
            } else {
                this.textContent = '▶';
            }
        });
    });
};

// Notion widget click handlers
const initNotionWidget = () => {
    document.querySelectorAll('.notion-item').forEach(item => {
        item.addEventListener('click', function() {
            // Add ripple effect
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
        });
    });
};

// Widget hover effects with transform
const initWidgetHovers = () => {
    document.querySelectorAll('.widget').forEach(widget => {
        widget.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        widget.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
};

// Add cursor follow effect for hero section
const initCursorEffect = () => {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;

    hero.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        
        const xPercent = (clientX / innerWidth - 0.5) * 2;
        const yPercent = (clientY / innerHeight - 0.5) * 2;
        
        document.querySelectorAll('.manifesto-item').forEach((item, index) => {
            const speed = (index + 1) * 0.5;
            item.style.transform = `translate(${xPercent * speed}px, ${yPercent * speed}px)`;
        });
    });
};

// Typewriter effect for manifesto text
const initTypewriter = () => {
    const manifestoItems = document.querySelectorAll('.manifesto-item');
    
    manifestoItems.forEach((item, index) => {
        const text = item.textContent;
        item.textContent = '';
        item.style.opacity = '1';
        
        let charIndex = 0;
        const speed = 30;
        
        setTimeout(() => {
            const type = () => {
                if (charIndex < text.length) {
                    item.textContent += text.charAt(charIndex);
                    charIndex++;
                    setTimeout(type, speed);
                }
            };
            type();
        }, index * 200);
    });
};

// Add scroll progress indicator
const initScrollProgress = () => {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: #000000;
        width: 0%;
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
};

// iOS Photos Carousel - "Instant Crush" on these photos 📸
const initPhotoCarousel = () => {
    // Initialize all photo carousels on the page
    const carousels = document.querySelectorAll('.photo-card');
    
    carousels.forEach(carousel => {
        initSingleCarousel(carousel);
    });
};

const initSingleCarousel = (carousel) => {
    if (!carousel) return;
    
    const allSlides = carousel.querySelectorAll('.photo-slide');
    const navButtons = carousel.querySelectorAll('.nav-icon');
    const navigator = carousel.querySelector('.photo-navigator');
    let hideTimeout;
    let isHovering = false;
    let autoRotateInterval;
    let isUserInteracting = false;
    
    // Track current index for each category
    const categoryIndices = {
        random: 0,
        home: 0,
        personal: 0,
        adventure: 0
    };
    
    let currentCategory = 'random';
    
    // Get slides for a specific category
    const getCategorySlides = (category) => {
        return Array.from(allSlides).filter(slide => slide.dataset.category === category);
    };
    
    // Show slide for a specific category and index with fade animation
    const showSlide = (category, index, animate = true) => {
        const categorySlides = getCategorySlides(category);
        
        // Add fade-out class to current active slide
        if (animate) {
            const currentActive = carousel.querySelector('.photo-slide.active');
            if (currentActive) {
                currentActive.classList.add('fade-out');
                setTimeout(() => {
                    currentActive.classList.remove('active', 'fade-out');
                }, 300);
            }
        } else {
            allSlides.forEach(slide => slide.classList.remove('active'));
        }
        
        // Show the specific slide with fade-in
        if (categorySlides[index]) {
            setTimeout(() => {
                categorySlides[index].classList.add('active', 'fade-in-slide');
                setTimeout(() => {
                    categorySlides[index].classList.remove('fade-in-slide');
                }, 300);
            }, animate ? 300 : 0);
        }
    };
    
    // Auto-rotate images every 8 seconds
    const startAutoRotate = () => {
        stopAutoRotate();
        autoRotateInterval = setInterval(() => {
            if (!isUserInteracting) {
                const categorySlides = getCategorySlides(currentCategory);
                categoryIndices[currentCategory] = (categoryIndices[currentCategory] + 1) % categorySlides.length;
                showSlide(currentCategory, categoryIndices[currentCategory], true);
            }
        }, 8000); // 8 seconds
    };
    
    const stopAutoRotate = () => {
        if (autoRotateInterval) {
            clearInterval(autoRotateInterval);
            autoRotateInterval = null;
        }
    };
    
    // Handle navigation button clicks
    navButtons.forEach((btn, btnIndex) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const category = btn.dataset.category;
            
            // User is interacting - pause auto-rotate temporarily
            isUserInteracting = true;
            stopAutoRotate();
            
            // If clicking the same category, cycle to next image
            if (category === currentCategory) {
                const categorySlides = getCategorySlides(category);
                categoryIndices[category] = (categoryIndices[category] + 1) % categorySlides.length;
            } else {
                // Switch to new category, keep its current index
                currentCategory = category;
            }
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show the slide
            showSlide(currentCategory, categoryIndices[currentCategory], true);
            playClickSound();
            
            // Resume auto-rotate after 5 seconds of inactivity
            setTimeout(() => {
                isUserInteracting = false;
                startAutoRotate();
            }, 5000);
        });
    });
    
    // Auto-hide navigator after mouse leaves
    const scheduleHide = () => {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            navigator.classList.add('hiding');
        }, 4000);
    };
    
    // Track hover state
    carousel.addEventListener('mouseenter', () => {
        isHovering = true;
        isUserInteracting = true;
        stopAutoRotate();
        clearTimeout(hideTimeout);
        navigator.classList.remove('hiding');
    });
    
    carousel.addEventListener('mouseleave', () => {
        isHovering = false;
        scheduleHide();
        
        // Resume auto-rotate after leaving
        setTimeout(() => {
            isUserInteracting = false;
            startAutoRotate();
        }, 2000);
    });
    
    // Initialize first slide and start auto-rotate
    showSlide(currentCategory, 0, false);
    startAutoRotate();
};

// Audible Phone Interactive Experience - "One More Time" with audiobooks 🎧
const initAudiblePhone = () => {
    const phoneCard = document.getElementById('audiblePhone');
    if (!phoneCard) return;
    
    const touchCursor = phoneCard.querySelector('.phone-touch-cursor');
    const homeScreen = phoneCard.querySelector('.phone-home-screen');
    const audibleApp = phoneCard.querySelector('.audible-app-screen');
    const audibleAppIcon = document.getElementById('audibleAppIcon');
    const backBtn = document.getElementById('audibleBackBtn');
    
    let currentAudio = null;
    
    // Audio quotes data
    const audioQuotes = {
        'atomic-habits': {
            text: "You do not rise to the level of your goals. You fall to the level of your systems.",
            duration: 3500
        },
        'deep-work': {
            text: "To produce at your peak level you need to work for extended periods with full concentration.",
            duration: 4000
        },
        'thinking-fast': {
            text: "Nothing in life is as important as you think it is, while you are thinking about it.",
            duration: 3500
        },
        'sapiens': {
            text: "You could never convince a monkey to give you a banana by promising him limitless bananas after death.",
            duration: 4500
        }
    };
    
    // Custom cursor movement
    phoneCard.addEventListener('mousemove', (e) => {
        const rect = phoneCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        touchCursor.style.left = x + 'px';
        touchCursor.style.top = y + 'px';
    });
    
    // Open Audible app
    audibleAppIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        homeScreen.classList.remove('active');
        setTimeout(() => {
            audibleApp.classList.add('active');
        }, 200);
        playClickSound();
    });
    
    // Back to home screen
    backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audibleApp.classList.remove('active');
        setTimeout(() => {
            homeScreen.classList.add('active');
        }, 200);
        playClickSound();
        
        // Stop any playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
            document.querySelectorAll('.play-btn-small.playing').forEach(btn => {
                btn.classList.remove('playing');
            });
        }
    });
    
    // Create audio playback with Web Audio API for quotes
    const playQuote = (bookKey, button) => {
        const quote = audioQuotes[bookKey];
        if (!quote) return;
        
        // Stop previous audio
        if (currentAudio) {
            currentAudio.pause();
            document.querySelectorAll('.play-btn-small.playing').forEach(btn => {
                btn.classList.remove('playing');
            });
        }
        
        // Use Web Audio API to create a pleasant notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a pleasant "book opening" sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // Mark as playing
        button.classList.add('playing');
        
        // Show quote notification
        showQuoteNotification(quote.text);
        
        // Reset after duration
        setTimeout(() => {
            button.classList.remove('playing');
        }, quote.duration);
    };
    
    // Show quote as a toast notification
    const showQuoteNotification = (text) => {
        // Remove existing notification
        const existing = document.querySelector('.quote-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'quote-notification';
        notification.innerHTML = `
            <div class="quote-icon">💡</div>
            <div class="quote-text">${text}</div>
        `;
        
        phoneCard.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
    
    // Play audiobook quotes
    document.querySelectorAll('.audiobook-item, .current-book').forEach(item => {
        item.addEventListener('click', (e) => {
            const bookKey = item.dataset.audio;
            const playBtn = item.querySelector('.play-btn-small');
            
            if (bookKey && playBtn) {
                playQuote(bookKey, playBtn);
            } else if (bookKey) {
                // For current book (no button)
                const tempBtn = document.createElement('div');
                playQuote(bookKey, tempBtn);
            }
        });
    });
    
    // Separate click handlers for play buttons
    document.querySelectorAll('.play-btn-small').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.audiobook-item');
            if (item) {
                const bookKey = item.dataset.audio;
                playQuote(bookKey, btn);
            }
        });
    });
};

// Spotify Player Widget
const initSpotifyPlayer = () => {
    const player = document.getElementById('spotifyPlayer');
    if (!player) return;
    
    const audio = document.getElementById('spotifyAudio');
    const albumCoverImg = document.getElementById('albumCoverImg');
    const songTitle = document.getElementById('songTitle');
    const songArtist = document.getElementById('songArtist');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const progressFill = document.getElementById('progressFill');
    const progressInput = document.getElementById('progressInput');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    
    // Get tracks from hidden track list
    const trackElements = player.querySelectorAll('.track-data');
    const tracks = Array.from(trackElements).map(el => ({
        title: el.dataset.title,
        artist: el.dataset.artist,
        cover: el.dataset.cover,
        audio: el.dataset.audio
    }));
    
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
    
    // Format time (seconds to m:ss)
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Load track
    const loadTrack = (index) => {
        if (index < 0 || index >= tracks.length) return;
        
        currentTrackIndex = index;
        const track = tracks[index];
        
        albumCoverImg.src = track.cover;
        songTitle.textContent = track.title;
        songArtist.textContent = track.artist;
        audio.src = track.audio;
        
        progressFill.style.width = '0%';
        progressInput.value = 0;
        currentTimeEl.textContent = '0:00';
        
        // Wait for metadata to load
        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audio.duration);
        }, { once: true });
        
        if (isPlaying) {
            audio.play().catch(console.error);
        }
    };
    
    // Update play/pause icons
    const updatePlayPauseIcons = () => {
        const playIcon = playPauseBtn.querySelector('.play-icon');
        const pauseIcon = playPauseBtn.querySelector('.pause-icon');
        
        if (isPlaying) {
            playIcon.style.opacity = '0';
            pauseIcon.style.opacity = '1';
        } else {
            playIcon.style.opacity = '1';
            pauseIcon.style.opacity = '0';
        }
    };
    
    // Play/Pause
    const togglePlayPause = () => {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(console.error);
        }
        isPlaying = !isPlaying;
        updatePlayPauseIcons();
    };
    
    // Next track
    const playNext = () => {
        let nextIndex;
        if (isShuffle) {
            nextIndex = Math.floor(Math.random() * tracks.length);
        } else {
            nextIndex = (currentTrackIndex + 1) % tracks.length;
        }
        loadTrack(nextIndex);
    };
    
    // Previous track
    const playPrev = () => {
        // If more than 3 seconds into track, restart it
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }
        
        let prevIndex;
        if (isShuffle) {
            prevIndex = Math.floor(Math.random() * tracks.length);
        } else {
            prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        }
        loadTrack(prevIndex);
    };
    
    // Toggle shuffle
    const toggleShuffle = () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
    };
    
    // Toggle repeat
    const toggleRepeat = () => {
        repeatMode = (repeatMode + 1) % 3;
        repeatBtn.classList.toggle('active', repeatMode > 0);
        
        // Visual indicator for repeat one
        if (repeatMode === 2) {
            repeatBtn.style.opacity = '1';
            repeatBtn.querySelector('svg').style.transform = 'scale(1.1)';
        } else {
            repeatBtn.style.opacity = repeatMode === 1 ? '1' : '';
            repeatBtn.querySelector('svg').style.transform = '';
        }
    };
    
    // Update progress bar
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${progress}%`;
        progressInput.value = progress;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    });
    
    // Seek functionality
    progressInput.addEventListener('input', (e) => {
        const seekTime = (e.target.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    });
    
    // Track ended
    audio.addEventListener('ended', () => {
        if (repeatMode === 2) {
            // Repeat one
            audio.currentTime = 0;
            audio.play().catch(console.error);
        } else if (repeatMode === 1 || currentTrackIndex < tracks.length - 1) {
            // Repeat all or more tracks available
            playNext();
        } else {
            // No repeat, last track
            isPlaying = false;
            updatePlayPauseIcons();
        }
    });
    
    // Event listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    
    // Load first track
    loadTrack(0);
};

// Audible Audiobook Player Widget
const initAudiblePlayer = () => {
    const player = document.getElementById('audiblePlayer');
    if (!player) return;
    
    const audio = document.getElementById('audibleAudio');
    const bookCoverImg = document.getElementById('bookCover');
    const bookTitle = document.getElementById('bookTitle');
    const bookAuthor = document.getElementById('bookAuthor');
    const playPauseBtn = document.getElementById('audiblePlayBtn');
    const prevBtn = document.getElementById('audiblePrevBtn');
    const nextBtn = document.getElementById('audibleNextBtn');
    const progressFill = document.getElementById('audibleProgressFill');
    const progressInput = document.getElementById('audibleProgressInput');
    const currentTimeEl = document.getElementById('audibleCurrentTime');
    const totalTimeEl = document.getElementById('audibleTotalTime');
    
    // Get tracks from hidden track list
    const trackElements = player.querySelectorAll('.audiobook-data');
    const tracks = Array.from(trackElements).map(el => ({
        title: el.dataset.title,
        author: el.dataset.author,
        cover: el.dataset.cover,
        audio: el.dataset.audio
    }));
    
    let currentTrackIndex = 0;
    let isPlaying = false;
    
    // Format time (seconds to m:ss)
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Load track
    const loadTrack = (index) => {
        if (index < 0 || index >= tracks.length) return;
        
        currentTrackIndex = index;
        const track = tracks[index];
        
        bookCoverImg.src = track.cover;
        bookTitle.textContent = track.title;
        bookAuthor.textContent = track.author;
        audio.src = track.audio;
        
        progressFill.style.width = '0%';
        progressInput.value = 0;
        currentTimeEl.textContent = '0:00';
        
        // Wait for metadata to load
        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audio.duration);
        }, { once: true });
        
        if (isPlaying) {
            audio.play().catch(console.error);
        }
    };
    
    // Update play/pause icons
    const updatePlayPauseIcons = () => {
        const playIcon = playPauseBtn.querySelector('.play-icon-audible');
        const pauseIcon = playPauseBtn.querySelector('.pause-icon-audible');
        
        if (isPlaying) {
            playIcon.style.opacity = '0';
            pauseIcon.style.opacity = '1';
        } else {
            playIcon.style.opacity = '1';
            pauseIcon.style.opacity = '0';
        }
    };
    
    // Play/Pause
    const togglePlayPause = () => {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(console.error);
        }
        isPlaying = !isPlaying;
        updatePlayPauseIcons();
    };
    
    // Next track
    const playNext = () => {
        const nextIndex = (currentTrackIndex + 1) % tracks.length;
        loadTrack(nextIndex);
    };
    
    // Previous track
    const playPrev = () => {
        // If more than 3 seconds into track, restart it
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }
        
        const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(prevIndex);
    };
    
    // Update progress bar
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${progress}%`;
        progressInput.value = progress;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    });
    
    // Seek functionality
    progressInput.addEventListener('input', (e) => {
        const seekTime = (e.target.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    });
    
    // Track ended - auto play next
    audio.addEventListener('ended', () => {
        playNext();
    });
    
    // Event listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);
    
    // Load first track
    loadTrack(0);
};

const initGamesStack = () => {
    const stacks = document.querySelectorAll('.games-stack');
    
    stacks.forEach((stack) => {
        const cards = Array.from(stack.querySelectorAll('.game-card'));
        if (cards.length < 2) return;
        
        let currentIndex = cards.findIndex((card) => card.classList.contains('is-active'));
        if (currentIndex === -1) {
            currentIndex = 0;
            cards[0].classList.add('is-active');
        }
        
        const interval = Number(stack.dataset.interval) || 3000;
        let isAnimating = false;
        
        setInterval(() => {
            if (isAnimating) return;
            isAnimating = true;
            
            const currentCard = cards[currentIndex];
            const nextIndex = (currentIndex + 1) % cards.length;
            const nextCard = cards[nextIndex];
            
            cards.forEach((card) => {
                if (card !== currentCard && card !== nextCard) {
                    card.classList.remove('is-active', 'is-exit', 'is-next');
                }
            });
            
            nextCard.classList.add('is-next');
            
            requestAnimationFrame(() => {
                currentCard.classList.remove('is-active');
                currentCard.classList.add('is-exit');
                nextCard.classList.add('is-active');
                nextCard.classList.remove('is-next');
            });
            
            setTimeout(() => {
                currentCard.classList.remove('is-exit');
                isAnimating = false;
            }, 800);
            
            currentIndex = nextIndex;
        }, interval);
    });
};

// Initialize all functionality
const init = () => {
    observeElements();
    initSmoothScroll();
    updateActiveNav();
    initParallax();
    initWorkItemHovers();
    initMusicPlayer();
    initNotionWidget();
    initWidgetHovers();
    initScrollProgress();
    initNavSounds();
    initPhotoCarousel();
    initAudiblePhone();
    initSpotifyPlayer();
    initAudiblePlayer();
    initWorkCardLazyLoad();
    initProjectImageLazyLoad();
    initProjectScreenshotLightbox();
    initWizposVideoPlayers();
    initHopOnRouteMap();
    initWhatsAppHoverTone();
    initPlaystationHoverSound();
    initWhatsAppMentions();
    initWhatsAppStatusViewer();
    initAboutMasonry();
    initGamesStack();
    
    // Optional: Enable typewriter effect (uncomment if desired)
    // initTypewriter();
    
    // Optional: Enable cursor effect (uncomment if desired)
    // initCursorEffect();
};

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// PDF Preview Modal
const initPDFPreview = () => {
    const resumeBtn = document.getElementById('resumeWidgetBtn');
    const pdfModal = document.getElementById('pdfPreviewModal');
    const pdfOverlay = document.getElementById('pdfModalOverlay');
    const pdfCloseBtn = document.getElementById('pdfCloseBtn');
    const pdfViewer = document.getElementById('pdfViewer');
    const pdfLoading = document.getElementById('pdfLoading');
    
    if (!resumeBtn || !pdfModal || !pdfOverlay || !pdfCloseBtn || !pdfViewer || !pdfLoading) return;
    
    const openPDFPreview = (e) => {
        e.preventDefault();
        
        const resumeSrc = resumeBtn.dataset.resumeSrc || resumeBtn.getAttribute('href');
        pdfLoading.classList.remove('hidden');
        pdfViewer.onload = () => {
            setTimeout(() => {
                pdfLoading.classList.add('hidden');
            }, 500);
        };
        pdfViewer.src = resumeSrc;

        // Show modal
        pdfModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    const closePDFPreview = () => {
        pdfModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset loading state
        setTimeout(() => {
            pdfLoading.classList.remove('hidden');
            pdfViewer.src = '';
        }, 300);
    };
    
    // Event listeners
    resumeBtn.addEventListener('click', openPDFPreview);
    pdfCloseBtn.addEventListener('click', closePDFPreview);
    pdfOverlay.addEventListener('click', closePDFPreview);
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && pdfModal.classList.contains('active')) {
            closePDFPreview();
        }
    });
};

// Initialize PDF preview
initPDFPreview();

// Export functions for use in other scripts
window.portfolioUtils = {
    observeElements,
    initSmoothScroll,
    updateActiveNav
};

// ---------------------------------------------------------------------------
// Service worker registration. Deferred to the load event so it never
// competes with first paint. The SW itself caches static assets only
// (no HTML) so a bad deploy can never "stick" a stale page.
// ---------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        // Small idle delay keeps the main thread free during the critical
        // post-load window when analytics and widgets are initialising.
        var register = function () {
            navigator.serviceWorker.register('/sw.js').catch(function () {
                // Registration failing is non-fatal — the site works fine
                // without a SW. Don't log to console in production.
            });
        };
        if ('requestIdleCallback' in window) {
            requestIdleCallback(register, { timeout: 3000 });
        } else {
            setTimeout(register, 1500);
        }
    });
}
