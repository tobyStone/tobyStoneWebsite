
// State
const state = {
    step: 1,
};

// DOM Elements
const video = document.getElementById('main-video');
const overlayV1 = document.getElementById('overlay-v1');
const overlayV2 = document.getElementById('overlay-v2');
const overlayV3 = document.getElementById('overlay-v3');
const overlayV4 = document.getElementById('overlay-v4');
const contactLinks = document.getElementById('contact-links');

// Assets
const videos = {
    v1: '/videos/With_background_noise_202602021518.mp4',
    v2: '/videos/_the_stepbystep_1080p_202602011636.mp4',
    v3: '/videos/Instruction_open_and_202602041218_mbxwm.mp4'
};

const music = '/music/musicfx-dj-1770309373761.wav';
const bgAudio = new Audio(music);

// Config
const V1_DURATION = 5713; // Adjusted for 1.225x speed (7000 / 1.225)
const V2_PAUSE_DURATION = 1200;

// --- Layout Configuration ---
const LayoutConfig = {
    MOBILE_BREAKPOINT: 768,

    get current() {
        return window.innerWidth <= this.MOBILE_BREAKPOINT ? 'mobile' : 'desktop';
    },

    mobile: {
        videoScaleMultiplier: 2.5,
        contactLinksLeft: '50%',
        wordRing: [
            { text: 'From', img: 'From.png', time: 500, pos: { top: '20%', left: '30%' } },
            { text: 'the', img: 'The.png', time: 1260, pos: { top: '20%', left: '70%' } },
            { text: 'seed', img: 'Seed.png', time: 2020, pos: { top: '45%', left: '85%' } },
            { text: 'of', img: 'Of.png', time: 2780, pos: { top: '70%', left: '70%' } },
            { text: 'an', img: 'An.png', time: 3540, pos: { top: '70%', left: '30%' } },
            { text: 'idea', img: 'Idea.png', time: 4300, pos: { top: '56%', left: '50%' } }
        ]
    },

    desktop: {
        videoScaleMultiplier: 1.0,
        contactLinksLeft: '84%',
        wordRing: [
            { text: 'From', img: 'From.png', time: 500, pos: { top: '19.7%', left: '32.5%' } },
            { text: 'the', img: 'The.png', time: 975, pos: { top: '15.5%', left: '56.1%' } },
            { text: 'seed', img: 'Seed.png', time: 1450, pos: { top: '27.5%', left: '76.8%' } },
            { text: 'of', img: 'Of.png', time: 1925, pos: { top: '50%', left: '85%' } },
            { text: 'a', img: 'A.png', time: 2400, pos: { top: '72.5%', left: '76.8%' } },
            { text: 'bean', img: 'Bean.png', time: 2875, pos: { top: '84.5%', left: '56.1%' } },
            { text: 'of', img: 'Of.png', time: 3350, pos: { top: '80.3%', left: '32.5%' } },
            { text: 'an', img: 'An.png', time: 3825, pos: { top: '62%', left: '17.1%' } },
            { text: 'idea', img: 'Idea.png', time: 4300, pos: { top: '56%', left: '50%' } }
        ]
    }
};

// --- Reflow Contract ---
function handleResize() {
    const config = LayoutConfig[LayoutConfig.current];

    // Update Contact Links if visible
    if (!contactLinks.classList.contains('hidden')) {
        contactLinks.style.left = config.contactLinksLeft;
    }
}
window.addEventListener('resize', handleResize);

// --- Timeout Manager ---
const timeoutManager = {
    timeouts: [],
    intervals: [],

    setTimeout: function (cb, delay) {
        const id = setTimeout(() => {
            cb();
            this.clearTimeout(id); // Cleanup after execution
        }, delay);
        this.timeouts.push(id);
        return id;
    },

    clearTimeout: function (id) {
        clearTimeout(id);
        this.timeouts = this.timeouts.filter(t => t !== id);
    },

    setInterval: function (cb, delay) {
        const id = setInterval(cb, delay);
        this.intervals.push(id);
        return id;
    },

    clearInterval: function (id) {
        clearInterval(id);
        this.intervals = this.intervals.filter(i => i !== id);
    },

    clearAll: function () {
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts = [];
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];
    }
};

