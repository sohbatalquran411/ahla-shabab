const fs = require('fs');
let code = fs.readFileSync('d:/ahla-shabab/src/app/forms/[id]/FormFiller.tsx', 'utf8');
code = code.replace(/mainOption\.sub_\(Array\.isArray\(options\) \? options \: \[\]\)\.map/g, '(Array.isArray(mainOption.sub_options) ? mainOption.sub_options : []).map');
fs.writeFileSync('d:/ahla-shabab/src/app/forms/[id]/FormFiller.tsx', code);
console.log('fixed FormFiller');
