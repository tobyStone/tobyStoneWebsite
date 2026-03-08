import { state, videos, LayoutConfig } from './modules/state.js';
import { timeoutManager } from './modules/utils.js';
import { initLayout } from './modules/layout.js';
import { audioPool, toggleMuteState } from './modules/audioController.js';
import { startVideo1, v1AnimationId, v2TimeUpdateHandler, clearVideoAnimationHandlers } from './modules/videoController.js';
import { startTestimonials } from './modules/testimonials.js';
import { initContactForm } from './modules/contactForm.js';

const video = document.getElementById('main-video');
const unmuteBtn = document.getElementById('unmute-btn');
const skipIntroBtn = document.getElementById('skip-intro-btn');

async function init() {
    console.log('Initializing... Version: Contact Transition Update 1.52 (Refinements - Modular)');

    initLayout();
    initContactForm();

    if (video) {
        video.src = videos.v1;
        video.muted = false;
        video.playbackRate = 1.225;

        video.onloadeddata = () => {
            video.onloadeddata = null;
            startVideo1();

            const preloadV3 = document.createElement('video');
            preloadV3.src = videos.v3;
            preloadV3.preload = 'auto';
        };
    }

    if (skipIntroBtn) {
        skipIntroBtn.addEventListener('click', skipIntro);
    }

    if (unmuteBtn) {
        unmuteBtn.onclick = () => toggleMuteState(unmuteBtn);
    }
}

function skipIntro() {
    console.log("Skipping Intro - Cleaning up and enforcing final state");

    timeoutManager.clearAll();

    if (v1AnimationId) {
        cancelAnimationFrame(v1AnimationId);
    }
    clearVideoAnimationHandlers();

    if (video) {
        video.pause();
        video.style.zIndex = '';
        video.style.mixBlendMode = '';
        video.style.position = '';

        try {
            video.src = '';
            video.load();
        } catch (e) { }
    }

    audioPool.forEach(a => {
        a.pause();
        a.src = '';
    });

    if (video) {
        video.onended = null;
        video.ontimeupdate = null;
        if (v2TimeUpdateHandler) {
            video.removeEventListener('timeupdate', v2TimeUpdateHandler);
        }
        video.onloadeddata = null;
        video.onloadedmetadata = null;
    }

    audioPool.forEach(a => {
        a.onended = null;
        a.onloadedmetadata = null;
    });

    document.body.classList.add('v3-mode');

    const overlayV1 = document.getElementById('overlay-v1');
    if (overlayV1) {
        overlayV1.classList.add('hidden');
        overlayV1.innerHTML = '';
    }

    const overlayV2 = document.getElementById('overlay-v2');
    if (overlayV2) {
        overlayV2.classList.add('hidden');
        overlayV2.style.opacity = '';
    }

    if (unmuteBtn) unmuteBtn.classList.add('hidden');
    if (skipIntroBtn) skipIntroBtn.classList.add('hidden');

    const overlayV3 = document.getElementById('overlay-v3');
    if (overlayV3) overlayV3.classList.remove('hidden');

    const wordLets = document.getElementById('word-lets');
    if (wordLets) {
        wordLets.classList.remove('hidden');
        wordLets.style.transition = 'none';
    }

    const isMobilePortrait = window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches;
    const isMobileLandscape = window.matchMedia('(max-height: 550px) and (orientation: landscape)').matches;

    const pow = document.getElementById('word-pow');
    if (pow) {
        pow.classList.remove('hidden');
        pow.style.transition = 'none';

        let powLeft = '39%';
        if (isMobilePortrait) powLeft = '16%';
        else if (isMobileLandscape) powLeft = '35%';
        pow.style.left = powLeft;

        if (isMobilePortrait) pow.style.top = '64%';
        else if (isMobileLandscape) pow.style.top = '75%';

        pow.style.transform = 'translate(-50%, -50%) rotate(-31deg)';
    }

    const wow = document.getElementById('word-wow');
    if (wow) {
        wow.classList.remove('hidden');
        wow.style.transition = 'none';

        let wowLeft = '63%';
        if (isMobilePortrait) wowLeft = '84%';
        else if (isMobileLandscape) wowLeft = '65%';
        wow.style.left = wowLeft;

        if (isMobilePortrait) wow.style.top = '67%';
        else if (isMobileLandscape) wow.style.top = '75%';

        wow.style.transform = 'translate(-50%, -50%) rotate(37deg)';
    }

    const contactLinks = document.getElementById('contact-links');
    if (contactLinks) {
        contactLinks.classList.remove('hidden');
        contactLinks.style.opacity = '1';
        contactLinks.style.left = LayoutConfig[LayoutConfig.current].contactLinksLeft;
    }

    const tagline = document.getElementById('contact-tagline');
    if (tagline) {
        tagline.classList.remove('hidden');
        tagline.style.opacity = '1';
    }

    startTestimonials();

    if (video) {
        video.src = videos.v3;
        const seekToEnd = () => {
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

        const config = LayoutConfig[LayoutConfig.current];
        const v3Scale = config.v3VideoScale || config.staticVideoScale || 1.0;
        const isMobile = LayoutConfig.current === 'mobile';
        const xShift = isMobile ? '-3vw' : '0';

        video.style.transform = `scale(${v3Scale}) translateX(${xShift})`;
        video.style.zIndex = '';
        video.style.mixBlendMode = '';
        video.style.opacity = '1';
    }
}

init();
