
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
        startVideo1();
    };
}

// --- Video 1 Logic ---
let v1StartTime;

function startVideo1() {
    overlayV1.classList.remove('hidden');

    const playPromise = video.play();

    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Autoplay with sound prevented. Falling back to muted.");
            video.muted = true;
            video.play();

            // Show Unmute Button
            unmuteBtn.classList.remove('hidden');
            unmuteBtn.onclick = () => {
                video.muted = false;
                unmuteBtn.classList.add('hidden');
            };
        }).then(() => {
            // Play started (either muted or unmuted)
            if (!v1StartTime) {
                v1StartTime = Date.now();
                requestAnimationFrame(animateV1);
            }
        });
    }

    // Words Sequence removed as per user request
    // const words = [ ... ];
    // words.forEach(...)
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
    startVideo2Setup();
}

function startVideo2Setup() {
    video.src = videos.v2;
    video.style.transform = 'scale(1)';
    video.currentTime = 0;
    video.muted = false; // Ensure sound on for V2

    // Apply blend mode for "explosion over words" effect
    video.style.zIndex = '30';
    video.style.position = 'relative'; // Ensure z-index works
    video.style.mixBlendMode = 'screen';

    // Ensure overlay is visible but behind video (z-20 vs z-30)
    // We want the overlay to appear during the pause.
    // Initially hidden? No, user says "remains on screen for 3600ms".
    // "around the colour in the centre of the video... will be the words"
    // So the video plays 1200ms. Then pauses.
    // At 1200ms, we show the words? Or are they there from start?
    // "At the same time... will be the words". "The video will then play... and the words will be rendered over".
    // Implies words appear during pause.

    // Hide overlay initially
    overlayV2.classList.add('hidden');

    video.play();

    // 1.2s Pause Logic
    setTimeout(() => {
        video.pause();
        overlayV2.classList.remove('hidden'); // Show words

        // 3.6s Wait Logic
        setTimeout(() => {
            video.play();
            // Words remain visible, video plays over them (screen blend)

            video.onended = () => {
                // Cleanup V2 styles
                video.style.zIndex = '';
                video.style.mixBlendMode = '';
                overlayV2.classList.add('hidden');
                startVideo3();
            };

            // Audio Fade
            const monitor = setInterval(() => {
                if (video.duration && video.currentTime >= video.duration - 1.0) {
                    if (video.volume > 0.1) video.volume -= 0.1;
                    if (bgAudio.paused) bgAudio.play();
                    if (bgAudio.volume < 1.0) bgAudio.volume += 0.1;
                }
                if (video.ended) clearInterval(monitor);
            }, 200);

        }, 3600);

    }, 1200);
}

function startVideo3() {
    video.src = videos.v3;
    video.muted = true;
    video.loop = false;
    video.play();

    overlayV3.classList.remove('hidden');

    document.getElementById('word-lets').classList.remove('hidden');

    // 1s Pow
    setTimeout(() => {
        const pow = document.getElementById('word-pow');
        pow.classList.remove('hidden');
        // Drift left 37% from left
        setTimeout(() => { pow.style.left = '37%'; }, 100);
    }, 1000);

    // 2s Wow
    setTimeout(() => {
        const wow = document.getElementById('word-wow');
        wow.classList.remove('hidden');
        // Drift right 37% from right -> left: 63%
        setTimeout(() => { pow.style.left = '63%'; }, 100); // Wait, COPY PASTE ERROR? 
        // Should be WOW. 
        setTimeout(() => { wow.style.left = '63%'; }, 100); // Fixed
    }, 2000);

    // Links Fade In
    setTimeout(() => {
        contactLinks.classList.remove('hidden');
        contactLinks.style.opacity = '1';
        // "appear to the right and slightly below centre"
        // Initial: left 50%, translate -50%.
        // Target: "slightly below centre" (top 65% set in CSS). 
        // "appear to the right" -> move LEFT value to say 60%?
        contactLinks.style.left = '60%';
    }, 4000); // "After these transitions" -> 2s (pow) + drift time? 4s is safe.
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
