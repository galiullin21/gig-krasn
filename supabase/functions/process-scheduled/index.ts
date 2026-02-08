import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledContent {
  id: string;
  title: string;
  slug: string;
  scheduled_at: string;
  scheduled_crosspost: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    console.log(`Processing scheduled content at ${now}`);

    const results = {
      news: [] as string[],
      blogs: [] as string[],
      galleries: [] as string[],
      crossposted: [] as string[],
      errors: [] as string[],
    };

    // Process scheduled news
    const { data: scheduledNews, error: newsError } = await supabase
      .from("news")
      .select("id, title, slug, scheduled_at, scheduled_crosspost")
      .eq("status", "draft")
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (newsError) {
      console.error("Error fetching scheduled news:", newsError);
      results.errors.push(`News fetch error: ${newsError.message}`);
    } else if (scheduledNews && scheduledNews.length > 0) {
      console.log(`Found ${scheduledNews.length} scheduled news items`);
      
      for (const news of scheduledNews as ScheduledContent[]) {
        try {
          // Publish the news
          const { error: updateError } = await supabase
            .from("news")
            .update({
              status: "published",
              published_at: news.scheduled_at,
              scheduled_at: null,
            })
            .eq("id", news.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`Published news: ${news.title} (${news.id})`);
          results.news.push(news.id);

          // Crosspost if enabled
          if (news.scheduled_crosspost) {
            try {
              await crosspostContent(supabase, "news", news.id, supabaseUrl);
              results.crossposted.push(`news:${news.id}`);
            } catch (crosspostError: any) {
              console.error(`Crosspost error for news ${news.id}:`, crosspostError);
              results.errors.push(`Crosspost news ${news.id}: ${crosspostError.message}`);
            }
          }
        } catch (err: any) {
          console.error(`Error publishing news ${news.id}:`, err);
          results.errors.push(`News ${news.id}: ${err.message}`);
        }
      }
    }

    // Process scheduled blogs
    const { data: scheduledBlogs, error: blogsError } = await supabase
      .from("blogs")
      .select("id, title, slug, scheduled_at, scheduled_crosspost")
      .eq("status", "draft")
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (blogsError) {
      console.error("Error fetching scheduled blogs:", blogsError);
      results.errors.push(`Blogs fetch error: ${blogsError.message}`);
    } else if (scheduledBlogs && scheduledBlogs.length > 0) {
      console.log(`Found ${scheduledBlogs.length} scheduled blog items`);
      
      for (const blog of scheduledBlogs as ScheduledContent[]) {
        try {
          const { error: updateError } = await supabase
            .from("blogs")
            .update({
              status: "published",
              published_at: blog.scheduled_at,
              scheduled_at: null,
            })
            .eq("id", blog.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`Published blog: ${blog.title} (${blog.id})`);
          results.blogs.push(blog.id);

          if (blog.scheduled_crosspost) {
            try {
              await crosspostContent(supabase, "blog", blog.id, supabaseUrl);
              results.crossposted.push(`blog:${blog.id}`);
            } catch (crosspostError: any) {
              console.error(`Crosspost error for blog ${blog.id}:`, crosspostError);
              results.errors.push(`Crosspost blog ${blog.id}: ${crosspostError.message}`);
            }
          }
        } catch (err: any) {
          console.error(`Error publishing blog ${blog.id}:`, err);
          results.errors.push(`Blog ${blog.id}: ${err.message}`);
        }
      }
    }

    // Process scheduled galleries
    const { data: scheduledGalleries, error: galleriesError } = await supabase
      .from("galleries")
      .select("id, title, slug, scheduled_at, scheduled_crosspost")
      .is("published_at", null)
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (galleriesError) {
      console.error("Error fetching scheduled galleries:", galleriesError);
      results.errors.push(`Galleries fetch error: ${galleriesError.message}`);
    } else if (scheduledGalleries && scheduledGalleries.length > 0) {
      console.log(`Found ${scheduledGalleries.length} scheduled gallery items`);
      
      for (const gallery of scheduledGalleries as ScheduledContent[]) {
        try {
          const { error: updateError } = await supabase
            .from("galleries")
            .update({
              published_at: gallery.scheduled_at,
              scheduled_at: null,
            })
            .eq("id", gallery.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`Published gallery: ${gallery.title} (${gallery.id})`);
          results.galleries.push(gallery.id);

          if (gallery.scheduled_crosspost) {
            try {
              await crosspostContent(supabase, "gallery", gallery.id, supabaseUrl);
              results.crossposted.push(`gallery:${gallery.id}`);
            } catch (crosspostError: any) {
              console.error(`Crosspost error for gallery ${gallery.id}:`, crosspostError);
              results.errors.push(`Crosspost gallery ${gallery.id}: ${crosspostError.message}`);
            }
          }
        } catch (err: any) {
          console.error(`Error publishing gallery ${gallery.id}:`, err);
          results.errors.push(`Gallery ${gallery.id}: ${err.message}`);
        }
      }
    }

    const totalPublished = results.news.length + results.blogs.length + results.galleries.length;
    console.log(`Processed ${totalPublished} scheduled items, ${results.crossposted.length} crossposted`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_at: now,
        results,
        summary: {
          news_published: results.news.length,
          blogs_published: results.blogs.length,
          galleries_published: results.galleries.length,
          crossposted: results.crossposted.length,
          errors: results.errors.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Process scheduled error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to call crosspost edge function
async function crosspostContent(
  supabase: any,
  contentType: "news" | "blog" | "gallery",
  contentId: string,
  supabaseUrl: string
): Promise<void> {
  console.log(`Crossposting ${contentType}:${contentId}`);
  
  // Fetch crosspost settings
  const { data: settingsData } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "crosspost_vk_group_id",
      "crosspost_vk_access_token",
      "crosspost_ok_application_id",
      "crosspost_ok_application_key",
      "crosspost_ok_application_secret",
      "crosspost_ok_access_token",
      "crosspost_ok_group_id",
    ]);

  const settings: Record<string, string> = {};
  settingsData?.forEach((item: { key: string; value: unknown }) => {
    settings[item.key] = item.value as string;
  });

  const vkConfigured = settings.crosspost_vk_group_id && settings.crosspost_vk_access_token;
  const okConfigured = settings.crosspost_ok_application_key && settings.crosspost_ok_access_token && settings.crosspost_ok_group_id;

  if (!vkConfigured && !okConfigured) {
    console.log("No crosspost platforms configured, skipping");
    return;
  }

  // Get content data
  let tableName = contentType === "blog" ? "blogs" : contentType === "gallery" ? "galleries" : "news";
  let selectColumns = contentType === "gallery" 
    ? "title, slug, cover_image, type" 
    : "title, slug, lead, content, cover_image";

  const { data: contentData, error: contentError } = await supabase
    .from(tableName)
    .select(selectColumns)
    .eq("id", contentId)
    .single();

  if (contentError || !contentData) {
    throw new Error(`Content not found: ${contentError?.message}`);
  }

  const siteUrl = "https://gig26.ru";
  const urlPath = contentType === "blog" ? "blogs" : contentType === "gallery" ? "galleries" : "news";
  const fullUrl = `${siteUrl}/${urlPath}/${contentData.slug}`;

  let description = "";
  if (contentData.lead) {
    description = contentData.lead;
  } else if (contentData.content) {
    const plainText = contentData.content.replace(/<[^>]*>/g, "").trim();
    description = plainText.length > 200 ? plainText.substring(0, 200) + "..." : plainText;
  }

  const emoji = contentType === "news" ? "📰" : contentType === "blog" ? "📝" : "📸";
  const message = `${emoji} ${contentData.title}\n\n${description}\n\n🔗 Читать полностью: ${fullUrl}`;

  // Post to VK
  if (vkConfigured) {
    try {
      const cleanGroupId = settings.crosspost_vk_group_id.replace(/[^0-9]/g, "");
      const vkParams = new URLSearchParams({
        owner_id: `-${cleanGroupId}`,
        from_group: "1",
        message: message,
        access_token: settings.crosspost_vk_access_token,
        v: "5.199",
      });

      const vkRes = await fetch(`https://api.vk.com/method/wall.post?${vkParams}`);
      const vkData = await vkRes.json();

      if (vkData.error) {
        console.error("VK error:", vkData.error);
        await supabase.from("crosspost_logs").insert({
          content_type: contentType,
          content_id: contentId,
          platform: "vk",
          status: "error",
          error_message: vkData.error.error_msg,
        });
      } else {
        console.log("VK post successful:", vkData.response?.post_id);
        await supabase.from("crosspost_logs").insert({
          content_type: contentType,
          content_id: contentId,
          platform: "vk",
          post_id: String(vkData.response?.post_id),
          status: "success",
        });
      }
    } catch (vkError: any) {
      console.error("VK crosspost error:", vkError);
      await supabase.from("crosspost_logs").insert({
        content_type: contentType,
        content_id: contentId,
        platform: "vk",
        status: "error",
        error_message: vkError.message,
      });
    }
  }

  // Post to OK.ru
  if (okConfigured) {
    try {
      const attachment = JSON.stringify({
        media: [
          { type: "text", text: message },
          { type: "link", url: fullUrl },
        ],
      });

      const params: Record<string, string> = {
        method: "mediatopic.post",
        application_key: settings.crosspost_ok_application_key,
        gid: settings.crosspost_ok_group_id,
        type: "GROUP_THEME",
        attachment: attachment,
        format: "json",
      };

      const sig = await calculateOkSignature(params, settings.crosspost_ok_access_token, settings.crosspost_ok_application_secret);

      const okParams = new URLSearchParams({
        ...params,
        sig: sig,
        access_token: settings.crosspost_ok_access_token,
      });

      const okRes = await fetch(`https://api.ok.ru/fb.do?${okParams}`);
      const okData = await okRes.json();

      if (okData.error_code || okData.error_msg) {
        console.error("OK.ru error:", okData);
        await supabase.from("crosspost_logs").insert({
          content_type: contentType,
          content_id: contentId,
          platform: "ok",
          status: "error",
          error_message: okData.error_msg || `Error: ${okData.error_code}`,
        });
      } else {
        console.log("OK.ru post successful:", okData);
        await supabase.from("crosspost_logs").insert({
          content_type: contentType,
          content_id: contentId,
          platform: "ok",
          post_id: String(okData.id || okData),
          status: "success",
        });
      }
    } catch (okError: any) {
      console.error("OK.ru crosspost error:", okError);
      await supabase.from("crosspost_logs").insert({
        content_type: contentType,
        content_id: contentId,
        platform: "ok",
        status: "error",
        error_message: okError.message,
      });
    }
  }
}

// MD5 and OK.ru signature calculation
async function calculateOkSignature(
  params: Record<string, string>,
  accessToken: string,
  applicationSecret: string
): Promise<string> {
  const secretKey = simpleMd5(accessToken + applicationSecret);
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'access_token')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('');
  return simpleMd5(sortedParams + secretKey);
}

