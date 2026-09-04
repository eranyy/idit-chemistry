/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

describe('script.js functionality', () => {
    let documentListeners = [];
    let windowListeners = [];
    let originalDocAddEventListener;
    let originalWinAddEventListener;

    beforeEach(() => {
        documentListeners = [];
        windowListeners = [];

        originalDocAddEventListener = document.addEventListener;
        document.addEventListener = function(type, listener, options) {
            documentListeners.push({ type, listener, options });
            originalDocAddEventListener.call(document, type, listener, options);
        };

        originalWinAddEventListener = window.addEventListener;
        window.addEventListener = function(type, listener, options) {
            windowListeners.push({ type, listener, options });
            originalWinAddEventListener.call(window, type, listener, options);
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
            <form id="contactForm">
                <input id="nameInput" value="Test Name" />
                <input id="phoneInput" value="0501234567" />
                <select id="levelInput"><option value="middle">Middle</option></select>
                <select id="formatInput"><option value="online">Online</option></select>
                <textarea id="messageInput">Test message</textarea>
                <button type="submit">Submit</button>
            </form>
            <div id="formFeedback" style="display: none;"></div>

            <!-- Accessibility panel elements -->
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

        window.open = jest.fn();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.restoreAllMocks();
        localStorage.clear();

        document.addEventListener = originalDocAddEventListener;
        documentListeners.forEach(({ type, listener, options }) => {
            document.removeEventListener(type, listener, options);
        });

        window.addEventListener = originalWinAddEventListener;
        windowListeners.forEach(({ type, listener, options }) => {
            window.removeEventListener(type, listener, options);
        });
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

        expect(header).toBeDefined();
    });

    test('handles invalid JSON in localStorage accSettings gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('accSettings', 'invalid json{');

        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        expect(consoleSpy).toHaveBeenCalledWith("Error parsing accessibility settings", expect.any(SyntaxError));
    });

    test('logs error to console when fetch fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const testError = new Error('Network error');

        global.fetch = jest.fn(() => Promise.reject(testError));

        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const form = document.getElementById('contactForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(consoleSpy).toHaveBeenCalledWith("Admin contact dispatch error:", testError);
        expect(consoleSpy).toHaveBeenCalledWith("Idit contact dispatch error:", testError);
    });
});
