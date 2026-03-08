import { state, videos, V1_DURATION, LayoutConfig } from './state.js';
import { timeoutManager } from './utils.js';
import { audioPool, playNextLoop, resetAudioLoopState } from './audioController.js';
import { startTestimonials } from './testimonials.js';

let v1StartTime;
export let v1AnimationId = null;
export let v2TimeUpdateHandler = null;

export function clearVideoAnimationHandlers() {
    v1AnimationId = null;
    v2TimeUpdateHandler = null;
}

export function startVideo1() {
    state.step = 1;
    document.body.classList.add('v1-mode');

    const overlayV1 = document.getElementById('overlay-v1');
    if (overlayV1) overlayV1.classList.remove('hidden');

    const video = document.getElementById('main-video');
    const unmuteBtn = document.getElementById('unmute-btn');

    if (video) video.muted = true;
    if (unmuteBtn) unmuteBtn.classList.remove('hidden');

    if (video) {
        video.play().then(() => {
            if (!v1StartTime) {
                v1StartTime = Date.now();
                v1AnimationId = requestAnimationFrame(() => animateV1(video, overlayV1));
            }
        }).catch(e => console.log("Autoplay failed even muted?", e));
    }

    const words = LayoutConfig[LayoutConfig.current].wordRing;

    words.forEach(w => {
        timeoutManager.setTimeout(() => {
            if (!overlayV1) return;
            const el = document.createElement('img');
            el.src = `/images/${w.img}`;
            el.className = 'v1-word';
            el.onerror = () => { el.style.display = 'none'; };
            Object.assign(el.style, w.pos);
            el.style.transform = 'translate(-50%, -50%)';
            overlayV1.appendChild(el);
        }, w.time);
    });

    timeoutManager.setTimeout(() => {
        const preloadV2 = document.createElement('video');
        preloadV2.src = videos.v2;
        preloadV2.preload = 'auto';
    }, V1_DURATION / 2);
}

function animateV1(video, overlayV1) {
    const now = Date.now();
    const elapsed = now - v1StartTime;

    if (elapsed >= V1_DURATION) {
        stopVideo1(video, overlayV1);
        return;
    }

    const factors = [1.3, 0.8, 1.5, 0.8, 1.7, 0.8, 1.9, 0.8, 2.1];
    const stepDuration = 800;

    const stepIndex = Math.floor(elapsed / stepDuration);
    const stepProgress = (elapsed % stepDuration) / stepDuration;

    let startScale = 0.36;
    for (let i = 0; i < stepIndex; i++) {
        if (i < factors.length) startScale *= factors[i];
    }

    let targetScale = startScale;
    if (stepIndex < factors.length) {
        targetScale = startScale * factors[stepIndex];
    }

    const baseScale = startScale + (targetScale - startScale) * stepProgress;
    const currentScale = baseScale * LayoutConfig[LayoutConfig.current].videoScaleMultiplier;

    if (video) video.style.transform = `scale(${currentScale})`;

    v1AnimationId = requestAnimationFrame(() => animateV1(video, overlayV1));
}

function stopVideo1(video, overlayV1) {
    if (video) video.pause();
    document.body.classList.remove('v1-mode');

    if (overlayV1) {
        overlayV1.classList.add('hidden');
        overlayV1.innerHTML = '';
    }

    startVideo2Setup();
}

export function startVideo2Setup() {
    state.step = 2;
    const video = document.getElementById('main-video');
    if (!video) return;

    video.src = videos.v2;

    const staticScale = LayoutConfig[LayoutConfig.current].staticVideoScale || 1.0;
    video.style.transform = `scale(${staticScale})`;
    video.currentTime = 0.3;

    video.style.zIndex = '30';
    video.style.position = 'relative';
    video.style.mixBlendMode = 'screen';

    video.playbackRate = 0.333;
    video.muted = true;

    const overlayV2 = document.getElementById('overlay-v2');
    if (overlayV2) {
        overlayV2.classList.remove('hidden');
        overlayV2.style.transition = 'opacity 0.5s ease-out';
        overlayV2.style.opacity = '1';
    }

    video.play();

    audioPool.forEach(a => {
        a.src = videos.v2;
        a.load();
        a.muted = state.isMuted;
    });

    timeoutManager.setTimeout(() => {
        if (overlayV2) overlayV2.style.opacity = '0';
    }, 3877);

    timeoutManager.setTimeout(() => {
        video.playbackRate = 1.0;
        video.muted = state.isMuted;

        timeoutManager.setTimeout(() => {
            if (overlayV2) overlayV2.classList.add('hidden');
        }, 3000);

    }, 1900);

    const checkEndTime = () => {
        if (video.duration && video.currentTime >= video.duration - 0.35) {
            video.pause();
            video.removeEventListener('timeupdate', checkEndTime);
            v2TimeUpdateHandler = null;
            video.onended = null;

            video.style.zIndex = '';
            video.style.mixBlendMode = '';
            video.style.position = '';
            video.playbackRate = 1.0;

            if (overlayV2) {
                overlayV2.classList.add('hidden');
                overlayV2.style.opacity = '';
            }

            startVideo3();
        }
    };

    v2TimeUpdateHandler = checkEndTime;
    video.addEventListener('timeupdate', checkEndTime);

    video.onended = () => {
        video.removeEventListener('timeupdate', checkEndTime);
        v2TimeUpdateHandler = null;

        video.style.zIndex = '';
        video.style.mixBlendMode = '';
        video.style.position = '';
        video.playbackRate = 1.0;

        if (overlayV2) {
            overlayV2.classList.add('hidden');
            overlayV2.style.opacity = '';
        }

        startVideo3();
    };
}

