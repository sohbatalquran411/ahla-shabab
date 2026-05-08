const fs = require('fs');
for (const file of ['d:/ahla-shabab/src/app/forms/create/page.tsx', 'd:/ahla-shabab/src/app/forms/[id]/edit/page.tsx']) {
  let code = fs.readFileSync(file, 'utf8');

  // Replace the sub-options logic inside the options map
  const regex = /\{\/\* Sub-options for nested choices or Matrix columns \*\/\}[\s\S]*?\{\/\* Scale Options \*\/\}/g;

  code = code.replace(regex, `
                        {/* Sub-options for nested choices (only for single/multiple choice) */}
                        {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                          <div className="mt-3 ms-2 sm:ms-6 space-y-2 overflow-x-hidden">
                            <button
                              onClick={() => addSubOption(qIndex, oIndex)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              إضافة خيارات فرعية
                            </button>
                            
                            {(option.sub_options || []).length > 0 && (
                              <div className="bg-amber-50 rounded-lg p-2 space-y-2 border border-amber-200 overflow-x-auto">
                                <p className="text-xs text-amber-700 font-medium">خيارات فرعية:</p>
                                {(option.sub_options || []).map((subOpt, sIndex) => (
                                  <div key={subOpt.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-lg p-2 min-w-min">
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
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addOption(qIndex)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {question.type === 'matrix' ? 'إضافة صف جديد' : 'إضافة خيار'}
                    </button>
                  </div>
                )}

                {/* Matrix Columns */}
                {question.type === 'matrix' && (
                  <div className="ms-2 sm:ms-11 space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-4">
                    <p className="text-sm font-medium text-blue-800">الأعمدة (الخيارات المشتركة للتقييم):</p>
                    {question.options.length > 0 && (question.options[0].sub_options || []).map((col, cIndex) => (
                      <div key={col.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-lg p-2 border border-blue-200">
                        <span className="text-blue-400 text-sm font-bold w-6">C{cIndex + 1}</span>
                        <input
                          type="text"
                          value={col.text}
                          onChange={(e) => updateSubOption(qIndex, 0, cIndex, { text: e.target.value })}
                          placeholder="اسم العمود (مثال: ممتاز، جيد جداً)..."
                          className="w-full sm:flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          min="0"
                          value={col.points}
                          onChange={(e) => updateSubOption(qIndex, 0, cIndex, { points: Number(e.target.value) })}
                          placeholder="النقاط"
                          className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-center"
                          title="النقاط"
                        />
                        <button
                          onClick={() => removeSubOption(qIndex, 0, cIndex)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => {
                        if (question.options.length === 0) addOption(qIndex); // ensure at least one row exists
                        setTimeout(() => addSubOption(qIndex, 0), 0);
                      }}
                      className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      إضافة عمود
                    </button>
                  </div>
                )}

                {/* Scale Options */}`);
  fs.writeFileSync(file, code);
}
console.log('done');
