-- إضافة عمود الصورة لجدول المشاريع
ALTER TABLE projects 
ADD COLUMN image_url TEXT;

-- إضافة تعليق للعمود
COMMENT ON COLUMN projects.image_url IS 'رابط صورة المشروع';

-- إضافة عمود الصورة لجدول الفورمز
ALTER TABLE forms 
ADD COLUMN image_url TEXT;

-- إضافة تعليق للعمود
COMMENT ON COLUMN forms.image_url IS 'رابط صورة الفورم';

-- إنشاء جدول الإعدادات العامة للتطبيق
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- إضافة فهرس على المفتاح
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- إضافة الإعدادات الافتراضية
INSERT INTO app_settings (key, value, description) VALUES 
('app_logo', '', 'شعار التطبيق الرئيسي'),
('app_name', 'أوراد أحلى شباب', 'اسم التطبيق'),
('app_description', 'منصة إدارة المشاريع الدعوية', 'وصف التطبيق')
ON CONFLICT (key) DO NOTHING;

-- إضافة سياسة الأمان - القراءة للجميع
CREATE POLICY "Allow read access to app_settings" ON app_settings
    FOR SELECT USING (true);

-- إضافة سياسة الأمان - التعديل للأدمن فقط
CREATE POLICY "Allow admin update app_settings" ON app_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- تفعيل RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;