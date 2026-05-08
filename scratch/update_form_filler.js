const fs = require('fs');
let code = fs.readFileSync('d:/ahla-shabab/src/app/forms/[id]/FormFiller.tsx', 'utf8');

// 1. Remove Points display from options
code = code.replace(/\{option\.points > 0 && \([\s\S]*?\{\option\.points\} نقطة\)<\/span>[\s\S]*?\)\}/g, "");
code = code.replace(/\{subOpt\.points > 0 && \([\s\S]*?\{\subOpt\.points\} نقطة\)<\/span>[\s\S]*?\)\}/g, "");
code = code.replace(/\{col\.points > 0 && <span className="block text-xs text-blue-500">\(\{col\.points\}\)<\/span>\}/g, "");
code = code.replace(/\{option\.points > 0 \? \`\(\$\{option\.points\} نقطة\)\` \: ''\}/g, "''");
code = code.replace(/<span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">[\s\S]*?\{question\.points\} نقطة[\s\S]*?<\/span>/g, ""); // Remove from question title

// 2. Add Matrix checkbox support
// In matrix, the radio inputs should become checkbox inputs if the user wants "الاختيارات تكون اتشيك بوكس"
// Actually the user said "يحدد الصفوف والاعمدة والاختيارات تكون اتشيك بوكس"
// Let's change the matrix input to checkbox instead of radio.
code = code.replace(
  `type="radio"
                              name={\`\${question.id}_\${row.id}\`}
                              checked={currentAnswer?.[row.id] === col.id}
                              onChange={() => {
                                setAnswers({
                                  ...answers,
                                  [question.id]: {
                                    ...currentAnswer,
                                    [row.id]: col.id
                                  }
                                })
                              }}`,
  `type="checkbox"
                              name={\`\${question.id}_\${row.id}\`}
                              checked={Array.isArray(currentAnswer?.[row.id]) ? currentAnswer[row.id].includes(col.id) : currentAnswer?.[row.id] === col.id}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                let rowAns = currentAnswer?.[row.id] || [];
                                if (!Array.isArray(rowAns)) rowAns = [rowAns];
                                
                                if (isChecked) {
                                  rowAns = [...rowAns, col.id];
                                } else {
                                  rowAns = rowAns.filter(id => id !== col.id);
                                }
                                
                                setAnswers({
                                  ...answers,
                                  [question.id]: {
                                    ...currentAnswer,
                                    [row.id]: rowAns
                                  }
                                })
                              }}`
);

// 3. Add Timer and Randomization states
// Find the component start
const componentStart = `export default function FormFiller({ form, questions, userId, existingResponse }: FormFillerProps) {`;

const extraStates = `
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Check expiration
    if (form.expires_at) {
      if (new Date() > new Date(form.expires_at)) {
        setIsExpired(true);
        return;
      }
    }

    // Set Timer
    if (form.time_limit && !submitted && !existingResponse) {
      setTimeLeft(form.time_limit * 60);
    }

    // Set Questions (randomized or normal)
    if (form.randomize_questions) {
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      setDisplayQuestions(shuffled);
    } else {
      setDisplayQuestions(questions);
    }
  }, [form, questions]);

  useEffect(() => {
    if (timeLeft === null || submitted || isExpired) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, isExpired]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return \`\${m}:\${s.toString().padStart(2, '0')}\`;
  };
`;

code = code.replace(
  "  const [deletingResponse, setDeletingResponse] = useState(false)\n  const router = useRouter()\n  const supabase = createClient()",
  "  const [deletingResponse, setDeletingResponse] = useState(false)\n  const router = useRouter()\n  const supabase = createClient()\n" + extraStates
);

// Replace mapping questions with displayQuestions
code = code.replace(/questions\.map\(\(question, index\) => \(/g, "displayQuestions.map((question, index) => (");
code = code.replace(/questions\.forEach\(\(q\)/g, "displayQuestions.forEach((q)");
code = code.replace(/for \(const q of questions\)/g, "for (const q of displayQuestions)");

// Add expiration and timer UI
const timerUI = `
      {/* Timer UI */}
      {timeLeft !== null && !submitted && (
        <div className="fixed top-4 left-4 z-50 bg-white shadow-lg rounded-xl p-3 border border-red-100 flex items-center gap-3">
          <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'}\`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 01 18 0z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">الوقت المتبقي</p>
            <p className={\`text-lg font-bold \${timeLeft < 60 ? 'text-red-600' : 'text-gray-900'}\`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
      )}
`;

code = code.replace(
  /return \(\n\s*<div className="min-h-screen bg-gray-50 py-8 lg:py-12">\n\s*<div className="max-w-3xl mx-auto px-4">/g,
  `if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">النموذج مغلق</h2>
          <p className="text-gray-600">هذا النموذج لم يعد متاحاً للتسجيل في الوقت الحالي.</p>
          <button onClick={() => router.back()} className="mt-8 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
            العودة للسابق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 lg:py-12">
${timerUI}
      <div className="max-w-3xl mx-auto px-4">`
);

// We need to fix the calculation of matrix checkboxes in score calculation.
// Currently it expects a single value, but now it could be an array of checked column ids.
const matrixScoreCalc = `
        } else if (q.type === 'matrix') {
          // answer is an object { [rowId]: colId | colId[] }
          const options = parseOptions(q.options)
          if (options.length > 0 && options[0].sub_options) {
            Object.values(answer).forEach(val => {
              if (Array.isArray(val)) {
                val.forEach(colId => {
                  const col = options[0].sub_options.find(c => c.id === colId)
                  if (col) score += col.points || 0
                })
              } else {
                const col = options[0].sub_options.find(c => c.id === val)
                if (col) score += col.points || 0
              }
            })
          }
`;

code = code.replace(
  /} else if \(q\.type === 'scale'\) \{/g,
  `${matrixScoreCalc}\n        } else if (q.type === 'scale') {`
);

fs.writeFileSync('d:/ahla-shabab/src/app/forms/[id]/FormFiller.tsx', code);
console.log('done FormFiller.tsx');
