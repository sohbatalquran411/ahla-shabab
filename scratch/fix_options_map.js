const fs = require('fs');

function fixRenderOptions(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // We should safely parse options when mapping them.
  // Look for: (question.options || []).map
  // Replace with: parseOptions(question.options).map
  code = code.replace(/\(question\.options \|\| \[\]\)\.map/g, "parseOptions(question.options).map");
  
  // Look for: (question.sub_options || []).map
  code = code.replace(/\(question\.sub_options \|\| \[\]\)\.map/g, "parseOptions(question.sub_options).map");
  
  // Look for: (option.sub_options || []).map
  code = code.replace(/\(option\.sub_options \|\| \[\]\)\.map/g, "parseOptions(option.sub_options).map");
  
  // Also fix: formData.questions[questionIndex].options || []
  code = code.replace(/\(formData\.questions\[questionIndex\]\.options \|\| \[\]\)\.map/g, "parseOptions(formData.questions[questionIndex].options).map");
  code = code.replace(/\(formData\.questions\[questionIndex\]\.options \|\| \[\]\)\.filter/g, "parseOptions(formData.questions[questionIndex].options).filter");
  
  // Also fix: option.sub_options || []
  code = code.replace(/\(option\.sub_options \|\| \[\]\)\.filter/g, "parseOptions(option.sub_options).filter");
  
  // Fix the Matrix settings where it loops over options[0].sub_options
  // Look for: question.options[0]?.sub_options?.map
  // We can't just replace safely, let's use Array.isArray
  code = code.replace(/question\.options\[0\]\?\.sub_options\?\.map/g, "(Array.isArray(question.options[0]?.sub_options) ? question.options[0].sub_options : []).map");

  fs.writeFileSync(filePath, code);
  console.log('Fixed render', filePath);
}

fixRenderOptions('d:/ahla-shabab/src/app/forms/create/page.tsx');
fixRenderOptions('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx');
