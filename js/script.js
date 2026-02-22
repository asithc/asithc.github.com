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
        const times = ['Just now', 'Today, 10:23 AM', 'Today, 2:15 PM', 'Yesterday, 8:11 PM', 'Yesterday, 6:45 PM', 'Today, 11:30 AM'];
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
    
    if (!resumeBtn || !pdfModal) return;
    
    const openPDFPreview = (e) => {
        e.preventDefault();
        
        // Set PDF source (update this path to your actual PDF file)
        pdfViewer.src = 'files/Resume-Asith Wijenayake-Lead-UX-Designer-27Jan.pdf';
        
        // Show modal
        pdfModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Hide loading when iframe loads
        pdfViewer.onload = () => {
            setTimeout(() => {
                pdfLoading.classList.add('hidden');
            }, 500);
        };
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