// --- Animation Frame Manager ---
let v1AnimationId = null; // Track requestAnimationFrame for V1
let v2TimeUpdateHandler = null; // Track V2 listener for lookup/removal

// --- Initialization ---
const unmuteBtn = document.getElementById('unmute-btn');
const skipIntroBtn = document.getElementById('skip-intro-btn');
let skipIntroTimeout;

async function init() {
    console.log('Initializing... Version: Contact Transition Update 1.12 (Mobile Landscape Delay 1000ms)');
    // Setup Video 1
    video.src = videos.v1;
    video.muted = false; // Try sound first
    // User requested: increase speed by another 7%. 1.145 * 1.07 = ~1.225
    video.playbackRate = 1.225;

    video.onloadeddata = () => {
        // Bugfix: Ensure this only runs once so V1 setup doesn't re-trigger for V2/V3
        video.onloadeddata = null;
        startVideo1();
    };

    skipIntroBtn.addEventListener('click', () => {
        // Skip Intro Logic
        skipIntro();
    });
}

// --- Video 1 Logic ---
let v1StartTime;

function startVideo1() {
    overlayV1.classList.remove('hidden');

    // User requested audio starts 'off'
    video.muted = true;
    unmuteBtn.classList.remove('hidden');

    unmuteBtn.onclick = () => {
        video.muted = false;
        unmuteBtn.classList.add('hidden');
        if (!bgAudio.paused) bgAudio.muted = false;
    };

    video.play().then(() => {
        // Play started
        if (!v1StartTime) {
            v1StartTime = Date.now();
            v1AnimationId = requestAnimationFrame(animateV1);
        }
    }).catch(e => {
        console.log("Autoplay failed even muted?", e);
    });

    // Words Sequence
    const words = LayoutConfig[LayoutConfig.current].wordRing;

    words.forEach(w => {
        timeoutManager.setTimeout(() => {
            const el = document.createElement('img');
            el.src = `/images/${w.img}`;
            el.className = 'v1-word';
            el.onerror = () => { el.style.display = 'none'; };
            Object.assign(el.style, w.pos);
            // Center all words for precise clock positioning
            el.style.transform = 'translate(-50%, -50%)';
            overlayV1.appendChild(el);
        }, w.time);
    });
}

function animateV1() {
    const now = Date.now();
    const elapsed = now - v1StartTime;

    if (elapsed >= V1_DURATION) {
        stopVideo1();
        return;
    }

    // "indication: 1st 800ms enlarge to 1.3... 2nd 800ms shrink to 0.8... 3rd 800ms enlarge to 1.5"
    // We define keyframes relative to the Previous Step's End Scale.
    // Step 0 (Start): 0.2

    // Define the sequence of multiplicative factors
    const factors = [1.3, 0.8, 1.5, 0.8, 1.7, 0.8, 1.9, 0.8, 2.1];
    const stepDuration = 800;

    // Determine current step index
    const stepIndex = Math.floor(elapsed / stepDuration);
    const stepProgress = (elapsed % stepDuration) / stepDuration; // 0.0 -> 1.0

    // Calculate the Scale at the START of the current step
    let startScale = 0.36; // Initial (1.5x of 0.24)
    for (let i = 0; i < stepIndex; i++) {
        if (i < factors.length) startScale *= factors[i];
    }

    // Calculate the Target Scale at the END of the current step
    let targetScale = startScale;
    if (stepIndex < factors.length) {
        targetScale = startScale * factors[stepIndex];
    }

    // Interpolate Linear
    const baseScale = startScale + (targetScale - startScale) * stepProgress;
    const currentScale = baseScale * LayoutConfig[LayoutConfig.current].videoScaleMultiplier;

    video.style.transform = `scale(${currentScale})`;

    v1AnimationId = requestAnimationFrame(animateV1);
}

