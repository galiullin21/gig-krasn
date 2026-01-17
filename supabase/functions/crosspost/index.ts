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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const vkToken = Deno.env.get("VK_ACCESS_TOKEN");
    const vkGroupId = Deno.env.get("VK_GROUP_ID");
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChannelId = Deno.env.get("TELEGRAM_CHANNEL_ID");

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

    const { data, error } = await supabase
      .from(tableName)
      .select("title, slug, lead, content, cover_image, type")
      .eq("id", content_id)
      .single();

    if (error || !data) {
      throw new Error(`Content not found: ${error?.message}`);
    }

    contentData = data as ContentData;

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
        
        // Post to wall
        const vkParams = new URLSearchParams({
          owner_id: `-${vkGroupId}`,
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

    // Post to Telegram
    if (telegramBotToken && telegramChannelId) {
      try {
        console.log("Posting to Telegram...");
        
        let telegramRes;
        
        if (contentData.cover_image) {
          // Send photo with caption
          telegramRes = await fetch(
            `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: telegramChannelId,
                photo: contentData.cover_image,
                caption: message,
                parse_mode: "HTML",
              }),
            }
          );
        } else {
          // Send text only
          telegramRes = await fetch(
            `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: telegramChannelId,
                text: message,
                parse_mode: "HTML",
              }),
            }
          );
        }
        
        const telegramData = await telegramRes.json();
        
        if (!telegramData.ok) {
          throw new Error(telegramData.description || "Telegram API error");
        }
        
        console.log("Telegram post successful:", telegramData);
        results.push({
          platform: "telegram",
          success: true,
          postId: String(telegramData.result?.message_id),
        });
      } catch (tgError: any) {
        console.error("Telegram error:", tgError);
        results.push({
          platform: "telegram",
          success: false,
          error: tgError.message,
        });
      }
    } else {
      console.log("Telegram credentials not configured, skipping");
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
