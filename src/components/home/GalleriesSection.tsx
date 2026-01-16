import { Link } from "react-router-dom";
import { ChevronRight, Camera } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  coverImage: string;
  photosCount: number;
  slug: string;
  type: "gallery" | "photoreport";
}

const mockGalleries: GalleryItem[] = [
  {
    id: "1",
    title: "День города 2025: праздничный концерт",
    coverImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
    photosCount: 45,
    slug: "den-goroda-2025",
    type: "photoreport",
  },
  {
    id: "2",
    title: "Зимний Железногорск",
    coverImage: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=600&h=400&fit=crop",
    photosCount: 28,
    slug: "zimnij-zheleznogorsk",
    type: "gallery",
  },
  {
    id: "3",
    title: "Открытие нового спорткомплекса",
    coverImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
    photosCount: 32,
    slug: "otkrytie-sportkompleksa",
    type: "photoreport",
  },
];

export function GalleriesSection() {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-condensed font-bold uppercase">
          Фотогалереи
        </h2>
        <Link
          to="/galleries"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Все галереи
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockGalleries.map((gallery) => (
          <article key={gallery.id} className="group relative">
            <Link to={`/galleries/${gallery.slug}`} className="block">
              <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                <img
                  src={gallery.coverImage}
                  alt={gallery.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 text-white/80 text-xs mb-2">
                    <Camera className="w-4 h-4" />
                    <span>{gallery.photosCount} фото</span>
                    <span className="uppercase">
                      {gallery.type === "photoreport"
                        ? "Фоторепортаж"
                        : "Галерея"}
                    </span>
                  </div>
                  <h3 className="text-white font-condensed font-bold text-lg leading-tight line-clamp-2 text-shadow">
                    {gallery.title}
                  </h3>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
