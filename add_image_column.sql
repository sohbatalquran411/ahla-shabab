-- إضافة عمود الصورة لجدول المشاريع (آمن لو العمود موجود بالفعل)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- إضافة تعليق للعمود
COMMENT ON COLUMN projects.image_url IS 'رابط صورة المشروع';

-- إضافة عمود الصورة لجدول الفورمز (آمن لو العمود موجود بالفعل)
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- إضافة تعليق للعمود
COMMENT ON COLUMN forms.image_url IS 'رابط صورة الفورم';