const fs = require('fs');

function fixQuestionType(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/QUESTION_TYPES\[question\.type\]\?\.label/g, 'QUESTION_TYPES[question.type as QuestionType]?.label');
  code = code.replace(/QUESTION_TYPES\[q\.type\]\?\.label/g, 'QUESTION_TYPES[q.type as QuestionType]?.label');
  fs.writeFileSync(filePath, code);
  console.log('Fixed', filePath);
}

fixQuestionType('d:/ahla-shabab/src/app/forms/create/page.tsx');
fixQuestionType('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx');
