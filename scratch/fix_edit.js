const fs = require('fs');
let code = fs.readFileSync('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx', 'utf8');

code = code.replace(
  /\{\(question\.type === 'single_choice' \|\| question\.type === 'multiple_choice'\) && \(/,
  `{(question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'dropdown' || question.type === 'ranking' || question.type === 'matrix') && (`
);

code = code.replace(
  /className="mr-11 space-y-3"/g,
  `className="ms-2 sm:ms-11 space-y-3"`
);

code = code.replace(
  /<p className="text-sm font-medium text-gray-700">الخيارات:<\/p>/,
  `<p className="text-sm font-medium text-gray-700">{question.type === 'matrix' ? 'الأسئلة الفرعية (الصفوف):' : 'الخيارات:'}</p>`
);

code = code.replace(
  /question\.type === 'single_choice' \? '○' \: '☐'/,
  `question.type === 'single_choice' || question.type === 'matrix' ? '○' : question.type === 'ranking' ? '#' : '☑'`
);

code = code.replace(
  /className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"/g,
  `className="w-full sm:flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"`
);

code = code.replace(
  /className="flex items-center gap-3"/g,
  `className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3"`
);

const subOptionsInjection = `
                        {/* Sub-options for nested choices or Matrix columns */}
                        {(question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'matrix') && (
                          <div className="mt-3 ms-2 sm:ms-6 space-y-2 overflow-x-hidden">
                            <button
                              onClick={() => addSubOption(qIndex, oIndex)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              {question.type === 'matrix' ? 'إضافة عمود خيارات' : 'إضافة خيارات فرعية'}
                            </button>
                            
                            {option.sub_options && option.sub_options.length > 0 && (
                              <div className="bg-amber-50 rounded-lg p-2 space-y-2 border border-amber-200 overflow-x-auto">
                                <p className="text-xs text-amber-700 font-medium">{question.type === 'matrix' ? 'الأعمدة:' : 'خيارات فرعية:'}</p>
                                {option.sub_options.map((subOpt, sIndex) => (
                                  <div key={subOpt.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-lg p-2 min-w-[200px]">
                                    <span className="text-gray-400 text-sm">↳</span>
                                    <input
                                      type="text"
                                      value={subOpt.text}
                                      onChange={(e) => updateSubOption(qIndex, oIndex, sIndex, { text: e.target.value })}
                                      placeholder="خيار فرعي..."
                                      className="w-full sm:flex-1 min-w-[120px] px-2 py-1 border border-gray-200 rounded text-sm"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      value={subOpt.points}
                                      onChange={(e) => updateSubOption(qIndex, oIndex, sIndex, { points: Number(e.target.value) })}
                                      className="w-16 px-1 py-1 border border-gray-200 rounded text-sm text-center"
                                      title="النقاط"
                                    />
                                    <button
                                      onClick={() => removeSubOption(qIndex, oIndex, sIndex)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
`;

code = code.replace(
  /<\/div>\s*<\/div>\s*\}\)\)/,
  `</div>\n${subOptionsInjection}\n</div>\n}))`
);

fs.writeFileSync('d:/ahla-shabab/src/app/forms/[id]/edit/page.tsx', code);
console.log('done');
