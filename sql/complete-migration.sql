-- ============================================================
-- COMPLETE MERGED MIGRATION — جميع التعديلات في ملف واحد
-- آمن لإعادة التشغيل (idempotent)
-- تم دمج 10 ملفات في ملف واحد شامل
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

-- Assumes user_role enum exists with values: 'admin', 'supervisor', 'volunteer'


-- ============================================================
-- 2. TABLES (CREATE TABLE IF NOT EXISTS)
-- ============================================================

-- Project invites (دعوات المشاريع)
CREATE TABLE IF NOT EXISTS project_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    max_uses INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-project assignments (تعيينات المستخدمين للمشاريع الخاصة)
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- Lesson comments (تعليقات الدروس)
CREATE TABLE IF NOT EXISTS lesson_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project supervisors (مشرفو المشاريع)
CREATE TABLE IF NOT EXISTS project_supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Project bans (المستخدمون المحظورون من المشاريع)
CREATE TABLE IF NOT EXISTS project_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Notifications (الإشعارات)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences (تفضيلات الإشعارات لكل مستخدم)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- App settings (الإعدادات العامة للتطبيق)
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);


-- ============================================================
-- 3. COLUMNS (ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- Projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS original_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{"forms": true, "curriculum": false}';

COMMENT ON COLUMN projects.image_url IS 'رابط صورة المشروع';

-- Lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'video';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true;

-- Curricula
ALTER TABLE curricula ADD COLUMN IF NOT EXISTS is_sequential BOOLEAN DEFAULT true;

-- Project invites
ALTER TABLE project_invites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- User projects
ALTER TABLE user_projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_projects ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Forms
ALTER TABLE forms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS time_limit INTEGER;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS pass_score DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS allow_delete_responses BOOLEAN DEFAULT false;

COMMENT ON COLUMN forms.image_url IS 'رابط صورة الفورم';
COMMENT ON COLUMN forms.description IS 'وصف النموذج';
COMMENT ON COLUMN forms.instructions IS 'تعليمات ملء النموذج';
COMMENT ON COLUMN forms.allow_multiple IS 'السماح بإجابات متعددة للسؤال الواحد';
COMMENT ON COLUMN forms.max_attempts IS 'عدد المحاولات المسموحة';
COMMENT ON COLUMN forms.show_results IS 'إظهار النتائج للمستخدم';
COMMENT ON COLUMN forms.time_limit IS 'الحد الزمني بالدقائق';
COMMENT ON COLUMN forms.randomize_questions IS 'ترتيب الأسئلة عشوائياً';
COMMENT ON COLUMN forms.pass_score IS 'درجة النجاح (نسبة مئوية)';

-- Questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS points DECIMAL(10,2) DEFAULT 0;

-- Drop deprecated column
ALTER TABLE forms DROP COLUMN IF EXISTS target_gender;

-- Allow NULL youtube_url (non-video lesson types)
ALTER TABLE lessons ALTER COLUMN youtube_url DROP NOT NULL;


-- ============================================================
-- 4. CONSTRAINTS (ALTER TABLE ... DROP CONSTRAINT IF EXISTS
--    / ADD CONSTRAINT ...)
-- ============================================================

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

UPDATE questions
SET type = 'text'
WHERE type NOT IN (
  'text', 'textarea', 'single_choice', 'multiple_choice',
  'scale', 'ranking', 'matrix', 'dropdown',
  'date', 'time', 'file_upload'
);

ALTER TABLE questions ADD CONSTRAINT questions_type_check
  CHECK (type IN (
    'text', 'textarea', 'single_choice', 'multiple_choice',
    'scale', 'ranking', 'matrix', 'dropdown',
    'date', 'time', 'file_upload'
  ));

COMMENT ON TABLE forms IS 'جدول النماذج والاستبيانات';


-- ============================================================
-- 5. FUNCTIONS (CREATE OR REPLACE FUNCTION)
-- ============================================================

-- Drop the auto-create trigger function (safe re-run)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Function to join a project via invite token
CREATE OR REPLACE FUNCTION public.join_project_via_invite(invite_token TEXT)
RETURNS JSONB AS $$
DECLARE
    inv project_invites%ROWTYPE;
    result JSONB;
BEGIN
    SELECT * INTO inv FROM project_invites WHERE token = invite_token;

    IF inv.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invite_not_found');
    END IF;

    IF inv.expires_at IS NOT NULL AND inv.expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'invite_expired');
    END IF;

    IF inv.max_uses > 0 AND inv.use_count >= inv.max_uses THEN
        RETURN jsonb_build_object('success', false, 'error', 'invite_max_uses');
    END IF;

    INSERT INTO user_projects (user_id, project_id)
    VALUES (auth.uid(), inv.project_id)
    ON CONFLICT (user_id, project_id) DO NOTHING;

    UPDATE project_invites SET use_count = use_count + 1 WHERE id = inv.id;

    RETURN jsonb_build_object('success', true, 'project_id', inv.project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 6. RLS (ROW LEVEL SECURITY + POLICIES)
-- ============================================================

-- ==================== project_invites ====================
ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view invites by token" ON project_invites;
CREATE POLICY "Anyone can view invites by token" ON project_invites FOR SELECT USING (true);

DROP POLICY IF EXISTS "Supervisors and admins can manage invites" ON project_invites;
CREATE POLICY "Supervisors and admins can manage invites" ON project_invites FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role))
);

