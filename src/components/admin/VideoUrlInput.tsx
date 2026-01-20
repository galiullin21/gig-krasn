import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Video, GripVertical } from "lucide-react";

interface VideoUrlInputProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function VideoUrlInput({ value, onChange }: VideoUrlInputProps) {
  const [newUrl, setNewUrl] = useState("");

  const addUrl = () => {
    if (!newUrl.trim()) return;
    
    // Validate URL format
    const isValid = 
      newUrl.includes("youtube.com") || 
      newUrl.includes("youtu.be") ||
      newUrl.includes("vk.com/video") ||
      newUrl.includes("vkvideo.ru") ||
      newUrl.includes("rutube.ru") ||
      newUrl.includes("vimeo.com");

    if (!isValid) {
      return;
    }

    onChange([...value, newUrl.trim()]);
    setNewUrl("");
  };

  const removeUrl = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const getPlatformName = (url: string): string => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
    if (url.includes("vk.com") || url.includes("vkvideo.ru")) return "VK Video";
    if (url.includes("rutube.ru")) return "Rutube";
    if (url.includes("vimeo.com")) return "Vimeo";
    return "Видео";
  };

  const getPlatformColor = (url: string): string => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "bg-red-500/10 text-red-600 border-red-200";
    if (url.includes("vk.com") || url.includes("vkvideo.ru")) return "bg-blue-500/10 text-blue-600 border-blue-200";
    if (url.includes("rutube.ru")) return "bg-green-500/10 text-green-600 border-green-200";
    if (url.includes("vimeo.com")) return "bg-cyan-500/10 text-cyan-600 border-cyan-200";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      {/* Existing videos */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((url, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getPlatformColor(url)}`}
            >
              <GripVertical className="h-4 w-4 opacity-50 cursor-move" />
              <Video className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium mb-0.5">{getPlatformName(url)}</div>
                <div className="text-xs truncate opacity-70">{url}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => removeUrl(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new video */}
      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Вставьте ссылку на видео (YouTube, VK, Rutube, Vimeo)"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <Button 
          type="button" 
          variant="secondary" 
          onClick={addUrl}
          disabled={!newUrl.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Поддерживаемые платформы: YouTube, VK Video (vk.com, vkvideo.ru), Rutube, Vimeo
      </p>
    </div>
  );
}