function simpleMd5(string: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  function f(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function g(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function h(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function i(x: number, y: number, z: number): number { return y ^ (x | ~z); }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    const lWordCount: number[] = [];
    const lMessageLength = str.length;
    const lNumberOfWords = (((lMessageLength + 8) - ((lMessageLength + 8) % 64)) / 64 + 1) * 16;
    
    for (let i = 0; i < lNumberOfWords; i++) {
      lWordCount[i] = 0;
    }
    
    let lBytePosition = 0;
    let lByteCount = 0;
    
    while (lByteCount < lMessageLength) {
      const lWordPosition = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordCount[lWordPosition] = lWordCount[lWordPosition] | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    
    const lWordPosition = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordCount[lWordPosition] = lWordCount[lWordPosition] | (0x80 << lBytePosition);
    lWordCount[lNumberOfWords - 2] = lMessageLength << 3;
    lWordCount[lNumberOfWords - 1] = lMessageLength >>> 29;
    
    return lWordCount;
  }

  function wordToHex(value: number): string {
    let hex = "";
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      hex += byte.toString(16).padStart(2, '0');
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    
    a = ff(a, b, c, d, x[k], S11, 0xD76AA478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = ff(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = ff(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = ff(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = ff(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49B40821);
    
    a = gg(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = gg(b, c, d, a, x[k], S24, 0xE9B6C7AA);
    a = gg(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = gg(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = gg(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    
    a = hh(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = hh(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = hh(d, a, b, c, x[k], S32, 0xEAA127FA);
    c = hh(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    
    a = ii(a, b, c, d, x[k], S41, 0xF4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = ii(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = ii(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  
  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}
