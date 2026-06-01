class AudioManager {
    constructor() {
        this.initialized = false;
        
        // Define audio tracks for one-shots
        this.tracks = {
            idle: new Audio('/sounds/idle.mp3'),
            sail: new Audio('/sounds/sail.mp3'),
            turn: new Audio('/sounds/turn.mp3'),
            hit: new Audio('/sounds/hit.mp3'),
            sink: new Audio('/sounds/sink.mp3')
        };
        
        // Setup Web Audio API for perfectly seamless ambient looping
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.ambientGain = this.audioCtx.createGain();
        this.ambientGain.gain.value = 0.0; // Start silent
        this.ambientGain.connect(this.audioCtx.destination);
        
        this.ambientSource = null;
        this.ambientBuffer = null;
        
        // Fetch and decode the wave sound into memory
        fetch('/sounds/waves_seamless.ogg')
            .then(res => res.arrayBuffer())
            .then(buf => this.audioCtx.decodeAudioData(buf))
            .then(decodedData => {
                this.ambientBuffer = decodedData;
            });
            
        this.ambientTargetVolume = 0.21; // Restore to 0.21 for single gapless track
        
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
        
        // Joke Engine
        this.jokes = [
            new Audio('/sounds/joke1.mp3'),
            new Audio('/sounds/joke2.mp3'),
            new Audio('/sounds/joke3.mp3'),
            new Audio('/sounds/joke4.mp3'),
            new Audio('/sounds/joke5.mp3')
        ];
        this.jokes.forEach(audio => audio.preload = 'auto');
        this.unplayedJokes = [...this.jokes];
        
        // Listen for first interaction to unlock audio
        const unlock = () => {
            if (!this.initialized) {
                this.initialized = true;
                
                // Unlock Web Audio Context
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }
                
                // Start gapless ambient loop
                const startAmbient = () => {
                    if (this.ambientBuffer && !this.ambientSource) {
                        this.ambientSource = this.audioCtx.createBufferSource();
                        this.ambientSource.buffer = this.ambientBuffer;
                        this.ambientSource.loop = true;
                        this.ambientSource.connect(this.ambientGain);
                        this.ambientSource.start();
                    }
                };
                
                // If buffer is already loaded, start it. Otherwise try again in 500ms
                if (this.ambientBuffer) {
                    startAmbient();
                } else {
                    setTimeout(startAmbient, 500);
                }
                
                this.fadeAmbient(this.ambientTargetVolume);
                this.scheduleNextJoke();
            }
            document.removeEventListener('click', unlock);
        };
        document.addEventListener('click', unlock);
    }
    
    scheduleNextJoke() {
        if (this.jokeTimer) clearTimeout(this.jokeTimer);
        
        // Random interval between 20 and 45 seconds
        const nextDelay = 20000 + Math.random() * 25000;
        this.jokeTimer = setTimeout(() => {
            this.playJoke();
            this.scheduleNextJoke();
        }, nextDelay);
    }
    
    playJoke() {
        if (!this.initialized) return;
        
        // Don't interrupt important state voice lines!
        if (this.currentVoice && !this.jokes.includes(this.currentVoice)) return;
        
        // Only tell jokes if we are just chilling out
        if (window.shipGame && window.shipGame.state !== 'IDLE' && window.shipGame.state !== 'SAILING') return;
        
        if (this.currentVoice) {
            this.currentVoice.pause();
            this.currentVoice.currentTime = 0;
            this.currentVoice.onended = null;
        }
        
        // Refill shuffle bag if empty
        if (this.unplayedJokes.length === 0) {
            this.unplayedJokes = [...this.jokes];
        }
        
        // Pick a random joke from the unplayed bag
        let jokeIndex = Math.floor(Math.random() * this.unplayedJokes.length);
        
        // If we just refilled the bag, ensure the first pick isn't the same as the last played joke!
        while (this.unplayedJokes.length === this.jokes.length && 
               this.unplayedJokes[jokeIndex] === this.lastPlayedJoke && 
               this.jokes.length > 1) {
            jokeIndex = Math.floor(Math.random() * this.unplayedJokes.length);
        }
        
        const joke = this.unplayedJokes.splice(jokeIndex, 1)[0];
        this.lastPlayedJoke = joke;
        
        this.currentVoice = joke;
        this.currentVoice.volume = 1.0;
        
        this.fadeAmbient(this.voiceDuckingVolume);
        
        this.currentVoice.play().catch(e => console.log('Joke play error:', e));
        
        this.currentVoice.onended = () => {
            this.currentVoice = null;
            this.fadeAmbient(this.ambientTargetVolume);
        };
    }
    
    fadeAmbient(targetVol) {
        if (!this.initialized || !this.ambientGain) return;
        
        // Cancel any currently scheduled fades
        this.ambientGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
        // Linearly ramp to the new volume over 0.5 seconds
        // By setting the value explicitly before ramping, we prevent sudden jumps
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.audioCtx.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(targetVol, this.audioCtx.currentTime + 0.5);
    }
    
    playVoice(engineState, isExplicitClick = false) {
        // Only play Idle sound if explicitly clicked by the user
        if (engineState === 'IDLE' && !isExplicitClick) return;
        
        // We only trigger voice lines if the user has actually interacted to unlock audio
        // The first click (e.g. clicking Idle) will both unlock AND play the voice line!
        if (!this.initialized) {
            // Give the unlocker 10ms to fire first
            setTimeout(() => {
                if (this.initialized) this.playVoice(engineState, isExplicitClick);
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
