import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { CrosspostSettings } from "@/components/admin/CrosspostSettings";
import { useAuth } from "@/hooks/useAuth";
import { Save, Globe, Phone, Mail, MapPin, Shield, Share2, Image } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SiteSettings {
  site_name: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
  phone: string;
  email: string;
  address: string;
  social_vk: string;
  social_telegram: string;
  social_ok: string;
  footer_text: string;
  // Auth settings
  auth_email_enabled: boolean;
  auth_phone_enabled: boolean;
  auth_google_enabled: boolean;
  auth_email_confirm_required: boolean;
  auth_phone_confirm_required: boolean;
}

const defaultSettings: SiteSettings = {
  site_name: "Город и горожане",
  site_description: "Городская газета Железногорска",
  logo_url: "",
  favicon_url: "",
  phone: "",
  email: "",
  address: "",
  social_vk: "",
  social_telegram: "",
  social_ok: "",
  footer_text: "",
  // Auth settings defaults
  auth_email_enabled: true,
  auth_phone_enabled: true,
  auth_google_enabled: true,
  auth_email_confirm_required: true,
  auth_phone_confirm_required: true,
};

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isDeveloper } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      const settingsMap: Record<string, unknown> = {};
      data.forEach((item) => {
        settingsMap[item.key] = item.value;
      });

      return settingsMap as Partial<SiteSettings>;
    },
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings((prev) => ({ ...prev, ...savedSettings }));
    }
  }, [savedSettings]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: SiteSettings) => {
      const entries = Object.entries(newSettings);
      
      for (const [key, value] of entries) {
        // Check if setting exists
        const { data: existing } = await supabase
          .from("site_settings")
          .select("id")
          .eq("key", key)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("site_settings")
            .update({ value: value as string })
            .eq("key", key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("site_settings")
            .insert([{ key, value: value as string }]);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Настройки сохранены" });
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-condensed font-bold">Настройки сайта</h1>
          <p className="text-muted-foreground">Управление общими настройками</p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Основные</TabsTrigger>
          <TabsTrigger value="contacts">Контакты</TabsTrigger>
          <TabsTrigger value="social">Соцсети</TabsTrigger>
          <TabsTrigger value="crosspost">
            <Share2 className="h-4 w-4 mr-1.5" />
            Кросс-постинг
          </TabsTrigger>
          {isDeveloper && <TabsTrigger value="auth">Авторизация</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Основная информация
              </CardTitle>
              <CardDescription>
                Название и описание сайта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Название сайта</Label>
                <Input
                  id="site_name"
                  value={settings.site_name}
                  onChange={(e) => updateSetting("site_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description">Описание сайта</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => updateSetting("site_description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Логотип</Label>
                <ImageUpload
                  value={settings.logo_url}
                  onChange={(url) => updateSetting("logo_url", url)}
                  bucket="images"
                  folder="settings"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_text">Текст в подвале</Label>
                <Textarea
                  id="footer_text"
                  value={settings.footer_text}
                  onChange={(e) => updateSetting("footer_text", e.target.value)}
                  rows={2}
                  placeholder="© 2024 Город и горожане. Все права защищены."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Favicon
              </CardTitle>
              <CardDescription>
                Иконка сайта, отображаемая во вкладке браузера
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Рекомендуемый размер: 32x32 или 64x64 пикселей. Поддерживаемые форматы: PNG, ICO, SVG.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>Иконка сайта (Favicon)</Label>
                <ImageUpload
                  value={settings.favicon_url}
                  onChange={(url) => updateSetting("favicon_url", url)}
                  bucket="images"
                  folder="settings"
                />
              </div>
              
              {settings.favicon_url && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <img 
                    src={settings.favicon_url} 
                    alt="Favicon preview" 
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-sm text-muted-foreground">
                    Предпросмотр favicon (32x32)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Контактная информация
              </CardTitle>
              <CardDescription>
                Телефон, email и адрес редакции
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => updateSetting("phone", e.target.value)}
                    className="pl-10"
                    placeholder="+7 (XXX) XXX-XX-XX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting("email", e.target.value)}
                    className="pl-10"
                    placeholder="info@example.ru"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Адрес</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={(e) => updateSetting("address", e.target.value)}
                    className="pl-10"
                    rows={2}
                    placeholder="г. Железногорск, ул. ..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Социальные сети</CardTitle>
              <CardDescription>
                Ссылки на официальные страницы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="social_vk">ВКонтакте</Label>
                <Input
                  id="social_vk"
                  value={settings.social_vk}
                  onChange={(e) => updateSetting("social_vk", e.target.value)}
                  placeholder="https://vk.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_telegram">Telegram</Label>
                <Input
                  id="social_telegram"
                  value={settings.social_telegram}
                  onChange={(e) => updateSetting("social_telegram", e.target.value)}
                  placeholder="https://t.me/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_ok">Одноклассники</Label>
                <Input
                  id="social_ok"
                  value={settings.social_ok}
                  onChange={(e) => updateSetting("social_ok", e.target.value)}
                  placeholder="https://ok.ru/..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crosspost" className="space-y-6">
          <CrosspostSettings />
        </TabsContent>

        {isDeveloper && (
          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Настройки авторизации
                </CardTitle>
                <CardDescription>
                  Управление методами входа и регистрации (только для разработчиков)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Методы авторизации</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email авторизация</Label>
                      <p className="text-sm text-muted-foreground">
                        Вход и регистрация через email и пароль
                      </p>
                    </div>
                    <Switch
                      checked={settings.auth_email_enabled}
                      onCheckedChange={(checked) => updateSetting("auth_email_enabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Телефон авторизация</Label>
                      <p className="text-sm text-muted-foreground">
                        Вход и регистрация через SMS-код
                      </p>
                    </div>
                    <Switch
                      checked={settings.auth_phone_enabled}
                      onCheckedChange={(checked) => updateSetting("auth_phone_enabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Google авторизация</Label>
                      <p className="text-sm text-muted-foreground">
                        Вход через аккаунт Google
                      </p>
                    </div>
                    <Switch
                      checked={settings.auth_google_enabled}
                      onCheckedChange={(checked) => updateSetting("auth_google_enabled", checked)}
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-medium">Подтверждение</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Подтверждение Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Требовать подтверждение email при регистрации
                      </p>
                    </div>
                    <Switch
                      checked={settings.auth_email_confirm_required}
                      onCheckedChange={(checked) => updateSetting("auth_email_confirm_required", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Подтверждение телефона</Label>
                      <p className="text-sm text-muted-foreground">
                        Требовать подтверждение телефона при регистрации
                      </p>
                    </div>
                    <Switch
                      checked={settings.auth_phone_confirm_required}
                      onCheckedChange={(checked) => updateSetting("auth_phone_confirm_required", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
