-- Table for admin actions/activity log
CREATE TABLE public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for admin notifications (separate from user notifications)
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin actions policies
CREATE POLICY "Admins can view all actions"
ON public.admin_actions FOR SELECT
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can create actions"
ON public.admin_actions FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

-- Admin notifications policies
CREATE POLICY "Admins can view admin notifications"
ON public.admin_notifications FOR SELECT
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage admin notifications"
ON public.admin_notifications FOR ALL
USING (is_admin_or_editor(auth.uid()));

-- Indexes
CREATE INDEX idx_admin_actions_admin ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created ON public.admin_actions(created_at DESC);
CREATE INDEX idx_admin_notifications_created ON public.admin_notifications(created_at DESC);