function stopVideo1() {
    // Overlap V1 Audio into V2 (Fade out) - REMOVED per request
    // if (!video.muted) { ... }

    video.pause();
    overlayV1.classList.add('hidden');
    overlayV1.innerHTML = ''; // Clear all text elements immediately
    startVideo2Setup();
}

function startVideo2Setup() {
    video.src = videos.v2;
    video.style.transform = 'scale(1)';
    video.currentTime = 0.3; // Start 300ms earlier (skip first 0.3s)
    // video.muted = false; // REMOVED: Respect global mute state (default muted)

    // Apply blend mode for "explosion over words" effect
    video.style.zIndex = '30';
    video.style.position = 'relative'; // Ensure z-index works
    video.style.mixBlendMode = 'screen';

    // Set initial playback rate to 1/3 speed
    video.playbackRate = 0.333;

    // Start Muted (Audio Delay)
    video.muted = true;

    // Show overlay immediately
    overlayV2.classList.remove('hidden');
    overlayV2.style.transition = 'opacity 0.5s ease-out';
    overlayV2.style.opacity = '1';

    video.play();

    // Fade out text starting at 3.5s + 377ms = 3877ms
    timeoutManager.setTimeout(() => {
        overlayV2.style.opacity = '0';
    }, 3877);

    // Switch to normal speed at 3.6s (1.2s of video content * 3)
    timeoutManager.setTimeout(() => {
        video.playbackRate = 1.0;

        // Unmute Video 2 IF user has globally unmuted
        // Check if the Unmute button is HIDDEN (meaning user clicked it)
        const isUserUnmuted = unmuteBtn.classList.contains('hidden');
        if (isUserUnmuted) {
            video.muted = false;
        }

        // Ensure overlay is hidden after fade
        timeoutManager.setTimeout(() => {
            overlayV2.classList.add('hidden');
        }, 3000); // Delayed to ensure text lingers as requested (377ms extra visible time logic)

    }, 1900); // 1200ms pause + 700ms slow-mo = 1900ms

    // User requested: Shorten second video by 300ms.
    // We can do this by checking timeupdate or setting a timeout to end it early?
    // video.onended fires naturally. To shorten, we need to manually stop/trigger onended.
    // We don't know exact duration easily without metadata, but assuming we let it play until near end - 300ms.
    // Or we can subtract 300ms from the end check if we were using timeupdate.
    // Since we rely on onended for transition, let's use timeupdate to detect end - 0.3s.

    const checkEndTime = () => {
        if (video.duration && video.currentTime >= video.duration - 0.3) {
            video.pause();
            // Trigger transition manually
            video.removeEventListener('timeupdate', checkEndTime);
            v2TimeUpdateHandler = null; // Clear global ref

            video.onended = null; // Prevent double firing
            // Perform the "onended" logic here
            // Cleanup V2 styles
            video.style.zIndex = '';
            video.style.mixBlendMode = '';
            video.playbackRate = 1.0; // Reset for V3
            overlayV2.classList.add('hidden');
            overlayV2.style.opacity = ''; // Reset opacity
            startVideo3();
        }
    };
    v2TimeUpdateHandler = checkEndTime; // Store ref
    video.addEventListener('timeupdate', checkEndTime);


    // video.onended is now handled/overridden by the early exit check above.
    // But keep a fallback just in case duration is short or update misses.
    video.onended = () => {
        video.removeEventListener('timeupdate', checkEndTime);
        v2TimeUpdateHandler = null;

        // Cleanup V2 styles
        video.style.zIndex = '';
        video.style.mixBlendMode = '';
        video.playbackRate = 1.0; // Reset for V3
        overlayV2.classList.add('hidden');
        overlayV2.style.opacity = ''; // Reset opacity
        startVideo3();
    };

    // Audio Fade (REMOVED: Do not play bgAudio/music in V2)
    // const monitor = setInterval(() => {
    //     if (video.duration && video.currentTime >= video.duration - 1.0) {
    //         if (video.volume > 0.1) video.volume -= 0.1;
    //         if (bgAudio.paused) bgAudio.play();
    //         if (bgAudio.volume < 1.0) bgAudio.volume += 0.1;
    //     }
    //     if (video.ended) clearInterval(monitor);
    // }, 200);
}

