
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
const V1_DURATION = 7000;
const V2_PAUSE_DURATION = 2000;

// --- Initialization ---
const unmuteBtn = document.getElementById('unmute-btn');

async function init() {
    console.log('Initializing...');
    // Setup Video 1
    video.src = videos.v1;
    video.muted = false; // Try sound first

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
        // Clock starts at 11 (240 deg). Spacing 30 + (90/9) = 40 deg.
        // Radius approx 35%. Center 50,50. 
        // 1. From (11): 240 deg. x=32.5, y=19.7
        { text: 'From', img: 'From.png', time: 500, pos: { top: '19.7%', left: '32.5%' } },
        // 2. the (12:20): 280 deg. x=56.1, y=15.5
        { text: 'the', img: 'The.png', time: 1000, pos: { top: '15.5%', left: '56.1%' } },
        // 3. seed (1:40): 320 deg. x=76.8, y=27.5
        { text: 'seed', img: 'Seed.png', time: 1500, pos: { top: '27.5%', left: '76.8%' } },
        // 4. of (3:00): 0 deg. x=85, y=50
        { text: 'of', img: 'Of.png', time: 2000, pos: { top: '50%', left: '85%' } },
        // 5. a (4:20): 40 deg. x=76.8, y=72.5
        { text: 'a', img: 'A.png', time: 2500, pos: { top: '72.5%', left: '76.8%' } },
        // 6. bean (5:40): 80 deg. x=56.1, y=84.5
        { text: 'bean', img: 'Bean.png', time: 3000, pos: { top: '84.5%', left: '56.1%' } },
        // 7. of (7:00): 120 deg. x=32.5, y=80.3
        { text: 'of', img: 'Of.png', time: 3500, pos: { top: '80.3%', left: '32.5%' } },
        // 8. an (8:20): 160 deg. x=17.1, y=62
        { text: 'an', img: 'An.png', time: 4000, pos: { top: '62%', left: '17.1%' } },
        // 9. idea: Center.
        { text: 'idea', img: 'Idea.png', time: 4500, pos: { top: '50%', left: '50%' } }
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
    let startScale = 0.2; // Initial
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
    video.currentTime = 0;
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

    // Fade out text starting at 3.5s to be gone by 4.0s
    setTimeout(() => {
        overlayV2.style.opacity = '0';
    }, 3500);

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
        }, 500); // 3.5s + 0.5s fade = 4.0s

    }, 2770); // 2000ms pause + 770ms slow-mo = 2770ms


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
    bgAudio.muted = !isUnmuted;
    bgAudio.currentTime = 0;
    bgAudio.volume = 0;
    bgAudio.loop = false; // Play once

    // Only play if unmuted, or prepare to play if user unmutes later? 
    // The unmuteBtn handler will unmute bgAudio if playing.
    bgAudio.play().catch(e => console.log("Audio play failed", e));

    // Fade up to 0.7
    const audioFade = setInterval(() => {
        if (bgAudio.volume < 0.7) {
            bgAudio.volume = Math.min(0.7, bgAudio.volume + 0.05);
        } else {
            clearInterval(audioFade);
        }
    }, 200);

    overlayV3.classList.remove('hidden');

    document.getElementById('word-lets').classList.remove('hidden');

    // 1s Pow -> 0.8s transition handled in CSS
    // User requested: Start 700ms later (1000 + 700 = 1700ms)
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
    }, 1700);

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
    setTimeout(() => {
        contactLinks.classList.remove('hidden');
        contactLinks.style.opacity = '1';
        contactLinks.style.left = '80%';
    }, 4000);
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
