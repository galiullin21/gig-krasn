import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Shield,
  FileText,
  Image,
  Newspaper,
  BookOpen,
  Settings,
  LogOut,
  Crown,
  Edit,
} from "lucide-react";

const roleLabels: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  admin: { label: "Администратор", color: "bg-red-500", icon: Crown },
  editor: { label: "Редактор", color: "bg-blue-500", icon: Edit },
  user: { label: "Пользователь", color: "bg-gray-500", icon: User },
};

export default function Cabinet() {
  const { user, profile, roles, isAdmin, isEditor, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0].toUpperCase() || "U";

  const displayRole = roles.length > 0 ? roles[0] : "user";
  const roleInfo = roleLabels[displayRole] || roleLabels.user;
  const RoleIcon = roleInfo.icon;

  return (
    <Layout>
      <div className="container py-6 md:py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-condensed font-bold mb-6">
          Личный кабинет
        </h1>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {profile?.full_name || "Пользователь"}
                  </h2>
                  <Badge className={`${roleInfo.color} text-white`}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {roleInfo.label}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                
                {roles.length > 1 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {roles.slice(1).map((role) => (
                      <Badge key={role} variant="outline">
                        {roleLabels[role]?.label || role}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats for Admins/Editors */}
        {isEditor && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Панель управления
              </CardTitle>
              <CardDescription>
                {isAdmin 
                  ? "Полный доступ к управлению сайтом" 
                  : "Доступ к редактированию контента"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin/news" className="group">
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="pt-6 text-center">
                      <Newspaper className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="font-medium">Новости</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/admin/blogs" className="group">
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="pt-6 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="font-medium">Блоги</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/admin/documents" className="group">
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="pt-6 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="font-medium">Документы</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/admin/galleries" className="group">
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="pt-6 text-center">
                      <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="font-medium">Галереи</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
              
              {isAdmin && (
                <>
                  <Separator className="my-6" />
                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline">
                      <Link to="/admin/users">
                        <User className="h-4 w-4 mr-2" />
                        Пользователи
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/admin/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Настройки сайта
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Activity (for regular users) */}
        {!isEditor && (
          <Card>
            <CardHeader>
              <CardTitle>Ваша активность</CardTitle>
              <CardDescription>
                История просмотров и взаимодействий
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Здесь будет отображаться ваша активность на сайте</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Статус аккаунта</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium">Активен</p>
                  <p className="text-sm text-muted-foreground">Аккаунт подтверждён</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{roleInfo.label}</p>
                  <p className="text-sm text-muted-foreground">Уровень доступа</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email подтверждён</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
