const fs = require('fs');
let code = fs.readFileSync('d:/ahla-shabab/src/app/forms/create/page.tsx', 'utf8');
code = code.replace(
  /interface FormData \{\s*name: string\s*description: string\s*target_gender: 'male' \| 'female' \| 'both'\s*allow_multiple: boolean\s*image_url: string\s*questions: Question\[\]\s*\}/g,
  `interface FormData {
  name: string
  description: string
  target_gender: 'male' | 'female' | 'both'
  allow_multiple: boolean
  image_url: string
  questions: Question[]
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
}`
);
fs.writeFileSync('d:/ahla-shabab/src/app/forms/create/page.tsx', code);
console.log('done');
