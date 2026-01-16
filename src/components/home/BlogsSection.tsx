import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BlogItem {
  id: string;
  title: string;
  category: string;
  coverImage: string;
  slug: string;
}

const mockBlogs: BlogItem[] = [
  {
    id: "1",
    title: "О смысле жизни и простых радостях",
    category: "Философия",
    coverImage: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=300&fit=crop",
    slug: "o-smysle-zhizni",
  },
  {
    id: "2",
    title: "Как я провел лето в Железногорске",
    category: "Размышления",
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    slug: "leto-v-zheleznogorske",
  },
  {
    id: "3",
    title: "Мой опыт работы в атомной отрасли",
    category: "Опыт",
    coverImage: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=300&fit=crop",
    slug: "opyt-atomnaya-otrasl",
  },
  {
    id: "4",
    title: "Воспоминания о старом городе",
    category: "Размышления",
    coverImage: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop",
    slug: "vospominaniya-o-gorode",
  },
];

export function BlogsSection() {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-condensed font-bold uppercase">Блоги</h2>
        <Link
          to="/blogs"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Все блоги
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockBlogs.map((blog) => (
          <article key={blog.id} className="group">
            <Link to={`/blogs/${blog.slug}`} className="block">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted mb-2">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>
            <span className="text-xs font-medium text-primary uppercase">
              {blog.category}
            </span>
            <Link to={`/blogs/${blog.slug}`}>
              <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors mt-1">
                {blog.title}
              </h3>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
