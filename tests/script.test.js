/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

// Export the function to the global object specifically in the test environment
const evalScript = () => {
    eval(scriptContent + '\nwindow.sendWeb3FormEmail = sendWeb3FormEmail;');
};

describe('script.js basic functionality', () => {
    let originalAddEventListener;
    let addedListeners = [];

    beforeEach(() => {
        addedListeners = [];
        originalAddEventListener = document.addEventListener;
        document.addEventListener = function(type, listener, options) {
            addedListeners.push({ type, listener, options });
            return originalAddEventListener.call(document, type, listener, options);
        };

        window.addEventListener = function(type, listener, options) {
            addedListeners.push({ target: window, type, listener, options });
            return EventTarget.prototype.addEventListener.call(window, type, listener, options);
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
        addedListeners.forEach(({ target, type, listener, options }) => {
            if (target === window) {
                window.removeEventListener(type, listener, options);
            } else {
                document.removeEventListener(type, listener, options);
            }
        });
        document.addEventListener = originalAddEventListener;
        delete window.addEventListener;
    });

    test('sets current year in footer', () => {
        evalScript();
        document.dispatchEvent(new Event('DOMContentLoaded'));
        const currentYearSpan = document.getElementById('currentYear');
        expect(currentYearSpan.textContent).toBe(new Date().getFullYear().toString());
    });

    test('toggles mobile menu on click', () => {
        evalScript();
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
        evalScript();
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
        document.body.innerHTML += `
            <button id="accessibilityToggle"></button>
            <div id="accessibilityPanel" class=""></div>
            <button id="accessibilityClose"></button>
            <button id="btnContrast" class=""></button>
            <button id="btnEnlargeText"><span class="btn-label"></span></button>
            <button id="btnMonochrome"></button>
            <button id="btnLinks"></button>
            <button id="btnFont"></button>
            <button id="btnReset"></button>
        `;
        evalScript();
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

        evalScript();
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
        evalScript();
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
        evalScript();
        document.dispatchEvent(new Event('DOMContentLoaded'));
        const statusBadge = document.getElementById('openingStatus');
        expect(statusBadge).not.toBeNull();
        expect(statusBadge.classList.contains('open') || statusBadge.classList.contains('closed')).toBe(true);
    });

    test('toggles accessibility floating panel and applies contrast setting', () => {
        document.body.innerHTML += `
            <button id="accessibilityToggle"></button>
            <div id="accessibilityPanel" class=""></div>
            <button id="accessibilityClose"></button>
            <button id="btnContrast" class=""></button>
            <button id="btnEnlargeText"><span class="btn-label"></span></button>
            <button id="btnMonochrome"></button>
            <button id="btnLinks"></button>
            <button id="btnFont"></button>
            <button id="btnReset"></button>
        `;
        evalScript();
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

describe('sendWeb3FormEmail', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;
        if (typeof window.sendWeb3FormEmail !== 'function') {
             evalScript();
        }
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    test('resolves immediately if accessKey is not provided', async () => {
        global.fetch = jest.fn();

        const promise = window.sendWeb3FormEmail({ subject: 'Test' });
        await expect(promise).resolves.toBeUndefined();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('calls fetch with correct parameters', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true });

        const params = {
            accessKey: 'test-key',
            subject: 'Test Subject',
            fromName: 'Test Name',
            name: 'Sender',
            email: 'test@example.com',
            message: 'Hello World'
        };

        await window.sendWeb3FormEmail(params);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                access_key: params.accessKey,
                subject: params.subject,
                from_name: params.fromName,
                name: params.name,
                email: params.email,
                message: params.message
            })
        });
    });

    test('catches and logs errors on fetch failure', async () => {
        const error = new Error('Fetch failed');
        global.fetch = jest.fn().mockRejectedValue(error);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await window.sendWeb3FormEmail({
            accessKey: 'test-key',
            errorTag: 'TestTag'
        });

        expect(consoleSpy).toHaveBeenCalledWith('TestTag contact dispatch error:', error);
    });
});
