import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Check, X, Eye, EyeOff, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CrosspostSettingsData {
  vk_enabled: boolean;
  vk_group_id: string;
  vk_access_token: string;
  telegram_enabled: boolean;
  telegram_bot_token: string;
  telegram_channel_id: string;
}

const defaultSettings: CrosspostSettingsData = {
  vk_enabled: false,
  vk_group_id: "",
  vk_access_token: "",
  telegram_enabled: false,
  telegram_bot_token: "",
  telegram_channel_id: "",
};

export function CrosspostSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<CrosspostSettingsData>(defaultSettings);
  const [showVkToken, setShowVkToken] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ["crosspost-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", [
          "crosspost_vk_enabled",
          "crosspost_vk_group_id",
          "crosspost_vk_access_token",
          "crosspost_telegram_enabled",
          "crosspost_telegram_bot_token",
          "crosspost_telegram_channel_id",
        ]);

      if (error) throw error;

      const settingsMap: Record<string, unknown> = {};
      data?.forEach((item) => {
        const key = item.key.replace("crosspost_", "");
        settingsMap[key] = item.value;
      });

      return {
        vk_enabled: settingsMap.vk_enabled === true,
        vk_group_id: (settingsMap.vk_group_id as string) || "",
        vk_access_token: (settingsMap.vk_access_token as string) || "",
        telegram_enabled: settingsMap.telegram_enabled === true,
        telegram_bot_token: (settingsMap.telegram_bot_token as string) || "",
        telegram_channel_id: (settingsMap.telegram_channel_id as string) || "",
      };
    },
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, [savedSettings]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: CrosspostSettingsData) => {
      const entries: [string, string | boolean][] = [
        ["crosspost_vk_enabled", newSettings.vk_enabled],
        ["crosspost_vk_group_id", newSettings.vk_group_id],
        ["crosspost_vk_access_token", newSettings.vk_access_token],
        ["crosspost_telegram_enabled", newSettings.telegram_enabled],
        ["crosspost_telegram_bot_token", newSettings.telegram_bot_token],
        ["crosspost_telegram_channel_id", newSettings.telegram_channel_id],
      ];

      for (const [key, value] of entries) {
        const { data: existing } = await supabase
          .from("site_settings")
          .select("id")
          .eq("key", key as string)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("site_settings")
            .update({ value: value as unknown as string })
            .eq("key", key as string);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("site_settings")
            .insert([{ key: key as string, value: value as unknown as string }]);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crosspost-settings"] });
      toast({ title: "Настройки кросс-постинга сохранены" });
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const updateSetting = <K extends keyof CrosspostSettingsData>(
    key: K,
    value: CrosspostSettingsData[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const isVkConfigured = settings.vk_group_id && settings.vk_access_token;
  const isTelegramConfigured = settings.telegram_bot_token && settings.telegram_channel_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Настройки кросс-постинга</h2>
          <p className="text-sm text-muted-foreground">
            Подключите соцсети для автоматической публикации
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      {/* Connected Platforms Overview */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.673 4 8.252c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.864 2.5 2.304 4.7 2.896 4.7.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.78 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
          </svg>
          <span className="font-medium">VK</span>
          {isVkConfigured ? (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
              <Check className="h-3 w-3 mr-1" />
              Подключён
            </Badge>
          ) : (
            <Badge variant="secondary">
              <X className="h-3 w-3 mr-1" />
              Не подключён
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span className="font-medium">Telegram</span>
          {isTelegramConfigured ? (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
              <Check className="h-3 w-3 mr-1" />
              Подключён
            </Badge>
          ) : (
            <Badge variant="secondary">
              <X className="h-3 w-3 mr-1" />
              Не подключён
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* VK Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.673 4 8.252c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.864 2.5 2.304 4.7 2.896 4.7.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.78 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
              </svg>
              ВКонтакте
            </CardTitle>
            <CardDescription>
              Публикация на стену группы VK
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Создайте{" "}
                <a
                  href="https://vk.com/editapp?act=create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  приложение VK
                </a>{" "}
                и получите токен доступа с правами wall, photos.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="vk_group_id">ID группы</Label>
              <Input
                id="vk_group_id"
                value={settings.vk_group_id}
                onChange={(e) => updateSetting("vk_group_id", e.target.value)}
                placeholder="123456789"
              />
              <p className="text-xs text-muted-foreground">
                Только цифры, без минуса
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vk_access_token">Access Token</Label>
              <div className="relative">
                <Input
                  id="vk_access_token"
                  type={showVkToken ? "text" : "password"}
                  value={settings.vk_access_token}
                  onChange={(e) => updateSetting("vk_access_token", e.target.value)}
                  placeholder="vk1.a.xxx..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowVkToken(!showVkToken)}
                >
                  {showVkToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </CardTitle>
            <CardDescription>
              Публикация в Telegram-канал
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Создайте бота через{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  @BotFather
                </a>{" "}
                и добавьте его админом в канал.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="telegram_bot_token">Bot Token</Label>
              <div className="relative">
                <Input
                  id="telegram_bot_token"
                  type={showTelegramToken ? "text" : "password"}
                  value={settings.telegram_bot_token}
                  onChange={(e) => updateSetting("telegram_bot_token", e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrs..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowTelegramToken(!showTelegramToken)}
                >
                  {showTelegramToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram_channel_id">ID канала</Label>
              <Input
                id="telegram_channel_id"
                value={settings.telegram_channel_id}
                onChange={(e) => updateSetting("telegram_channel_id", e.target.value)}
                placeholder="@channel_name или -1001234567890"
              />
              <p className="text-xs text-muted-foreground">
                Юзернейм с @ или числовой ID
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
