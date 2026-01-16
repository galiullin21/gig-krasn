import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const warningSchema = z.object({
  user_id: z.string().min(1, "Выберите пользователя"),
  reason: z.string().min(5, "Укажите причину (минимум 5 символов)").max(200),
  details: z.string().max(1000).optional(),
});

type WarningFormData = z.infer<typeof warningSchema>;

export default function AdminWarningForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get("user");
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<WarningFormData>({
    resolver: zodResolver(warningSchema),
    defaultValues: {
      user_id: preselectedUserId || "",
      reason: "",
      details: "",
    },
  });

  const onSubmit = async (data: WarningFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_warnings").insert({
        user_id: data.user_id,
        issued_by: user.id,
        reason: data.reason,
        details: data.details || null,
      });

      if (error) throw error;

      toast({ title: "Предупреждение выдано" });
      navigate("/admin/users");
    } catch (error) {
      console.error("Error issuing warning:", error);
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUsers) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к пользователям
          </Link>
        </Button>
        <h1 className="font-condensed font-bold text-2xl flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          Выдать предупреждение
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о предупреждении</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пользователь</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите пользователя" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((u) => (
                          <SelectItem key={u.user_id} value={u.user_id}>
                            {u.full_name || "Без имени"} ({u.user_id.slice(0, 8)}...)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Причина</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Краткая причина предупреждения"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Например: "Нарушение правил комментирования"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подробное описание (опционально)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Подробное объяснение нарушения..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Отправка..." : "Выдать предупреждение"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/users")}
            >
              Отмена
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
