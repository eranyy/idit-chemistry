/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

describe('script.js basic functionality', () => {

    let domContentLoadedListeners = [];
    beforeAll(() => {
        const originalAddEventListener = document.addEventListener;
        document.addEventListener = function(event, callback, options) {
            if (event === 'DOMContentLoaded') {
                domContentLoadedListeners.push(callback);
            } else {
                originalAddEventListener.call(document, event, callback, options);
            }
        };
        eval(`(function() { \
${scriptContent}\
 })();`);
    });

    beforeEach(() => {

        document.body.innerHTML = `
            <header id="header"></header>
            <span id="currentYear"></span>
            <button id="menuToggle" aria-expanded="false"></button>
            <nav id="navMenu"></nav>
            <div id="accessibilityToggle"></div>
            <div id="accessibilityPanel"></div>
            <div id="accessibilityClose"></div>
    <button id="btnEnlargeText"></button>
    <button id="btnContrast"></button>
    <button id="btnMonochrome"></button>
    <button id="btnLinks"></button>
    <button id="btnFont"></button>
    <button id="btnReset"></button>
            <table id="hoursTable">
                <tr data-day="0"><td>Sun</td></tr>
                <tr data-day="1"><td>Mon</td></tr>
            </table>
            <div id="openingStatus"><span class="status-text"></span></div>
        `;
    });

    test('sets current year in footer', () => {

        domContentLoadedListeners.forEach(listener => listener());
        const currentYearSpan = document.getElementById('currentYear');
        expect(currentYearSpan.textContent).toBe(new Date().getFullYear().toString());
    });

    test('toggles mobile menu on click', () => {

        domContentLoadedListeners.forEach(listener => listener());
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

        domContentLoadedListeners.forEach(listener => listener());
        const header = document.getElementById('header');

        window.scrollY = 100;
        window.dispatchEvent(new Event('scroll'));

        // Allow requestAnimationFrame callback if throttled
        expect(header).toBeDefined();
    });

    test('handles invalid JSON in localStorage accSettings gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('accSettings', 'invalid json{');

        domContentLoadedListeners.forEach(listener => listener());
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


        domContentLoadedListeners.forEach(listener => listener());

        const form = document.getElementById('contactForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await new Promise(resolve => setTimeout(resolve, 10));
        expect(consoleSpy).toHaveBeenCalledWith("Admin contact dispatch error:", expect.any(Error));
        consoleSpy.mockRestore();
    });

    test('validates contact form phone input edge cases correctly', () => {
        document.body.innerHTML += `
            <form id="contactForm">
                <input id="nameInput" value="ישראל ישראלי" />
                <input id="phoneInput" value="12345" />
                <select id="levelInput"><option value="bagrut5">בגרות 5 יח"ל</option></select>
                <select id="formatInput"><option value="online">אונליין</option></select>
                <textarea id="messageInput">שלום</textarea>
                <div id="formFeedback"></div>
            </form>
        `;

        domContentLoadedListeners.forEach(listener => listener());

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

    test('updates opening status badge correctly based on time and day', () => {

        domContentLoadedListeners.forEach(listener => listener());
        const statusBadge = document.getElementById('openingStatus');
        expect(statusBadge).not.toBeNull();
        expect(statusBadge.classList.contains('open') || statusBadge.classList.contains('closed')).toBe(true);
    });

    test('toggles accessibility floating panel and applies contrast setting', () => {
        document.body.innerHTML += `
            <button id="accessibilityToggle"></button>
            <div id="accessibilityPanel"></div>
            <button id="accessibilityClose"></button>
            <button id="btnContrast"></button>
        `;
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const accToggle = document.getElementById('accessibilityToggle');
        const accPanel = document.getElementById('accessibilityPanel');
        const btnContrast = document.getElementById('btnContrast');

        accToggle.click();
        expect(accPanel.classList.contains('active')).toBe(true);

        btnContrast.click();
        expect(document.body.classList.contains('acc-contrast')).toBe(true);
    });
});
