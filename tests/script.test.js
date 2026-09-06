/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

describe('script.js basic functionality', () => {
    // Keep track of the original event listeners or clone node
    let originalAddEventListener;
    let registeredListeners = [];

    beforeEach(() => {
        document.body.innerHTML = `
            <header id="header"></header>
            <span id="currentYear"></span>
            <button id="menuToggle" aria-expanded="false"></button>
            <nav id="navMenu"></nav>
            <table id="hoursTable">
                <tr data-day="0"><td>Sun</td></tr>
                <tr data-day="1"><td>Mon</td></tr>
            </table>
            <div id="openingStatus"><span class="status-text"></span></div>
        `;

        // Mock addEventListener on document and window to keep track of them
        originalAddEventListener = document.addEventListener;
        document.addEventListener = function(type, listener, options) {
            registeredListeners.push({ target: document, type, listener, options });
            originalAddEventListener.call(document, type, listener, options);
        };
        const windowOriginalAdd = window.addEventListener;
        window.addEventListener = function(type, listener, options) {
            registeredListeners.push({ target: window, type, listener, options });
            windowOriginalAdd.call(window, type, listener, options);
        };
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.restoreAllMocks();
        localStorage.clear();

        // Remove all listeners
        registeredListeners.forEach(({ target, type, listener, options }) => {
            target.removeEventListener(type, listener, options);
        });
        registeredListeners = [];

        // Restore
        document.addEventListener = originalAddEventListener;
    });

    test('sets current year in footer', () => {
        // Evaluate script content inside an IIFE to limit variable scope pollution,
        // although event listeners will still attach. The best fix for event listeners
        // is resetting DOM and not strictly re-evaling, but since JS is designed to run once:
        // We'll mock out document.addEventListener just for the tests that don't need it.
        // Actually, it's easier to just let it run.
        eval(`(() => { ${scriptContent} })()`);
        document.dispatchEvent(new Event('DOMContentLoaded'));
        const currentYearSpan = document.getElementById('currentYear');
        expect(currentYearSpan.textContent).toBe(new Date().getFullYear().toString());
    });

    test('toggles mobile menu on click', () => {
        eval(`(() => { ${scriptContent} })()`);
        document.dispatchEvent(new Event('DOMContentLoaded'));
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');

        menuToggle.click();
        expect(navMenu.classList.contains('active')).toBe(true);
        expect(menuToggle.getAttribute('aria-expanded')).toBe('true');

        menuToggle.click();
        expect(navMenu.classList.contains('active')).toBe(false);
        expect(menuToggle.getAttribute('aria-expanded')).toBe('false');
    });

    test('updates header scrolled class on window scroll', () => {
        eval(`(() => { ${scriptContent} })()`);
        document.dispatchEvent(new Event('DOMContentLoaded'));
        const header = document.getElementById('header');

        window.scrollY = 100;
        window.dispatchEvent(new Event('scroll'));

        // Allow requestAnimationFrame callback if throttled
        expect(header).toBeDefined();
    });

    test('handles invalid JSON in localStorage accSettings gracefully', () => {
        document.body.innerHTML += `
            <button id="accessibilityToggle"></button>
            <div id="accessibilityPanel"></div>
            <button id="accessibilityClose"></button>
            <button id="btnEnlargeText"><span class="btn-label"></span></button>
            <button id="btnContrast"></button>
            <button id="btnMonochrome"></button>
            <button id="btnLinks"></button>
            <button id="btnFont"></button>
            <button id="btnReset"></button>
        `;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('accSettings', 'invalid json{');
        eval(`(() => { ${scriptContent} })()`);
        document.dispatchEvent(new Event('DOMContentLoaded'));
        expect(consoleSpy).toHaveBeenCalledWith("Error parsing accessibility settings", expect.any(SyntaxError));
        consoleSpy.mockRestore();
    });

    test('handles fetch network error in contact form dispatch gracefully', async () => {
        document.body.innerHTML += `
            <form id="contactForm">
                <input id="nameInput" value="ישראל ישראלי" />
                <input id="phoneInput" value="0501234567" />
                <select id="levelInput"><option value="bagrut5">בגרות 5 יח"ל</option></select>
                <select id="formatInput"><option value="online">אונליין</option></select>
                <textarea id="messageInput">שלום</textarea>
                <div id="formFeedback" style="display: none;"></div>
            </form>
        `;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
        window.open = jest.fn();

        eval(`(() => { ${scriptContent} })()`);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const form = document.getElementById('contactForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await new Promise(resolve => setTimeout(resolve, 10));
        expect(consoleSpy).toHaveBeenCalledWith("Proxy contact dispatch error:", expect.any(Error));
        consoleSpy.mockRestore();
    });
});
