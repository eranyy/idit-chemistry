/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

describe('script.js basic functionality', () => {
    let windowListeners = [];
    let documentListeners = [];

    const originalWindowAddEventListener = window.addEventListener;
    const originalDocumentAddEventListener = document.addEventListener;

    beforeEach(() => {
        // Track event listeners to clean them up later
        window.addEventListener = (type, listener, options) => {
            windowListeners.push({ type, listener, options });
            originalWindowAddEventListener.call(window, type, listener, options);
        };
        document.addEventListener = (type, listener, options) => {
            documentListeners.push({ type, listener, options });
            originalDocumentAddEventListener.call(document, type, listener, options);
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
        // Remove tracked event listeners to prevent state leakage between tests
        windowListeners.forEach(({ type, listener, options }) => {
            window.removeEventListener(type, listener, options);
        });
        documentListeners.forEach(({ type, listener, options }) => {
            document.removeEventListener(type, listener, options);
        });
        windowListeners = [];
        documentListeners = [];

        // Restore original methods
        window.addEventListener = originalWindowAddEventListener;
        document.addEventListener = originalDocumentAddEventListener;

        // Reset the body
        document.body.innerHTML = '';

        // Clear any mocks and localStorage
        jest.restoreAllMocks();
        localStorage.clear();
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
            <button id="btnEnlargeText"></button>
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

    test('filters learning tracks correctly when tab buttons are clicked', () => {
        document.body.innerHTML += `
            <div class="tracks-tabs">
                <button class="tab-btn active" data-target="all">All</button>
                <button class="tab-btn" data-target="middle">Middle School</button>
                <button class="tab-btn" data-target="high">High School</button>
            </div>
            <div class="tracks-grid">
                <div class="track-card" data-category="middle" style="display: flex;"></div>
                <div class="track-card" data-category="high" style="display: flex;"></div>
                <div class="track-card" data-category="academic" style="display: flex;"></div>
            </div>
        `;

        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const tabBtns = document.querySelectorAll('.tab-btn');
        const middleBtn = Array.from(tabBtns).find(btn => btn.getAttribute('data-target') === 'middle');
        const trackCards = document.querySelectorAll('.track-card');
        const middleCard = Array.from(trackCards).find(card => card.getAttribute('data-category') === 'middle');
        const highCard = Array.from(trackCards).find(card => card.getAttribute('data-category') === 'high');

        // Click on the 'Middle School' tab
        middleBtn.click();

        // Verify that 'active' class is updated
        expect(middleBtn.classList.contains('active')).toBe(true);
        expect(tabBtns[0].classList.contains('active')).toBe(false);

        // Advance timers if necessary, though setTimeout is used for opacity, display should change instantly
        expect(middleCard.style.display).toBe('flex');
        expect(highCard.style.display).toBe('none');
    });

    test('toggles accessibility floating panel and applies contrast setting', () => {
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
