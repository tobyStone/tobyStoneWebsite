// ShipEngine.js
// State Machine for controlling interactive ship video with temporal-spatial continuity

import calibrationData from './calibration.json';

const STATE = {
    INIT: 'INIT',
    MOVING_LEFT: 'MOVING_LEFT',
    MOVING_RIGHT: 'MOVING_RIGHT',
    TURN_L_TO_R: 'TURN_L_TO_R',
    TURN_R_TO_L: 'TURN_R_TO_L',
    ERROR: 'ERROR'
};

const CONFIG = {
    deadZone: 0.03,        // 3% normalized viewport width
    intentHoldMs: 100,     // 100ms debounce for turning
    crossfadeMs: 150       // CSS transition duration
};

class ShipEngine {
    constructor() {
        this.videoL = document.getElementById('video-l');
        this.videoR = document.getElementById('video-r');
        this.videoT = document.getElementById('video-t');
        this.bgShipless = document.getElementById('bg-shipless');
        
        this.state = STATE.INIT;
        this.pointerX = 0.5;      // Normalized pointer X (0 to 1)
        this.shipX = 0.5;         // Normalized ship X (0 to 1) 
        
        this.calibration = null;
        this.activeVideo = null;
        
        this.turnTimer = null;
        this.intentTimer = null;

        this.init();
    }

    async init() {
        try {
            // Assign imported calibration data
            this.calibration = calibrationData;
            
            // Wait for initial metadata to be ready
            await Promise.all([
                this.waitForMeta(this.videoL),
                this.waitForMeta(this.videoR),
                this.waitForMeta(this.videoT)
            ]);

            this.setupListeners();
            this.setState(STATE.MOVING_RIGHT); // default
            this.updateDebug();
        } catch (e) {
            console.error("Initialization error:", e);
            this.setState(STATE.ERROR);
        }
    }

    waitForMeta(videoElement) {
        return new Promise((resolve) => {
            if (videoElement.readyState >= 1) resolve();
            else videoElement.addEventListener('loadedmetadata', resolve, { once: true });
        });
    }

