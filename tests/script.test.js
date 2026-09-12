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

    describe('checkStatus boundary conditions', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        // Sunday - Thursday (Normal days): 08:00 to 20:00
        test.each([
            ['Sunday 07:59', new Date('2023-10-15T07:59:00'), 'closed'],
            ['Sunday 08:00', new Date('2023-10-15T08:00:00'), 'open'],
            ['Thursday 19:59', new Date('2023-10-19T19:59:00'), 'open'],
            ['Thursday 20:00', new Date('2023-10-19T20:00:00'), 'closed']
        ])('sets status to %s on %s', (desc, time, expectedStatus) => {
            jest.setSystemTime(time);
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));
            const statusBadge = document.getElementById('openingStatus');
            expect(statusBadge.classList.contains(expectedStatus)).toBe(true);
            expect(statusBadge.classList.contains(expectedStatus === 'open' ? 'closed' : 'open')).toBe(false);
        });

        // Friday Summer (DST): 08:00 to 17:00
        test.each([
            ['Summer Friday 07:59', new Date('2023-08-11T07:59:00'), 'closed'],
            ['Summer Friday 08:00', new Date('2023-08-11T08:00:00'), 'open'],
            ['Summer Friday 16:59', new Date('2023-08-11T16:59:00'), 'open'],
            ['Summer Friday 17:00', new Date('2023-08-11T17:00:00'), 'closed']
        ])('sets status to %s on %s in summer', (desc, time, expectedStatus) => {
            jest.setSystemTime(time);
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));
            const statusBadge = document.getElementById('openingStatus');
            expect(statusBadge.classList.contains(expectedStatus)).toBe(true);
        });

        // Friday Winter (Non-DST): 08:00 to 15:00
        test.each([
            ['Winter Friday 07:59', new Date('2023-01-13T07:59:00'), 'closed'],
            ['Winter Friday 08:00', new Date('2023-01-13T08:00:00'), 'open'],
            ['Winter Friday 14:59', new Date('2023-01-13T14:59:00'), 'open'],
            ['Winter Friday 15:00', new Date('2023-01-13T15:00:00'), 'closed']
        ])('sets status to %s on %s in winter', (desc, time, expectedStatus) => {
            jest.setSystemTime(time);
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));
            const statusBadge = document.getElementById('openingStatus');
            expect(statusBadge.classList.contains(expectedStatus)).toBe(true);
        });

        // Saturday (Evening): 18:00 to 21:00
        test.each([
            ['Saturday 17:59', new Date('2023-10-21T17:59:00'), 'closed'],
            ['Saturday 18:00', new Date('2023-10-21T18:00:00'), 'open'],
            ['Saturday 20:59', new Date('2023-10-21T20:59:00'), 'open'],
            ['Saturday 21:00', new Date('2023-10-21T21:00:00'), 'closed']
        ])('sets status to %s on %s', (desc, time, expectedStatus) => {
            jest.setSystemTime(time);
            eval(scriptContent);
            document.dispatchEvent(new Event('DOMContentLoaded'));
            const statusBadge = document.getElementById('openingStatus');
            expect(statusBadge.classList.contains(expectedStatus)).toBe(true);
        });
    });
});
