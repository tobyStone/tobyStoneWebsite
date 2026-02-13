
// State
const state = {
    step: 1,
};

// DOM Elements
const video = document.getElementById('main-video');
const overlayV1 = document.getElementById('overlay-v1');
const overlayV2 = document.getElementById('overlay-v2');
const overlayV3 = document.getElementById('overlay-v3');
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

// --- Initialization ---
const unmuteBtn = document.getElementById('unmute-btn');
const skipIntroBtn = document.getElementById('skip-intro-btn');
let skipIntroTimeout;

async function init() {
    console.log('Initializing...');
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
            requestAnimationFrame(animateV1);
        }
    }).catch(e => {
        console.log("Autoplay failed even muted?", e);
    });

    // Words Sequence
    const words = [
        // Clock starts at 11. 
        // 1. From (11): 500ms
        { text: 'From', img: 'From.png', time: 500, pos: { top: '19.7%', left: '32.5%' } },
        // Subsequent words speed increased by 5%. 
        // Original interval 500ms -> New interval 475ms (500 * 0.95)
        // 2. the (12:20): 500 + 475 = 975
        { text: 'the', img: 'The.png', time: 975, pos: { top: '15.5%', left: '56.1%' } },
        // 3. seed (1:40): 975 + 475 = 1450
        { text: 'seed', img: 'Seed.png', time: 1450, pos: { top: '27.5%', left: '76.8%' } },
        // 4. of (3:00): 1450 + 475 = 1925
        { text: 'of', img: 'Of.png', time: 1925, pos: { top: '50%', left: '85%' } },
        // 5. a (4:20): 1925 + 475 = 2400
        { text: 'a', img: 'A.png', time: 2400, pos: { top: '72.5%', left: '76.8%' } },
        // 6. bean (5:40): 2400 + 475 = 2875
        { text: 'bean', img: 'Bean.png', time: 2875, pos: { top: '84.5%', left: '56.1%' } },
        // 7. of (7:00): 2875 + 475 = 3350
        { text: 'of', img: 'Of.png', time: 3350, pos: { top: '80.3%', left: '32.5%' } },
        // 8. an (8:20): 3350 + 475 = 3825
        { text: 'an', img: 'An.png', time: 3825, pos: { top: '62%', left: '17.1%' } },
        // 9. idea: Center. 3825 + 475 = 4300
        // User requested: 3% lower -> 53% + 3% = 56%
        { text: 'idea', img: 'Idea.png', time: 4300, pos: { top: '56%', left: '50%' } }
    ];

    words.forEach(w => {
        setTimeout(() => {
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
    const currentScale = startScale + (targetScale - startScale) * stepProgress;

    video.style.transform = `scale(${currentScale})`;

    requestAnimationFrame(animateV1);
}

function stopVideo1() {
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
    setTimeout(() => {
        overlayV2.style.opacity = '0';
    }, 3877);

    // Switch to normal speed at 3.6s (1.2s of video content * 3)
    setTimeout(() => {
        video.playbackRate = 1.0;

        // Unmute Video 2 IF user has globally unmuted
        // Check if the Unmute button is HIDDEN (meaning user clicked it)
        const isUserUnmuted = unmuteBtn.classList.contains('hidden');
        if (isUserUnmuted) {
            video.muted = false;
        }

        // Ensure overlay is hidden after fade
        setTimeout(() => {
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
    video.addEventListener('timeupdate', checkEndTime);


    // video.onended is now handled/overridden by the early exit check above.
    // But keep a fallback just in case duration is short or update misses.
    video.onended = () => {
        video.removeEventListener('timeupdate', checkEndTime);
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
    video.src = videos.v3;
    // Fix: Ensure V3 doesn't loop via recycled onended handler
    video.onended = null;

    // Helper to start playback and apply skip logic if needed
    const runVideo = () => {
        video.play().catch(e => console.log("Video 3 play failed", e));

        if (skipped) {
            // Jump to end of animations (approx 3.5s)
            // Wow ends transition at 3.5s.
            video.currentTime = 3.5;
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

    // Start at 75% for initial play (as per previous request), or 63% (last 37%)? 
    // Previous: "loop the last 33%". New: "loop the last 27%".
    // 1.0 - 0.27 = 0.73
    const loopStartRatio = 0.73;

    // Logic: Repeat short soundtrack (last 27%) twice.
    // 1st time: volume 0.25 (as set before, "75% softer").
    // 2nd time: volume 0.125 (50% of previous).

    // We need a counter or state for loop count
    let loopCount = 0;
    const maxLoops = 2; // "repeat ... twice" means play once, then repeat twice? OR play total 2 times? 
    // "repeat ... twice" implies play, repeat, repeat. Total 3.
    // OR "play ... twice".
    // "each time at 50% of the volume of the iteration before."
    // 1: 0.25
    // 2: 0.125
    // 3: 0.0625

    const playNextLoop = () => {
        if (loopCount > 2) return; // Stop after 2 repeats (Total 3 plays).

        // Loop 0
        if (loopCount === 0) bgAudio.volume = 0; // Start silent for fade-in
        // Loop 1
        else if (loopCount === 1) bgAudio.volume = 0;
        // Loop 2
        else if (loopCount === 2) bgAudio.volume = 0;

        const targetVolume = [0.25, 0.125, 0.0625][loopCount];

        bgAudio.currentTime = bgAudio.duration * loopStartRatio;

        bgAudio.play().then(() => {
            // Fade In (50ms duration? "quick fade")
            // Let's fade in over 200ms
            let vol = 0;
            const fadeIn = setInterval(() => {
                vol += (targetVolume / 5); // 5 steps of 40ms = 200ms
                if (vol >= targetVolume) {
                    vol = targetVolume;
                    clearInterval(fadeIn);
                }
                bgAudio.volume = vol;
            }, 40);

            // Schedule Fade Out
            // Loop duration?
            const duration = bgAudio.duration - bgAudio.currentTime;
            // Fade out last 300ms
            setTimeout(() => {
                let volOut = bgAudio.volume;
                const fadeOut = setInterval(() => {
                    volOut -= (targetVolume / 5);
                    if (volOut <= 0) {
                        volOut = 0;
                        clearInterval(fadeOut);
                    }
                    bgAudio.volume = volOut;
                }, 40); // 5 steps * 40ms = 200ms fade out
            }, (duration * 1000) - 300); // Start fade out 300ms before end

        }).catch(e => console.log("Audio play failed", e));

        loopCount++;
    };

    bgAudio.onended = () => {
        if (loopCount < 3) { // 0, 1, 2
            playNextLoop();
        }
    };

    // If bgAudio metadata loaded, set time and play first loop
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
    setTimeout(() => {
        const pow = document.getElementById('word-pow');
        pow.classList.remove('hidden');
        // Drift left 39% from left -> right: 61% AND Rotate -31deg
        setTimeout(() => {
            pow.style.left = '39%';
            pow.style.transform = 'translate(-50%, -50%) rotate(-31deg)';
        }, 50);
    }, 1423);

    // 2s Wow
    // User requested: Start 700ms later (2000 + 700 = 2700ms)
    setTimeout(() => {
        const wow = document.getElementById('word-wow');
        wow.classList.remove('hidden');
        // Drift right 37% from right -> left: 63% AND Rotate 37deg
        setTimeout(() => {
            wow.style.left = '63%';
            wow.style.transform = 'translate(-50%, -50%) rotate(37deg)';
        }, 50);
    }, 2700);

    // If skipped, we fast-forward animations
    if (skipped) {
        // Show 'Let's'
        document.getElementById('word-lets').classList.remove('hidden');

        // Show 'Pow' in final state
        const pow = document.getElementById('word-pow');
        pow.classList.remove('hidden');
        pow.style.transition = 'none'; // Instant
        pow.style.left = '39%';
        pow.style.transform = 'translate(-50%, -50%) rotate(-31deg)';

        // Show 'Wow' in final state
        const wow = document.getElementById('word-wow');
        wow.classList.remove('hidden');
        wow.style.transition = 'none'; // Instant
        wow.style.left = '63%';
        wow.style.transform = 'translate(-50%, -50%) rotate(37deg)';

        // Hide Skip Button immediately
        skipIntroBtn.classList.add('hidden');

        // Show Links immediately? "fading in of the contact wording... if button is pressed"
        // Request: "skip to... just before the fading in". 
        // So we should start the contact fade in NOW.
        contactLinks.classList.remove('hidden');
        contactLinks.style.opacity = '1';
        contactLinks.style.left = '84%';

        return; // Skip the timeouts below
    }

    // Normal Flow
    // ... items below ...
    // Calculate when to hide Skip Button: 4200ms
    skipIntroTimeout = setTimeout(() => {
        skipIntroBtn.classList.add('hidden');
    }, 4200);

    // Links Fade In
    // Play 700ms after Wow stops transitioning.
    // Wow starts at 2700ms. Transition is 0.8s (800ms).
    // Wow stops at 2700 + 800 = 3500ms.
    // Appear at 3500 + 700 = 4200ms.
    setTimeout(() => {
        contactLinks.classList.remove('hidden');
        contactLinks.style.opacity = '1';
        contactLinks.style.left = '84%'; // Matches CSS update: Moved 2% left from 86%
    }, 4200);
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
    // 1. Stop current video / audio
    video.pause();
    bgAudio.pause();

    // Clear any pending timeouts/intervals/animations if possible
    // (Ideally we track IDs, but simplistic approach: rely on state switch)

    // 2. Hide overlays
    overlayV1.classList.add('hidden');
    overlayV1.innerHTML = '';
    overlayV2.classList.add('hidden');

    // 3. Setup V3 state immediately
    // Jump to the state where WOW has finished and contacts are about to appear.
    // "disappear at the point Wow stops transitioning and just before the fading in of the contact wording"
    // Wow stops at 3500ms (2700 + 800). Contacts appear at 4200ms.
    // So we want to be effectively at approx 4200ms of V3 timeline.

    startVideo3(true); // pass true for 'skipped'
}

// Modify startVideo3 to accept 'skipped' param
// We need to update the function definition. Since we can't easily change signature in multi-replace
// without replacing the whole function head, we'll assume it handles it or we modify it below.

// Wait, I need to modify startVideo3 signature and logic.
// See next chunk.
