const fs = require('fs');
let code = fs.readFileSync('tests/script.test.js', 'utf8');

// Replace custom MockDate with jest.useFakeTimers() and remove conditional `if(statusBadgeEl)`

// 1. Find and replace mockDate function
const newMockDate = `
    const mockDate = (day, hours, minutes) => {
        const dayOffset = day + 1;
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');
        const mockDateString = '2023-10-0' + dayOffset + 'T' + h + ':' + m + ':00';

        jest.useFakeTimers().setSystemTime(new Date(mockDateString));
    };
`;

code = code.replace(/const mockDate = \(day, hours, minutes\) => \{[\s\S]*?global\.Date = MockDate;\n    \};/, newMockDate);

// 2. Remove const origDate = global.Date; and global.Date = origDate;
code = code.replace(/const origDate = global\.Date;\n\s*/g, '');
code = code.replace(/global\.Date = origDate;\n\s*/g, '');

// 3. Remove conditional if(statusBadgeEl)
code = code.replace(/if\s*\(statusBadgeEl\)\s*\{/g, '');
code = code.replace(/expect\(statusBadgeEl\.classList\.contains\('open'\)\)\.toBe\(true\);\n            expect\(statusBadgeEl\.querySelector\('\.status-text'\)\.innerText\)\.toContain\('פתוח'\);\n        \}/g, `expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('open')).toBe(true);
        expect(statusBadgeEl.querySelector('.status-text').innerText).toContain('פתוח');`);

code = code.replace(/expect\(statusBadgeEl\.classList\.contains\('closed'\)\)\.toBe\(true\);\n            expect\(statusBadgeEl\.querySelector\('\.status-text'\)\.innerText\)\.toContain\('סגור'\);\n        \}/g, `expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('closed')).toBe(true);
        expect(statusBadgeEl.querySelector('.status-text').innerText).toContain('סגור');`);

code = code.replace(/expect\(statusBadgeEl\.classList\.contains\('open'\)\)\.toBe\(true\);\n        \}/g, `expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('open')).toBe(true);`);

code = code.replace(/expect\(statusBadgeEl\.classList\.contains\('closed'\)\)\.toBe\(true\);\n        \}/g, `expect(statusBadgeEl).not.toBeNull();
        expect(statusBadgeEl.classList.contains('closed')).toBe(true);`);

fs.writeFileSync('tests/script.test.js', code);
