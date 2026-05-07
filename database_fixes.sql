-- إضافة الأعمدة الناقصة لجدول forms
-- Add missing columns to forms table

-- إضافة عمود allow_multiple إذا لم يكن موجود
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT false;

-- إضافة عمود target_gender إذا لم يكن موجود  
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS target_gender VARCHAR(10) DEFAULT 'both' CHECK (target_gender IN ('male', 'female', 'both'));

-- إضافة عمود description إذا لم يكن موجود
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS description TEXT;

-- إضافة عمود instructions إذا لم يكن موجود
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- إضافة عمود max_attempts إذا لم يكن موجود
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;

-- إضافة عمود show_results إذا لم يكن موجود
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;

-- إضافة عمود time_limit إذا لم يكن موجود (بالدقائق)
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS time_limit INTEGER;

-- إضافة عمود randomize_questions إذا لم يكن موجود
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT false;

-- إضافة عمود pass_score إذا لم يكن موجود (النسبة المئوية للنجاح)
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS pass_score DECIMAL(5,2) DEFAULT 0.00;

-- تحديث البيانات الموجودة
UPDATE forms 
SET 
  allow_multiple = false,
  target_gender = 'both',
  max_attempts = 1,
  show_results = true,
  randomize_questions = false,
  pass_score = 0.00
WHERE 
  allow_multiple IS NULL 
  OR target_gender IS NULL 
  OR max_attempts IS NULL 
  OR show_results IS NULL 
  OR randomize_questions IS NULL 
  OR pass_score IS NULL;

-- إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_forms_target_gender ON forms(target_gender);
CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_forms_project_id ON forms(project_id);

-- إضافة تعليق على الجدول
COMMENT ON TABLE forms IS 'جدول النماذج والاستبيانات';
COMMENT ON COLUMN forms.allow_multiple IS 'السماح بإجابات متعددة للسؤال الواحد';
COMMENT ON COLUMN forms.target_gender IS 'الجنس المستهدف: male, female, both';
COMMENT ON COLUMN forms.description IS 'وصف النموذج';
COMMENT ON COLUMN forms.instructions IS 'تعليمات ملء النموذج';
COMMENT ON COLUMN forms.max_attempts IS 'عدد المحاولات المسموحة';
COMMENT ON COLUMN forms.show_results IS 'إظهار النتائج للمستخدم';
COMMENT ON COLUMN forms.time_limit IS 'الحد الزمني بالدقائق';
COMMENT ON COLUMN forms.randomize_questions IS 'ترتيب الأسئلة عشوائياً';
COMMENT ON COLUMN forms.pass_score IS 'درجة النجاح (نسبة مئوية)';