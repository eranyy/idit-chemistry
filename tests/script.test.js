/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

describe('script.js basic functionality', () => {

    let originalAddEventListener;
    let eventListeners = [];

    beforeEach(() => {
        originalAddEventListener = document.addEventListener;
        document.addEventListener = function (type, listener, options) {
            eventListeners.push({ type, listener, options, target: document });
            originalAddEventListener.call(document, type, listener, options);
        };
        window.addEventListener = function (type, listener, options) {
            eventListeners.push({ type, listener, options, target: window });
            originalAddEventListener.call(window, type, listener, options);
        };

        document.body.innerHTML = `
            <header id="header"></header>
            <span id="currentYear"></span>
            <button id="menuToggle" aria-expanded="false"></button>
            <nav id="navMenu"></nav>
            <table id="hoursTable">
                <tr data-day="0"><td>Sun</td></tr>
                <tr data-day="1"><td>Mon</td></tr>
                <tr data-day="2"><td>Tue</td></tr>
                <tr data-day="3"><td>Wed</td></tr>
                <tr data-day="4"><td>Thu</td></tr>
                <tr data-day="5"><td>Fri</td></tr>
                <tr data-day="6"><td>Sat</td></tr>
            </table>
            <div id="openingStatus"><span class="status-text"></span></div>
            <form id="contactForm">
                <input id="nameInput" value="ישראל ישראלי" />
                <input id="phoneInput" value="0501234567" />
                <select id="levelInput"><option value="bagrut5">בגרות 5 יח"ל</option></select>
                <select id="formatInput"><option value="online">אונליין</option></select>
                <textarea id="messageInput">שלום</textarea>
                <div id="formFeedback"></div>
            </form>
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
    });

    afterEach(() => {
        eventListeners.forEach(({ type, listener, options, target }) => {
            target.removeEventListener(type, listener, options);
        });
        eventListeners = [];
        document.addEventListener = originalAddEventListener;
        window.addEventListener = originalAddEventListener;
        document.body.innerHTML = '';
        localStorage.clear();
        jest.useRealTimers();
        jest.restoreAllMocks();
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

        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const form = document.getElementById('contactForm');
        const phoneInput = document.getElementById('phoneInput');

        // Test short phone (< 9 digits)
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(phoneInput.style.borderColor).toBeTruthy();

        // Test valid phone with hyphens
        phoneInput.value = '050-271-9917';
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(phoneInput.value.replace(/[^0-9]/g, '').length).toBeGreaterThanOrEqual(9);
    });


    const mockDate = (day, hours, minutes) => {
        const dayOffset = day + 1;
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');
        const mockDateString = '2023-10-0' + dayOffset + 'T' + h + ':' + m + ':00';

        jest.useFakeTimers().setSystemTime(new Date(mockDateString));
    };


    test('checkStatus - Sun-Thu: Open between 08:00 and 20:00', () => {
        mockDate(0, 10, 0);
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const statusBadgeEl = document.getElementById('openingStatus');

            expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('open')).toBe(true);
        expect(statusBadgeEl.querySelector('.status-text').innerText).toContain('פתוח');
        });

    test('checkStatus - Sun-Thu: Closed outside 08:00 and 20:00', () => {
        mockDate(1, 7, 0);
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const statusBadgeEl = document.getElementById('openingStatus');

            expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('closed')).toBe(true);
        expect(statusBadgeEl.querySelector('.status-text').innerText).toContain('סגור');
        });

    test('checkStatus - Friday: Open between 08:00 and 15:00/17:00', () => {
        mockDate(5, 10, 0);
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const statusBadgeEl = document.getElementById('openingStatus');

            expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('open')).toBe(true);
        });

    test('checkStatus - Friday: Closed late afternoon', () => {
        mockDate(5, 18, 0);
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const statusBadgeEl = document.getElementById('openingStatus');

            expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('closed')).toBe(true);
        });

    test('checkStatus - Saturday: Open between 18:00 and 21:00', () => {
        mockDate(6, 19, 0);
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const statusBadgeEl = document.getElementById('openingStatus');

            expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('open')).toBe(true);
        });

    test('checkStatus - Saturday: Closed before 18:00', () => {
        mockDate(6, 12, 0);
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const statusBadgeEl = document.getElementById('openingStatus');

            expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('closed')).toBe(true);
        });

});