-- ==================== user_projects ====================
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project assignments" ON user_projects;
CREATE POLICY "Users can view own project assignments" ON user_projects FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all assignments" ON user_projects;
CREATE POLICY "Admins can view all assignments" ON user_projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
);

DROP POLICY IF EXISTS "Anyone can insert own via RPC" ON user_projects;
CREATE POLICY "Anyone can insert own via RPC" ON user_projects FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==================== lesson_comments ====================
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON lesson_comments;
CREATE POLICY "Anyone can view comments" ON lesson_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own comments" ON lesson_comments;
CREATE POLICY "Users can create own comments" ON lesson_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete comments" ON lesson_comments;
CREATE POLICY "Admins can delete comments" ON lesson_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
);

-- ==================== project_supervisors ====================
ALTER TABLE project_supervisors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view supervisors" ON project_supervisors;
CREATE POLICY "Anyone can view supervisors" ON project_supervisors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Supervisors and admins can manage supervisors" ON project_supervisors;
CREATE POLICY "Supervisors and admins can manage supervisors" ON project_supervisors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- ==================== project_bans ====================
ALTER TABLE project_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view bans" ON project_bans;
CREATE POLICY "Anyone can view bans" ON project_bans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Supervisors and admins can manage bans" ON project_bans;
CREATE POLICY "Supervisors and admins can manage bans" ON project_bans FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- ==================== notifications ====================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ==================== notification_preferences ====================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own preferences" ON notification_preferences;
CREATE POLICY "Users can manage own preferences" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can read preferences" ON notification_preferences;
CREATE POLICY "System can read preferences" ON notification_preferences FOR SELECT USING (true);

-- ==================== app_settings ====================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to app_settings" ON app_settings;
CREATE POLICY "Allow read access to app_settings" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update app_settings" ON app_settings;
CREATE POLICY "Allow admin update app_settings" ON app_settings FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ==================== projects ====================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- SELECT: public view (non-archived, non-private, with bans/supervisors checks)
DROP POLICY IF EXISTS "Anyone can view public projects" ON projects;
CREATE POLICY "Anyone can view public projects" ON projects FOR SELECT USING (
    is_archived = false
    AND (
        visibility IS DISTINCT FROM 'private'
        OR EXISTS (SELECT 1 FROM user_projects WHERE user_projects.project_id = projects.id AND user_projects.user_id = auth.uid() AND (user_projects.expires_at IS NULL OR user_projects.expires_at > NOW()))
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
        OR EXISTS (SELECT 1 FROM project_supervisors WHERE project_supervisors.project_id = projects.id AND project_supervisors.user_id = auth.uid())
    )
    AND NOT EXISTS (SELECT 1 FROM project_bans WHERE project_bans.project_id = projects.id AND project_bans.user_id = auth.uid())
);

-- SELECT: admins can view archived
DROP POLICY IF EXISTS "Admins can view archived" ON projects;
CREATE POLICY "Admins can view archived" ON projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- INSERT: supervisors and admins can create
DROP POLICY IF EXISTS "Supervisors and admins can create projects" ON projects;
CREATE POLICY "Supervisors and admins can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
    AND profiles.status = 'approved'
  )
);

