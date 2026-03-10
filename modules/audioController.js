import { state } from './state.js';
import { timeoutManager } from './utils.js';

const music = '/music/musicfx-dj-1770309373761.wav';
export const audioPool = [new Audio(music), new Audio(music)];
export let activeAudioIndex = 0;

export const bgAudio = () => audioPool[activeAudioIndex];
export const standbyAudio = () => audioPool[1 - activeAudioIndex];

export function toggleMuteState(unmuteBtn) {
    state.isMuted = !state.isMuted;
    audioPool.forEach(a => Object.assign(a, { muted: state.isMuted }));

    const video = document.getElementById('main-video');
    if (video) {
        video.muted = state.isMuted;
    }

    const btnImg = unmuteBtn.querySelector('img');
    if (state.isMuted) {
        btnImg.src = '/images/unmute.png';
        btnImg.alt = 'Unmute';
    } else {
        btnImg.src = '/images/mute.png';
        btnImg.alt = 'Mute';
    }
}

let loopCount = 0;

export function playNextLoop() {
    const loopStartRatio = 0.73;
    const targetVolume = 0.25 * Math.pow(0.5, loopCount);
    const unmuteBtn = document.getElementById('unmute-btn');

    if (targetVolume < 0.001) {
        if (unmuteBtn) unmuteBtn.classList.add('hidden');
        return;
    }

    const current = bgAudio();
    const next = standbyAudio();

    if (!isFinite(next.duration)) {
        console.log("Next audio duration not finite, skipping this loop tick");
        return;
    }

    next.currentTime = next.duration * loopStartRatio;
    next.volume = 0;
    next.muted = state.isMuted;

    next.play().then(() => {
        const fadeSteps = 10;
        const fadeInterval = 40;
        let step = 0;

        const crossfade = timeoutManager.setInterval(() => {
            step++;
            const progress = step / fadeSteps;

            next.volume = loopCount === 0 ? targetVolume : progress * targetVolume;

            if (loopCount > 0) {
                const prevVolume = 0.25 * Math.pow(0.5, loopCount - 1);
                current.volume = (1 - progress) * prevVolume;
            }

            if (step >= fadeSteps) {
                timeoutManager.clearInterval(crossfade);
                if (loopCount > 0) current.pause();
                activeAudioIndex = 1 - activeAudioIndex;
            }
        }, fadeInterval);

        const snippetDuration = next.duration * (1 - loopStartRatio);
        if (!isFinite(snippetDuration)) return;
        const fadeOutStartTime = snippetDuration * 0.47;

        timeoutManager.setTimeout(() => {
            loopCount++;
            playNextLoop();
        }, fadeOutStartTime * 1000);

    }).catch(e => console.log("Audio play failed", e));
}

export function resetAudioLoopState() {
    loopCount = 0;
}
