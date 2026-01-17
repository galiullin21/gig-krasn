import { supabase } from "@/integrations/supabase/client";

interface NotificationData {
  type: string;
  title: string;
  message?: string;
  link?: string;
}

export async function sendAdminNotification(data: NotificationData): Promise<void> {
  try {
    const { error } = await supabase
      .from("admin_notifications")
      .insert({
        type: data.type,
        title: data.title,
        message: data.message || null,
        link: data.link || null,
      });

    if (error) {
      console.error("Failed to send admin notification:", error);
    }
  } catch (err) {
    console.error("Error sending admin notification:", err);
  }
}

export async function notifyNewComment(
  contentType: "news" | "blog",
  contentTitle: string,
  contentSlug: string,
  userName: string
): Promise<void> {
  const basePath = contentType === "news" ? "/news" : "/blogs";
  await sendAdminNotification({
    type: "comment",
    title: "Новый комментарий",
    message: `${userName} оставил комментарий к ${contentType === "news" ? "новости" : "блогу"} "${contentTitle}"`,
    link: `${basePath}/${contentSlug}`,
  });
}

export async function notifyNewReaction(
  contentType: "news" | "blog" | "comment",
  contentTitle: string,
  reactionType: "like" | "dislike",
  contentSlug?: string
): Promise<void> {
  const reactionLabel = reactionType === "like" ? "👍" : "👎";
  const typeLabel = contentType === "news" ? "новости" : contentType === "blog" ? "блогу" : "комментарию";
  
  let link: string | undefined;
  if (contentSlug) {
    const basePath = contentType === "news" ? "/news" : contentType === "blog" ? "/blogs" : undefined;
    if (basePath) link = `${basePath}/${contentSlug}`;
  }

  await sendAdminNotification({
    type: "reaction",
    title: `Новая реакция ${reactionLabel}`,
    message: `Пользователь поставил ${reactionType === "like" ? "лайк" : "дизлайк"} к ${typeLabel} "${contentTitle}"`,
    link,
  });
}

export async function notifyContentShared(
  contentType: "news" | "blog",
  contentTitle: string,
  platform: string,
  contentSlug: string
): Promise<void> {
  const basePath = contentType === "news" ? "/news" : "/blogs";
  const platformNames: Record<string, string> = {
    vk: "ВКонтакте",
    telegram: "Telegram",
    ok: "Одноклассники",
    whatsapp: "WhatsApp",
    copy: "копирование ссылки",
    native: "нативное меню",
  };

  await sendAdminNotification({
    type: "share",
    title: "Материал поделились",
    message: `${contentType === "news" ? "Новость" : "Блог"} "${contentTitle}" был поделён через ${platformNames[platform] || platform}`,
    link: `${basePath}/${contentSlug}`,
  });
}
