import { state, LayoutConfig } from './state.js';
import { timeoutManager } from './utils.js';

export function recalculateLayout() {
    const video = document.getElementById('main-video');
    const config = LayoutConfig[LayoutConfig.current];
    const isMobile = LayoutConfig.current === 'mobile';

    if (state.step === 2) {
        const staticScale = config.staticVideoScale || 1.0;
        if (video) video.style.transform = `scale(${staticScale})`;
    } else if (state.step >= 3) {
        const v3Scale = config.v3VideoScale || config.staticVideoScale || 1.0;
        const xShift = isMobile ? '-3vw' : '0';
        if (video) video.style.transform = `scale(${v3Scale}) translateX(${xShift})`;
    }
}

let resizeTimeout;
export function handleResize() {
    timeoutManager.clearTimeout(resizeTimeout);
    resizeTimeout = timeoutManager.setTimeout(recalculateLayout, 150);
}

export function initLayout() {
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
}
