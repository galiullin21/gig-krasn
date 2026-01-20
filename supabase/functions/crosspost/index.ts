import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CrosspostRequest {
  content_type: "news" | "blog" | "gallery";
  content_id: string;
}

interface ContentData {
  title: string;
  slug: string;
  lead?: string;
  content?: string;
  cover_image?: string;
  type?: string;
}

// MD5 implementation for OK.ru signature
async function md5(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("MD5", msgUint8).catch(() => {
    // Fallback for environments without MD5 support
    return null;
  });
  
  if (!hashBuffer) {
    // Simple MD5 implementation fallback
    return simpleMd5(message);
  }
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple MD5 fallback implementation
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

// Calculate OK.ru API signature
async function calculateOkSignature(
  params: Record<string, string>,
  accessToken: string,
  applicationSecret: string
): Promise<string> {
  // secret_key = MD5(access_token + application_secret_key)
  const secretKey = await md5(accessToken + applicationSecret);
  
  // Sort params and concatenate
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'access_token')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('');
  
  // sig = MD5(sorted_params + secret_key)
  return md5(sortedParams + secretKey);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authorization check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);

    if (claimsError || !claimsData.user) {
      console.error("Token verification failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    console.log(`User ${userId} initiating crosspost`);

    // Check if user has admin or editor role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "editor", "developer"]);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("User lacks required role:", roleError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${userId} authorized with role: ${roleData[0].role}`);

    // Fetch crosspost settings from database
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

    const vkGroupId = settings.crosspost_vk_group_id || "";
    const vkToken = settings.crosspost_vk_access_token || "";
    const okApplicationId = settings.crosspost_ok_application_id || "";
    const okApplicationKey = settings.crosspost_ok_application_key || "";
    const okApplicationSecret = settings.crosspost_ok_application_secret || "";
    const okAccessToken = settings.crosspost_ok_access_token || "";
    const okGroupId = settings.crosspost_ok_group_id || "";

    console.log("VK configured:", !!vkGroupId && !!vkToken);
    console.log("OK configured:", !!okApplicationId && !!okApplicationKey && !!okApplicationSecret && !!okAccessToken && !!okGroupId);

    const { content_type, content_id }: CrosspostRequest = await req.json();

    if (!content_type || !content_id) {
      throw new Error("content_type and content_id are required");
    }

    console.log(`Crossposting ${content_type} with id ${content_id}`);

    // Fetch content based on type
    let contentData: ContentData | null = null;
    let tableName = "";
    let urlPath = "";

    switch (content_type) {
      case "news":
        tableName = "news";
        urlPath = "news";
        break;
      case "blog":
        tableName = "blogs";
        urlPath = "blogs";
        break;
      case "gallery":
        tableName = "galleries";
        urlPath = "galleries";
        break;
      default:
        throw new Error(`Unknown content type: ${content_type}`);
    }

    // Select only columns that exist in each table
    let selectColumns = "title, slug, cover_image";
    if (content_type === "news" || content_type === "blog") {
      selectColumns = "title, slug, lead, content, cover_image";
    } else if (content_type === "gallery") {
      selectColumns = "title, slug, cover_image, type";
    }

    const { data, error } = await supabase
      .from(tableName)
      .select(selectColumns)
      .eq("id", content_id)
      .single();

    if (error || !data) {
      throw new Error(`Content not found: ${error?.message}`);
    }

    contentData = data as unknown as ContentData;

    // Build the post message
    const siteUrl = "https://gig-krasn.lovable.app";
    const fullUrl = `${siteUrl}/${urlPath}/${contentData.slug}`;
    
    let description = "";
    if (contentData.lead) {
      description = contentData.lead;
    } else if (contentData.content) {
      // Strip HTML and truncate
      const plainText = contentData.content.replace(/<[^>]*>/g, "").trim();
      description = plainText.length > 200 ? plainText.substring(0, 200) + "..." : plainText;
    }

    const emoji = content_type === "news" ? "📰" : content_type === "blog" ? "📝" : "📸";
    const typeLabel = content_type === "gallery" && contentData.type === "video" ? "Видео" : 
                      content_type === "gallery" ? "Галерея" : 
                      content_type === "news" ? "Новость" : "Блог";

    const message = `${emoji} ${contentData.title}

${description}

🔗 Читать полностью: ${fullUrl}`;

    const results: { platform: string; success: boolean; postId?: string; error?: string }[] = [];

    // Post to VK
    if (vkToken && vkGroupId) {
      try {
        console.log("Posting to VK...");
        
        let attachments = "";
        
        // Upload photo to VK if cover image exists
        if (contentData.cover_image) {
          try {
            // Get upload server
            const uploadServerRes = await fetch(
              `https://api.vk.com/method/photos.getWallUploadServer?group_id=${vkGroupId}&access_token=${vkToken}&v=5.199`
            );
            const uploadServerData = await uploadServerRes.json();
            
            if (uploadServerData.response?.upload_url) {
              // Download image
              const imageRes = await fetch(contentData.cover_image);
              const imageBlob = await imageRes.blob();
              
              // Upload to VK
              const formData = new FormData();
              formData.append("photo", imageBlob, "cover.jpg");
              
              const uploadRes = await fetch(uploadServerData.response.upload_url, {
                method: "POST",
                body: formData,
              });
              const uploadData = await uploadRes.json();
              
              if (uploadData.photo && uploadData.photo !== "[]") {
                // Save photo
                const saveRes = await fetch(
                  `https://api.vk.com/method/photos.saveWallPhoto?group_id=${vkGroupId}&photo=${encodeURIComponent(uploadData.photo)}&server=${uploadData.server}&hash=${uploadData.hash}&access_token=${vkToken}&v=5.199`
                );
                const saveData = await saveRes.json();
                
                if (saveData.response?.[0]) {
                  const photo = saveData.response[0];
                  attachments = `photo${photo.owner_id}_${photo.id}`;
                }
              }
            }
          } catch (photoError) {
            console.error("VK photo upload error:", photoError);
            // Continue without photo
          }
        }
        
        // Post to wall - ensure group ID is a clean number with minus prefix
        const cleanGroupId = vkGroupId.replace(/[^0-9]/g, "");
        const vkParams = new URLSearchParams({
          owner_id: `-${cleanGroupId}`,
          from_group: "1",
          message: message,
          access_token: vkToken,
          v: "5.199",
        });
        
        if (attachments) {
          vkParams.append("attachments", attachments);
        }
        
        const vkRes = await fetch(`https://api.vk.com/method/wall.post?${vkParams}`);
        const vkData = await vkRes.json();
        
        if (vkData.error) {
          throw new Error(vkData.error.error_msg || "VK API error");
        }
        
        console.log("VK post successful:", vkData);
        results.push({
          platform: "vk",
          success: true,
          postId: String(vkData.response?.post_id),
        });
      } catch (vkError: any) {
        console.error("VK error:", vkError);
        results.push({
          platform: "vk",
          success: false,
          error: vkError.message,
        });
      }
    } else {
      console.log("VK credentials not configured, skipping");
    }

    // Post to OK.ru (Odnoklassniki)
    if (okApplicationKey && okApplicationSecret && okAccessToken && okGroupId) {
      try {
        console.log("Posting to OK.ru...");
        
        // Build attachment JSON for mediatopic.post
        const attachment = JSON.stringify({
          media: [
            {
              type: "text",
              text: message
            },
            {
              type: "link",
              url: fullUrl
            }
          ]
        });

        const params: Record<string, string> = {
          method: "mediatopic.post",
          application_key: okApplicationKey,
          gid: okGroupId,
          type: "GROUP_THEME",
          attachment: attachment,
          format: "json",
        };

        // Calculate signature
        const sig = await calculateOkSignature(params, okAccessToken, okApplicationSecret);

        // Build request URL
        const okParams = new URLSearchParams({
          ...params,
          sig: sig,
          access_token: okAccessToken,
        });

        console.log("OK.ru request params (without tokens):", {
          method: params.method,
          gid: params.gid,
          type: params.type,
        });

        const okRes = await fetch(`https://api.ok.ru/fb.do?${okParams}`);
        const okData = await okRes.json();

        console.log("OK.ru response:", okData);

        if (okData.error_code || okData.error_msg) {
          throw new Error(okData.error_msg || `OK.ru API error: ${okData.error_code}`);
        }

        console.log("OK.ru post successful:", okData);
        results.push({
          platform: "ok",
          success: true,
          postId: String(okData.id || okData),
        });
      } catch (okError: any) {
        console.error("OK.ru error:", okError);
        results.push({
          platform: "ok",
          success: false,
          error: okError.message,
        });
      }
    } else {
      console.log("OK.ru credentials not configured, skipping");
    }

    // Log results to database
    for (const result of results) {
      await supabase.from("crosspost_logs").insert({
        content_type,
        content_id,
        platform: result.platform,
        post_id: result.postId || null,
        status: result.success ? "success" : "error",
        error_message: result.error || null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Crosspost error:", error);
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
