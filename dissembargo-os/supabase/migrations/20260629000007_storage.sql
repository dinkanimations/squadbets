-- Storage buckets for Dissembargo OS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'email-attachments',
    'email-attachments',
    false,
    26214400,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'project-assets',
    'project-assets',
    false,
    104857600,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'video/mp4',
      'video/quicktime',
      'application/zip'
    ]
  ),
  (
    'documents',
    'documents',
    false,
    52428800,
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  )
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can manage files in all buckets
CREATE POLICY "storage_authenticated_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id IN ('email-attachments', 'project-assets', 'documents'));

CREATE POLICY "storage_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('email-attachments', 'project-assets', 'documents'));

CREATE POLICY "storage_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('email-attachments', 'project-assets', 'documents'))
  WITH CHECK (bucket_id IN ('email-attachments', 'project-assets', 'documents'));

CREATE POLICY "storage_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('email-attachments', 'project-assets', 'documents'));
