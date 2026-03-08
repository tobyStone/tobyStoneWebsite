export const state = {
    step: 1,
    isMuted: true
};

export const videos = {
    v1: '/videos/With_background_noise_202602021518.mp4',
    v2: '/videos/_the_stepbystep_1080p_202602011636.mp4',
    v3: '/videos/Instruction_open_and_202602041218_mbxwm.mp4'
};

export const V1_DURATION = 5713;

export const LayoutConfig = {
    MOBILE_BREAKPOINT: 768,

    get current() {
        const isPortrait = window.innerHeight > window.innerWidth;
        if (!isPortrait && window.innerHeight <= 550) {
            return 'mobileLandscape';
        }
        return (window.innerWidth <= this.MOBILE_BREAKPOINT || isPortrait) ? 'mobile' : 'desktop';
    },

    mobileLandscape: {
        videoScaleMultiplier: 1.0,
        staticVideoScale: 1.0,
        v3VideoScale: 1.0,
        contactLinksLeft: '84%',
        wordRing: [
            { text: 'From', img: 'From.png', time: 500, pos: { top: '19.7%', left: '32.5%' } },
            { text: 'the', img: 'The.png', time: 975, pos: { top: '15.5%', left: '56.1%' } },
            { text: 'seed', img: 'Seed.png', time: 1450, pos: { top: '27.5%', left: '76.8%' } },
            { text: 'of', img: 'Of.png', time: 1925, pos: { top: '50%', left: '85%' } },
            { text: 'a', img: 'A.png', time: 2400, pos: { top: '72.5%', left: '76.8%' } },
            { text: 'bean', img: 'Bean.png', time: 2875, pos: { top: '84.5%', left: '56.1%' } },
            { text: 'of', img: 'Of.png', time: 3350, pos: { top: '80.3%', left: '32.5%' } },
            { text: 'an', img: 'An.png', time: 3825, pos: { top: '62%', left: '17.1%' } },
            { text: 'idea', img: 'Idea.png', time: 4300, pos: { top: '59%', left: '50%' } }
        ]
    },

    mobile: {
        videoScaleMultiplier: 2.5,
        staticVideoScale: 1.5,
        v3VideoScale: 2.204,
        contactLinksLeft: '50%',
        wordRing: [
            { text: 'From', img: 'From.png', time: 500, pos: { top: '29%', left: '30%' } },
            { text: 'the', img: 'The.png', time: 1260, pos: { top: '29%', left: '70%' } },
            { text: 'seed', img: 'Seed.png', time: 2020, pos: { top: '45%', left: '85%' } },
            { text: 'of', img: 'Of.png', time: 2780, pos: { top: '70%', left: '70%' } },
            { text: 'an', img: 'An.png', time: 3540, pos: { top: '70%', left: '30%' } },
            { text: 'idea', img: 'Idea.png', time: 4300, pos: { top: '56%', left: '50%' } }
        ]
    },

    desktop: {
        videoScaleMultiplier: 1.0,
        contactLinksLeft: '84%',
        wordRing: [
            { text: 'From', img: 'From.png', time: 500, pos: { top: '19.7%', left: '32.5%' } },
            { text: 'the', img: 'The.png', time: 975, pos: { top: '15.5%', left: '56.1%' } },
            { text: 'seed', img: 'Seed.png', time: 1450, pos: { top: '27.5%', left: '76.8%' } },
            { text: 'of', img: 'Of.png', time: 1925, pos: { top: '50%', left: '85%' } },
            { text: 'a', img: 'A.png', time: 2400, pos: { top: '72.5%', left: '76.8%' } },
            { text: 'bean', img: 'Bean.png', time: 2875, pos: { top: '84.5%', left: '56.1%' } },
            { text: 'of', img: 'Of.png', time: 3350, pos: { top: '80.3%', left: '32.5%' } },
            { text: 'an', img: 'An.png', time: 3825, pos: { top: '62%', left: '17.1%' } },
            { text: 'idea', img: 'Idea.png', time: 4300, pos: { top: '59%', left: '50%' } }
        ]
    }
};
