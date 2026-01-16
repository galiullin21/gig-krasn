import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Clock, Building } from "lucide-react";

export default function CityMap() {
  useEffect(() => {
    // Load Leaflet CSS dynamically
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-condensed font-bold mb-6">
          Карта Железногорска
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video md:aspect-[16/10] w-full">
                  <iframe
                    src="https://www.openstreetmap.org/export/embed.html?bbox=93.48%2C56.20%2C93.60%2C56.28&layer=mapnik&marker=56.2494%2C93.5375"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Карта Железногорска"
                  />
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground mt-2">
              <a
                href="https://www.openstreetmap.org/?mlat=56.2494&mlon=93.5375#map=13/56.2494/93.5375"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Открыть большую карту →
              </a>
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />О городе
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <strong>Железногорск</strong> (Красноярск-26) — закрытый город 
                  в Красноярском крае России, расположенный на берегу реки Енисей.
                </p>
                <p>
                  Население: около 84 000 человек
                </p>
                <p>
                  Основан в 1950 году как секретный город для размещения 
                  Горно-химического комбината.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Полезные адреса
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="font-medium">Администрация города</p>
                  <p className="text-sm text-muted-foreground">
                    ул. 22 Партсъезда, 21
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Редакция газеты «ГиГ»</p>
                  <p className="text-sm text-muted-foreground">
                    ул. Свердлова, 47
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Дворец культуры</p>
                  <p className="text-sm text-muted-foreground">
                    ул. Ленина, 23
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Контакты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>+7 (3919) 74-00-00</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Пн–Пт: 9:00–18:00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
