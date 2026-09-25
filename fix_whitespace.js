const fs = require('fs');

let content = fs.readFileSync('script.js', 'utf8');

const strToReplace1 = `    const whatsappMsg = \`היי עידית, שלחתי המלצה חדשה עבור האתר שלך:
    ✍️ *שם הממליץ:* \${name}
    🎓 *רמת לימוד / מוסד:* \${role}
    ⭐ *דירוג:* \${starString} (\${rating}/5)
    💬 *המלצה:* \${text}\`;`;

const newStr1 = `    const whatsappMsg = \`היי עידית, שלחתי המלצה חדשה עבור האתר שלך:
✍️ *שם הממליץ:* \${name}
🎓 *רמת לימוד / מוסד:* \${role}
⭐ *דירוג:* \${starString} (\${rating}/5)
💬 *המלצה:* \${text}\`;`;

content = content.replace(strToReplace1, newStr1);


const strToReplace2 = `                const customMessage = \`היי עידית, קיבלת פנייה חדשה מאתר האינטרנט שלך:

    פרטי הפנייה:
    - שם מלא: \${nameInput.value.trim()}
    - טלפון: \${phoneInput.value.trim()}
    - מסלול לימוד מבוקש: \${levelText}
    - סגנון שיעור מועדף: \${formatText}
    - הודעה מהלקוח: \${messageInput.value.trim() || 'לא צורפה הודעה'}

    נא לחזור אליו בהקדם.\`;`;

const newStr2 = `                const customMessage = \`היי עידית, קיבלת פנייה חדשה מאתר האינטרנט שלך:

פרטי הפנייה:
- שם מלא: \${nameInput.value.trim()}
- טלפון: \${phoneInput.value.trim()}
- מסלול לימוד מבוקש: \${levelText}
- סגנון שיעור מועדף: \${formatText}
- הודעה מהלקוח: \${messageInput.value.trim() || 'לא צורפה הודעה'}

נא לחזור אליו בהקדם.\`;`;


content = content.replace(strToReplace2, newStr2);


fs.writeFileSync('script.js', content);
