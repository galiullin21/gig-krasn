// User notifications utility functions
import { supabase } from "@/integrations/supabase/client";

interface UserNotificationData {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}

export async function sendUserNotification(data: UserNotificationData): Promise<void> {
  try {
    // Don't send notification to self
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === data.userId) return;

    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message || null,
        link: data.link || null,
      });

    if (error) {
      console.error("Failed to send user notification:", error);
    }
  } catch (err) {
    console.error("Error sending user notification:", err);
  }
}

export async function notifyCommentReply(
  commentOwnerId: string,
  replierName: string,
  contentType: "news" | "blog",
  contentSlug: string
): Promise<void> {
  const basePath = contentType === "news" ? "/news" : "/blogs";
  await sendUserNotification({
    userId: commentOwnerId,
    type: "comment_reply",
    title: "Ответ на комментарий",
    message: `${replierName} ответил на ваш комментарий`,
    link: `${basePath}/${contentSlug}`,
  });
}

export async function notifyContentReaction(
  contentOwnerId: string,
  reactionType: "like" | "dislike",
  contentType: "news" | "blog" | "comment",
  contentTitle: string,
  contentSlug?: string
): Promise<void> {
  const reactionLabel = reactionType === "like" ? "понравился" : "не понравился";
  const typeLabel = contentType === "news" ? "ваша новость" : contentType === "blog" ? "ваш блог" : "ваш комментарий";
  
  let link: string | undefined;
  if (contentSlug) {
    const basePath = contentType === "news" ? "/news" : contentType === "blog" ? "/blogs" : undefined;
    if (basePath) link = `${basePath}/${contentSlug}`;
  }

  await sendUserNotification({
    userId: contentOwnerId,
    type: "reaction",
    title: reactionType === "like" ? "Новый лайк 👍" : "Новый дизлайк 👎",
    message: `Кому-то ${reactionLabel} ${typeLabel}`,
    link,
  });
}
