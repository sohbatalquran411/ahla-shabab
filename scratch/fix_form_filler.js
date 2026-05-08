const fs = require('fs');
let code = fs.readFileSync('d:/ahla-shabab/src/app/forms/[id]/FormFiller.tsx', 'utf8');
code = code.replace(/options\.map/g, '(Array.isArray(options) ? options : []).map');
code = code.replace(/mainOption\.sub_options\.map/g, '(Array.isArray(mainOption.sub_options) ? mainOption.sub_options : []).map');
code = code.replace(/form\.questions\.map/g, '(Array.isArray(form.questions) ? form.questions : []).map');
fs.writeFileSync('d:/ahla-shabab/src/app/forms/[id]/FormFiller.tsx', code);
console.log('done');
