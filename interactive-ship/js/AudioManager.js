class AudioManager {
    constructor() {
        this.initialized = false;
        
        // Define audio tracks
        this.tracks = {
            ambient: new Audio('/sounds/waves.mp3'),
            idle: new Audio('/sounds/idle.mp3'),
            sail: new Audio('/sounds/sail.mp3'),
            turn: new Audio('/sounds/turn.mp3'),
            hit: new Audio('/sounds/hit.mp3'),
            sink: new Audio('/sounds/sink.mp3')
        };
        
        // Configure ambient track
        this.tracks.ambient.loop = true;
        this.tracks.ambient.volume = 0.0; // Start silent, fade in
        this.ambientTargetVolume = 0.3; // Default 30% volume
        
        // Preload all
        Object.values(this.tracks).forEach(audio => {
            audio.preload = 'auto';
        });
        
        // Track the currently playing voice line
        this.currentVoice = null;
        this.voiceDuckingVolume = 0.05; // 5% volume for waves when talking
        
        // Map engine states to sound keys
        this.stateMap = {
            'IDLE': 'idle',
            'SAILING': 'sail',
            'TURN': 'turn',
            'HIT': 'hit',
            'SINK': 'sink'
        };
        
        // Listen for first interaction to unlock audio
        const unlock = () => {
            if (!this.initialized) {
                this.initialized = true;
                this.tracks.ambient.play().catch(e => console.log('Audio autoplay blocked:', e));
                this.fadeAmbient(this.ambientTargetVolume);
            }
            document.removeEventListener('click', unlock);
        };
        document.addEventListener('click', unlock);
    }
    
    fadeAmbient(targetVol) {
        if (!this.initialized) return;
        
        // Simple fade interval
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        
        this.fadeInterval = setInterval(() => {
            let current = this.tracks.ambient.volume;
            if (Math.abs(current - targetVol) < 0.02) {
                this.tracks.ambient.volume = targetVol;
                clearInterval(this.fadeInterval);
                return;
            }
            this.tracks.ambient.volume += (targetVol > current) ? 0.02 : -0.02;
        }, 50);
    }
    
    playVoice(engineState) {
        // We only trigger voice lines if the user has actually interacted to unlock audio
        // The first click (e.g. clicking Idle) will both unlock AND play the voice line!
        if (!this.initialized) {
            // Give the unlocker 10ms to fire first
            setTimeout(() => {
                if (this.initialized) this.playVoice(engineState);
            }, 10);
            return;
        }
        
        // Stop any current voice
        if (this.currentVoice) {
            this.currentVoice.pause();
            this.currentVoice.currentTime = 0;
            this.currentVoice.onended = null;
        }
        
        const trackKey = this.stateMap[engineState];
        const voice = this.tracks[trackKey];
        if (!voice) return;
        
        this.currentVoice = voice;
        this.currentVoice.volume = 1.0;
        
        // Duck ambient volume
        this.fadeAmbient(this.voiceDuckingVolume);
        
        this.currentVoice.play().catch(e => console.log('Voice play error:', e));
        
        this.currentVoice.onended = () => {
            this.currentVoice = null;
            this.fadeAmbient(this.ambientTargetVolume); // Fade waves back up
        };
    }
}

// Instantiate globally
window.audioManager = new AudioManager();
