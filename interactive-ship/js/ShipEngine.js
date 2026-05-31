// ShipEngine.js
// State Machine for controlling interactive ship using WebM layers

const STATE = {
    IDLE: 'IDLE',
    SAILING: 'SAILING',
    HIT: 'HIT',
    SINK: 'SINK',
    TURN: 'TURN'
};

class ShipGameController {
    constructor() {
        this.state = STATE.IDLE;
        
        // Video Elements
        this.videos = {
            [STATE.IDLE]: document.getElementById('ship-idle'),
            [STATE.SAILING]: document.getElementById('ship-sailing'),
            [STATE.HIT]: document.getElementById('ship-hit'),
            [STATE.SINK]: document.getElementById('ship-sink'),
            [STATE.TURN]: document.getElementById('ship-turn')
        };
        
        // Ensure we play the videos correctly on load
        Object.values(this.videos).forEach(vid => {
            if (vid) {
                // Ensure looping is correct based on state
                vid.loop = (vid === this.videos[STATE.IDLE] || vid === this.videos[STATE.SAILING]);
            }
        });

        this.initButtons();
        this.setState(STATE.IDLE);
        
        // Start the real-time wave tracking
        this.currentLeftPct = 22; // Track the exact X position
        this.startWaveTracking();
    }

    initButtons() {
        const btnIdle = document.getElementById('btn-idle');
        const btnSail = document.getElementById('btn-sail');
        const btnHit = document.getElementById('btn-hit');
        const btnSink = document.getElementById('btn-sink');
        const btnTurn = document.getElementById('btn-turn');

        if(btnIdle) btnIdle.addEventListener('click', () => this.playIdle());
        if(btnSail) btnSail.addEventListener('click', () => this.startSailing());
        if(btnHit) btnHit.addEventListener('click', () => this.playHit());
        if(btnSink) btnSink.addEventListener('click', () => this.playSink());
        if(btnTurn) btnTurn.addEventListener('click', () => this.playTurn());
    }

    playTurn() {
        if (this.state === STATE.TURN) return;
        this.setState(STATE.TURN);
        
        const turnVideo = this.videos[STATE.TURN];
        if (!turnVideo) return;
        
        const isCurrentlyFlipped = document.getElementById('sea-overlay').classList.contains('flipped');
        turnVideo.classList.toggle('flipped', isCurrentlyFlipped);
        
        turnVideo.onended = () => {
            turnVideo.onended = null;
            if (this.state === STATE.TURN) {
                const sea = document.getElementById('sea-overlay');
                const isFlipped = sea.classList.toggle('flipped');
                Object.values(this.videos).forEach(vid => {
                    if (vid && vid !== turnVideo) {
                        vid.classList.toggle('flipped', isFlipped);
                    }
                });
                this.playIdle();
            }
        };
    }

    // --- Core Transition Logic ---

