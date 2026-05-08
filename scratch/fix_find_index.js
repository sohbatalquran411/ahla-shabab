const fs = require('fs');

function fixFindIndex(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/\.findIndex\(\(o\)? \=\>/g, '.findIndex((o: any) =>');
  code = code.replace(/\.findIndex\(o \=\>/g, '.findIndex((o: any) =>');
  
  fs.writeFileSync(filePath, code);
  console.log('Fixed', filePath);
}

fixFindIndex('d:/ahla-shabab/src/app/forms/create/page.tsx');
fixFindIndex('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx');
