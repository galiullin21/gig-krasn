import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link2, Share2 } from "lucide-react";
import { notifyContentShared } from "@/lib/adminNotifications";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
  contentType?: "news" | "blog";
}

export function ShareButtons({ url, title, description = "", image, className = "", contentType }: ShareButtonsProps) {
  const { toast } = useToast();
  const fullUrl = window.location.origin + url;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  // Extract slug from url
  const slug = url.split("/").pop() || "";

  const shareLinks = {
    vk: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}${image ? `&image=${encodeURIComponent(image)}` : ""}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    ok: `https://connect.ok.ru/offer?url=${encodedUrl}&title=${encodedTitle}&description=${encodedDescription}${image ? `&imageUrl=${encodeURIComponent(image)}` : ""}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const trackShare = async (platform: string) => {
    if (contentType && slug) {
      await notifyContentShared(contentType, title, platform, slug);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
        await trackShare("native");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({ title: "Ссылка скопирована" });
      await trackShare("copy");
    } catch (error) {
      toast({ variant: "destructive", title: "Не удалось скопировать ссылку" });
    }
  };

  const handleSocialClick = (platform: string) => {
    trackShare(platform);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground mr-1">Поделиться:</span>
      
      {/* VK */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full"
        asChild
      >
        <a
          href={shareLinks.vk}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Поделиться ВКонтакте"
          onClick={() => handleSocialClick("vk")}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.189 1.366 1.259 2.18 1.815.616.42 1.084.328 1.084.328l2.175-.03s1.138-.07.598-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.246.999-1.33 1.398-2.142 1.273-2.489-.12-.332-.859-.244-.859-.244l-2.45.015s-.182-.025-.316.056c-.131.079-.216.263-.216.263s-.387 1.028-.903 1.903c-1.088 1.848-1.523 1.946-1.701 1.831-.414-.267-.31-1.075-.31-1.648 0-1.793.273-2.539-.532-2.733-.267-.064-.463-.106-1.146-.113-.876-.009-1.617.003-2.036.208-.278.136-.493.44-.363.457.162.022.528.099.722.363.251.341.242 1.107.242 1.107s.144 2.11-.336 2.372c-.33.179-.782-.187-1.753-1.868-.497-.861-.872-1.814-.872-1.814s-.072-.177-.201-.272c-.156-.115-.374-.151-.374-.151l-2.328.015s-.35.01-.478.161c-.114.135-.009.413-.009.413s1.819 4.254 3.878 6.399c1.889 1.966 4.032 1.837 4.032 1.837h.972z" />
          </svg>
        </a>
      </Button>

      {/* Telegram */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full"
        asChild
      >
        <a
          href={shareLinks.telegram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Поделиться в Telegram"
          onClick={() => handleSocialClick("telegram")}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
          </svg>
        </a>
      </Button>

      {/* Odnoklassniki */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full"
        asChild
      >
        <a
          href={shareLinks.ok}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Поделиться в Одноклассниках"
          onClick={() => handleSocialClick("ok")}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm4.5 8.5c-.69.69-1.602 1.063-2.546 1.206l2.046 2.044a1 1 0 01-1.414 1.414L12 17.078l-2.586 2.586a1 1 0 01-1.414-1.414l2.046-2.044c-.944-.143-1.856-.516-2.546-1.206a1 1 0 011.414-1.414c1.17 1.17 3.002 1.17 4.172 0a1 1 0 011.414 1.414z" />
          </svg>
        </a>
      </Button>

      {/* WhatsApp */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full"
        asChild
      >
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Поделиться в WhatsApp"
          onClick={() => handleSocialClick("whatsapp")}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </Button>

      {/* Copy Link */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={copyLink}
        aria-label="Копировать ссылку"
      >
        <Link2 className="h-4 w-4" />
      </Button>

      {/* Native Share (mobile) */}
      {typeof navigator !== "undefined" && navigator.share && (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full md:hidden"
          onClick={handleShare}
          aria-label="Поделиться"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
