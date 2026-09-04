const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, 'script.js'), 'utf8');

describe('Accessibility Settings Error Handling', () => {
    beforeEach(() => {
        // Prepare the DOM with all the required nodes so script.js doesn't throw before reaching our catch block
        document.body.innerHTML = `
            <div id="header"></div>
            <div id="currentYear"></div>
            <div id="menuToggle"></div>
            <div id="navMenu"></div>
            <div id="openingStatus"><div class="status-text"></div></div>
            <form id="contactForm">
                <input id="nameInput" />
                <input id="phoneInput" />
                <input id="levelInput" />
                <input id="formatInput" />
                <input id="messageInput" />
            </form>
            <div id="formFeedback"></div>
            <div id="certModal"></div>
            <div id="modalImg"></div>
            <div id="modalCaption"></div>
            <div id="closeModal"></div>
            <div id="openReviewBtn"></div>
            <div id="reviewModal"></div>
            <div id="closeReviewModal"></div>
            <form id="reviewForm">
                <input id="reviewName" />
                <input id="reviewRole" />
                <input id="reviewRating" />
                <input id="reviewText" />
            </form>
            <div id="starRating"><div class="star"></div></div>
            <div id="accessibilityToggle"></div>
            <div id="accessibilityPanel"></div>
            <div id="accessibilityClose"></div>
            <div id="btnEnlargeText"><div class="btn-label"></div></div>
            <div id="btnContrast"></div>
            <div id="btnMonochrome"></div>
            <div id="btnLinks"></div>
            <div id="btnFont"></div>
            <div id="btnReset"></div>
            <div id="cookieBanner"></div>
            <div id="acceptCookiesBtn"></div>
        `;

        localStorage.clear();
        jest.clearAllMocks();

        // Mock console.error
        jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock setInterval to prevent hanging
        jest.spyOn(window, 'setInterval').mockImplementation(() => {});
        jest.spyOn(window, 'setTimeout').mockImplementation(() => {});
        window.fetch = jest.fn().mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should catch JSON.parse error when stored accSettings is invalid', () => {
        // Set invalid JSON in localStorage
        localStorage.setItem('accSettings', '{ invalid_json ');

        // Ensure we handle DOMContentLoaded by intercepting document.addEventListener
        // to immediately execute it within a try/catch, to handle potential minor DOM missing errors properly
        // though we provided all the IDs.
        const originalAddEventListener = document.addEventListener.bind(document);
        let domContentLoadedExecuted = false;

        jest.spyOn(document, 'addEventListener').mockImplementation((event, callback) => {
            if (event === 'DOMContentLoaded') {
                callback();
                domContentLoadedExecuted = true;
            } else {
                originalAddEventListener(event, callback);
            }
        });

        // Run the script
        eval(scriptContent);

        // Make sure it actually ran
        expect(domContentLoadedExecuted).toBe(true);

        // Verify console.error was called with the specific message and an error object
        expect(console.error).toHaveBeenCalledWith(
            "Error parsing accessibility settings",
            expect.any(Error)
        );
    });
});
