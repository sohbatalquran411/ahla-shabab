const fs = require('fs');
let code = fs.readFileSync('d:/ahla-shabab/src/app/forms/create/page.tsx', 'utf8');
code = code.replace(/randomize_questions: formData\.randomize_questions,\s*allow_multiple: formData\.allow_multiple,/g, 'randomize_questions: formData.randomize_questions,');
fs.writeFileSync('d:/ahla-shabab/src/app/forms/create/page.tsx', code);
console.log('done');
