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
    ok: `https://connect.ok.ru/offer?url=${encodedUrl}&title=${encodedTitle}&description=${encodedDescription}${image ? `&imageUrl=${encodeURIComponent(image)}` : ""}`,
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