    setState(newState) {
        if (this.state === newState && newState !== STATE.HIT) return; // Allow repeating hit
        
        const oldVideo = this.videos[this.state];
        const newVideo = this.videos[newState];

        if (!newVideo) {
            console.error(`Video for state ${newState} not found.`);
            return;
        }

        this.state = newState;

        // Reset the old video and hide it
        if (oldVideo && oldVideo !== newVideo) {
            oldVideo.classList.remove('active');
            oldVideo.pause();
        }

        // Prepare the new video and show it
        if (oldVideo !== newVideo) {
            if (newState === STATE.SINK) {
                newVideo.load(); // Force the browser to refresh the video buffer
                newVideo.playbackRate = 0.3773; // Slow down the tilting video further (0.49 * 0.77) to hide clipping
            } else {
                newVideo.playbackRate = 1.0;
                newVideo.currentTime = 0;
            }
            newVideo.classList.add('active');
        }
        
        const playPromise = newVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Video play prevented:", e));
        }
    }

    // --- Public API for Game Logic ---

    playIdle() {
        this.setState(STATE.IDLE);
    }

    startSailing() {
        this.setState(STATE.SAILING);
    }

    playHit() {
        this.setState(STATE.HIT);
        
        // Once hit finishes, return to idle automatically
        const hitVideo = this.videos[STATE.HIT];
        hitVideo.onended = () => {
            hitVideo.onended = null;
            if (this.state === STATE.HIT) {
                this.playIdle();
            }
        };
    }

    playSink() {
        this.setState(STATE.SINK);
    }

    startWaveTracking() {
        this.seaVideo = document.querySelector('.sea-overlay');
        
        const track = () => {
            requestAnimationFrame(track);
            
            if (!this.seaVideo || this.seaVideo.readyState < 2) return;
            const videoWidth = this.seaVideo.videoWidth;
            const videoHeight = this.seaVideo.videoHeight;
            if (videoWidth === 0 || videoHeight === 0) return;

            const activeVideo = this.videos[this.state];
            if (!activeVideo) return;

            const shipRect = activeVideo.getBoundingClientRect();
            // Center of the ship horizontally
            const shipScreenX = shipRect.left + shipRect.width / 2;

            const containerW = window.innerWidth;
            const containerH = window.innerHeight;
            
            // Calculate actual rendered dimensions due to object-fit: contain
            const scale = Math.min(containerW / videoWidth, containerH / videoHeight);
            const renderedVidW = videoWidth * scale;
            const renderedVidH = videoHeight * scale;
            
            const vidOffsetX = (containerW - renderedVidW) / 2;
            const vidOffsetY = (containerH - renderedVidH) / 2;
            
            // Map the screen X to native video X
            const relativeX = shipScreenX - vidOffsetX;
            let nativeX = (relativeX / renderedVidW) * videoWidth;
            nativeX = Math.max(0, Math.min(videoWidth - 1, Math.floor(nativeX)));

            if (!this.scanCanvas) {
                this.scanCanvas = document.createElement('canvas');
                this.scanCtx = this.scanCanvas.getContext('2d', { willReadFrequently: true });
            }
            
            if (this.scanCanvas.width !== 1 || this.scanCanvas.height !== videoHeight) {
                this.scanCanvas.width = 1;
                this.scanCanvas.height = videoHeight;
            }

            this.scanCtx.clearRect(0, 0, 1, videoHeight);
            // Draw a single 1-pixel wide column from nativeX in the video
            this.scanCtx.drawImage(
                this.seaVideo, 
                nativeX, 0, 1, videoHeight,
                0, 0, 1, videoHeight
            );

            const imgData = this.scanCtx.getImageData(0, 0, 1, videoHeight).data;
            let waveYNative = videoHeight; 

            // Find the wave surface (first pixel with alpha > 50)
            for (let y = 0; y < videoHeight; y++) {
                if (imgData[y * 4 + 3] > 50) { 
                    waveYNative = y;
                    break;
                }
            }

            // Map native Y back to viewport Y
            const waveYViewport = vidOffsetY + (waveYNative / videoHeight) * renderedVidH;
            const waveBottomPx = containerH - waveYViewport;
            
            // The user wants the ship closer to the viewer (halfway between base of viewport and horizon)
            // The horizon's distance from the bottom is waveBottomPx. Halfway is waveBottomPx * 0.5.
            const targetBottomPx = waveBottomPx * 0.5;

            // Subtract 15% of viewport to compensate for the transparent empty space at the bottom of the ship's WebM canvas
            const paddingOffset = containerH * 0.15; 
            const targetBottom = targetBottomPx - paddingOffset;
            
            // Initialize smoothing variable on first frame
            if (this.currentBottom === undefined) {
                this.currentBottom = targetBottom;
            }
            
            if (this.state === STATE.SINK) {
                // Determine how much to sink per frame (sink off screen in ~5 seconds at 60fps)
                // Multiplied by 0.7 to perfectly match the 0.7x slowed video animation!
                const sinkAmount = (containerH / 300) * 0.7;
                
                // Track total distance sunk
                if (!this.sinkOffset) this.sinkOffset = 0;
                this.sinkOffset += sinkAmount;
                
                // The new target is the wave's surface MINUS how far we've sunk!
                const sinkTarget = targetBottom - this.sinkOffset;
                
                // Keep smoothing it! This allows the ship to elegantly bob with the waves WHILE sinking
                this.currentBottom += (sinkTarget - this.currentBottom) * 0.05;
                
                // Perfectly cancel out the mask drop by pushing the mask upwards
                document.documentElement.style.setProperty('--sink-mask-offset', `${this.sinkOffset}px`);
            } else {
                // Apply standard smoothing (low-pass filter) to eliminate jerkiness
                this.currentBottom += (targetBottom - this.currentBottom) * 0.05;
                
                // Reset the mask offset in case the user resets to idle
                this.sinkOffset = 0;
                document.documentElement.style.setProperty('--sink-mask-offset', `0px`);
            }
            
            // X-Axis Movement Logic
            if (this.state === STATE.SAILING) {
                const isFlipped = this.seaVideo.classList.contains('flipped');
                const speed = (75 - 22) / (12 * 60); // 12 seconds to cross screen at 60fps
                
                if (isFlipped) {
                    this.currentLeftPct -= speed;
                    if (this.currentLeftPct < 22) this.currentLeftPct = 22;
                } else {
                    this.currentLeftPct += speed;
                    if (this.currentLeftPct > 75) this.currentLeftPct = 75;
                }
            }
            
            // Apply new dynamic positions to all videos so they stay perfectly overlaid
            const newBottom = `${this.currentBottom}px`;
            const newLeft = `${this.currentLeftPct}%`;
            
            Object.values(this.videos).forEach(vid => {
                if (vid) {
                    vid.style.bottom = newBottom;
                    vid.style.left = newLeft;
                }
            });
        };
        
        track();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.shipGame = new ShipGameController();
});