export function startVideo3(skipped = false) {
    state.step = 3;
    console.log("Starting Video 3 (Skipped: " + skipped + ")");

    document.body.classList.add('v3-mode');

    const overlayV3 = document.getElementById('overlay-v3');
    if (overlayV3) overlayV3.style.zIndex = '50';

    const video = document.getElementById('main-video');
    if (!video) return;

    video.src = videos.v3;
    video.onended = null;

    const runVideo = () => {
        if (skipped) {
            video.currentTime = 3.5;
            video.pause();
            if (overlayV3) overlayV3.classList.remove('hidden');
            const wordLets = document.getElementById('word-lets');
            if (wordLets) wordLets.classList.remove('hidden');
        } else {
            video.play().then(() => {
                if (overlayV3) overlayV3.classList.remove('hidden');
                const wordLets = document.getElementById('word-lets');
                if (wordLets) wordLets.classList.remove('hidden');
            }).catch(e => console.log("Video 3 play failed", e));
        }
    };

    if (video.readyState >= 1) {
        runVideo();
    } else {
        video.onloadedmetadata = () => {
            video.onloadedmetadata = null;
            runVideo();
        };
    }

    const config = LayoutConfig[LayoutConfig.current];
    const v3Scale = config.v3VideoScale || config.staticVideoScale || 1.0;

    video.muted = true;
    video.loop = false;

    const isMobile = LayoutConfig.current === 'mobile';
    const xShift = isMobile ? '-3vw' : '0';
    video.style.transform = `scale(${v3Scale}) translateX(${xShift})`;
    video.playbackRate = 1.2;

    audioPool.forEach(a => Object.assign(a, { muted: state.isMuted }));

    const isMobileLandscape = window.matchMedia('(max-width: 1200px) and (orientation: landscape)').matches || window.matchMedia('(max-height: 550px) and (orientation: landscape)').matches;
    const delayOffset = isMobileLandscape ? 1000 : 0;

    if (!skipped) {
        let readyCount = 0;
        const checkReady = () => {
            readyCount++;
            if (readyCount === 2) {
                resetAudioLoopState();
                playNextLoop();
            }
        };

        audioPool.forEach(a => {
            if (a.readyState >= 1 && isFinite(a.duration)) {
                checkReady();
            } else {
                a.onloadedmetadata = checkReady;
            }
        });
    } else {
        audioPool.forEach(a => a.pause());
    }

    const isMobileVal = window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches;
    const powTimeout = isMobileVal ? 1623 : 1423;
    const wowTimeout = isMobileVal ? 2900 : 2700;

    timeoutManager.setTimeout(() => {
        const pow = document.getElementById('word-pow');
        if (pow) {
            pow.classList.remove('hidden');
            timeoutManager.setTimeout(() => {
                pow.classList.add('drift-active');
            }, 50);
        }
    }, powTimeout + delayOffset);

    timeoutManager.setTimeout(() => {
        const wow = document.getElementById('word-wow');
        if (wow) {
            wow.classList.remove('hidden');
            timeoutManager.setTimeout(() => {
                wow.classList.add('drift-active');
            }, 50);
        }
    }, wowTimeout + delayOffset);

    timeoutManager.setTimeout(() => {
        const skipBtn = document.getElementById('skip-intro-btn');
        if (skipBtn) skipBtn.classList.add('hidden');

        const contactLinks = document.getElementById('contact-links');
        if (contactLinks) {
            contactLinks.classList.remove('hidden');
            contactLinks.style.opacity = '1';
        }

        const tagline = document.getElementById('contact-tagline');
        if (tagline) {
            tagline.classList.remove('hidden');
            tagline.style.opacity = '1';
        }

        startTestimonials(delayOffset);
    }, 4400 + delayOffset);
}