    setupListeners() {
        // Track pointer normalized to 0-1
        window.addEventListener('mousemove', (e) => {
            this.pointerX = e.clientX / window.innerWidth;
            this.evaluateIntent();
            this.updateDebug();
        });
        
        // Touch support
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.pointerX = e.touches[0].clientX / window.innerWidth;
                this.evaluateIntent();
                this.updateDebug();
            }
        });

        // Track ship's simulated X based on active video current time
        // Use requestAnimationFrame for smoother tracking than timeupdate event
        const trackShipX = () => {
            if (this.activeVideo && this.calibration) {
                const time = this.activeVideo.currentTime;
                // Simple interpolation from calibration mapping
                let clipKey = null;
                if (this.state === STATE.MOVING_LEFT) clipKey = 'L';
                if (this.state === STATE.MOVING_RIGHT) clipKey = 'R';

                if (clipKey) {
                    const map = this.calibration.clipData[clipKey]?.xMap;
                    if (map) {
                        this.shipX = this.interpolateX(map, time);
                        
                        // Stop at edges: if we hit the min/max of the map, pause the video
                        const atStart = time <= map[0].t;
                        const atEnd = time >= map[map.length - 1].t;
                        
                        if (atStart || atEnd) {
                            this.activeVideo.pause();
                        } else {
                            // Resume if we've moved back into tracking territory
                            this.activeVideo.play().catch(() => {});
                        }
                    }
                }
            }
            this.updateDebug();
            requestAnimationFrame(trackShipX);
        };
        trackShipX();
    }

    interpolateX(xMap, time) {
        // Find surrounding points
        for (let i = 0; i < xMap.length - 1; i++) {
            const p1 = xMap[i];
            const p2 = xMap[i+1];
            if (time >= p1.t && time <= p2.t) {
                const ratio = (time - p1.t) / (p2.t - p1.t);
                return p1.xNorm + ratio * (p2.xNorm - p1.xNorm);
            }
        }
        return xMap[xMap.length-1].xNorm;
    }

    evaluateIntent() {
        // Deadzone check
        if (Math.abs(this.pointerX - this.shipX) < CONFIG.deadZone) {
            return; // Inside deadzone, do nothing
        }

        const pointerIsRight = this.pointerX > this.shipX;
        
        if (this.state === STATE.MOVING_LEFT && pointerIsRight) {
            this.triggerTurnIntent(STATE.TURN_L_TO_R);
        } else if (this.state === STATE.MOVING_RIGHT && !pointerIsRight) {
            this.triggerTurnIntent(STATE.TURN_R_TO_L);
        } else if (this.state === STATE.MOVING_LEFT || this.state === STATE.MOVING_RIGHT) {
            // Match, cancel any turn intents
            clearTimeout(this.intentTimer);
            this.intentTimer = null;
        }
    }

    triggerTurnIntent(nextState) {
        if (this.intentTimer) return; // Already queuing
        
        this.intentTimer = setTimeout(() => {
            this.setState(nextState);
            this.intentTimer = null;
        }, CONFIG.intentHoldMs);
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;

        // Clear active classes
        [this.videoL, this.videoR, this.videoT].forEach(v => {
            v.classList.remove('active');
        });

        const crossfadeTo = (videoEl, isReverse = false) => {
            if (this.activeVideo && this.activeVideo !== videoEl) {
                // Pause old shortly after to allow smooth opacity transition
                const oldVideo = this.activeVideo;
                setTimeout(() => {
                    oldVideo.pause();
                }, CONFIG.crossfadeMs);
            }
            this.activeVideo = videoEl;
            
            videoEl.classList.add('active');

            if (isReverse) {
                this.playReverse(videoEl);
            } else {
                videoEl.playbackRate = 1.0;
                videoEl.play().catch(e => console.error("Play prevented", e));
            }
        };

        if (newState === STATE.MOVING_LEFT) {
            crossfadeTo(this.videoL);
        } 
        else if (newState === STATE.MOVING_RIGHT) {
            crossfadeTo(this.videoR);
        } 
        else if (newState === STATE.TURN_L_TO_R || newState === STATE.TURN_R_TO_L) {
            
            // We use the same turning video for now for both logic branches
            // Ideally we'd have T_LR and T_RL, but user specified "the turning video"
            
            const isReverse = (newState === STATE.TURN_R_TO_L);
            
            // Translate the turning video so its centre Perfectly aligns with the ship's current X coordinate
            // We multiply by 80vw instead of 100vw because the main L/R videos are scaled to 0.8 in CSS
            const offsetVw = (this.shipX - 0.5) * 80;
            this.videoT.style.transform = `translateX(${offsetVw}vw) translateY(-10vh) scale(0.672)`;
            
            // Start from beginning if forward, end if reverse
            this.videoT.currentTime = isReverse ? this.videoT.duration : 0;
            
            crossfadeTo(this.videoT, isReverse);

            // While turning, recalculate opposite video mapping and aggressively preload
            const nextVideo = (newState === STATE.TURN_L_TO_R) ? this.videoR : this.videoL;
            const targetX = this.shipX; // Approximating ship doesn't move far in turn
            const lookupKey = (newState === STATE.TURN_L_TO_R) ? 'R' : 'L';
            
            const targetTimeForOpposite = this.findNearestTimeForX(this.calibration.clipData[lookupKey].xMap, targetX);
            nextVideo.currentTime = targetTimeForOpposite;
            
            // Queue transition back to moving
            clearTimeout(this.turnTimer);
            this.turnTimer = setTimeout(() => {
                this.setState((newState === STATE.TURN_L_TO_R) ? STATE.MOVING_RIGHT : STATE.MOVING_LEFT);
            }, this.videoT.duration * 1000 - 200); // 200ms buffer
        }
        
        this.updateDebug();
    }

    findNearestTimeForX(xMap, targetX) {
        let bestT = 0;
        let minDiff = Infinity;
        xMap.forEach(p => {
            const diff = Math.abs(p.xNorm - targetX);
            if (diff < minDiff) {
                minDiff = diff;
                bestT = p.t;
            }
        });
        return bestT;
    }

    updateDebug() {
        const dbgState = document.getElementById('dbg-state');
        const dbgX = document.getElementById('dbg-x');
        const dbgMX = document.getElementById('dbg-mx');
        
        if(dbgState) dbgState.textContent = this.state;
        if(dbgX) dbgX.textContent = this.shipX.toFixed(2);
        if(dbgMX) dbgMX.textContent = this.pointerX.toFixed(2);
    }

    playReverse(videoEl) {
        videoEl.pause();
        const fps = 30;
        const interval = 1000 / fps;
        
        const step = () => {
            if (this.activeVideo !== videoEl || this.state === STATE.INIT) return;
            if (videoEl.currentTime > 0) {
                videoEl.currentTime -= (1 / fps);
                setTimeout(() => requestAnimationFrame(step), interval);
            }
        };
        requestAnimationFrame(step);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.engine = new ShipEngine();
});
