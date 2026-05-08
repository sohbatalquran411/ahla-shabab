const fs = require('fs');

function fixImplicitAnys(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix parseOptions
  code = code.replace(/const parseOptions = \(options\) => \{/g, "const parseOptions = (options: any): any[] => {");

  // Fix implicit anys in maps
  code = code.replace(/\.map\(\(opt, i\) =>/g, ".map((opt: any, i: number) =>");
  code = code.replace(/\.map\(\(q, i\) =>/g, ".map((q: any, i: number) =>");
  code = code.replace(/\.map\(\(sub, i\) =>/g, ".map((sub: any, i: number) =>");
  code = code.replace(/\.filter\(\(\_, i\) =>/g, ".filter((_: any, i: number) =>");
  code = code.replace(/\.map\(\(\_, i\) =>/g, ".map((_: any, i: number) =>");
  
  // Fix implicit anys in save routines
  code = code.replace(/\.map\(opt =>/g, ".map((opt: any) =>");
  code = code.replace(/\.map\(sub =>/g, ".map((sub: any) =>");

  // Fix implicit anys in render functions
  code = code.replace(/\.map\(\(question, qIndex\) =>/g, ".map((question: any, qIndex: number) =>");
  code = code.replace(/\.map\(\(option, oIndex\) =>/g, ".map((option: any, oIndex: number) =>");
  code = code.replace(/\.map\(\(subOpt, sIndex\) =>/g, ".map((subOpt: any, sIndex: number) =>");
  
  // The ones that don't have second param
  code = code.replace(/\.map\(\(opt\) =>/g, ".map((opt: any) =>");
  code = code.replace(/\.map\(\(q\) =>/g, ".map((q: any) =>");
  
  // Fix map in the save function where it's map((q, index) =>
  code = code.replace(/\.map\(\(q, index\) =>/g, ".map((q: any, index: number) =>");

  fs.writeFileSync(filePath, code);
  console.log('Fixed typings in', filePath);
}

fixImplicitAnys('d:/ahla-shabab/src/app/forms/create/page.tsx');
fixImplicitAnys('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx');
