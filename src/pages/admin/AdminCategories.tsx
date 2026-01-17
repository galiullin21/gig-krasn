import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export default function AdminCategories() {
  const [activeTab, setActiveTab] = useState("categories");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | TagItem | null>(null);
  const [itemType, setItemType] = useState<"news" | "blog" | "document">("news");
  const [itemName, setItemName] = useState("");
  const [itemSlug, setItemSlug] = useState("");
  const [deleteItem, setDeleteItem] = useState<{ id: string; table: "categories" | "tags" } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("type", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch tags
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ["admin-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("type", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as TagItem[];
    },
  });

  // Create/update category
  const categoryMutation = useMutation({
    mutationFn: async ({ id, name, slug, type }: { id?: string; name: string; slug: string; type: string }) => {
      if (id) {
        const { error } = await supabase.from("categories").update({ name, slug }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert([{ name, slug, type }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: editingItem ? "Категория обновлена" : "Категория создана" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    },
  });

  // Create/update tag
  const tagMutation = useMutation({
    mutationFn: async ({ id, name, slug, type }: { id?: string; name: string; slug: string; type: string }) => {
      if (id) {
        const { error } = await supabase.from("tags").update({ name, slug }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tags").insert([{ name, slug, type }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
      toast({ title: editingItem ? "Тег обновлён" : "Тег создан" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, table }: { id: string; table: "categories" | "tags" }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
      toast({ title: "Удалено" });
      setDeleteItem(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-а-яё]/gi, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const openDialog = (item?: Category | TagItem, type?: "news" | "blog" | "document") => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemSlug(item.slug);
      setItemType(item.type as "news" | "blog" | "document");
    } else {
      setEditingItem(null);
      setItemName("");
      setItemSlug("");
      setItemType(type || "news");
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setItemName("");
    setItemSlug("");
  };

  const handleSave = () => {
    if (!itemName.trim()) return;
    const slug = itemSlug || generateSlug(itemName);
    
    if (activeTab === "categories") {
      categoryMutation.mutate({ id: editingItem?.id, name: itemName.trim(), slug, type: itemType });
    } else {
      tagMutation.mutate({ id: editingItem?.id, name: itemName.trim(), slug, type: itemType === "document" ? "news" : itemType });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "news": return "Новости";
      case "blog": return "Блоги";
      case "document": return "Документы";
      default: return type;
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-condensed font-bold">Категории и теги</h1>
        <p className="text-muted-foreground">Управление категориями и тегами контента</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="tags">Теги</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Категории</CardTitle>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="w-24">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeLabel(cat.type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openDialog(cat)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteItem({ id: cat.id, table: "categories" })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {categories.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Категории не найдены
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Теги
              </CardTitle>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="w-24">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">#{tag.name}</TableCell>
                        <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeLabel(tag.type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openDialog(tag)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteItem({ id: tag.id, table: "tags" })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tags.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Теги не найдены
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Редактировать" : "Создать"} {activeTab === "categories" ? "категорию" : "тег"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название</label>
              <Input
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  if (!editingItem) {
                    setItemSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="Название"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={itemSlug}
                onChange={(e) => setItemSlug(e.target.value)}
                placeholder="slug-url"
              />
            </div>
            {!editingItem && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Тип</label>
                <div className="flex gap-2">
                  {(activeTab === "categories" ? ["news", "blog", "document"] : ["news", "blog"]).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={itemType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setItemType(type as "news" | "blog" | "document")}
                    >
                      {getTypeLabel(type)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={categoryMutation.isPending || tagMutation.isPending}>
              {(categoryMutation.isPending || tagMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить {deleteItem?.table === "categories" ? "категорию" : "тег"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
