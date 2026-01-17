import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GalleryEntry {
  title: string;
  description?: string;
  cover_image: string;
  images: string[];
  type?: string;
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

async function fetchGalleryImages(galleryUrl: string): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // Fetch gallery page
    const response = await fetch(galleryUrl);
    if (!response.ok) return images;
    
    const html = await response.text();
    
    // Extract full-size image URLs from links
    // Pattern: https://www.gig26.ru/UserFiles/gallery/XXX/img_XXXX.JPG
    const regex = /https:\/\/www\.gig26\.ru\/UserFiles\/gallery\/\d+\/img_\d+\.(?:JPG|jpg|jpeg|png|gif)/gi;
    const matches = html.match(regex);
    
    if (matches) {
      // Remove duplicates and filter out mini versions
      const uniqueImages = [...new Set(matches)].filter(url => !url.includes('_mini'));
      images.push(...uniqueImages);
    }
    
    // Check if there are more pages
    const pageMatch = html.match(/Последняя.*?cid-\d+_p-(\d+)/);
    if (pageMatch) {
      const lastPage = parseInt(pageMatch[1]);
      const baseUrl = galleryUrl.replace('.html', '');
      
      for (let i = 1; i <= lastPage; i++) {
        const pageUrl = `${baseUrl}_p-${i}.html`;
        console.log(`Fetching page ${i + 1}: ${pageUrl}`);
        
        const pageResponse = await fetch(pageUrl);
        if (pageResponse.ok) {
          const pageHtml = await pageResponse.text();
          const pageMatches = pageHtml.match(regex);
          
          if (pageMatches) {
            const uniquePageImages = [...new Set(pageMatches)].filter(url => !url.includes('_mini'));
            for (const img of uniquePageImages) {
              if (!images.includes(img)) {
                images.push(img);
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error(`Error fetching images from ${galleryUrl}:`, e);
  }
  
  return images;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { galleries, fetchImages = false } = await req.json() as { 
      galleries: GalleryEntry[];
      fetchImages?: boolean;
    };

    if (!galleries || !Array.isArray(galleries)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid galleries data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting import of ${galleries.length} galleries...`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of galleries) {
      try {
        // Check if already exists by title
        const { data: existing } = await supabase
          .from('galleries')
          .select('id, images')
          .eq('title', item.title)
          .limit(1);

        const imagesToUse = item.images && item.images.length > 0 ? item.images : [];

        if (existing && existing.length > 0) {
          // Update existing gallery if it has no images but we have some
          const existingImages = existing[0].images as string[] || [];
          if (existingImages.length === 0 && imagesToUse.length > 0) {
            const { error } = await supabase
              .from('galleries')
              .update({
                images: imagesToUse,
                cover_image: item.cover_image || imagesToUse[0],
              })
              .eq('id', existing[0].id);
            
            if (error) {
              errors.push(`Update ${item.title}: ${error.message}`);
            } else {
              updated++;
            }
          } else {
            skipped++;
          }
          continue;
        }

        const slug = generateSlug(item.title) + '-' + Date.now();

        const { error } = await supabase
          .from('galleries')
          .insert({
            title: item.title,
            slug: slug,
            cover_image: item.cover_image || (imagesToUse.length > 0 ? imagesToUse[0] : null),
            type: item.type || 'photo',
            views_count: 0,
            images: imagesToUse,
            published_at: new Date().toISOString(),
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

    console.log(`Import complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ success: true, inserted, updated, skipped, errors }),
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
