import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface UserWarningsProps {
  userId: string;
}

export function UserWarnings({ userId }: UserWarningsProps) {
  const { data: warnings, isLoading } = useQuery({
    queryKey: ["user-warnings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_warnings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !warnings?.length) {
    return null;
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Предупреждения ({warnings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className="p-4 border border-destructive/20 rounded-lg bg-destructive/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-destructive">{warning.reason}</p>
                  {warning.details && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {warning.details}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(warning.created_at), "d MMMM yyyy, HH:mm", {
                      locale: ru,
                    })}
                  </p>
                </div>
                {!warning.is_read && (
                  <Badge variant="destructive">Новое</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
