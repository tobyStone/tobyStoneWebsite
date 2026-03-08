import { state } from './state.js';
import { timeoutManager } from './utils.js';

export function startTestimonials(delayOffset = 0) {
    state.step = 4;
    document.body.classList.add('v4-mode');

    const overlayV4 = document.getElementById('overlay-v4');
    if (overlayV4) {
        overlayV4.classList.remove('hidden');
        overlayV4.style.pointerEvents = 'none';
    }

    const contactLinks = document.getElementById('contact-links');
    if (contactLinks) contactLinks.style.zIndex = '30';

    const contactHeader = document.getElementById('contact-header');
    if (contactHeader) {
        contactHeader.classList.remove('hidden');
        contactHeader.style.opacity = '1';
    }

    const quotes = [
        'is friendly and approachable',
        'listened to our needs',
        'translated them into a website',
        'that looks great',
        'works brilliantly too,"',
        'Karen Simpson, Tutors Alliance Scotland.',
        'Contact him here'
    ];

    const quoteEl = document.getElementById('testimonial-quote');
    let currentIndex = 0;

    const showNextQuote = () => {
        if (!quoteEl) return;
        const text = quotes[currentIndex];

        if (text === 'Contact him here') {
            currentIndex = (currentIndex + 1) % quotes.length;
            runContactTransition(quoteEl, quotes, showNextQuote);
            return;
        }

        quoteEl.textContent = text;
        quoteEl.style.opacity = '1';

        const duration = 2500 / 1.2 / 1.2;

        timeoutManager.setTimeout(() => {
            quoteEl.style.opacity = '0';

            timeoutManager.setTimeout(() => {
                currentIndex = (currentIndex + 1) % quotes.length;
                showNextQuote();
            }, 1000 / 1.2 / 1.2);

        }, duration);
    };

    timeoutManager.setTimeout(showNextQuote, 1000);
}

export function runContactTransition(quoteEl, quotes, loopCallback) {
    quoteEl.innerHTML = '<img src="/images/contact.png" id="trans-contact" style="width: 150px; height: auto; vertical-align: middle;"> <span id="trans-him-here" style="vertical-align: middle;">him here</span>';
    quoteEl.style.opacity = '1';

    const arrow = document.getElementById('testimonial-arrow');
    const contactHeader = document.getElementById('contact-header');

    if (arrow) {
        arrow.style.opacity = '0';
        arrow.style.display = 'block';
    }

    const qRect = quoteEl.getBoundingClientRect();
    const hRect = contactHeader ? contactHeader.getBoundingClientRect() : qRect;

    const midX = (qRect.left + qRect.width / 2 + hRect.left + hRect.width / 2) / 2;
    const midY = (qRect.top + qRect.height / 2 + hRect.top + hRect.height / 2) / 2;

    if (arrow) {
        arrow.style.left = midX + 'px';
        arrow.style.top = midY + 'px';
        arrow.style.transform = 'translate(-50%, -50%) rotate(83deg)';
        arrow.style.transition = 'opacity 0.5s';
        arrow.style.opacity = '1';
    }

    const readTime = 2500 / 1.2 / 1.2;

    timeoutManager.setTimeout(() => {
        const transContact = document.getElementById('trans-contact');
        const transHimHere = document.getElementById('trans-him-here');

        if (!transContact || !destRect) return;

        const cRect = transContact.getBoundingClientRect();
        const destRect = contactHeader ? contactHeader.getBoundingClientRect() : cRect;

        const deltaX = destRect.left - cRect.left;
        const deltaY = destRect.top - cRect.top;

        transContact.style.display = 'inline-block';
        transContact.style.position = 'relative';
        transContact.style.transition = 'transform 1s ease-in-out, width 1s, height 1s';

        const scaleX = destRect.width / cRect.width;
        const scaleY = destRect.height / cRect.height;
        transContact.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
        transContact.style.transformOrigin = 'top left';

        if (transHimHere) {
            transHimHere.style.transition = 'opacity 1s ease-in-out';
            transHimHere.style.opacity = '0';
        }

        if (arrow) {
            arrow.style.transition = 'opacity 1s ease-in-out';
            arrow.style.opacity = '0';
        }

        timeoutManager.setTimeout(() => {
            if (contactHeader) contactHeader.style.opacity = '1';
            quoteEl.style.opacity = '0';

            timeoutManager.setTimeout(() => {
                quoteEl.textContent = '';
                loopCallback();
            }, 1000);

        }, 1000);

    }, readTime);
}