function startVideo3(skipped = false) {
    // V3 Mobile Landscape Mode
    document.body.classList.add('v3-mode');

    video.src = videos.v3;
    // Fix: Ensure V3 doesn't loop via recycled onended handler
    video.onended = null;

    // Helper to start playback and apply skip logic if needed
    const runVideo = () => {
        if (skipped) {
            // Jump to end state. Do not play.
            // Wow ends transition at 3.5s.
            video.currentTime = 3.5;
            video.pause(); // Ensure paused
        } else {
            video.play().catch(e => console.log("Video 3 play failed", e));
        }
    };

    // If source changed, we might need to wait for metadata to seek safely?
    // Usually play() handles loading, but currentTime might need metadata.
    if (video.readyState >= 1) {
        runVideo();
    } else {
        video.onloadedmetadata = () => {
            video.onloadedmetadata = null; // Cleanup
            runVideo();
        };
    }

    video.style.transform = 'scale(1)'; // Reset scale just in case

    video.muted = true; // Video itself is muted, using bgAudio
    video.loop = false;

    // 17% left shift and 0.5 speed -> User requested 1.5x current (0.5 * 1.5 = 0.75)
    // User Update: Move head back to midpoint (remove left shift)
    video.style.transform = 'translateX(0)';
    // User requested: video 3 speed increased to 1.2
    video.playbackRate = 1.2;

    // Background Audio Logic
    // Sync with global mute state (unmuteBtn hidden = sound ON)
    const isUnmuted = unmuteBtn.classList.contains('hidden');

    // Switch to Video 2 audio track
    bgAudio.src = videos.v2;
    bgAudio.muted = !isUnmuted;

    // Check for Mobile Landscape to add delay offset
    const isMobileLandscape = window.matchMedia('(max-width: 900px) and (orientation: landscape)').matches;
    const delayOffset = isMobileLandscape ? 1000 : 0; // 1000ms delay if mobile landscape (600 + 400)

    // Start at 75% for initial play (as per previous request), or 63% (last 37%)? 
    // Previous: "loop the last 33%". New: "loop the last 27%".
    // 1.0 - 0.27 = 0.73
    const loopStartRatio = 0.73;

    // Logic: Repeat short soundtrack (last 27%) twice.
    // 1st time: volume 0.25 (as set before, "75% softer").
    // 2nd time: volume 0.125 (50% of previous).

    // We need a counter or state for loop count
    let loopCount = 0;
    const maxLoops = 3; // "one more time" -> Total 4 plays? Original: 3 plays. Now: 4 plays.
    // "repeat ... twice" -> 3 plays.
    // "loop ... one more time" -> 4 plays. 
    // "repeat ... twice" implies play, repeat, repeat. Total 3.
    // OR "play ... twice".
    // "each time at 50% of the volume of the iteration before."
    // 1: 0.25
    // 2: 0.125
    // 3: 0.0625

    const playNextLoop = () => {
        if (loopCount > 4) return; // Stop after 4 repeats (Total 5 plays).

        // Loop 0-3: Start silent for fade-in
        bgAudio.volume = 0;

        // 1: 0.25 -> 2: 0.125 -> 3: 0.0625 -> 4: 0.03125
        // 1: 0.25 -> 2: 0.125 -> 3: 0.0625 -> 4: 0.03125 -> 5: 0.015625
        const targetVolume = [0.25, 0.125, 0.0625, 0.03125, 0.015625][loopCount];

        bgAudio.currentTime = bgAudio.duration * loopStartRatio;

        bgAudio.play().then(() => {
            // Fade In (50ms duration? "quick fade")
            // Let's fade in over 200ms
            let vol = 0;
            const fadeIn = timeoutManager.setInterval(() => {
                vol += (targetVolume / 5); // 5 steps of 40ms = 200ms
                if (vol >= targetVolume) {
                    vol = targetVolume;
                    timeoutManager.clearInterval(fadeIn);
                }
                bgAudio.volume = vol;
            }, 40);

            // Schedule Fade Out
            // Loop duration?
            const duration = bgAudio.duration - bgAudio.currentTime;
            // Fade out last 300ms
            timeoutManager.setTimeout(() => {
                let volOut = bgAudio.volume;
                const fadeOut = timeoutManager.setInterval(() => {
                    volOut -= (targetVolume / 5);
                    if (volOut <= 0) {
                        volOut = 0;
                        timeoutManager.clearInterval(fadeOut);
                    }
                    bgAudio.volume = volOut;
                }, 40); // 5 steps * 40ms = 200ms fade out
            }, (duration * 1000) - 300); // Start fade out 300ms before end

        }).catch(e => console.log("Audio play failed", e));

        loopCount++;
    };

    if (!skipped) {
        bgAudio.onended = () => {
            if (loopCount < 5) { // 0, 1, 2, 3, 4
                playNextLoop();
            } else {
                // Audio finished completely
                unmuteBtn.classList.add('hidden');
            }
        };
    }

    // If bgAudio metadata loaded, set time and play first loop
    if (!skipped) {
        if (bgAudio.duration) {
            // reset count
            loopCount = 0;
            playNextLoop();
        } else {
            bgAudio.onloadedmetadata = () => {
                loopCount = 0;
                playNextLoop();
            };
        }
    } else {
        // If skipped, ensure bgAudio is stopped
        bgAudio.pause();
    }

    // "75% softer initially" -> 0.25 volume
    // Initial play handled by playNextLoop logic or loadedmetadata above.
    // If we call play() here blindly, we might duplicate or mess up the count.
    // We already call playNextLoop() inside the checks.
    // But we need to ensure it starts if metadata was ALREADY loaded.
    // The "if (bgAudio.duration)" block above checks that. 
    // We can remove the loose play() call and the volume set.

    // Fade up to 0.7
    // Fade logic requested: "reduce ... to 25% volume by the end"
    // Since we start at 25% (0.25), and want to end at 25%, no fade needed?
    // "75% softer initially" means 0.25 volume. 
    // "reduce ... to 25% volume by the end" means end at 0.25 volume.
    // Interpreting as: Start at 0.25 and stay there (or ensure it ends there).
    // Removing the volume increase interval.

    // If metadata wasn't loaded for currentTime calc:
    // Removed onloadedmetadata duplications since we handled it above.

    overlayV3.classList.remove('hidden');

    document.getElementById('word-lets').classList.remove('hidden');

    // 1s Pow -> 0.8s transition handled in CSS
    // User requested: Start 700ms later (1000 + 700 = 1700ms)
    // User requested: Increase speed (appear earlier) by 177ms -> 1700 - 177 = 1523ms
    // User requested: Appear 100ms *earlier* -> 1523 - 100 = 1423ms
    timeoutManager.setTimeout(() => {
        const pow = document.getElementById('word-pow');
        pow.classList.remove('hidden');
        // Drift left 39% from left -> right: 61% AND Rotate -31deg
        timeoutManager.setTimeout(() => {
            pow.style.left = '39%';
            pow.style.transform = 'translate(-50%, -50%) rotate(-31deg)';
        }, 50);
    }, 1423 + delayOffset);

    // 2s Wow
    // User requested: Start 700ms later (2000 + 700 = 2700ms)
    timeoutManager.setTimeout(() => {
        const wow = document.getElementById('word-wow');
        if (wow) {
            wow.classList.remove('hidden');
            // Drift right 37% from right -> left: 63% AND Rotate 37deg
            timeoutManager.setTimeout(() => {
                wow.style.left = '63%';
                wow.style.transform = 'translate(-50%, -50%) rotate(37deg)';
            }, 50);
        }
    }, 2700 + delayOffset);

    // If skipped, we fast-forward animations
    if (skipped) {
        // Skip Logic moved to skipIntro function proper or handled via clearing
    }

    // Normal Flow
    // ... items below ...
    // Calculate when to hide Skip Button: 4200ms
    skipIntroTimeout = timeoutManager.setTimeout(() => {
        skipIntroBtn.classList.add('hidden');
    }, 4200);

    // Links Fade In
    // Play 700ms after Wow stops transitioning.
    // Wow starts at 2700ms. Transition is 0.8s (800ms).
    // Wow stops at 2700 + 800 = 3500ms.
    // Appear at 3500 + 700 = 4200ms.
    timeoutManager.setTimeout(() => {
        contactLinks.classList.remove('hidden');
        contactLinks.style.opacity = '1';
        if (contactLinks) {
            contactLinks.style.left = LayoutConfig[LayoutConfig.current].contactLinksLeft;
        }

        // Start Testimonials after contacts appear
        startTestimonials(delayOffset);
    }, 4200 + delayOffset);
}

