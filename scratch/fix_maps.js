const fs = require('fs');
for (const file of ['d:/ahla-shabab/src/app/forms/create/page.tsx', 'd:/ahla-shabab/src/app/forms/[id]/edit/page.tsx']) {
  let code = fs.readFileSync(file, 'utf8');
  
  code = code.replace(/question\.options\.map/g, '(question.options || []).map');
  code = code.replace(/option\.sub_options\.map/g, '(option.sub_options || []).map');
  code = code.replace(/option\.sub_options\.length/g, '(option.sub_options || []).length');
  code = code.replace(/form\.questions\.map/g, '(form.questions || []).map');
  code = code.replace(/formData\.questions\.map/g, '(formData.questions || []).map');
  code = code.replace(/formData\.questions\.length/g, '(formData.questions || []).length');
  code = code.replace(/question\.options\.findIndex/g, '(question.options || []).findIndex');
  code = code.replace(/formData\.questions\[questionIndex\]\.options\.map/g, '(formData.questions[questionIndex].options || []).map');
  code = code.replace(/formData\.questions\[questionIndex\]\.options\.filter/g, '(formData.questions[questionIndex].options || []).filter');

  fs.writeFileSync(file, code);
}
console.log('done');
