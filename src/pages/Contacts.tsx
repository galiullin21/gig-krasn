import { Layout } from "@/components/layout/Layout";
import { Phone, Mail, Clock, MapPin } from "lucide-react";

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

export default function Contacts() {
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
                <h1 className="font-condensed font-bold text-2xl md:text-3xl">Редакция</h1>
              </div>

              <div className="space-y-4">
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <span>
                    <strong>Адрес:</strong> 662971, Красноярский край, г. Железногорск,
                    ул. 22 Партсъезда, 21, а/я 174
                  </span>
                </p>

                <p className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <span>
                    <strong>Телефон:</strong>{" "}
                    <a href="tel:+73919723679" className="text-primary hover:underline">
                      +7 (3919) 72-36-79
                    </a>
                    <br />
                    <strong>Факс:</strong> +7 (3919) 72-82-83
                  </span>
                </p>

                <p className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <span>
                    <strong>Время работы:</strong> понедельник — пятница, с 8.30 до 17.30
                    <br />
                    <strong>Перерыв</strong> — с 12.30 до 13.30
                  </span>
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <p className="font-medium">И.о. главного редактора сетевого издания:</p>
                  <p className="text-muted-foreground">Мажурина Екатерина Дмитриевна</p>
                  <p className="text-muted-foreground">+7 (3919) 74-66-11</p>
                </div>

                <div>
                  <p className="font-medium">Редактор сетевого издания (сайт газеты "Город и горожане"):</p>
                  <p className="text-muted-foreground">Исаченко Сергей Владимирович</p>
                  <p className="text-muted-foreground">+7 (3919) 74-66-11</p>
                </div>
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