function startTestimonials(delayOffset = 0) {
    overlayV4.classList.remove('hidden');
    overlayV4.style.pointerEvents = 'none';
    document.getElementById('contact-links').style.zIndex = '30';

    // Show static Contact Header immediately ("with Toby")
    const contactHeader = document.getElementById('contact-header');
    contactHeader.classList.remove('hidden');
    contactHeader.style.opacity = '1';

    const quotes = [
        'is friendly and approachable', // Added 'is'
        'listened to our needs',
        'translated them into a website',
        'that looks great', // Added 'that'
        'works brilliantly too,"', // Added punctuation
        'Karen Simpson, Tutors Alliance Scotland.', // Added author to loop
        'Contact him here' // Added "Contact Him Here"
    ];

    const quoteEl = document.getElementById('testimonial-quote');
    // We don't need separate authorEl logic anymore if it's just text in the center
    // Wait, user said "render at the end and then loop back around".
    // Does Author display in the same place as quotes? Or separate?
    // "render at the end and then loop back around all the previous testimonial words"
    // Usually testimonials have author at bottom. But if it's part of the loop sequence of "words", maybe it replaces the quote text?
    // "All following words will be in white and will fade in and fade out... 'Karen Simpson...'"
    // Implies it's just another item in the sequence.

    // Let's assume it replaces the quote text for now.

    let currentIndex = 0;

    const showNextQuote = () => {
        const text = quotes[currentIndex];

        // Fade In
        // Special check for "Contact him here"
        if (text === 'Contact him here') {
            currentIndex = (currentIndex + 1) % quotes.length;
            runContactTransition(quoteEl, quotes, showNextQuote);
            return;
        }

        quoteEl.textContent = text;
        quoteEl.style.opacity = '1';

        // Duration
        // 2s duration for text
        // Maybe longer for author?
        const duration = 2500 / 1.2 / 1.2;

        timeoutManager.setTimeout(() => {
            // Fade Out
            quoteEl.style.opacity = '0';

            timeoutManager.setTimeout(() => {
                // Next
                currentIndex = (currentIndex + 1) % quotes.length;
                showNextQuote();
            }, 1000 / 1.2 / 1.2); // 1s gap between words (speed increased by 1.2 twice)

        }, duration);
    };

    // Start delay
    timeoutManager.setTimeout(showNextQuote, 1000);
}

