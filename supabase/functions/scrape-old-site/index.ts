import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedArticle {
  title: string;
  content: string;
  lead?: string;
  cover_image?: string;
  published_at: string;
  url: string;
  type: 'news' | 'blog';
}

function extractDate(text: string): string | null {
  // Try to find date patterns like "25 ноября 2024", "25.11.2024", etc.
  const months: Record<string, string> = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
  };

  // Pattern: "25 ноября 2024"
  const russianDateMatch = text.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i);
  if (russianDateMatch) {
    const day = russianDateMatch[1].padStart(2, '0');
    const month = months[russianDateMatch[2].toLowerCase()];
    const year = russianDateMatch[3];
    return `${year}-${month}-${day}T12:00:00Z`;
  }

  // Pattern: "25.11.2024"
  const dotDateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotDateMatch) {
    const day = dotDateMatch[1].padStart(2, '0');
    const month = dotDateMatch[2].padStart(2, '0');
    const year = dotDateMatch[3];
    return `${year}-${month}-${day}T12:00:00Z`;
  }

  return null;
}

function parseHTML(html: string): { title: string; content: string; date: string | null; image: string | null } {
  // Extract title
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || 
                     html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // Extract main content - look for article, main content areas
  const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                       html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  
  let content = contentMatch ? contentMatch[1] : '';
  
  // Clean up content - remove scripts and styles
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
  content = content.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  content = content.replace(/<footer[\s\S]*?<\/footer>/gi, '');

  // Extract date from content
  const date = extractDate(html);

  // Extract cover image
  const imageMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*>/i) ||
                     html.match(/og:image[^>]*content="([^"]+)"/i);
  const image = imageMatch ? imageMatch[1] : null;

  return { title, content, date, image };
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) return null;
    return await response.text();
  } catch (e) {
    console.error(`Failed to fetch ${url}:`, e);
    return null;
  }
}

async function scrapeListPage(baseUrl: string, listPath: string): Promise<string[]> {
  const html = await fetchPage(`${baseUrl}${listPath}`);
  if (!html) return [];

  // Find all article links
  const links: string[] = [];
  const linkMatches = html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>/gi);
  
  for (const match of linkMatches) {
    const href = match[1];
    // Filter for article-like links
    if (href.includes('/news/') || href.includes('/blog/') || 
        href.includes('/article/') || href.includes('/post/') ||
        href.match(/\/\d{4}\/\d{2}\//) || href.match(/\d+\.html?$/)) {
      // Make absolute URL
      const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? href : '/' + href}`;
      if (!links.includes(fullUrl) && fullUrl.includes(baseUrl.replace('https://', '').replace('http://', ''))) {
        links.push(fullUrl);
      }
    }
  }

  return links;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, url, startMonth, endMonth, year } = await req.json();

    if (action === 'discover') {
      // Discover article URLs from the site
      const baseUrl = 'https://www.gig26.ru';
      const allLinks: string[] = [];

      // Try common list page patterns
      const listPaths = [
        '/',
        '/news/',
        '/blog/',
        '/articles/',
        '/novosti/',
        '/stati/',
      ];

      // Also try paginated versions
      for (let page = 1; page <= 10; page++) {
        listPaths.push(`/news/page/${page}/`);
        listPaths.push(`/blog/page/${page}/`);
        listPaths.push(`/?page=${page}`);
      }

      for (const path of listPaths) {
        const links = await scrapeListPage(baseUrl, path);
        for (const link of links) {
          if (!allLinks.includes(link)) {
            allLinks.push(link);
          }
        }
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 200));
      }

      console.log(`Discovered ${allLinks.length} potential article URLs`);

      return new Response(
        JSON.stringify({ success: true, urls: allLinks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scrape') {
      // Scrape a single URL
      if (!url) {
        return new Response(
          JSON.stringify({ success: false, error: 'URL required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const html = await fetchPage(url);
      if (!html) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch page' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const parsed = parseHTML(html);

      // Filter by date if specified
      if (parsed.date && startMonth && endMonth && year) {
        const articleDate = new Date(parsed.date);
        const startDate = new Date(`${year}-${startMonth}-01`);
        const endDate = new Date(`${year}-${endMonth}-31`);
        
        if (articleDate < startDate || articleDate > endDate) {
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: 'Out of date range' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const article: ScrapedArticle = {
        title: parsed.title,
        content: parsed.content,
        lead: parsed.content.replace(/<[^>]+>/g, '').substring(0, 200),
        cover_image: parsed.image || undefined,
        published_at: parsed.date || new Date().toISOString(),
        url: url,
        type: url.includes('blog') ? 'blog' : 'news'
      };

      return new Response(
        JSON.stringify({ success: true, article }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import') {
      // Import scraped articles into the database
      const { articles, contentType } = await req.json() as { articles: ScrapedArticle[]; contentType: 'news' | 'blogs' };

      if (!articles || !Array.isArray(articles)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Articles array required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let inserted = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const article of articles) {
        try {
          // Check if exists
          const { data: existing } = await supabase
            .from(contentType)
            .select('id')
            .eq('title', article.title)
            .limit(1);

          if (existing && existing.length > 0) {
            skipped++;
            continue;
          }

          // Generate slug
          const slug = article.title
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
            .substring(0, 100) + '-' + Date.now();

          const insertData: Record<string, unknown> = {
            title: article.title,
            slug: slug,
            content: article.content,
            cover_image: article.cover_image,
            status: 'published',
            published_at: article.published_at,
            views_count: 0,
          };

          if (contentType === 'news') {
            insertData.lead = article.lead || article.content?.substring(0, 200) || '';
          }

          const { error } = await supabase.from(contentType).insert(insertData);

          if (error) {
            errors.push(`${article.title}: ${error.message}`);
          } else {
            inserted++;
          }
        } catch (e) {
          errors.push(`${article.title}: ${(e as Error).message}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, inserted, skipped, errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
