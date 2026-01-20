const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping article from:', url);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();

    // Extract title
    let title = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // Try to get og:title which is often cleaner
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim();
    }

    // Extract description/lead
    let lead = '';
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (descMatch) {
      lead = descMatch[1].trim();
    }
    
    // Try og:description
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
    if (ogDescMatch) {
      lead = ogDescMatch[1].trim();
    }

    // Extract cover image
    let coverImage = '';
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImageMatch) {
      coverImage = ogImageMatch[1].trim();
      // Make relative URLs absolute
      if (coverImage.startsWith('/')) {
        const urlObj = new URL(url);
        coverImage = `${urlObj.origin}${coverImage}`;
      }
    }

    // Extract main content
    let content = '';
    
    // Try to find article content in common containers
    const articlePatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]+class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
    ];

    for (const pattern of articlePatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 200) {
        content = match[1];
        break;
      }
    }

    // If no article container found, try to get body content
    if (!content) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1];
      }
    }

    // Clean content - remove scripts, styles, comments, and convert to cleaner HTML
    content = content
      // Remove scripts
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      // Remove styles
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove noscript
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      // Remove nav, header, footer, aside
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      // Remove forms
      .replace(/<form[\s\S]*?<\/form>/gi, '')
      // Remove iframes (except youtube/vimeo)
      .replace(/<iframe(?![^>]*(?:youtube|vimeo))[^>]*>[\s\S]*?<\/iframe>/gi, '')
      // Clean up attributes but keep essential ones
      .replace(/<(\w+)[^>]*\s+(src|href)=["']([^"']+)["'][^>]*>/gi, (match, tag, attr, value) => {
        // Make relative URLs absolute
        if (value.startsWith('/')) {
          const urlObj = new URL(url);
          value = `${urlObj.origin}${value}`;
        }
        if (tag.toLowerCase() === 'img') {
          return `<img src="${value}" class="max-w-full rounded-lg my-4">`;
        }
        if (tag.toLowerCase() === 'a') {
          return `<a href="${value}" target="_blank" rel="noopener noreferrer" class="text-primary underline">`;
        }
        return match;
      })
      // Remove empty paragraphs and divs
      .replace(/<(p|div)[^>]*>\s*<\/(p|div)>/gi, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Extract all images from content for gallery
    const images: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      let imgUrl = imgMatch[1];
      // Make relative URLs absolute
      if (imgUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imgUrl = `${urlObj.origin}${imgUrl}`;
      }
      if (!images.includes(imgUrl) && imgUrl !== coverImage) {
        images.push(imgUrl);
      }
    }

    console.log('Article scraped successfully:', { title, leadLength: lead.length, contentLength: content.length, imagesCount: images.length });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title,
          lead,
          content,
          cover_image: coverImage,
          gallery_images: images.slice(0, 10), // Limit to 10 images
          source_url: url,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping article:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape article';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
