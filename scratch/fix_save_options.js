const fs = require('fs');

function fixSaveOptions(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace q.options.map with parseOptions(q.options).map
  code = code.replace(/q\.options\.map/g, "parseOptions(q.options).map");
  
  // Replace opt.sub_options?.map with parseOptions(opt.sub_options).map
  code = code.replace(/opt\.sub_options\?\.map/g, "parseOptions(opt.sub_options).map");

  fs.writeFileSync(filePath, code);
  console.log('Fixed save', filePath);
}

fixSaveOptions('d:/ahla-shabab/src/app/forms/create/page.tsx');
fixSaveOptions('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx');
