
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
        { text: 'idea', img: 'Idea.png', time: 4300, pos: { top: '50%', left: '50%' } }
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


    video.onended = () => {
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

function startVideo3() {
    video.src = videos.v3;
    // Fix: Ensure V3 doesn't loop via recycled onended handler
    video.onended = null;

    video.muted = true; // Video itself is muted, using bgAudio
    video.loop = false;

    // 17% left shift and 0.5 speed -> User requested 1.5x current (0.5 * 1.5 = 0.75)
    // User Update: Move head back to midpoint (remove left shift)
    video.style.transform = 'translateX(0)';
    // User requested: video 3 speed increased to 1.2
    video.playbackRate = 1.2;

    video.play();

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

    if (bgAudio.duration) {
        bgAudio.currentTime = bgAudio.duration * loopStartRatio;
    }

    // "75% softer initially" -> 0.25 volume
    bgAudio.volume = 0.25;
    bgAudio.loop = false; // We handle loop manually

    bgAudio.onended = null; // Remove looping logic to play only once

    // Only play if unmuted, or prepare to play if user unmutes later
    bgAudio.play().catch(e => console.log("Audio play failed", e));

    // Fade up to 0.7
    // Fade logic requested: "reduce ... to 25% volume by the end"
    // Since we start at 25% (0.25), and want to end at 25%, no fade needed?
    // "75% softer initially" means 0.25 volume. 
    // "reduce ... to 25% volume by the end" means end at 0.25 volume.
    // So distinct fade is not requested, just constant low volume? 
    // Or did user mean "reduce current volume by ANOTHER 75%"?
    // "play... 75% softer initially" -> 0.25.
    // "reduce... to 25% volume by end" -> 0.25.
    // Interpreting as: Start at 0.25 and stay there (or ensure it ends there).
    // Removing the volume increase interval.

    // If metadata wasn't loaded for currentTime calc:
    // If metadata wasn't loaded for currentTime calc:
    bgAudio.onloadedmetadata = () => {
        bgAudio.currentTime = bgAudio.duration * 0.73;
    };

    overlayV3.classList.remove('hidden');

    document.getElementById('word-lets').classList.remove('hidden');

    // 1s Pow -> 0.8s transition handled in CSS
    // User requested: Start 700ms later (1000 + 700 = 1700ms)
    // User requested: Increase speed (appear earlier) by 177ms -> 1700 - 177 = 1523ms
    // User requested: Appear 100ms *earlier* -> 1523 - 100 = 1423ms
    setTimeout(() => {
        const pow = document.getElementById('word-pow');
        pow.classList.remove('hidden');
        // Drift left 37% from left AND Rotate -37deg
        // CSS transition updated to 0.8s
        // User requested: Move 2% right (37% -> 39%)
        // User requested: Reduce rotation from 34deg to 31deg (3% less)
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

    // Links Fade In
    // Play 700ms after Wow stops transitioning.
    // Wow starts at 2700ms. Transition is 0.8s (800ms).
    // Wow stops at 2700 + 800 = 3500ms.
    // Appear at 3500 + 700 = 4200ms.
    setTimeout(() => {
        contactLinks.classList.remove('hidden');
        contactLinks.style.opacity = '1';
        contactLinks.style.left = '86%'; // Moved 3% right from 83%
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

init();