function runContactTransition(quoteEl, quotes, loopCallback) {
    // 1. Show "Contact him here"
    // Image size: 0.75x of final 200px = 150px
    quoteEl.innerHTML = '<img src="/images/contact.png" id="trans-contact" style="width: 150px; height: auto; vertical-align: middle;"> <span id="trans-him-here" style="vertical-align: middle;">him here</span>';
    quoteEl.style.opacity = '1';

    // 2. Show Arrow
    const arrow = document.getElementById('testimonial-arrow');
    const contactHeader = document.getElementById('contact-header');

    // Calculate Midpoint
    // We need element rects.
    // contactHeader is already visible (from startTestimonials), so rect is valid.

    // Ensure arrow is visible for rect but opacity 0 (default css for arrow?)
    // Arrow in V4 overlay is visible by default? No, it's just an img in overlay.
    // Let's set arrow style
    arrow.style.opacity = '0';
    arrow.style.display = 'block'; // Ensure it's not hidden

    // Get Rects
    const qRect = quoteEl.getBoundingClientRect();
    const hRect = contactHeader.getBoundingClientRect();

    // Midpoint
    const midX = (qRect.left + qRect.width / 2 + hRect.left + hRect.width / 2) / 2;
    const midY = (qRect.top + qRect.height / 2 + hRect.top + hRect.height / 2) / 2;

    // Position Arrow
    arrow.style.left = midX + 'px';
    arrow.style.top = midY + 'px';
    arrow.style.transform = 'translate(-50%, -50%) rotate(83deg)'; // 83deg clockwise from Up (assuming arrow image is Up?)
    // If arrow image is Right (standard), 83deg is Down-Right. 
    // User said "start bearing at upwards", implying 0 is Up.

    // Fade In Arrow
    arrow.style.transition = 'opacity 0.5s';
    arrow.style.opacity = '1';

    // Wait for reading time (approx same as other words? ~1.7s)
    const readTime = 2500 / 1.2 / 1.2;

    timeoutManager.setTimeout(() => {
        // 3. Transition "Contact"
        const transContact = document.getElementById('trans-contact');
        const transHimHere = document.getElementById('trans-him-here');

        // Get positions for transition
        // We need to move transContact to contactHeader position.
        // Easier to make transContact fixed/absolute to animate it across DOM?
        // Or just transform translate.

        const cRect = transContact.getBoundingClientRect();
        const destRect = contactHeader.getBoundingClientRect();

        const deltaX = destRect.left - cRect.left;
        const deltaY = destRect.top - cRect.top;

        transContact.style.display = 'inline-block';
        transContact.style.position = 'relative'; // Ensure transform works
        transContact.style.transition = 'transform 1s ease-in-out, width 1s, height 1s';

        // Match destination dimensions if needed? Or just let it fly.
        // If destination image is larger (width 200px vs 2.5rem), we should scale it.
        // 2.5rem approx 40px. 200px is 5x larger.
        // We can scale transform? Or just let it translate.
        // Actually, let's scale it to match the destination size roughly.
        // destination width (destRect.width) / source width (cRect.width)
        const scaleX = destRect.width / cRect.width;
        const scaleY = destRect.height / cRect.height;
        // Apply scale in transform
        transContact.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
        transContact.style.transformOrigin = 'top left'; // Grow from top-left corner (matches translation vector logic better)

        // 4. Fade out "Him Here" and Arrow
        transHimHere.style.transition = 'opacity 1s ease-in-out';
        transHimHere.style.opacity = '0';

        arrow.style.transition = 'opacity 1s ease-in-out';
        arrow.style.opacity = '0';

        // 5. When transition ends
        timeoutManager.setTimeout(() => {
            // Show real header, hide Transition Contact
            contactHeader.style.opacity = '1';
            quoteEl.style.opacity = '0'; // Hide the whole quote container

            // Wait a moment then restart loop
            timeoutManager.setTimeout(() => {
                // Reset stuff for next loop?
                // Hide arrow? It's already opacity 0.
                // Reset Quote El text?
                quoteEl.textContent = '';

                // Restart Loop (index is handled by caller logic? No, we need to reset/increment)
                // loopCallback expects to be called to show NEXT quote.
                // We should reset index to 0 for next loop?
                // "restart the loop of the testimonial wording"
                // Do we restart from 'friendly'?
                // Caller `showNextQuote` calculates `currentIndex = (currentIndex + 1)`.
                // We are at `quotes.length - 1` (Contact Him Here).
                // Next call will wrap to 0. Perfect.
                loopCallback();
            }, 1000); // 1s pause before restarting "is friendly..."

        }, 1000); // 1s transition time

    }, readTime);
}

