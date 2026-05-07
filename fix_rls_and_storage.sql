-- =============================================
-- إصلاح 1: مشكلة RLS عند إضافة صفوف جديدة
-- =============================================

-- السماح للمشرفين والمديرين بإضافة مشاريع
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

-- السماح للمديرين والمشرفين بتحديث المشاريع
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

-- السماح للمديرين بحذف المشاريع
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

-- =============================================
-- إصلاح 2: Storage Bucket للصور
-- =============================================

-- إنشاء الـ bucket لو مش موجود
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- السماح للمديرين والمشرفين برفع الصور
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

-- السماح للجميع بقراءة الصور (Bucket عام)
DROP POLICY IF EXISTS "Public can view project images" ON storage.objects;
CREATE POLICY "Public can view project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- السماح بحذف الصور للمديرين والمشرفين
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
