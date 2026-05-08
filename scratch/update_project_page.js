const fs = require('fs');
let code = fs.readFileSync('d:/ahla-shabab/src/app/projects/[id]/page.tsx', 'utf8');

// 1. Replace completedFormIds with userResponses
code = code.replace(
  "const [completedFormIds, setCompletedFormIds] = useState<string[]>([])",
  "const [userResponses, setUserResponses] = useState<any[]>([])\n  const [showResultsModal, setShowResultsModal] = useState<string | null>(null)"
);

code = code.replace(
  "setCompletedFormIds(responsesData?.map((r: any) => r.form_id) || [])",
  "setUserResponses(responsesData || [])"
);

// 2. Add handle delete response
const extraFunc = `
  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الاستجابة؟')) return;
    try {
      const { error } = await supabase.from('form_responses').delete().eq('id', responseId);
      if (error) throw error;
      setUserResponses(prev => prev.filter(r => r.id !== responseId));
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحذف');
    }
  };
`;
code = code.replace(
  "  const handleDeleteProject = async () => {",
  `${extraFunc}\n  const handleDeleteProject = async () => {`
);

// 3. Update the card render
const cardRegex = /const isCompleted = completedFormIds\.includes\(form\.id\)([\s\S]*?)<\/Link>\s*<\/div>\s*\)\s*\}\)/;

const newCardCode = `
            const formResponses = userResponses.filter(r => r.form_id === form.id)
            const isCompleted = formResponses.length > 0
            
            return (
              <div
                key={form.id}
                className={\`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-lg hover:border-blue-200 \${
                  isCompleted ? 'border-green-200' : 'border-gray-100'
                }\`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile?.role === 'admin' && (
                      <div className="flex gap-1 relative z-10" onClick={e => e.stopPropagation()}>
                        <Link
                          href={\`/forms/\${form.id}/edit\`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل الفورم"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDeleteModal(form.id)
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف الفورم"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <Link href={\`/forms/\${form.id}\`} className="block">
                  <h4 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">{form.name}</h4>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {form.description || 'لا يوجد وصف'}
                  </p>
                </Link>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <Link href={\`/forms/\${form.id}\`} className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:text-blue-700">
                    {isCompleted && !form.allow_multiple ? 'لقد قمت بالتسجيل مسبقاً' : 'تسجيل جديد'}
                    <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>

                  {isCompleted && (
                    <button
                      onClick={() => setShowResultsModal(form.id)}
                      className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      عرض النتائج
                    </button>
                  )}
                </div>
              </div>
            )
          })`;

code = code.replace(cardRegex, newCardCode);

// 4. Add Results Modal at the bottom
const resultsModal = `
      {/* Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowResultsModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">نتائج تسجيلاتك</h3>
              <button onClick={() => setShowResultsModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 rounded-r-lg">التاريخ والوقت</th>
                    <th className="p-3">النتيجة</th>
                    <th className="p-3 rounded-l-lg">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userResponses.filter(r => r.form_id === showResultsModal).map(r => {
                    const form = forms.find(f => f.id === r.form_id);
                    return (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="p-3 text-gray-900" dir="ltr">{new Date(r.submitted_at).toLocaleString('ar-EG')}</td>
                      <td className="p-3 text-blue-600 font-medium">{r.score} / {r.max_score}</td>
                      <td className="p-3">
                        {form?.allow_delete_responses && (
                          <button
                            onClick={() => handleDeleteResponse(r.id)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            حذف
                          </button>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "{/* Delete Confirmation Modal */}",
  `${resultsModal}\n      {/* Delete Confirmation Modal */}`
);

fs.writeFileSync('d:/ahla-shabab/src/app/projects/[id]/page.tsx', code);
console.log('done projects/[id]/page.tsx');
