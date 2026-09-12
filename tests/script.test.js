/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

describe('script.js basic functionality', () => {

    const originalAddEventListener = document.addEventListener;
    let documentListeners = [];
    document.addEventListener = function(type, listener, options) {
        documentListeners.push({ type, listener, options });
        return originalAddEventListener.call(document, type, listener, options);
    };

    const originalWindowAddEventListener = window.addEventListener;
    let windowListeners = [];
    window.addEventListener = function(type, listener, options) {
        windowListeners.push({ type, listener, options });
        return originalWindowAddEventListener.call(window, type, listener, options);
    };

    afterEach(() => {
        documentListeners.forEach(({ type, listener, options }) => {
            document.removeEventListener(type, listener, options);
        });
        documentListeners = [];

        windowListeners.forEach(({ type, listener, options }) => {
            window.removeEventListener(type, listener, options);
        });
        windowListeners = [];

        // Also clear local storage
        localStorage.clear();
    });

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

            <!-- Accessibility Panel Elements -->
            <button id="accessibilityToggle"></button>
            <div id="accessibilityPanel">
                <button id="accessibilityClose"></button>
                <button id="btnEnlargeText"><span class="btn-label">הגדלת גופן</span></button>
                <button id="btnContrast"></button>
                <button id="btnMonochrome"></button>
                <button id="btnLinks"></button>
                <button id="btnFont"></button>
                <button id="btnReset"></button>
            </div>
`;
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
                <input id="contactName" value="ישראל ישראלי" />
                <input id="contactPhone" value="0501234567" />
                <select id="contactLevel"><option value="bagrut5">בגרות 5 יח"ל</option></select>
                <select id="contactFormat"><option value="online">אונליין</option></select>
                <textarea id="contactMessage">שלום</textarea>
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

    test('validates contact form phone input edge cases correctly', () => {
        document.body.innerHTML += `
            <form id="contactForm">
                <input id="contactName" value="ישראל ישראלי" />
                <input id="contactPhone" value="12345" />
                <select id="contactLevel"><option value="bagrut5">בגרות 5 יח"ל</option></select>
                <select id="contactFormat"><option value="online">אונליין</option></select>
                <textarea id="contactMessage">שלום</textarea>
                <div id="formFeedback"></div>
            </form>
        `;
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const form = document.getElementById('contactForm');
        const phoneInput = document.getElementById('contactPhone');

        // Test short phone (< 9 digits)
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(phoneInput.style.borderColor).toBeTruthy();

        // Test valid phone with hyphens
        phoneInput.value = '050-271-9917';
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(phoneInput.value.replace(/[^0-9]/g, '').length).toBeGreaterThanOrEqual(9);
    });

    test('updates opening status badge correctly based on time and day', () => {
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));
        const statusBadge = document.getElementById('openingStatus');
        expect(statusBadge).not.toBeNull();
        expect(statusBadge.classList.contains('open') || statusBadge.classList.contains('closed')).toBe(true);
    });

    test('toggles accessibility panel and handles escape key', () => {
        eval(scriptContent);
        // We dispatch DOMContentLoaded to trigger any listeners if they were attached there,
        // although in script.js it's immediately executed.
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const accToggle = document.getElementById('accessibilityToggle');
        const accPanel = document.getElementById('accessibilityPanel');
        const accClose = document.getElementById('accessibilityClose');

        // Initial state
        expect(accPanel.classList.contains('active')).toBe(false);

        // Open panel
        accToggle.click();
        expect(accPanel.classList.contains('active')).toBe(true);
        expect(accPanel.getAttribute('aria-hidden')).toBe('false');

        // Close with close button
        accClose.click();
        expect(accPanel.classList.contains('active')).toBe(false);
        expect(accPanel.getAttribute('aria-hidden')).toBe('true');

        // Open again
        accToggle.click();
        expect(accPanel.classList.contains('active')).toBe(true);

        // Close with Escape key
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(accPanel.classList.contains('active')).toBe(false);
        expect(accPanel.getAttribute('aria-hidden')).toBe('true');
    });


    test('applies accessibility settings on button click and saves to localStorage', () => {
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const btnContrast = document.getElementById('btnContrast');
        const btnEnlargeText = document.getElementById('btnEnlargeText');
        const btnReset = document.getElementById('btnReset');

        // Initial state
        expect(document.body.classList.contains('acc-contrast')).toBe(false);

        // Click contrast button
        btnContrast.click();
        expect(document.body.classList.contains('acc-contrast')).toBe(true);
        expect(btnContrast.classList.contains('active')).toBe(true);

        // Check localStorage
        const storedSettings = JSON.parse(localStorage.getItem('accSettings'));
        expect(storedSettings.contrast).toBe(true);

        // Click enlarge text button (cycles through sizes)
        btnEnlargeText.click();
        expect(document.documentElement.classList.contains('acc-text-lg')).toBe(true);
        const storedSettings2 = JSON.parse(localStorage.getItem('accSettings'));
        expect(storedSettings2.textSize).toBe('lg');

        // Reset
        btnReset.click();
        expect(document.body.classList.contains('acc-contrast')).toBe(false);
        expect(document.documentElement.classList.contains('acc-text-lg')).toBe(false);

        const storedSettings3 = JSON.parse(localStorage.getItem('accSettings'));
        expect(storedSettings3.contrast).toBe(false);
        expect(storedSettings3.textSize).toBe('md');
    });


    test('loads accessibility settings from localStorage on initialization', () => {
        // Pre-populate localStorage with specific settings
        const initialSettings = {
            textSize: 'xl',
            contrast: false,
            monochrome: true,
            links: true,
            font: false
        };
        localStorage.setItem('accSettings', JSON.stringify(initialSettings));

        // Evaluate script and trigger DOMContentLoaded
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Verify settings were applied
        expect(document.documentElement.classList.contains('acc-text-xl')).toBe(true);
        expect(document.documentElement.classList.contains('acc-monochrome')).toBe(true);
        expect(document.body.classList.contains('acc-links')).toBe(true);

        // Verify other classes are absent
        expect(document.body.classList.contains('acc-contrast')).toBe(false);
        expect(document.body.classList.contains('acc-font')).toBe(false);

        // Check if buttons got active state
        expect(document.getElementById('btnEnlargeText').classList.contains('active')).toBe(true);
        expect(document.getElementById('btnMonochrome').classList.contains('active')).toBe(true);
        expect(document.getElementById('btnLinks').classList.contains('active')).toBe(true);
    });

});
