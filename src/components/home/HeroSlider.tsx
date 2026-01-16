import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlideItem {
  id: string;
  title: string;
  category: string;
  image: string;
  slug: string;
  date: string;
}

const mockSlides: SlideItem[] = [
  {
    id: "1",
    title: "В Железногорске открылся новый спортивный комплекс",
    category: "Город",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=600&fit=crop",
    slug: "novyj-sportivnyj-kompleks",
    date: "16 января 2026",
  },
  {
    id: "2",
    title: "Губернатор края посетил Железногорск с рабочим визитом",
    category: "Власть",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=600&fit=crop",
    slug: "vizit-gubernatora",
    date: "15 января 2026",
  },
  {
    id: "3",
    title: "Итоги года: главные события Железногорска",
    category: "Общество",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=600&fit=crop",
    slug: "itogi-goda",
    date: "14 января 2026",
  },
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mockSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + mockSlides.length) % mockSlides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % mockSlides.length);
  };

  return (
    <section className="relative h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
      {mockSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container">
              <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-medium uppercase mb-3">
                {slide.category}
              </span>
              <Link to={`/news/${slide.slug}`}>
                <h2 className="text-2xl md:text-4xl font-condensed font-bold text-white text-shadow mb-2 line-clamp-2 hover:text-primary-foreground/90 transition-colors">
                  {slide.title}
                </h2>
              </Link>
              <p className="text-white/70 text-sm">{slide.date}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 text-white hover:bg-black/50"
        onClick={goToPrev}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 text-white hover:bg-black/50"
        onClick={goToNext}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {mockSlides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentSlide ? "bg-primary" : "bg-white/50"
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
