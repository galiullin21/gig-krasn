-- Table for comments on news and blogs
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('news', 'blog')),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for reactions (like/dislike)
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('news', 'blog', 'comment')),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_type, content_id, user_id)
);

-- Table for warning chat messages
CREATE TABLE public.warning_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warning_id UUID NOT NULL REFERENCES public.user_warnings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warning_messages ENABLE ROW LEVEL SECURITY;

-- Comments RLS policies
CREATE POLICY "Public can view approved comments"
ON public.comments FOR SELECT
USING (is_approved = true);

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
ON public.comments FOR ALL
USING (is_admin_or_editor(auth.uid()));

-- Reactions RLS policies
CREATE POLICY "Public can view reactions"
ON public.reactions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create reactions"
ON public.reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions"
ON public.reactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
ON public.reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Warning messages RLS policies
CREATE POLICY "Users can view messages on own warnings"
ON public.warning_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_warnings
    WHERE id = warning_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages on own warnings"
ON public.warning_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_warnings
    WHERE id = warning_id AND user_id = auth.uid()
  ) AND is_from_admin = false
);

CREATE POLICY "Admins can view all warning messages"
ON public.warning_messages FOR SELECT
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can send warning messages"
ON public.warning_messages FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

-- Trigger for updated_at on comments
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_comments_content ON public.comments(content_type, content_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_reactions_content ON public.reactions(content_type, content_id);
CREATE INDEX idx_warning_messages_warning ON public.warning_messages(warning_id);