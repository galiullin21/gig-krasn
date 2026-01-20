import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Check, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CrosspostSettingsData {
  vk_enabled: boolean;
  vk_group_id: string;
  vk_access_token: string;
  ok_enabled: boolean;
  ok_application_id: string;
  ok_application_key: string;
  ok_application_secret: string;
  ok_access_token: string;
  ok_group_id: string;
}

const defaultSettings: CrosspostSettingsData = {
  vk_enabled: false,
  vk_group_id: "",
  vk_access_token: "",
  ok_enabled: false,
  ok_application_id: "",
  ok_application_key: "",
  ok_application_secret: "",
  ok_access_token: "",
  ok_group_id: "",
};

export function CrosspostSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<CrosspostSettingsData>(defaultSettings);
  const [showVkToken, setShowVkToken] = useState(false);
  const [showOkSecret, setShowOkSecret] = useState(false);
  const [showOkToken, setShowOkToken] = useState(false);

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
          "crosspost_ok_enabled",
          "crosspost_ok_application_id",
          "crosspost_ok_application_key",
          "crosspost_ok_application_secret",
          "crosspost_ok_access_token",
          "crosspost_ok_group_id",
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
        ok_enabled: settingsMap.ok_enabled === true,
        ok_application_id: (settingsMap.ok_application_id as string) || "",
        ok_application_key: (settingsMap.ok_application_key as string) || "",
        ok_application_secret: (settingsMap.ok_application_secret as string) || "",
        ok_access_token: (settingsMap.ok_access_token as string) || "",
        ok_group_id: (settingsMap.ok_group_id as string) || "",
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
        ["crosspost_ok_enabled", newSettings.ok_enabled],
        ["crosspost_ok_application_id", newSettings.ok_application_id],
        ["crosspost_ok_application_key", newSettings.ok_application_key],
        ["crosspost_ok_application_secret", newSettings.ok_application_secret],
        ["crosspost_ok_access_token", newSettings.ok_access_token],
        ["crosspost_ok_group_id", newSettings.ok_group_id],
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
  const isOkConfigured = settings.ok_application_id && settings.ok_application_key && 
                         settings.ok_application_secret && settings.ok_access_token && settings.ok_group_id;

  // OK.ru icon SVG path
  const OkIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 4.8c1.983 0 3.6 1.617 3.6 3.6S13.983 12 12 12s-3.6-1.617-3.6-3.6S10.017 4.8 12 4.8zm0 2.4c-.663 0-1.2.537-1.2 1.2s.537 1.2 1.2 1.2 1.2-.537 1.2-1.2-.537-1.2-1.2-1.2zm4.243 8.357a6.002 6.002 0 01-2.656 1.131l2.291 2.291a1.2 1.2 0 11-1.697 1.697L12 18.494l-2.181 2.182a1.2 1.2 0 11-1.697-1.697l2.291-2.291a6.002 6.002 0 01-2.656-1.131 1.2 1.2 0 111.486-1.886A3.598 3.598 0 0012 14.4a3.598 3.598 0 002.757-1.129 1.2 1.2 0 111.486 1.886z"/>
    </svg>
  );

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
          <OkIcon />
          <span className="font-medium">Одноклассники</span>
          {isOkConfigured ? (
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

        {/* OK.ru Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 4.8c1.983 0 3.6 1.617 3.6 3.6S13.983 12 12 12s-3.6-1.617-3.6-3.6S10.017 4.8 12 4.8zm0 2.4c-.663 0-1.2.537-1.2 1.2s.537 1.2 1.2 1.2 1.2-.537 1.2-1.2-.537-1.2-1.2-1.2zm4.243 8.357a6.002 6.002 0 01-2.656 1.131l2.291 2.291a1.2 1.2 0 11-1.697 1.697L12 18.494l-2.181 2.182a1.2 1.2 0 11-1.697-1.697l2.291-2.291a6.002 6.002 0 01-2.656-1.131 1.2 1.2 0 111.486-1.886A3.598 3.598 0 0012 14.4a3.598 3.598 0 002.757-1.129 1.2 1.2 0 111.486 1.886z"/>
              </svg>
              Одноклассники
            </CardTitle>
            <CardDescription>
              Публикация в группу Одноклассники
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Создайте приложение на{" "}
                <a
                  href="https://ok.ru/devaccess"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  ok.ru/devaccess
                </a>{" "}
                и получите Application ID, Public Key, Secret Key и Access Token с правами GROUP_CONTENT, PHOTO_CONTENT.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="ok_application_id">Application ID</Label>
              <Input
                id="ok_application_id"
                value={settings.ok_application_id}
                onChange={(e) => updateSetting("ok_application_id", e.target.value)}
                placeholder="12345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ok_application_key">Application Key (Public)</Label>
              <Input
                id="ok_application_key"
                value={settings.ok_application_key}
                onChange={(e) => updateSetting("ok_application_key", e.target.value)}
                placeholder="CABCDEFGH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ok_application_secret">Application Secret Key</Label>
              <div className="relative">
                <Input
                  id="ok_application_secret"
                  type={showOkSecret ? "text" : "password"}
                  value={settings.ok_application_secret}
                  onChange={(e) => updateSetting("ok_application_secret", e.target.value)}
                  placeholder="ABCDEF123456..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowOkSecret(!showOkSecret)}
                >
                  {showOkSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ok_access_token">Access Token</Label>
              <div className="relative">
                <Input
                  id="ok_access_token"
                  type={showOkToken ? "text" : "password"}
                  value={settings.ok_access_token}
                  onChange={(e) => updateSetting("ok_access_token", e.target.value)}
                  placeholder="tkn1.a.xxx..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowOkToken(!showOkToken)}
                >
                  {showOkToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ok_group_id">ID группы</Label>
              <Input
                id="ok_group_id"
                value={settings.ok_group_id}
                onChange={(e) => updateSetting("ok_group_id", e.target.value)}
                placeholder="12345678901234"
              />
              <p className="text-xs text-muted-foreground">
                Числовой ID группы (можно найти в URL группы)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
