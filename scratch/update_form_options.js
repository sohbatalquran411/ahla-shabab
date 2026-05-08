const fs = require('fs');

// 1. Update types/index.ts
let typesCode = fs.readFileSync('d:/ahla-shabab/src/types/index.ts', 'utf8');
typesCode = typesCode.replace(
  "  updated_at: string",
  "  updated_at: string\n  time_limit?: number | null\n  expires_at?: string | null\n  allow_delete_responses?: boolean\n  randomize_questions?: boolean\n  allow_multiple?: boolean"
);
fs.writeFileSync('d:/ahla-shabab/src/types/index.ts', typesCode);

// 2. Update create/page.tsx
let createCode = fs.readFileSync('d:/ahla-shabab/src/app/forms/create/page.tsx', 'utf8');
createCode = createCode.replace(
  /allow_multiple: boolean\n  image_url: string\n  questions: any\[\]\n\}/,
  "allow_multiple: boolean\n  image_url: string\n  questions: any[]\n  time_limit?: number | null\n  expires_at?: string | null\n  allow_delete_responses?: boolean\n  randomize_questions?: boolean\n}"
);

createCode = createCode.replace(
  "allow_multiple: false,",
  "allow_multiple: false,\n    time_limit: null,\n    expires_at: '',\n    allow_delete_responses: false,\n    randomize_questions: false,"
);

// We need to inject the new settings UI right before the `<div className="space-y-4">` of Questions.
// Let's find "السماح بالتسجيل أكثر من مرة" and insert the new fields after it.
const extraSettingsUI = `
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">السماح بحذف الردود</h3>
                    <p className="text-sm text-gray-500">تمكين المستخدم من حذف استجابته لهذا النموذج</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_delete_responses}
                      onChange={(e) => setFormData({ ...formData, allow_delete_responses: e.target.checked })}
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
                      checked={formData.randomize_questions}
                      onChange={(e) => setFormData({ ...formData, randomize_questions: e.target.checked })}
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
                      value={formData.time_limit || ''}
                      onChange={(e) => setFormData({ ...formData, time_limit: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ ووقت انتهاء صلاحية النموذج
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expires_at || ''}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value || null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
`;

createCode = createCode.replace(
  /<\/div>\s*<\/div>\s*\{!\(formData as any\)\.hideQuestions &&/g,
  `</div>\n${extraSettingsUI}\n              </div>\n\n              {!(formData as any).hideQuestions &&`
);

// We need to pass the new fields to supabase insert
createCode = createCode.replace(
  "target_gender: formData.target_gender,",
  "target_gender: formData.target_gender,\n          allow_multiple: formData.allow_multiple,\n          time_limit: formData.time_limit,\n          expires_at: formData.expires_at || null,\n          allow_delete_responses: formData.allow_delete_responses,\n          randomize_questions: formData.randomize_questions,"
);

fs.writeFileSync('d:/ahla-shabab/src/app/forms/create/page.tsx', createCode);

console.log('done create/page.tsx');
