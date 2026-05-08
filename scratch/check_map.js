const fs = require('fs');
let code = fs.readFileSync('d:/ahla-shabab/src/app/admin/results/page.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.includes('.map')) {
    console.log((i+1) + ': ' + line.trim());
  }
});
