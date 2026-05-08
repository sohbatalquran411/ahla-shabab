const fs = require('fs');
const content = fs.readFileSync('d:/ahla-shabab/src/app/forms/create/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('.map') && (line.includes('options') || line.includes('questions'))) {
    console.log((i + 1) + ': ' + line.trim());
  }
});
