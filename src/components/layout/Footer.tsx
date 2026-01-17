import { Link } from "react-router-dom";

// Social icons
const VKIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.189 1.366 1.259 2.18 1.815.616.42 1.084.328 1.084.328l2.175-.03s1.138-.07.598-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.246.999-1.33 1.398-2.142 1.273-2.489-.12-.332-.859-.244-.859-.244l-2.45.015s-.182-.025-.316.056c-.131.079-.216.263-.216.263s-.387 1.028-.903 1.903c-1.088 1.848-1.523 1.946-1.701 1.831-.414-.267-.31-1.075-.31-1.648 0-1.793.273-2.539-.532-2.733-.267-.064-.463-.106-1.146-.113-.876-.009-1.617.003-2.036.208-.278.136-.493.44-.363.457.162.022.528.099.722.363.251.341.242 1.107.242 1.107s.144 2.11-.336 2.372c-.33.179-.782-.187-1.753-1.868-.497-.861-.872-1.814-.872-1.814s-.072-.177-.201-.272c-.156-.115-.374-.151-.374-.151l-2.328.015s-.35.01-.478.161c-.114.135-.009.413-.009.413s1.819 4.254 3.878 6.399c1.889 1.966 4.032 1.837 4.032 1.837h.972z" />
  </svg>
);

const OKIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm4.5 8.5c-.69.69-1.602 1.063-2.546 1.206l2.046 2.044a1 1 0 01-1.414 1.414L12 17.078l-2.586 2.586a1 1 0 01-1.414-1.414l2.046-2.044c-.944-.143-1.856-.516-2.546-1.206a1 1 0 011.414-1.414c1.17 1.17 3.002 1.17 4.172 0a1 1 0 011.414 1.414z" />
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
  </svg>
);

const ViberIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.18 1.88 5.82L2 22l4.18-1.88C7.82 21.3 9.83 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.5 14.5c-.25.7-1.45 1.33-2 1.4-.5.07-1.15.1-1.85-.12-.42-.13-1-.32-1.7-.62-3-1.3-4.95-4.4-5.1-4.6-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.15 1.05-2.45.25-.25.55-.35.75-.35h.55c.2 0 .45-.05.7.5.25.6.9 2.15.95 2.3.1.15.1.35 0 .55-.05.15-.1.25-.2.4-.1.1-.2.25-.3.35-.1.1-.2.2-.1.4.15.2.6.95 1.25 1.55.85.75 1.55 1 1.8 1.1.2.1.35.1.5-.05.1-.15.5-.6.65-.8.15-.2.3-.2.5-.1.2.05 1.25.6 1.45.7.25.1.4.15.45.25.1.1.1.6-.15 1.15z" />
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-gig-dark text-white">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Contacts */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-1">
              <span className="text-white/60 text-xl">°</span>
              <span className="text-3xl font-bold font-condensed">ГиГ</span>
            </Link>
            
            <div className="flex gap-2 mt-4">
              <a
                href="https://vk.com/gig26"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="VKontakte"
              >
                <VKIcon />
              </a>
              <a
                href="https://ok.ru/gig26"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Odnoklassniki"
              >
                <OKIcon />
              </a>
              <a
                href="https://t.me/gig26"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Telegram"
              >
                <TelegramIcon />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Viber"
              >
                <ViberIcon />
              </a>
            </div>
            
            <div className="text-sm text-white/70 space-y-1 mt-4">
              <p className="font-medium text-white">Телефон редакции:</p>
              <p>+7 (3919) 74-66-11, 72-36-79</p>
              <p className="font-medium text-white mt-3">E-mail редакции:</p>
              <p>
                <a href="mailto:gig-26@mail.ru" className="text-primary hover:underline">
                  gig-26@mail.ru
                </a>
              </p>
            </div>
          </div>

          {/* Газета */}
          <div>
            <h3 className="font-bold text-lg mb-4">Газета</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link to="/documents" className="hover:text-white transition-colors">
                  Официальные документы
                </Link>
              </li>
              <li>
                <Link to="/archive" className="hover:text-white transition-colors">
                  Свежий выпуск
                </Link>
              </li>
              <li>
                <Link to="/archive" className="hover:text-white transition-colors">
                  Архив
                </Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-white transition-colors">
                  Справочная
                </Link>
              </li>
              <li>
                <Link to="/contacts" className="hover:text-white transition-colors">
                  О редакции
                </Link>
              </li>
            </ul>
          </div>

          {/* Реклама */}
          <div>
            <h3 className="font-bold text-lg mb-4">Реклама</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link to="/advertising" className="hover:text-white transition-colors">
                  Рекламодателям
                </Link>
              </li>
              <li>
                <p>Тел: (3919) 75-99-99</p>
              </li>
              <li>
                <a href="mailto:otrpl@mail.ru" className="hover:text-white transition-colors">
                  E-mail: otrpl@mail.ru
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-8 pt-6 text-xs text-white/50">
          <div className="md:flex md:justify-between mb-4">
            <p className="mb-2 md:mb-0">
              Сетевое издание gig26.ru зарегистрировано в Роскомнадзоре
              <br />
              06 апреля 2012 г.{" "}
              <a href="#" className="text-primary hover:underline">
                Номер свидетельства Эл № ФС77-49278
              </a>
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between gap-2">
            <p>© "Город и горожане" 2011-{new Date().getFullYear()}</p>
            <p>При перепечатке материалов ссылка на сайт газеты обязательна</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
