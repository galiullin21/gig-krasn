import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
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

function parseRussianDate(text: string): string | null {
  const months: Record<string, string> = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
  };

  const match = text.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = months[match[2].toLowerCase()];
    const year = match[3];
    return `${year}-${month}-${day}T12:00:00Z`;
  }
  return null;
}

function isInDateRange(dateStr: string, startDate: Date, endDate: Date): boolean {
  const date = new Date(dateStr);
  return date >= startDate && date <= endDate;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ru-RU,ru;q=0.9'
      }
    });
    if (!response.ok) return null;
    return await response.text();
  } catch (e) {
    console.error(`Failed to fetch ${url}:`, e);
    return null;
  }
}

function extractArticleLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /href="([^"]*nid-\d+\.html)"/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let href = match[1];
    if (!href.startsWith('http')) {
      href = href.startsWith('/') ? baseUrl + href : baseUrl + '/' + href;
    }
    if (!href.includes('#') && !links.includes(href)) {
      links.push(href);
    }
  }
  return links;
}

function parseArticlePage(html: string, url: string): ScrapedArticle | null {
  const h1Match = html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                  html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let title = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  title = title.replace(/\s+/g, ' ').trim();
  if (!title || title.length < 5) return null;

  const dateMatch = html.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                    html.match(/<time[^>]*>([\s\S]*?)<\/time>/i) ||
                    html.match(/(\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})/i);
  
  const dateText = dateMatch ? dateMatch[1] || dateMatch[0] : '';
  const publishedAt = parseRussianDate(dateText);

  const contentMatch = html.match(/<div[^>]*class="[^"]*(?:article-body|content-body|news-body|text-body|article_text|news_text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  
  let content = contentMatch ? contentMatch[1] : '';
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  
  const lead = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300);

  const imgMatch = html.match(/<img[^>]*class="[^"]*(?:article|news|main|cover)[^"]*"[^>]*src="([^"]+)"/i) ||
                   html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                   html.match(/<img[^>]*src="(https?:\/\/[^"]*(?:\.jpg|\.jpeg|\.png|\.webp))"/i);
  
  let coverImage = imgMatch ? imgMatch[1] : undefined;
  if (coverImage && !coverImage.startsWith('http')) {
    coverImage = 'https://www.gig26.ru' + (coverImage.startsWith('/') ? '' : '/') + coverImage;
  }

  const type: 'news' | 'blog' = url.includes('/statii/') || url.includes('/spetsproekty/') ? 'blog' : 'news';

  return {
    title,
    content,
    lead,
    cover_image: coverImage,
    published_at: publishedAt || new Date().toISOString(),
    url,
    type
  };
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

async function runImport(supabaseUrl: string, supabaseKey: string, startDateStr?: string, endDateStr?: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const startDate = new Date(startDateStr || '2025-11-01');
  const endDate = new Date(endDateStr || '2025-12-23');
  
  console.log(`Starting full import from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  const baseUrl = 'https://www.gig26.ru';
  const allArticleUrls: string[] = [];

  const categories = [
    '/news/obschestvo', '/news/kultura', '/news/meditsina', '/news/proishestviya',
    '/news/obrazovanie', '/news/politika', '/news/sport', '/news/ekonomika', '/news/vazhno',
    '/statii/obschestvo', '/statii/kultura', '/statii/sport',
    '/spetsproekty/litsa_goroda', '/spetsproekty/zheleznogortsy_vy_horoshie'
  ];

  for (const category of categories) {
    for (let page = 1; page <= 5; page++) {
      const pageUrl = page === 1 ? `${baseUrl}${category}` : `${baseUrl}${category}/page/${page}`;
      const html = await fetchPage(pageUrl);
      if (html) {
        const links = extractArticleLinks(html, baseUrl);
        for (const link of links) {
          if (!allArticleUrls.includes(link)) {
            allArticleUrls.push(link);
          }
        }
      }
      await new Promise(r => setTimeout(r, 50));
    }
  }

  console.log(`Discovered ${allArticleUrls.length} article URLs`);

  let imported = 0, skipped = 0, outOfRange = 0, errors = 0;

  for (const articleUrl of allArticleUrls) {
    try {
      const html = await fetchPage(articleUrl);
      if (!html) { errors++; continue; }

      const article = parseArticlePage(html, articleUrl);
      if (!article) { skipped++; continue; }

      if (!isInDateRange(article.published_at, startDate, endDate)) {
        outOfRange++;
        continue;
      }

      const table = article.type === 'news' ? 'news' : 'blogs';
      const { data: existing } = await supabase.from(table).select('id').eq('title', article.title).limit(1);

      if (existing && existing.length > 0) { skipped++; continue; }

      const slug = generateSlug(article.title) + '-' + Date.now();

      if (table === 'news') {
        const { error } = await supabase.from('news').insert({
          title: article.title,
          slug,
          content: article.content,
          lead: article.lead,
          cover_image: article.cover_image,
          status: 'published',
          published_at: article.published_at,
          views_count: 0,
        });
        if (error) { console.error(`Insert error: ${error.message}`); errors++; }
        else { imported++; console.log(`Imported news: ${article.title}`); }
      } else {
        const { error } = await supabase.from('blogs').insert({
          title: article.title,
          slug,
          content: article.content,
          cover_image: article.cover_image,
          status: 'published',
          published_at: article.published_at,
          views_count: 0,
        });
        if (error) { console.error(`Insert error: ${error.message}`); errors++; }
        else { imported++; console.log(`Imported blog: ${article.title}`); }
      }

      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.error(`Error: ${e}`);
      errors++;
    }
  }

  console.log(`Import complete: ${imported} imported, ${skipped} skipped, ${outOfRange} out of range, ${errors} errors`);
  return { imported, skipped, outOfRange, errors, totalUrls: allArticleUrls.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, url: articleUrl, startDate: startDateParam, endDate: endDateParam } = body;

    if (action === 'full-import') {
      // Start background task with optional date params
      EdgeRuntime.waitUntil(runImport(supabaseUrl, supabaseKey, startDateParam, endDateParam));
      
      return new Response(
        JSON.stringify({ success: true, message: 'Import started in background. Check logs for progress.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scrape-single' && articleUrl) {
      const html = await fetchPage(articleUrl);
      if (!html) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch page' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const article = parseArticlePage(html, articleUrl);
      return new Response(
        JSON.stringify({ success: true, article }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'discover') {
      const baseUrl = 'https://www.gig26.ru';
      const html = await fetchPage(baseUrl);
      if (!html) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch main page' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const links = extractArticleLinks(html, baseUrl);
      return new Response(
        JSON.stringify({ success: true, urls: links }),
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
