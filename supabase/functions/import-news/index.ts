import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsEntry {
  title: string;
  lead?: string;
  content: string;
  cover_image?: string;
  published_at: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => {
      const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { news } = await req.json() as { news: NewsEntry[] };

    if (!news || !Array.isArray(news)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid news data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting import of ${news.length} news items...`);

    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of news) {
      try {
        // Check if already exists by title
        const { data: existing } = await supabase
          .from('news')
          .select('id')
          .eq('title', item.title)
          .limit(1);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        const slug = generateSlug(item.title) + '-' + Date.now();

        const { error } = await supabase
          .from('news')
          .insert({
            title: item.title,
            slug: slug,
            lead: item.lead || item.content?.substring(0, 200) || '',
            content: item.content,
            cover_image: item.cover_image,
            status: 'published',
            published_at: item.published_at,
            views_count: 0,
          });

        if (error) {
          errors.push(`${item.title}: ${error.message}`);
        } else {
          inserted++;
        }
      } catch (e) {
        errors.push(`${item.title}: ${(e as Error).message}`);
      }
    }

    console.log(`Import complete: ${inserted} inserted, ${skipped} skipped, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ success: true, inserted, skipped, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