document.getElementById('link-form').addEventListener('click', () => {
    document.getElementById('form-modal').classList.remove('hidden');
});

document.getElementById('close-form').addEventListener('click', () => {
    document.getElementById('form-modal').classList.add('hidden');
});

const form = document.getElementById('interest-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success) {
            alert('Thanks!');
            document.getElementById('form-modal').classList.add('hidden');
        } else {
            alert('Error submitting form');
        }
    } catch (err) {
        console.error(err);
        alert('Network error');
    }
});

function skipIntro() {
    console.log("Skipping Intro - Cleaning up and enforcing final state");

    // 1. CLEAR ALL TIMERS
    // This stops future events (V2 start, V3 words, audio fades, etc.)
    timeoutManager.clearAll();

    // 2. STOP V1 ANIMATION LOOP
    if (v1AnimationId) {
        cancelAnimationFrame(v1AnimationId);
    }

    // 3. STOP ALL MEDIA
    video.pause();
    // Use try/catch to avoid errors if src is empty
    try {
        video.src = ''; // Stops downloading/buffering
        video.load();
    } catch (e) { }

    bgAudio.pause();
    bgAudio.src = ''; // Stop audio completely

    // 4. REMOVE EVENT LISTENERS (Clean Slate)
    // We replace the node to strip listeners or just nullify properties we attached
    video.onended = null;
    video.ontimeupdate = null;
    if (v2TimeUpdateHandler) {
        video.removeEventListener('timeupdate', v2TimeUpdateHandler);
        v2TimeUpdateHandler = null;
    }

    video.onloadeddata = null;
    video.onloadedmetadata = null;
    bgAudio.onended = null;
    bgAudio.onloadedmetadata = null;

    // 5. CLEAR OVERLAYS / HIDE OLD ELEMENTS
    document.body.classList.remove('v3-mode'); // Clean up V3 mode

    overlayV1.classList.add('hidden');
    overlayV1.innerHTML = '';

    overlayV2.classList.add('hidden');
    overlayV2.style.opacity = '';

    unmuteBtn.classList.add('hidden'); // Ensure unmute button is hidden on skip

    skipIntroBtn.classList.add('hidden');

    // 6. ENFORCE V3 FINAL STATE
    overlayV3.classList.remove('hidden');

    // 'Let's'
    const wordLets = document.getElementById('word-lets');
    wordLets.classList.remove('hidden');
    wordLets.style.transition = 'none';

    // 'Pow'
    const pow = document.getElementById('word-pow');
    pow.classList.remove('hidden');
    pow.style.transition = 'none';
    pow.style.left = '39%';
    pow.style.transform = 'translate(-50%, -50%) rotate(-31deg)';

    // 'Wow'
    const wow = document.getElementById('word-wow');
    wow.classList.remove('hidden');
    wow.style.transition = 'none';
    wow.style.left = '63%';
    wow.style.transform = 'translate(-50%, -50%) rotate(37deg)';

    // Contact Links
    contactLinks.classList.remove('hidden');
    contactLinks.style.opacity = '1';
    contactLinks.style.left = LayoutConfig[LayoutConfig.current].contactLinksLeft;

    // START TESTIMONIALS IMMEDIATELY
    startTestimonials();

    // Ensure V3 Video Background is visible?
    // We effectively stopped the video. If we want the V3 *frame* to be visible as background, we need to set it.
    // "skip to the end of all three videos playing... and not play any videos"
    // Does this mean black background? Or the last frame of V3?
    // Usually means last frame.
    // Set src to V3, seek to end, pause.
    video.src = videos.v3;
    const seekToEnd = () => {
        // Seek to the very end. Setting currentTime to duration usually shows the last frame.
        // Or a tiny bit before if some browsers loop/reset.
        // Let's safe bet: duration - 0.1? Or just duration. 
        // User asked for "end of the playing time".
        if (video.duration) {
            video.currentTime = video.duration;
        }
    };

    if (video.readyState >= 1) {
        seekToEnd();
    } else {
        video.onloadedmetadata = () => {
            seekToEnd();
            video.onloadedmetadata = null;
        };
    }
    // Force transform to reset
    video.style.transform = 'translateX(0) scale(1)';
    video.style.zIndex = '';
    video.style.mixBlendMode = '';
    video.style.opacity = '1';
}

init();
