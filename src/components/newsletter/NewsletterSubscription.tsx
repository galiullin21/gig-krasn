import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, CheckCircle } from "lucide-react";

interface NewsletterSubscriptionProps {
  className?: string;
}

export function NewsletterSubscription({ className = "" }: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Введите корректный email",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("email_subscriptions")
        .insert([{ email }]);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Вы уже подписаны",
            description: "Этот email уже есть в нашей рассылке",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        setEmail("");
        toast({
          title: "Вы подписаны!",
          description: "Спасибо за подписку на нашу рассылку",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка подписки",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={`flex items-center gap-2 text-green-400 ${className}`}>
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm">Спасибо за подписку!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <p className="text-sm text-white/70">
        Подпишитесь на рассылку новостей
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading} size="sm">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Подписаться"
          )}
        </Button>
      </div>
    </form>
  );
}
