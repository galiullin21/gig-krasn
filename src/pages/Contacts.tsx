import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Building2,
  Newspaper,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contacts() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Сообщение отправлено",
      description: "Мы свяжемся с вами в ближайшее время.",
    });

    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-condensed font-bold text-foreground">
            Контакты
          </h1>
          <p className="text-muted-foreground mt-2">
            Свяжитесь с редакцией газеты «Город и горожане»
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Редакция газеты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Адрес</p>
                    <p className="text-muted-foreground">
                      662971, Красноярский край, г. Железногорск,
                      <br />
                      ул. Ленина, д. 50, каб. 203
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Телефоны</p>
                    <p className="text-muted-foreground">
                      Приёмная: +7 (3919) 74-52-81
                      <br />
                      Отдел рекламы: +7 (3919) 74-52-82
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">
                      Редакция: info@gig26.ru
                      <br />
                      Реклама: reklama@gig26.ru
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Режим работы</p>
                    <p className="text-muted-foreground">
                      Понедельник — Пятница: 9:00 — 18:00
                      <br />
                      Суббота, Воскресенье: выходной
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-primary" />
                  О газете
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  МАУ «Редакция газеты „Город и горожане"» — городская газета
                  Железногорска, выходящая с 1958 года. Мы освещаем главные
                  события города, публикуем интервью с интересными людьми,
                  рассказываем о культурной и спортивной жизни Железногорска.
                </p>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Учредитель:</strong> Администрация ЗАТО г.
                    Железногорск
                    <br />
                    <strong>Главный редактор:</strong> Иванов И.И.
                    <br />
                    <strong>Регистрация:</strong> СМИ ПИ № ТУ24-01234
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Мы в социальных сетях</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <a
                    href="https://vk.com/gig26"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-[#0077FF] hover:bg-[#0077FF]/90 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.189 1.366 1.259 2.18 1.815.616.42 1.084.328 1.084.328l2.175-.03s1.138-.07.598-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.246.999-1.33 1.398-2.142 1.273-2.489-.12-.332-.859-.244-.859-.244l-2.45.015s-.182-.025-.316.056c-.131.079-.216.263-.216.263s-.387 1.028-.903 1.903c-1.088 1.848-1.523 1.946-1.701 1.831-.414-.267-.31-1.075-.31-1.648 0-1.793.273-2.539-.532-2.733-.267-.064-.463-.106-1.146-.113-.876-.009-1.617.003-2.036.208-.278.136-.493.44-.363.457.162.022.528.099.722.363.251.341.242 1.107.242 1.107s.144 2.11-.336 2.372c-.33.179-.782-.187-1.753-1.868-.497-.861-.872-1.814-.872-1.814s-.072-.177-.201-.272c-.156-.115-.374-.151-.374-.151l-2.328.015s-.35.01-.478.161c-.114.135-.009.413-.009.413s1.819 4.254 3.878 6.399c1.889 1.966 4.032 1.837 4.032 1.837h.972z" />
                    </svg>
                  </a>
                  <a
                    href="https://ok.ru/gig26"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-[#EE8208] hover:bg-[#EE8208]/90 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm4.5 8.5c-.69.69-1.602 1.063-2.546 1.206l2.046 2.044a1 1 0 01-1.414 1.414L12 17.078l-2.586 2.586a1 1 0 01-1.414-1.414l2.046-2.044c-.944-.143-1.856-.516-2.546-1.206a1 1 0 011.414-1.414c1.17 1.17 3.002 1.17 4.172 0a1 1 0 011.414 1.414z" />
                    </svg>
                  </a>
                  <a
                    href="https://t.me/gig26"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-[#0088CC] hover:bg-[#0088CC]/90 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Написать в редакцию</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ваше имя *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="Иван Иванов"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="ivan@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+7 (XXX) XXX-XX-XX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Тема обращения *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      required
                      placeholder="Тема вашего сообщения"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Сообщение *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      placeholder="Введите ваше сообщение..."
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Отправка..." : "Отправить сообщение"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map placeholder */}
            <Card className="mt-6">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2" />
                    <p>Карта будет здесь</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
