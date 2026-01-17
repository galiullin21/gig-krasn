import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { NewsletterSubscription } from "@/components/newsletter/NewsletterSubscription";

export function Footer() {
  return (
    <footer className="bg-gig-dark text-white">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Social */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <span className="text-3xl font-bold font-condensed">ГиГ</span>
            </Link>
            <p className="text-sm text-white/70">
              Город и горожане — информационный портал Железногорска
            </p>
            <div className="flex gap-3">
              <a
                href="https://vk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="VKontakte"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.189 1.366 1.259 2.18 1.815.616.42 1.084.328 1.084.328l2.175-.03s1.138-.07.598-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.246.999-1.33 1.398-2.142 1.273-2.489-.12-.332-.859-.244-.859-.244l-2.45.015s-.182-.025-.316.056c-.131.079-.216.263-.216.263s-.387 1.028-.903 1.903c-1.088 1.848-1.523 1.946-1.701 1.831-.414-.267-.31-1.075-.31-1.648 0-1.793.273-2.539-.532-2.733-.267-.064-.463-.106-1.146-.113-.876-.009-1.617.003-2.036.208-.278.136-.493.44-.363.457.162.022.528.099.722.363.251.341.242 1.107.242 1.107s.144 2.11-.336 2.372c-.33.179-.782-.187-1.753-1.868-.497-.861-.872-1.814-.872-1.814s-.072-.177-.201-.272c-.156-.115-.374-.151-.374-.151l-2.328.015s-.35.01-.478.161c-.114.135-.009.413-.009.413s1.819 4.254 3.878 6.399c1.889 1.966 4.032 1.837 4.032 1.837h.972z" />
                </svg>
              </a>
              <a
                href="https://ok.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Odnoklassniki"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm4.5 8.5c-.69.69-1.602 1.063-2.546 1.206l2.046 2.044a1 1 0 01-1.414 1.414L12 17.078l-2.586 2.586a1 1 0 01-1.414-1.414l2.046-2.044c-.944-.143-1.856-.516-2.546-1.206a1 1 0 011.414-1.414c1.17 1.17 3.002 1.17 4.172 0a1 1 0 011.414 1.414z" />
                </svg>
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Telegram"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-condensed font-bold text-lg mb-4 uppercase">
              Рассылка
            </h3>
            <NewsletterSubscription />
          </div>

          {/* Реклама */}
          <div>
            <h3 className="font-condensed font-bold text-lg mb-4 uppercase">
              Реклама
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link to="/advertising" className="hover:text-white transition-colors">
                  Разместить рекламу
                </Link>
              </li>
              <li>
                <Link to="/price-list" className="hover:text-white transition-colors">
                  Прайс-лист
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="font-condensed font-bold text-lg mb-4 uppercase">
              Контакты
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>662971, Красноярский край, г. Железногорск</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <a href="tel:+73919740000" className="hover:text-white transition-colors">
                  +7 (3919) 74-00-00
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:info@gig26.ru" className="hover:text-white transition-colors">
                  info@gig26.ru
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/50">
          <p>
            © {new Date().getFullYear()} ГиГ — Город и горожане. Все права защищены.
          </p>
          <p className="mt-2">
            Учредитель и издатель: МАУ «Редакция газеты „Город и горожане"».
            Главный редактор: Иванов И.И.
          </p>
          <p className="mt-1">
            Свидетельство о регистрации СМИ ПИ № ТУ24-00000 от 01.01.2020
          </p>
          <p className="mt-3 text-white/70">
            Разработка и дизайн —{" "}
            <a 
              href="https://t.me/galiullin_ruzal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Рузаль Галиуллин
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
