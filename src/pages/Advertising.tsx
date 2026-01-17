import { Layout } from "@/components/layout/Layout";
import { Phone, Mail, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdBannerDisplay } from "@/components/ads/AdBannerDisplay";

export default function Advertising() {
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
                  Реклама в сетевом издании<br />«Город и горожане»
                </h1>
              </div>

              {/* Contacts */}
              <div className="mb-8 space-y-2">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <strong>Звоните:</strong> (3919) 75-99-99, 74-67-47
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <strong>Пишите:</strong>{" "}
                  <a href="mailto:otrpl@mail.ru" className="text-primary hover:underline">
                    otrpl@mail.ru
                  </a>
                </p>
              </div>

              {/* Documents */}
              <div className="mb-8 space-y-2">
                <a href="#" className="text-primary hover:underline flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Прайс-лист (скачать)
                </a>
                <a href="#" className="text-primary hover:underline flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Договор публичной оферты МКУ ЦОС (скачать)
                </a>
              </div>

              {/* Why us */}
              <div className="mb-8">
                <h2 className="font-bold text-lg mb-4">Почему мы?</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Сетевое издание gig26.ru зарегистрировано в Роскомнадзоре 06 апреля 2012 г. Номер свидетельства Эл № ФС77-49278.</li>
                  <li>• gig26.ru – это городской портал Железногорска. Аудитория проекта – в месяц около 13 тысяч индивидуальных пользователей.</li>
                  <li>• Количество просмотров сайта в месяц – от 50 до 70 тысяч!</li>
                  <li>• Рекламные услуги предоставляются только юридическим лицам, в соответствии с <a href="#" className="text-primary hover:underline">ФЗ «О рекламе» от 13.03.2006 N 38-ФЗ</a></li>
                </ul>
              </div>

              {/* What we offer */}
              <div className="mb-8">
                <h2 className="font-bold text-lg mb-4">Что мы предлагаем:</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Размещение рекламного баннера на страницах сайта;</li>
                  <li>• Написание (размещение) рекламных новостей на сайте.</li>
                </ul>
              </div>

              {/* Banner ads */}
              <div className="mb-8">
                <h2 className="font-bold text-lg mb-4">Баннерная реклама:</h2>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Рекламодателю предоставляет статичный графический материал (баннер) в формате .jpg(.png) с разрешением 800 х 80 px / 770 х 350 рх (пиксели), либо динамический баннер в формате gif с разрешением 800 х 80 рх / 770 х 350 рх (пиксели);</li>
                  <li>• Сетевое издание не предоставляет услуги разработки графического материала;</li>
                  <li>• Минимальный период размещения баннера - 7 дней, максимальный период не ограничен;</li>
                  <li>• Рекламные места на сайте представлены в приложении ниже</li>
                </ul>
              </div>

              {/* News ads */}
              <div className="mb-8">
                <h2 className="font-bold text-lg mb-4">Новости (информационные сообщения):</h2>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Новость публикуется на главной странице сайта в разделе «Самое важное» сроком на 5 дней. Затем новость сдвигается по ленте новостей, но с сайта не удаляется;</li>
                  <li>• Рекламная новость может содержать до 5 изображений;</li>
                  <li>• У публикуемой новости в качестве источника указывается сайт клиента или иные рекламные носители;</li>
                </ul>
              </div>

              {/* Important */}
              <div className="mb-8 p-4 bg-muted rounded-lg">
                <h2 className="font-bold text-lg mb-2">Важно:</h2>
                <p className="text-muted-foreground text-sm">
                  Реклама размещается только после оплаты и согласования с редактором сайта.
                </p>
              </div>

              {/* Ad placements */}
              <div className="mb-8">
                <h2 className="font-bold text-lg mb-4">Рекламные места:</h2>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Растяжка вверху сайта (титульная и внутренние страницы) (место №1)</li>
                  <li>• Растяжка под новостным слайдером на титульной странице сайта (место №2)</li>
                  <li>• Растяжка справа на титульной странице сайта (рядом с блоком "Статьи") (места №3 и №4)</li>
                </ul>
              </div>

              {/* Preview images */}
              <div className="space-y-6">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-primary text-primary-foreground p-2 text-sm">
                    Пример размещения рекламы
                  </div>
                  <div className="p-4 bg-muted/30">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                      Схема размещения рекламы на сайте
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-72 space-y-6">
              <AdBannerDisplay position="advertising-sidebar" />
              <AdBannerDisplay position="advertising-sidebar" />
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}
