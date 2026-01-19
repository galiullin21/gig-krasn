import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Image as ImageIcon, GripVertical } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket: string;
  folder?: string;
  maxImages?: number;
}

export function MultiImageUpload({
  value,
  onChange,
  bucket,
  folder = "",
  maxImages = 20,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: `Максимальное количество изображений: ${maxImages}`,
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const invalidFiles = filesToUpload.filter(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Некоторые файлы не являются изображениями",
      });
      return;
    }

    const largeFiles = filesToUpload.filter(
      (file) => file.size > 5 * 1024 * 1024
    );
    if (largeFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Некоторые файлы превышают 5 МБ",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const newUrls: string[] = [];
    let uploaded = 0;

    try {
      for (const file of filesToUpload) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
        uploaded++;
        setUploadProgress(Math.round((uploaded / filesToUpload.length) * 100));
      }

      onChange([...value, ...newUrls]);
      toast({
        title: `Загружено ${newUrls.length} изображений`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = [...value];
    newUrls.splice(index, 1);
    onChange(newUrls);
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.length) return;
    const newUrls = [...value];
    const [moved] = newUrls.splice(fromIndex, 1);
    newUrls.splice(toIndex, 0, moved);
    onChange(newUrls);
  };

  return (
    <div className="space-y-4">
      {/* Carousel Preview */}
      {value.length > 0 && (
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {value.map((url, index) => (
                <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="relative group aspect-video rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveImage(index, index - 1)}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1} / {value.length}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>
      )}

      {/* Grid View */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-md overflow-hidden border"
            >
              <img
                src={url}
                alt={`Thumb ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxImages && (
        <label className="flex flex-col items-center justify-center w-full py-8 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors bg-muted/30">
          <div className="flex flex-col items-center justify-center">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">
                  Загрузка... {uploadProgress}%
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Нажмите для загрузки изображений
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP (до 5 МБ каждое)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {value.length} / {maxImages} изображений
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative"
          disabled={isUploading || value.length >= maxImages}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Добавить изображения
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading || value.length >= maxImages}
          />
        </Button>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
          >
            <X className="h-4 w-4 mr-1" />
            Очистить все
          </Button>
        )}
      </div>
    </div>
  );
}
