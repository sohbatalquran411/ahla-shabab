const fs = require('fs');

const parseOptionsCode = `
  const parseOptions = (options) => {
    if (!options) return []
    if (typeof options === 'string') {
      try {
        return JSON.parse(options)
      } catch {
        return []
      }
    }
    return Array.isArray(options) ? options : []
  }
`;

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (!code.includes('const parseOptions =')) {
    // Add the helper function inside the component
    code = code.replace(
      /(const router = useRouter\(\)\s*)/,
      `$1\n${parseOptionsCode}\n`
    );
  }

  // Find all mapping over options and wrap with parseOptions
  // Specifically: form.questions?.map((q: any) =>
  // where q.options might be string
  
  // Replace in importQuestion
  code = code.replace(
    /options: question\.options \|\| \[\],/,
    "options: parseOptions(question.options),"
  );
  
  code = code.replace(
    /sub_options: question\.sub_options \|\| \[\]/,
    "sub_options: parseOptions(question.sub_options)"
  );
  
  fs.writeFileSync(filePath, code);
  console.log('Fixed', filePath);
}

fixFile('d:/ahla-shabab/src/app/forms/create/page.tsx');
fixFile('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx');

