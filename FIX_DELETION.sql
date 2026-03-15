-- RUN THIS IN SUPABASE SQL EDITOR

-- STEP 1: CREATE TABLES (Make sure these exist first)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comment_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watched_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: ENABLE RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- STEP 3: APPLY POLICIES (One by one)

-- Videos
DROP POLICY IF EXISTS "Enable delete for everyone" ON public.videos;
CREATE POLICY "Enable delete for everyone" ON public.videos FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for everyone" ON public.videos;
CREATE POLICY "Enable read access for everyone" ON public.videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for everyone" ON public.videos;
CREATE POLICY "Enable insert for everyone" ON public.videos FOR INSERT WITH CHECK (true);

-- Comments
DROP POLICY IF EXISTS "Enable delete for everyone" ON public.comments;
CREATE POLICY "Enable delete for everyone" ON public.comments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for everyone" ON public.comments;
CREATE POLICY "Enable read access for everyone" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for everyone" ON public.comments;
CREATE POLICY "Enable insert for everyone" ON public.comments FOR INSERT WITH CHECK (true);

-- Watch History
DROP POLICY IF EXISTS "Enable delete for everyone" ON public.watch_history;
CREATE POLICY "Enable delete for everyone" ON public.watch_history FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for everyone" ON public.watch_history;
CREATE POLICY "Enable read access for everyone" ON public.watch_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for everyone" ON public.watch_history;
CREATE POLICY "Enable insert for everyone" ON public.watch_history FOR INSERT WITH CHECK (true);
