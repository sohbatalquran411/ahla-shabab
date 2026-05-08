const fs = require('fs');

let editCode = fs.readFileSync('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx', 'utf8');

// The FormData type might not be explicitly declared like in create/page.tsx, it might just use `form`.
// In edit/page.tsx, it usually has `const [form, setForm] = useState<any>(null)`. Let's assume it's `form`.
const extraSettingsUI = `
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">السماح بحذف الردود</h3>
                    <p className="text-sm text-gray-500">تمكين المستخدم من حذف استجابته لهذا النموذج</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allow_delete_responses || false}
                      onChange={(e) => setForm({ ...form, allow_delete_responses: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">ترتيب عشوائي للأسئلة</h3>
                    <p className="text-sm text-gray-500">سيتم عرض الأسئلة بترتيب مختلف لكل مستخدم</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.randomize_questions || false}
                      onChange={(e) => setForm({ ...form, randomize_questions: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وقت محدد للإجابة (بالدقائق)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="اتركه فارغاً لعدم تحديد وقت"
                      value={form.time_limit || ''}
                      onChange={(e) => setForm({ ...form, time_limit: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ ووقت انتهاء صلاحية النموذج
                    </label>
                    <input
                      type="datetime-local"
                      value={form.expires_at ? new Date(form.expires_at).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setForm({ ...form, expires_at: e.target.value || null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
`;

editCode = editCode.replace(
  /<\/div>\s*<\/div>\s*\{!\(form as any\)\.hideQuestions &&/g,
  `</div>\n${extraSettingsUI}\n              </div>\n\n              {!(form as any).hideQuestions &&`
);

// add to supabase update
editCode = editCode.replace(
  "target_gender: form.target_gender,",
  "target_gender: form.target_gender,\n          time_limit: form.time_limit,\n          expires_at: form.expires_at || null,\n          allow_delete_responses: form.allow_delete_responses,\n          randomize_questions: form.randomize_questions,\n          allow_multiple: form.allow_multiple,"
);

fs.writeFileSync('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx', editCode);
console.log('done edit/page.tsx');
