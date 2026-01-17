import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Tag {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface TagSelectorProps {
  type: "news" | "blog";
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagSelector({ type, selectedTagIds, onChange }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: tags = [], refetch } = useQuery({
    queryKey: ["tags", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("type", type)
        .order("name");
      if (error) throw error;
      return data as Tag[];
    },
  });

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const availableTags = tags.filter((tag) => !selectedTagIds.includes(tag.id));

  const handleSelect = (tagId: string) => {
    onChange([...selectedTagIds, tagId]);
  };

  const handleRemove = (tagId: string) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const slug = newTagName
        .toLowerCase()
        .replace(/[^\w\s-а-яё]/gi, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const { data, error } = await supabase
        .from("tags")
        .insert([{ name: newTagName.trim(), slug, type }])
        .select("id")
        .single();

      if (error) throw error;

      await refetch();
      onChange([...selectedTagIds, data.id]);
      setNewTagName("");
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              #{tag.name}
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector */}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" type="button">
              <Plus className="h-4 w-4 mr-1" />
              Добавить тег
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-64" align="start">
            <Command>
              <CommandInput placeholder="Поиск тегов..." />
              <CommandList>
                <CommandEmpty>Теги не найдены</CommandEmpty>
                <CommandGroup>
                  {availableTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => {
                        handleSelect(tag.id);
                        setOpen(false);
                      }}
                    >
                      #{tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Create new tag */}
        <div className="flex gap-1">
          <Input
            placeholder="Новый тег"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="h-9 w-32"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createTag())}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={createTag}
            disabled={!newTagName.trim() || isCreating}
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Создать"}
          </Button>
        </div>
      </div>
    </div>
  );
}