-- UPDATE: broad role-based (approved supervisors/admins)
DROP POLICY IF EXISTS "Admins and supervisors can update projects" ON projects;
CREATE POLICY "Admins and supervisors can update projects"
ON projects FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
    AND profiles.status = 'approved'
  )
);

-- UPDATE: creator / project_supervisors
DROP POLICY IF EXISTS "Supervisors can update their projects" ON projects;
CREATE POLICY "Supervisors can update their projects" ON projects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM project_supervisors WHERE project_supervisors.project_id = projects.id AND project_supervisors.user_id = auth.uid())
);

-- DELETE: admins only (approved)
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
CREATE POLICY "Admins can delete projects"
ON projects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'approved'
  )
);

-- DELETE: admin-only (legacy, without status check — kept for backward compat)
DROP POLICY IF EXISTS "Admins manage projects" ON projects;
CREATE POLICY "Admins manage projects" ON projects FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==================== profiles ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert Profiles Policy" ON public.profiles;
CREATE POLICY "Insert Profiles Policy"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);


-- ============================================================
-- 7. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TRIGGER IF EXISTS update_project_invites_updated_at ON project_invites;
CREATE TRIGGER update_project_invites_updated_at BEFORE UPDATE ON project_invites FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_projects_updated_at ON user_projects;
CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 8. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_forms_project_id ON forms(project_id);
CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_questions_form_id ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON form_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_curricula_project_id ON curricula(project_id);
CREATE INDEX IF NOT EXISTS idx_lessons_curriculum_id ON lessons(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);


-- ============================================================
-- 9. DATA MIGRATION — sub_options to matrix_rows/columns
-- ============================================================

DO $$
DECLARE
    q RECORD;
    rows_data JSONB;
    cols_data JSONB;
BEGIN
    FOR q IN
        SELECT id, options FROM questions
        WHERE type = 'matrix'
        AND jsonb_typeof(options) = 'array'
        AND options IS NOT NULL
        AND options->0 ? 'sub_options' = false
    LOOP
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', elem->>'id',
                'text', elem->>'text',
                'required', COALESCE((elem->>'required')::boolean, false)
            )
        ) INTO rows_data
        FROM jsonb_array_elements(q.options) AS elem
        WHERE NOT (elem ? 'sub_options');

        SELECT elem->'sub_options' INTO cols_data
        FROM jsonb_array_elements(q.options) AS elem
        WHERE elem ? 'sub_options'
        LIMIT 1;

        IF rows_data IS NOT NULL AND cols_data IS NOT NULL THEN
            UPDATE questions
            SET options = jsonb_build_object(
                'matrix_rows', rows_data,
                'matrix_columns', cols_data
            )
            WHERE id = q.id;
        END IF;
    END LOOP;
END $$;


-- ============================================================
-- 10. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Upload policy for project-images
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
CREATE POLICY "Authenticated users can upload project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
    AND profiles.status = 'approved'
  )
);

-- Public read policy for project-images
DROP POLICY IF EXISTS "Public can view project images" ON storage.objects;
CREATE POLICY "Public can view project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Delete policy for project-images
DROP POLICY IF EXISTS "Authenticated users can delete project images" ON storage.objects;
CREATE POLICY "Authenticated users can delete project images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
    AND profiles.status = 'approved'
  )
);


-- ============================================================
-- 11. SEED DATA
-- ============================================================

-- Default notification preferences for existing users
INSERT INTO notification_preferences (user_id, notification_type, enabled)
SELECT p.id, 'assignment', true
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np WHERE np.user_id = p.id AND np.notification_type = 'assignment'
);

-- Default app settings
INSERT INTO app_settings (key, value, description) VALUES
('app_logo', '', 'شعار التطبيق الرئيسي'),
('app_name', 'أوراد أحلى شباب', 'اسم التطبيق'),
('app_description', 'منصة إدارة المشاريع الدعوية', 'وصف التطبيق')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- تم الانتهاء من جميع التعديلات
-- ============================================================
SELECT 'تم تطبيق جميع التعديلات بنجاح ✓' AS result;
