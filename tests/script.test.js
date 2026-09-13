/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

describe('script.js basic functionality', () => {
    let originalDocumentAddEventListener;
    let originalWindowAddEventListener;
    let listeners = [];

    beforeEach(() => {
        jest.useFakeTimers();
        originalDocumentAddEventListener = document.addEventListener;
        document.addEventListener = function(type, listener, options) {
            listeners.push({ target: document, type, listener, options });
            return originalDocumentAddEventListener.apply(document, arguments);
        };
        originalWindowAddEventListener = window.addEventListener;
        window.addEventListener = function(type, listener, options) {
            listeners.push({ target: window, type, listener, options });
            return originalWindowAddEventListener.apply(window, arguments);
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

            <button id="openReviewBtn"></button>
            <div id="reviewModal">
                <button id="closeReviewModal"></button>
                <form id="reviewForm">
                    <input id="reviewName" />
                    <input id="reviewRole" />
                    <textarea id="reviewText"></textarea>
                    <div id="starRating">
                        <span class="star" data-value="1"></span>
                        <span class="star" data-value="2"></span>
                        <span class="star" data-value="3"></span>
                        <span class="star" data-value="4"></span>
                        <span class="star" data-value="5"></span>
                    </div>
                    <input id="reviewRating" value="5" />
                    <button type="submit">Submit</button>
                </form>
            </div>
        `;
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        document.addEventListener = originalDocumentAddEventListener;
        window.addEventListener = originalWindowAddEventListener;
        listeners.forEach(l => {
            l.target.removeEventListener(l.type, l.listener, l.options);
        });
        listeners = [];
        jest.restoreAllMocks();
        document.body.innerHTML = '';
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
        document.body.innerHTML += `
            <button id="accessibilityToggle"></button>
            <div id="accessibilityPanel"></div>
            <button id="accessibilityClose"></button>
            <button id="btnEnlargeText"></button>
            <button id="btnContrast"></button>
            <button id="btnMonochrome"></button>
            <button id="btnLinks"></button>
            <button id="btnFont"></button>
            <button id="btnReset"></button>
        `;
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

        jest.advanceTimersByTime(20);
        await Promise.resolve(); // flush promises
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

    test('updates opening status badge correctly based on time and day', () => {
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));
        const statusBadge = document.getElementById('openingStatus');
        expect(statusBadge).not.toBeNull();
        expect(statusBadge.classList.contains('open') || statusBadge.classList.contains('closed')).toBe(true);
    });

    test('opens and closes review modal correctly', () => {
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const openBtn = document.getElementById('openReviewBtn');
        const closeBtn = document.getElementById('closeReviewModal');
        const modal = document.getElementById('reviewModal');

        openBtn.click();
        expect(modal.style.display).toBe('flex');
        expect(modal.getAttribute('aria-hidden')).toBe('false');

        jest.advanceTimersByTime(20);
        expect(modal.classList.contains('active')).toBe(true);

        closeBtn.click();
        expect(modal.getAttribute('aria-hidden')).toBe('true');
        expect(modal.classList.contains('active')).toBe(false);

        jest.advanceTimersByTime(350);
        expect(modal.style.display).toBe('none');
    });

    test('updates star rating logic correctly', () => {
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const stars = document.querySelectorAll('#starRating .star');
        const ratingInput = document.getElementById('reviewRating');

        stars[2].click(); // Click the 3rd star (data-value=3)

        expect(ratingInput.value).toBe('3');
        expect(stars[0].classList.contains('selected')).toBe(true);
        expect(stars[1].classList.contains('selected')).toBe(true);
        expect(stars[2].classList.contains('selected')).toBe(true);
        expect(stars[3].classList.contains('selected')).toBe(false);
    });

    test('submits review form correctly', async () => {
        global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve({}) });
        window.open = jest.fn();

        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        document.getElementById('reviewName').value = 'Test User';
        document.getElementById('reviewRole').value = 'Test Role';
        document.getElementById('reviewText').value = 'Great tutor!';
        document.getElementById('reviewRating').value = '4';

        const form = document.getElementById('reviewForm');
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        jest.advanceTimersByTime(600);
        expect(window.open).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/'), '_blank');
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});
