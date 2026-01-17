import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ContentType = "news" | "blog" | "gallery";

export function useCrosspost() {
  const { toast } = useToast();

  const crosspost = async (contentType: ContentType, contentId: string) => {
    try {
      console.log(`Initiating crosspost for ${contentType}:${contentId}`);
      
      const { data, error } = await supabase.functions.invoke("crosspost", {
        body: {
          content_type: contentType,
          content_id: contentId,
        },
      });

      if (error) {
        console.error("Crosspost function error:", error);
        toast({
          variant: "destructive",
          title: "Ошибка кросс-постинга",
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      if (data?.success) {
        const successPlatforms = data.results
          ?.filter((r: any) => r.success)
          .map((r: any) => r.platform === "vk" ? "VK" : "Telegram")
          .join(", ");

        const failedPlatforms = data.results
          ?.filter((r: any) => !r.success)
          .map((r: any) => `${r.platform === "vk" ? "VK" : "Telegram"}: ${r.error}`)
          .join("; ");

        if (successPlatforms) {
          toast({
            title: "Опубликовано в соцсети",
            description: `Успешно: ${successPlatforms}`,
          });
        }

        if (failedPlatforms) {
          toast({
            variant: "destructive",
            title: "Ошибки кросс-постинга",
            description: failedPlatforms,
          });
        }

        return { success: true, results: data.results };
      }

      return { success: false, error: data?.error };
    } catch (err: any) {
      console.error("Crosspost error:", err);
      toast({
        variant: "destructive",
        title: "Ошибка кросс-постинга",
        description: err.message,
      });
      return { success: false, error: err.message };
    }
  };

  return { crosspost };
}
