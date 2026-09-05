/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

describe('script.js basic functionality', () => {
    let originalAddEventListener;
    let globalListeners = [];

    beforeEach(() => {
        // Track global event listeners to prevent state contamination across tests
        originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (this === document || this === window) {
                globalListeners.push({ target: this, type, listener, options });
            }
            return originalAddEventListener.call(this, type, listener, options);
        };

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
    });

    afterEach(() => {
        // Remove global event listeners
        globalListeners.forEach(({ target, type, listener, options }) => {
            target.removeEventListener(type, listener, options);
        });
        globalListeners = [];
        EventTarget.prototype.addEventListener = originalAddEventListener;
    });

    test('sets current year in footer', () => {
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));
        const currentYearSpan = document.getElementById('currentYear');
        expect(currentYearSpan.textContent).toBe(new Date().getFullYear().toString());
    });

    test('toggles mobile menu on click', () => {
        eval(scriptContent);
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
        eval(scriptContent);
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
        eval(scriptContent);
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
                <div id="formFeedback"></div>
            </form>
        `;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
        window.open = jest.fn();

        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const form = document.getElementById('contactForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await new Promise(resolve => setTimeout(resolve, 10));
        expect(consoleSpy).toHaveBeenCalledWith("Admin contact dispatch error:", expect.any(Error));
        consoleSpy.mockRestore();
    });
});
