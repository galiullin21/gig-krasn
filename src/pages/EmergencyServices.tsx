import { Layout } from "@/components/layout/Layout";
import { Phone } from "lucide-react";

const emergencyServices = [
  {
    name: "МП «Горэлектросеть»",
    director: "Директор: Харабет Алексей Иванович",
    phone: "(3919) 72-16-53",
    address: "662970, Красноярский край, ЗАТО Железногорск, ул.Восточная, 18"
  },
  {
    name: "МУ МВД России по ЗАТО г.Железногорск",
    phone: "(3919) 72-20-30",
    address: "662972, Железногорск, Красноярский край, Ленина, 67а"
  },
  {
    name: "Федеральное государственное казённое учреждение \"Специальное управление федеральной противопожарной службы № 2 МЧС России\"",
    director: "Начальник управления - главный государственный инспектор ФГКУ \"Специальное управление ФПС № 2 МЧС России\" по пожарному надзору: Дерышев Владимир Владимирович",
    phone: "(3919) 73-39-02",
    address: "662972, г. Железногорск, ул. Ленина, д. 54"
  }
];

const urgentServices = [
  {
    name: "ЕДДС ЗАТО Железногорск - 01 (служба 112)",
    phones: []
  },
  {
    name: "МУ МВД РФ по ЗАТО г. Железногорск",
    phones: [
      "Телефон дежурной части 02: 8 (3919) 74-58-98",
      "Телефон дежурной ООВ: 8 (3919) 74-37-07",
      "С сотового телефона 102"
    ]
  },
  {
    name: "Экстренные службы ФГБУЗ КБ №51 ФМБА России",
    description: "Отделение скорой медицинской помощи (ОСМП), ул. Павлова, д.4. Заведующий ОСМП - Маслова Александра Сергеевна - 3919-72-26-69",
    phones: [
      "Фельдшер по приёму вызовов - 3919-72-26-37, 03 - круглосуточно",
      "Приёмно-диагностическое отделение (ПДО), ул. Павлова, д.8. Заведующий ПДО - Ерошкина Лариса Николаевна - 3919-74-84-97",
      "Дежурный медрегистратор - 3919-72-34-40 - круглосуточно"
    ]
  },
  {
    name: "Детская поликлиника, ул. Кирова,7",
    phones: [
      "Заведующая поликлиникой - Скоробогатова Юлия Александровна - 3919-72-30-38",
      "Вызов врача на дом - 3919-72-44-31, с 07:00-18:00ч.",
      "Запись к врачу - 3919-72-33-41"
    ]
  },
  {
    name: "Поликлиника, ул. Кирова, д.11",
    phones: [
      "Заведующий поликлиникой: Стрельцова Лилия Рафаиловна - 3919-72-41-78",
      "Вызов врача на дом - 3919-72-26-72, 72-26-15, с 07:00-18:00ч.",
      "Запись к врачу - 3919-74-18-00"
    ]
  }
];

const fireStations = [
  { name: "Пожарная часть №1", address: "Ул.Ленина,54", phones: ["Начальник ПЧ:74-61", "Зам.начальника: 75-22-05", "Диспетчер 75-03-06"] },
  { name: "Пожарная часть №2", address: "Ул.Ленина,54", phones: ["Начальник:75-43-39", "Зам.начальника: 75-22-05", "Диспетчер 75-03-06"] },
  { name: "Пожарная часть №3", address: "Ул. Поселковая проезд, 4", phones: ["Начальник:79-52-12", "Зам.начальника: 79-50-01 75-50-68", "Инспектор:76-50-01 79-50-03", "Диспетчер 76-50-01 79-50-03"] },
  { name: "Пожарная часть №4", address: "Ул. Поселковая проезд, 4", phones: ["Начальник:79-52-12", "Зам.начальника:", "Инспектор:", "Диспетчер"] },
];

export default function EmergencyServices() {
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
              {/* Аварийные службы */}
              <div className="border-l-4 border-primary pl-4 mb-6">
                <h1 className="font-condensed font-bold text-2xl md:text-3xl">Аварийные службы</h1>
              </div>

              <div className="space-y-6 mb-12">
                <div className="bg-muted rounded-lg aspect-video max-w-xs flex items-center justify-center text-muted-foreground">
                  ФОТО
                </div>

                {emergencyServices.map((service, index) => (
                  <div key={index} className="border-b pb-4">
                    <h3 className="font-bold text-lg">{service.name}</h3>
                    {service.director && (
                      <p className="text-muted-foreground text-sm mt-1">{service.director}</p>
                    )}
                    {service.phone && (
                      <p className="flex items-center gap-2 mt-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-primary">{service.phone}</span>
                      </p>
                    )}
                    {service.address && (
                      <p className="text-muted-foreground text-sm mt-1">Адрес: {service.address}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Экстренные службы */}
              <div className="border-l-4 border-primary pl-4 mb-6">
                <h2 className="font-condensed font-bold text-2xl">Экстренные службы</h2>
              </div>

              <div className="space-y-6 mb-12">
                <div className="bg-muted rounded-lg aspect-video max-w-xs flex items-center justify-center text-muted-foreground">
                  ФОТО
                </div>

                {urgentServices.map((service, index) => (
                  <div key={index} className="border-b pb-4">
                    <h3 className="font-bold">{service.name}</h3>
                    {service.description && (
                      <p className="text-muted-foreground text-sm mt-1">{service.description}</p>
                    )}
                    {service.phones.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {service.phones.map((phone, i) => (
                          <p key={i} className="text-sm text-muted-foreground">{phone}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Управление ГПС-2 МЧС России */}
              <div className="border-l-4 border-primary pl-4 mb-6">
                <h2 className="font-condensed font-bold text-xl">Управление ГПС-2 МЧС России</h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm">Ул.Ленина,54</p>
                <p className="text-sm">Единая дежурно-диспетчерская служба:01</p>
                <p className="text-sm">Начальник управления: 75-99-76</p>
                <p className="text-sm">Первый зам.начальника управления: 75-96-76</p>
                
                {fireStations.map((station, index) => (
                  <div key={index} className="border-b pb-3">
                    <h4 className="font-medium">{station.name}</h4>
                    <p className="text-xs text-muted-foreground">{station.address}</p>
                    {station.phones.map((phone, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{phone}</p>
                    ))}
                  </div>
                ))}
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
