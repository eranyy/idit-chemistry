const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf-8');

// The script.js file wraps things in document.addEventListener('DOMContentLoaded', () => { ... })
// We can extract the function body, or simply export it for testing.
// However, since we shouldn't modify the source just for testing if possible, let's extract it.

describe('isIsraelDST error handling', () => {
    let isIsraelDST;

    beforeAll(() => {
        const match = scriptContent.match(/function isIsraelDST\(\) {([\s\S]*?catch \(e\) {[\s\S]*?})[\s\S]*?}/);
        if (match) {
            // Recreate the function
            isIsraelDST = new Function(
                `
                ${match[0]}
                return isIsraelDST();
                `
            );
        } else {
            throw new Error("Could not find isIsraelDST in script.js");
        }
    });

    let originalDateTimeFormat;

    beforeEach(() => {
        originalDateTimeFormat = Intl.DateTimeFormat;
    });

    afterEach(() => {
        Intl.DateTimeFormat = originalDateTimeFormat;
        jest.restoreAllMocks();
    });

    test('should fallback to month check when Intl.DateTimeFormat throws', () => {
        const mockError = new Error('Intl.DateTimeFormat mock error');
        Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
            throw mockError;
        });

        jest.useFakeTimers();

        // July is summer time (month >= 4 && month <= 10) -> should be true
        jest.setSystemTime(new Date(2023, 6, 15));
        expect(isIsraelDST()).toBe(true);

        // Winter time: January (month 0 + 1 = 1) -> should be false
        jest.setSystemTime(new Date(2023, 0, 15));
        expect(isIsraelDST()).toBe(false);

        jest.useRealTimers();
    });
});
