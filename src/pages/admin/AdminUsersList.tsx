import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RoleBadge } from "@/components/RoleBadge";
import { UserWarningsDialog } from "@/components/admin/UserWarningsDialog";
import { Search, Shield, ShieldCheck, User, Trash2, AlertTriangle, Code, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_verified: boolean | null;
  role: string | null;
  role_id: string | null;
  warnings_count: number;
}

export default function AdminUsersList() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [warningsDialog, setWarningsDialog] = useState<{ userId: string; userName: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const { data: warnings } = await supabase
        .from("user_warnings")
        .select("user_id");

      const warningsCounts: Record<string, number> = {};
      warnings?.forEach(w => {
        warningsCounts[w.user_id] = (warningsCounts[w.user_id] || 0) + 1;
      });

      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || null,
          role_id: userRole?.id || null,
          warnings_count: warningsCounts[profile.user_id] || 0,
        };
      });

      if (search) {
        return usersWithRoles.filter((u) =>
          u.full_name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      return usersWithRoles;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, existingRoleId }: { userId: string; role: "admin" | "editor" | "author" | "developer" | "none"; existingRoleId: string | null }) => {
      if (role === "none") {
        if (existingRoleId) {
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("id", existingRoleId);
          if (error) throw error;
        }
      } else if (existingRoleId) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("id", existingRoleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Роль обновлена" });
    },
    onError: (error) => {
      console.error("Role update error:", error);
      toast({ title: "Ошибка обновления роли", variant: "destructive" });
    },
  });

  const toggleVerifiedMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: isVerified })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Статус обновлён" });
    },
    onError: () => {
      toast({ title: "Ошибка", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from("user_warnings").delete().eq("user_id", userId);
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Профиль удалён" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    },
  });

  const handleRoleChange = (user: UserWithRole, newRole: "admin" | "editor" | "author" | "developer" | "none") => {
    updateRoleMutation.mutate({
      userId: user.user_id,
      role: newRole,
      existingRoleId: user.role_id,
    });
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="h-4 w-4 text-red-500" />;
      case "editor":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "developer":
        return <Code className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-condensed font-bold">Пользователи</h1>
          <p className="text-muted-foreground">Управление пользователями и ролями</p>
        </div>
        <Button asChild variant="destructive">
          <Link to="/admin/warnings/new">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Выдать предупреждение
          </Link>
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Верификация</TableHead>
              <TableHead>Предупр.</TableHead>
              <TableHead>Дата регистрации</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.full_name || "Без имени"}</span>
                        {user.is_verified && (
                          <CheckCircle className="h-4 w-4 text-red-500 fill-current" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <Select
                        value={user.role || "none"}
                        onValueChange={(value) => handleRoleChange(user, value as any)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Без роли</SelectItem>
                          <SelectItem value="author">Автор</SelectItem>
                          <SelectItem value="editor">Редактор</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                          <SelectItem value="developer">Разработчик</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={user.is_verified ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVerifiedMutation.mutate({
                        userId: user.user_id,
                        isVerified: !user.is_verified,
                      })}
                      className={user.is_verified ? "bg-red-500 hover:bg-red-600" : ""}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    {user.warnings_count > 0 ? (
                      <button
                        onClick={() => setWarningsDialog({
                          userId: user.user_id,
                          userName: user.full_name || "Пользователь",
                        })}
                        className="text-destructive font-medium hover:underline"
                      >
                        {user.warnings_count}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "d MMM yyyy", { locale: ru })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/admin/warnings/new?user=${user.user_id}`}>
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(user.user_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Пользователи не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить профиль?</AlertDialogTitle>
            <AlertDialogDescription>
              Это удалит профиль пользователя, его роли и предупреждения. Аккаунт останется в системе.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteUserMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {warningsDialog && (
        <UserWarningsDialog
          userId={warningsDialog.userId}
          userName={warningsDialog.userName}
          open={!!warningsDialog}
          onOpenChange={(open) => !open && setWarningsDialog(null)}
        />
      )}
    </div>
  );
}
