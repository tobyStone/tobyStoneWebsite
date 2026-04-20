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
    deadZone: 0.03,        
    intentHoldMs: 100,     
    crossfadeMs: 150       
};

class ShipEngine {
    constructor() {
        this.shipL = document.getElementById('ship-l');
        this.shipR = document.getElementById('ship-r');
        this.shipTL = document.getElementById('ship-tl'); // R to L turn (turning left)
        this.shipTR = document.getElementById('ship-tr'); // L to R turn (turning right)
        
        this.wavesL = document.getElementById('waves-l');
        this.wavesR = document.getElementById('waves-r');
        
        this.state = STATE.INIT;
        this.pointerX = 0.5;      
        this.shipX = 0.5;         
        
        this.calibration = null;
        this.activeShip = null;
        this.activeWaves = null;
        
        this.turnTimer = null;
        this.intentTimer = null;

        this.init();
    }

    async init() {
        try {
            this.calibration = calibrationData;
            
            // To prevent blocking initial wait times on videos that don't have a src yet,
            // we only wait for meta on the active starting ones.
            await Promise.all([
                this.waitForMeta(this.shipR),
                this.waitForMeta(this.wavesR)
            ]);

            this.setupListeners();
            // Start state
            this.setState(STATE.MOVING_RIGHT);
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
        // Track pointer 
        window.addEventListener('mousemove', (e) => {
            this.pointerX = e.clientX / window.innerWidth;
            this.evaluateIntent();
            this.updateDebug();
        });
        
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.pointerX = e.touches[0].clientX / window.innerWidth;
                this.evaluateIntent();
                this.updateDebug();
            }
        });

        // Track ship's simulated X based on active video current time
        const trackShipX = () => {
            if (this.activeShip && this.calibration) {
                const time = this.activeShip.currentTime;
                let clipKey = null;
                if (this.state === STATE.MOVING_LEFT) clipKey = 'L';
                if (this.state === STATE.MOVING_RIGHT) clipKey = 'R';

                if (clipKey) {
                    const map = this.calibration.clipData[clipKey]?.xMap;
                    if (map) {
                        this.shipX = this.interpolateX(map, time);
                        
                        // Stop at edges
                        const atStart = time <= map[0].t;
                        const atEnd = time >= map[map.length - 1].t;
                        
                        if (atStart || atEnd) {
                            this.activeShip.pause();
                        } else {
                            this.activeShip.play().catch(() => {});
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
        if (Math.abs(this.pointerX - this.shipX) < CONFIG.deadZone) {
            return; 
        }

        const pointerIsRight = this.pointerX > this.shipX;
        
        if (this.state === STATE.MOVING_LEFT && pointerIsRight) {
            this.triggerTurnIntent(STATE.TURN_L_TO_R);
        } else if (this.state === STATE.MOVING_RIGHT && !pointerIsRight) {
            this.triggerTurnIntent(STATE.TURN_R_TO_L);
        } else if (this.state === STATE.MOVING_LEFT || this.state === STATE.MOVING_RIGHT) {
            clearTimeout(this.intentTimer);
            this.intentTimer = null;
        }
    }

    triggerTurnIntent(nextState) {
        if (this.intentTimer) return; 
        
        this.intentTimer = setTimeout(() => {
            this.setState(nextState);
            this.intentTimer = null;
        }, CONFIG.intentHoldMs);
    }

    crossfadeElements(newShip, newWaves = null) {
        // Handle Ship
        if (this.activeShip && this.activeShip !== newShip) {
            const oldShip = this.activeShip;
            oldShip.classList.remove('active');
            setTimeout(() => {
                oldShip.pause();
                oldShip.removeAttribute('src'); // Aggressive garbage collection
                oldShip.load(); 
            }, CONFIG.crossfadeMs);
        }
        this.activeShip = newShip;
        if (!this.activeShip.hasAttribute('src')) {
            this.activeShip.src = this.activeShip.dataset.src;
            this.activeShip.load();
        }
        
        // Handle Waves
        if (newWaves && this.activeWaves !== newWaves) {
            if (this.activeWaves) {
                const oldWaves = this.activeWaves;
                oldWaves.classList.remove('active');
                setTimeout(() => { 
                    oldWaves.pause(); 
                    oldWaves.removeAttribute('src');
                    oldWaves.load();
                }, CONFIG.crossfadeMs);
            }
            this.activeWaves = newWaves;
            if (!this.activeWaves.hasAttribute('src')) {
                this.activeWaves.src = this.activeWaves.dataset.src;
                this.activeWaves.load();
            }
            this.activeWaves.classList.add('active');
            this.activeWaves.play().catch(e => console.error("Wave Play prevented", e));
        }

        // Add class to ship but handle pre-play requirements explicitly per function
        newShip.classList.add('active');
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;

        if (newState === STATE.MOVING_LEFT) {
            this.crossfadeElements(this.shipL, this.wavesL);
            this.activeShip.play().catch(e => console.error("Play prevented", e));
        } 
        else if (newState === STATE.MOVING_RIGHT) {
            this.crossfadeElements(this.shipR, this.wavesR);
            this.activeShip.play().catch(e => console.error("Play prevented", e));
        } 
        else if (newState === STATE.TURN_L_TO_R || newState === STATE.TURN_R_TO_L) {
            // Turning State
            const turnVid = (newState === STATE.TURN_L_TO_R) ? this.shipTR : this.shipTL;
            
            // src handling is done within crossfadeElements now 
            this.crossfadeElements(turnVid);
            turnVid.currentTime = 0;
            this.activeShip.play().catch(e => console.error("Play prevented", e));
            
            const durationMs = turnVid.duration ? (turnVid.duration * 1000) : 2000; // Fallback if meta not loaded instantly

            // Preload opposite videos & Find mapping
            const nextShip = (newState === STATE.TURN_L_TO_R) ? this.shipR : this.shipL;
            const nextWaves = (newState === STATE.TURN_L_TO_R) ? this.wavesR : this.wavesL;
            const lookupKey = (newState === STATE.TURN_L_TO_R) ? 'R' : 'L';
            
            // Preload by setting src early
            if (!nextShip.hasAttribute('src')) {
                nextShip.src = nextShip.dataset.src;
                nextShip.load();
            }
            if (!nextWaves.hasAttribute('src')) {
                nextWaves.src = nextWaves.dataset.src;
                nextWaves.load();
            }
            
            // Sync Temporal mapping
            const targetTimeForOpposite = this.findNearestTimeForX(this.calibration.clipData[lookupKey].xMap, this.shipX);
            // Ensure readyState > 0 to set currentTime safely, or just set it
            try { nextShip.currentTime = targetTimeForOpposite; } catch(e){}
            try { nextWaves.currentTime = targetTimeForOpposite; } catch(e){}
            
            // Queue transition back to move state
            clearTimeout(this.turnTimer);
            this.turnTimer = setTimeout(() => {
                this.setState((newState === STATE.TURN_L_TO_R) ? STATE.MOVING_RIGHT : STATE.MOVING_LEFT);
            }, durationMs - CONFIG.crossfadeMs);
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.engine = new ShipEngine();
});
