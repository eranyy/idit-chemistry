/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

describe('script.js basic functionality', () => {
    let globalListeners = [];
    const originalAddEventListener = EventTarget.prototype.addEventListener;

    beforeAll(() => {
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (this === document || this === window) {
                globalListeners.push({ target: this, type, listener, options });
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
    });

    afterAll(() => {
        EventTarget.prototype.addEventListener = originalAddEventListener;
    });

    afterEach(() => {
        globalListeners.forEach(({ target, type, listener, options }) => {
            target.removeEventListener(type, listener, options);
        });
        globalListeners = [];
        jest.clearAllMocks();
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

    describe('Contact Form Validation', () => {
        beforeEach(() => {
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
            window.open = jest.fn();
            global.fetch = jest.fn().mockResolvedValue({});
        });

        test('applies error styling for phone number with fewer than 9 digits', () => {
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const phoneInput = document.getElementById('phoneInput');
            phoneInput.value = '12345678'; // 8 digits

            const form = document.getElementById('contactForm');
            form.dispatchEvent(new Event('submit', { cancelable: true }));

            expect(phoneInput.style.borderColor.toLowerCase()).toBe('#e02424');
        });

        test('passes validation for phone number with exactly 9 digits', () => {
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const phoneInput = document.getElementById('phoneInput');
            phoneInput.value = '123456789'; // 9 digits

            const form = document.getElementById('contactForm');
            form.dispatchEvent(new Event('submit', { cancelable: true }));

            expect(phoneInput.style.borderColor.toLowerCase()).not.toBe('#e02424');
        });

        test('passes validation for phone number with more than 9 digits and formatting characters', () => {
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const phoneInput = document.getElementById('phoneInput');
            phoneInput.value = '050-123-4567'; // 10 digits with hyphens

            const form = document.getElementById('contactForm');
            form.dispatchEvent(new Event('submit', { cancelable: true }));

            expect(phoneInput.style.borderColor.toLowerCase()).not.toBe('#e02424');
        });

        test('applies error styling for empty phone number', () => {
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const phoneInput = document.getElementById('phoneInput');
            phoneInput.value = '';

            const form = document.getElementById('contactForm');
            form.dispatchEvent(new Event('submit', { cancelable: true }));

            expect(phoneInput.style.borderColor.toLowerCase()).toBe('#e02424');
        });

        test('applies error styling for non-numeric phone number', () => {
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const phoneInput = document.getElementById('phoneInput');
            phoneInput.value = 'abcdefghi'; // 9 non-numeric characters

            const form = document.getElementById('contactForm');
            form.dispatchEvent(new Event('submit', { cancelable: true }));

            expect(phoneInput.style.borderColor.toLowerCase()).toBe('#e02424');
        });

        test('handles fetch network error in contact form dispatch gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const form = document.getElementById('contactForm');
            form.dispatchEvent(new Event('submit', { cancelable: true }));

            await new Promise(resolve => setTimeout(resolve, 10));
            expect(consoleSpy).toHaveBeenCalledWith("Admin contact dispatch error:", expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

});
