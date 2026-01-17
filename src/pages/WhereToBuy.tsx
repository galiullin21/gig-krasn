import { Layout } from "@/components/layout/Layout";

const salesPoints = {
  "В магазинах торговой сети «Командор»": [
    "1. Свердлова, 22 «Савин»",
    "2. Свердлова, 35 «Прогресс»",
    "3. Школьная, 23 маг. «Школьный»",
    "4. Курчатова,33 «Созвездие»",
    "5. Восточная, 49а «Ториш»",
    "6. Ленинградский 16, «Аллея»",
    "7. Ленинградский, 35, «Балтийский»",
    "8. Ленинградский, 55 «Мозаика»",
    "9. 60 лет ВЛКСМ, 24 «Снежинка»",
    "10. Белорусская, 53 «Цветик»"
  ],
  "Микрорайон": [
    "рынок «Центральный», магазины «Семейный» (Восточная, 11), «Кедр» (Восточная, 31б), «Риф» (Восточная, 49), «Волки» (Восточная, 58а), «Фортуна» (Восточная, 13), «Ёлочка» (Молодёжная, 15а), «Белый аист» (Курчатова, 53), «Виктория-Он» (Курчатова, 22), «7 шагов» (Центральный, 4а), «Квадрат» (Курчатова,16а), киоск «Поми» (Королёва, 6а)."
  ],
  "Ленинградский": [
    "киоск «Любимый» (60 лет ВЛКСМ, 64), магазины «Проспект» (Ленинградский, 20а), «Гурман» (Ленинградский, 71), «Красный яр» (Мира,15), «Хозтовары» (Мира, 15в), «Санни» (60 лет ВЛКСМ), «Вега» (Ленинградский).",
    "п. Зазеркий (Элиа): ТД «Железногорск»."
  ],
  "Старая часть города": [
    "магазины «Квадрат» (Андреева, 9), «Тасти» (Ленина, 50), «Шанс» (Ленина, 63а), «Час пик» (Ленина, 24), «Федя» (Свердлова, 53), «Для вас» (Октябрьская, 41), «Осень» (Маяковского, 19), «квадрат» (Ленина, 13), «Фавор» (Свердлова, 55г)",
    "А также в рекламном отеле газеты «Город и горожане» по Ленина, 25а (гостиница «Центральная», 1 этаж)."
  ],
  "Первомайский": ["магазины «ИП Павличенко», «Палитра»."],
  "Лукаши": ["магазин «Лукаши»"],
  "Додоново": ["магазин «Додоновский», магазин «Колос»"],
  "Подгорный": ["магазины «Соболь», «Енисей»"],
  "Новый Путь": ["магазин «Маяк»"],
  "У наших распространителей": [
    "в магазинах «Прогресс», «Домашний» (Мира, 25а)."
  ]
};

export default function WhereToBuy() {
  return (
    <Layout>
      {/* Hero Banner */}
      <div className="bg-muted">
        <div className="container py-6">
          <div className="bg-primary/10 rounded-lg flex items-center justify-center min-h-[100px] text-muted-foreground">
            <span>Рекламный баннер</span>
          </div>
        </div>
      </div>

      <div className="bg-card">
        <div className="container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1">
              <div className="border-l-4 border-primary pl-4 mb-6">
                <h1 className="font-condensed font-bold text-2xl md:text-3xl">
                  Где купить газету «Город и горожане»?
                </h1>
              </div>

              <p className="text-muted-foreground mb-6">
                Газету «Город и горожане» можно купить в следующих торговых точках:
              </p>

              <p className="mb-6">
                <strong>Во всех киосках «Роспечать».</strong>
              </p>

              <div className="space-y-6">
                {Object.entries(salesPoints).map(([region, points]) => (
                  <div key={region}>
                    <h3 className="font-bold mb-2">{region}:</h3>
                    <ul className="space-y-1 text-muted-foreground text-sm">
                      {points.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Ищите на торговых точках ЗАТО объявление:</strong><br />
                  Здесь можно купить газету «Город и горожане»
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-72 space-y-6">
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="text-center text-muted-foreground text-sm mb-2">Реклама</div>
                <div className="bg-muted rounded-lg flex items-center justify-center min-h-[200px]">
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Здесь может быть размещено ваше рекламное объявление
                  </p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>РЕКЛАМА</span>
                  <span>16.02.2024</span>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="text-center text-muted-foreground text-sm mb-2">Реклама</div>
                <div className="bg-muted rounded-lg flex items-center justify-center min-h-[200px]">
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Здесь может быть размещено ваше рекламное объявление
                  </p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>РЕКЛАМА</span>
                  <span>16.02.2024</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}
