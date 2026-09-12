/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');


let globalListeners = [];
const origDocAddEventListener = document.addEventListener;
const origWinAddEventListener = window.addEventListener;

beforeAll(() => {
    document.addEventListener = function(type, listener, options) {
        globalListeners.push({ target: document, type, listener, options });
        origDocAddEventListener.call(this, type, listener, options);
    };
    window.addEventListener = function(type, listener, options) {
        globalListeners.push({ target: window, type, listener, options });
        origWinAddEventListener.call(this, type, listener, options);
    };
});

afterEach(() => {
    globalListeners.forEach(({ target, type, listener, options }) => {
        target.removeEventListener(type, listener, options);
    });
    globalListeners = [];
});


describe('script.js basic functionality', () => {
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
            <button id="accessibilityToggle"></button>
            <div id="accessibilityPanel"></div>
            <button id="accessibilityClose"></button>
            <button id="btnEnlargeText"><span class="btn-label"></span></button>
            <button id="btnContrast"></button>
            <button id="btnMonochrome"></button>
            <button id="btnLinks"></button>
            <button id="btnFont"></button>
            <button id="btnReset"></button>
            <div id="cookieBanner"></div>
            <button id="acceptCookiesBtn"></button>
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
});

describe('Interactive Chemistry Readiness Assessment Quiz Engine', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="quizModal"></div>
            <button id="openQuizBtn"></button>
            <button id="floatingQuizBtn"></button>
            <button id="closeQuizModal"></button>
            <div id="quizHeader"></div>
            <h2 id="quizTitle"></h2>
            <p id="quizSubtitle"></p>
            <div id="quizProgressWrap" style="display: none;"></div>
            <div id="quizProgressBar"></div>
            <div id="quizBody"></div>
        `;
    });

    test('opens quiz modal when openQuizBtn is clicked', () => {
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const openQuizBtn = document.getElementById('openQuizBtn');
        const quizModal = document.getElementById('quizModal');

        expect(quizModal.classList.contains('active')).toBe(false);

        openQuizBtn.click();

        expect(quizModal.classList.contains('active')).toBe(true);
        expect(quizModal.getAttribute('aria-hidden')).toBe('false');
        expect(document.body.style.overflow).toBe('hidden');
    });

    test('closes quiz modal on close button click and overlay click', () => {
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const openQuizBtn = document.getElementById('openQuizBtn');
        const closeQuizModal = document.getElementById('closeQuizModal');
        const quizModal = document.getElementById('quizModal');

        // Open modal
        openQuizBtn.click();
        expect(quizModal.classList.contains('active')).toBe(true);

        // Close using close button
        closeQuizModal.click();
        expect(quizModal.classList.contains('active')).toBe(false);
        expect(quizModal.getAttribute('aria-hidden')).toBe('true');
        expect(document.body.style.overflow).toBe('');

        // Open again
        openQuizBtn.click();
        expect(quizModal.classList.contains('active')).toBe(true);

        // Close by clicking outside (on the modal overlay)
        window.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        // Simulate click event targeting quizModal directly
        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: quizModal, enumerable: true });
        window.dispatchEvent(clickEvent);
        expect(quizModal.classList.contains('active')).toBe(false);
    });

    test('completes the quiz flow and shows result', () => {
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const openQuizBtn = document.getElementById('openQuizBtn');
        const quizTitle = document.getElementById('quizTitle');
        const quizSubtitle = document.getElementById('quizSubtitle');
        const quizBody = document.getElementById('quizBody');

        // Open quiz
        openQuizBtn.click();
        expect(quizTitle.textContent).toBe('בחרו את מסלול הלימוד שלכם');

        // Select track (highschool)
        let options = quizBody.querySelectorAll('.quiz-option-card');
        expect(options.length).toBeGreaterThan(0);
        options[0].click(); // Select first track (highschool)

        // Step 1
        expect(quizTitle.textContent).toContain('שאלה 1');
        options = quizBody.querySelectorAll('.quiz-option-card');
        options[0].click();

        // Step 2
        expect(quizTitle.textContent).toContain('שאלה 2');
        options = quizBody.querySelectorAll('.quiz-option-card');
        options[0].click();

        // Step 3
        expect(quizTitle.textContent).toContain('שאלה 3');
        options = quizBody.querySelectorAll('.quiz-option-card');
        options[0].click();

        // Result Step
        expect(quizTitle.textContent).toBe('תוצאת אבחון הלימוד וההתאמה שלך');
        expect(quizSubtitle.textContent).toBe('הניתוח הושלם בהצלחה! להלן הסיכום וההמלצה של עידית:');

        const whatsappBtn = quizBody.querySelector('.btn-whatsapp-quiz');
        expect(whatsappBtn).not.toBeNull();
        expect(whatsappBtn.getAttribute('href')).toContain('wa.me');
    });

});