// ShipEngine.js
// State Machine for controlling interactive ship using WebM layers

const STATE = {
    IDLE: 'IDLE',
    SAILING: 'SAILING',
    HIT: 'HIT',
    SINK: 'SINK'
};

class ShipGameController {
    constructor() {
        this.state = STATE.IDLE;
        
        // Video Elements
        this.videos = {
            [STATE.IDLE]: document.getElementById('ship-idle'),
            [STATE.SAILING]: document.getElementById('ship-sailing'),
            [STATE.HIT]: document.getElementById('ship-hit'),
            [STATE.SINK]: document.getElementById('ship-sink')
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
    }

    initButtons() {
        const btnIdle = document.getElementById('btn-idle');
        const btnSail = document.getElementById('btn-sail');
        const btnHit = document.getElementById('btn-hit');
        const btnSink = document.getElementById('btn-sink');

        if(btnIdle) btnIdle.addEventListener('click', () => this.playIdle());
        if(btnSail) btnSail.addEventListener('click', () => this.startSailing());
        if(btnHit) btnHit.addEventListener('click', () => this.playHit());
        if(btnSink) btnSink.addEventListener('click', () => this.playSink());
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
        newVideo.currentTime = 0;
        newVideo.classList.add('active');
        
        const playPromise = newVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Video play prevented:", e));
        }

        // Manage the CSS sailing animation classes
        // All videos need the sailing class if the ship is currently physically moving
        // But for now, we attach it to all so they move together.
        if (newState === STATE.SAILING) {
            Object.values(this.videos).forEach(vid => {
                if (vid) {
                    vid.classList.remove('ship-sailing');
                    // Trigger reflow
                    void vid.offsetWidth;
                    vid.classList.add('ship-sailing');
                }
            });
        } else {
            // Keep it wherever it was, or reset it. For a pure "restart", remove the class.
            Object.values(this.videos).forEach(vid => {
                if (vid && newState !== STATE.HIT) {
                    // If we hit, we want to pause its movement. If we go to idle or sink, we might stop moving.
                    // For now, only remove sailing class when going back to idle or sink.
                    vid.classList.remove('ship-sailing');
                }
            });
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
        
        // Sink stays sunk, no auto-return
        const sinkVideo = this.videos[STATE.SINK];
        sinkVideo.onended = () => {
            sinkVideo.onended = null;
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.shipGame = new ShipGameController();
});
