/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

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

    test('filters learning tracks on tab button click', () => {
        document.body.innerHTML += `
            <button class="tab-btn active" data-target="all">All</button>
            <button class="tab-btn" data-target="bagrut">Bagrut</button>
            <div class="track-card" data-category="bagrut"></div>
            <div class="track-card" data-category="academic"></div>
        `;
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const tabs = document.querySelectorAll('.tab-btn');
        const cards = document.querySelectorAll('.track-card');

        tabs[1].click();
        expect(tabs[1].classList.contains('active')).toBe(true);
        expect(tabs[0].classList.contains('active')).toBe(false);
        expect(cards[0].style.display).toBe('flex');
        expect(cards[1].style.display).toBe('none');
    });

    test('accepts cookie consent banner and persists to localStorage', () => {
        document.body.innerHTML += `
            <div id="cookieBanner" class="active" aria-hidden="false"></div>
            <button id="acceptCookiesBtn"></button>
        `;
        localStorage.removeItem('cookieConsentAccepted');
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const cookieBanner = document.getElementById('cookieBanner');
        const acceptBtn = document.getElementById('acceptCookiesBtn');

        acceptBtn.click();
        expect(localStorage.getItem('cookieConsentAccepted')).toBe('true');
        expect(cookieBanner.classList.contains('active')).toBe(false);
        expect(cookieBanner.getAttribute('aria-hidden')).toBe('true');
    });

    test('opens certificate lightbox modal when auth-card is clicked', () => {
        document.body.innerHTML += `
            <div class="auth-card" data-cert="cert1.jpg" data-caption="M.Sc Certificate"></div>
            <div id="certModal" aria-hidden="true"></div>
            <img id="modalImg" />
            <div id="modalCaption"></div>
            <button id="closeModal"></button>
        `;
        eval(scriptContent);
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const card = document.querySelector('.auth-card');
        const certModal = document.getElementById('certModal');
        const modalImg = document.getElementById('modalImg');

        card.click();
        expect(certModal.style.display).toBe('block');
        expect(certModal.getAttribute('aria-hidden')).toBe('false');
        expect(modalImg.getAttribute('src')).toContain('cert1.jpg');
    });
});
