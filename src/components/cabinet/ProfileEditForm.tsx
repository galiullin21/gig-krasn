import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().min(2, "Имя должно быть не менее 2 символов").max(100),
  avatar_url: z.string().optional(),
  bio: z.string().max(500, "Максимум 500 символов").optional(),
  social_vk: z.string().url("Введите корректный URL").optional().or(z.literal("")),
  social_telegram: z.string().optional(),
  social_ok: z.string().url("Введите корректный URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  userId: string;
  initialData: {
    full_name: string | null;
    avatar_url: string | null;
    bio?: string | null;
    social_links?: {
      vk?: string;
      telegram?: string;
      ok?: string;
    } | null;
  };
  onSuccess: () => void;
}

export function ProfileEditForm({ userId, initialData, onSuccess }: ProfileEditFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData.full_name || "",
      avatar_url: initialData.avatar_url || "",
      bio: initialData.bio || "",
      social_vk: initialData.social_links?.vk || "",
      social_telegram: initialData.social_links?.telegram || "",
      social_ok: initialData.social_links?.ok || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const social_links = {
        vk: data.social_vk || null,
        telegram: data.social_telegram || null,
        ok: data.social_ok || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          avatar_url: data.avatar_url || null,
          bio: data.bio || null,
          social_links,
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({ title: "Профиль обновлён" });
      onSuccess();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Ошибка обновления", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>
              Эта информация будет видна другим пользователям
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Аватар</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                      bucket="covers"
                      folder="avatars"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Ваше имя" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>О себе</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Расскажите немного о себе..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Максимум 500 символов</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Социальные сети</CardTitle>
            <CardDescription>
              Ссылки на ваши профили в соцсетях
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="social_vk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ВКонтакте</FormLabel>
                  <FormControl>
                    <Input placeholder="https://vk.com/username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram</FormLabel>
                  <FormControl>
                    <Input placeholder="@username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_ok"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Одноклассники</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ok.ru/profile/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Сохранить изменения
        </Button>
      </form>
    </Form>
  );
}
