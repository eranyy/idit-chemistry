const { performance } = require('perf_hooks');

function testOld() {
    for (let i = 0; i < 10000; i++) {
        const jlmHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hourCycle: 'h23' }).format(new Date()), 10);
        const utcHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: 'numeric', hourCycle: 'h23' }).format(new Date()), 10);
    }
}

const dtfJlm = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hourCycle: 'h23' });
const dtfUtc = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: 'numeric', hourCycle: 'h23' });

function testNew() {
    for (let i = 0; i < 10000; i++) {
        const jlmHour = parseInt(dtfJlm.format(new Date()), 10);
        const utcHour = parseInt(dtfUtc.format(new Date()), 10);
    }
}

const start1 = performance.now();
testOld();
const end1 = performance.now();
console.log(`Old: ${end1 - start1} ms`);

const start2 = performance.now();
testNew();
const end2 = performance.now();
console.log(`New: ${end2 - start2} ms`);
