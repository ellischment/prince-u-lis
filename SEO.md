# SEO. Индексация и структурированные данные

Ответ на вопрос «размечаем ли мы сайт через schema». Да, и ниже точно какими типами, на каких страницах и с какими полями. Читается вместе со `SPEC.md`.

Разметка нужна не ради красоты: без неё поисковик видит текст, но не понимает, что это студия с адресом, занятие с ценой и статья с датой. С ней в выдаче появляются цена, рейтинг, хлебные крошки и карточка организации.

---

## 1. Что размечается на каждой странице

| Страница | Типы schema.org |
|---|---|
| Все страницы | `Organization`, `WebSite`, `BreadcrumbList` |
| Главная | плюс `LocalBusiness` |
| Занятие | `Course` или `Event` в зависимости от типа, плюс `Offer` |
| Курс | `Course` плюс `CourseInstance` для каждого потока |
| Расписание | `Event` для каждого занятия недели |
| Мастер | `Person` |
| Работа или товар | `Product` плюс `Offer` |
| Формат праздника | `Service` плюс `Offer` |
| Статья | `Article` |
| Событие | `Event` |
| Вопросы | `FAQPage` |
| Отзывы | `Review` внутри `LocalBusiness` |

Разметка отдаётся форматом JSON-LD в теге `script` в разметке страницы. Микроформаты в атрибутах не используются: их труднее поддерживать.

---

## 2. Организация и студия

Отдаётся на всех страницах. Собирается из настроек, чтобы студия могла поменять телефон без разработчика.

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://princulissart.ru/#studio",
  "name": "Принц и Лис",
  "description": "Художественная студия: керамика, живопись, витраж",
  "url": "https://princulissart.ru",
  "telephone": "+79199690585",
  "image": "https://princulissart.ru/og/studio.jpg",
  "priceRange": "1500-9500 RUB",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "ул. Сущевская, д. 12, стр. 1",
    "addressLocality": "Москва",
    "addressCountry": "RU"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": null, "longitude": null },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "11:00",
    "closes": "22:00"
  }],
  "sameAs": ["https://t.me/princ_liss", "https://vk.com/..."]
}
```

Правила:
- Часы берутся из таблицы `StudioHours`, выходные дни исключаются из списка
- Координаты заполняются после подтверждения студией, до этого поле не выводится вовсе, а не с пустым значением
- В `sameAs` только Telegram и ВКонтакте. Ссылки на сервисы Meta не добавляются

---

## 3. Занятие

Занятие это `Course`, если оно обучающее, и `Event`, если это разовое мероприятие с датой. У нас почти всё обучающее.

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Гончарный круг",
  "description": "Короткое описание занятия",
  "provider": { "@id": "https://princulissart.ru/#studio" },
  "image": ["https://princulissart.ru/uploads/..."],
  "offers": {
    "@type": "Offer",
    "price": "2500",
    "priceCurrency": "RUB",
    "availability": "https://schema.org/InStock",
    "url": "https://princulissart.ru/zanyatiya/goncharnyj-krug"
  },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "onsite",
    "courseWorkload": "PT2H",
    "location": { "@id": "https://princulissart.ru/#studio" }
  }
}
```

Правила:
- `price` только число без пробелов и символа рубля. Текст «от 2 500 ₽» разбирается: берётся первое число
- Если цена «от», добавляется `"priceSpecification": {"@type":"PriceSpecification","minPrice":2500}`
- `courseWorkload` в формате длительности: два часа это `PT2H`, полтора это `PT1H30M`
- Скрытое занятие разметку не отдаёт вовсе

---

## 4. Курс и потоки

У курса каждый открытый поток становится отдельным `CourseInstance` с датой начала. Это то, что позволяет курсу показаться в выдаче с датами набора.

```json
{
  "@type": "Course",
  "name": "Курс «Чайная пара»",
  "provider": { "@id": "https://princulissart.ru/#studio" },
  "hasCourseInstance": [
    {
      "@type": "CourseInstance",
      "courseMode": "onsite",
      "startDate": "2026-09-06",
      "courseSchedule": {
        "@type": "Schedule",
        "repeatFrequency": "P1W",
        "repeatCount": 4,
        "byDay": "https://schema.org/Saturday",
        "startTime": "12:00"
      },
      "location": { "@id": "https://princulissart.ru/#studio" },
      "offers": { "@type": "Offer", "price": "12000", "priceCurrency": "RUB" }
    }
  ]
}
```

Потоки с прошедшей датой в разметку не попадают.

---

## 5. Работа и товар

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Кружка",
  "description": "Описание работы",
  "image": ["https://princulissart.ru/uploads/..."],
  "brand": { "@id": "https://princulissart.ru/#studio" },
  "offers": {
    "@type": "Offer",
    "price": "2400",
    "priceCurrency": "RUB",
    "availability": "https://schema.org/InStock",
    "seller": { "@id": "https://princulissart.ru/#studio" },
    "url": "https://princulissart.ru/kupit/kruzhka"
  }
}
```

Единственный товар в одном экземпляре: если работа продана и скрыта, разметка не отдаётся.

---

## 6. Статья

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Куда сходить вдвоём, если надоели рестораны",
  "description": "Краткое описание",
  "image": ["https://princulissart.ru/uploads/cover.jpg"],
  "datePublished": "2026-07-12",
  "dateModified": "2026-07-20",
  "author": { "@id": "https://princulissart.ru/#studio" },
  "publisher": { "@id": "https://princulissart.ru/#studio" },
  "mainEntityOfPage": "https://princulissart.ru/blog/kuda-shodit-vdvoem"
}
```

Черновики и снятые с сайта статьи разметку не отдают.

---

## 7. Мастер

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Елисавета",
  "jobTitle": "основательница студии, керамика",
  "worksFor": { "@id": "https://princulissart.ru/#studio" },
  "image": "https://princulissart.ru/uploads/..."
}
```

---

## 8. Событие и формат праздника

Событие студии:

```json
{
  "@type": "Event",
  "name": "Ночь керамики",
  "startDate": "2026-09-14T19:00:00+03:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": { "@id": "https://princulissart.ru/#studio" },
  "organizer": { "@id": "https://princulissart.ru/#studio" },
  "image": ["..."]
}
```

Формат праздника это не событие с датой, а услуга:

```json
{
  "@type": "Service",
  "name": "День рождения в студии",
  "serviceType": "Организация детского дня рождения",
  "provider": { "@id": "https://princulissart.ru/#studio" },
  "areaServed": { "@type": "City", "name": "Москва" },
  "offers": { "@type": "Offer", "priceCurrency": "RUB", "priceSpecification": { "@type": "PriceSpecification", "minPrice": 15000 } }
}
```

---

## 9. Вопросы и отзывы

Страница вопросов размечается как `FAQPage`: каждый вопрос это `Question` с одним `acceptedAnswer`. Это даёт раскрывающиеся ответы прямо в выдаче.

Отзывы размечаются как `Review` внутри `LocalBusiness`. Важное ограничение: агрегированный рейтинг `aggregateRating` выводится только если отзывы настоящие и их не меньше пяти. Придуманный рейтинг это прямой путь к санкциям поисковика.

---

## 10. Хлебные крошки

На всех внутренних страницах. Дают в выдаче путь вместо голого адреса.

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://princulissart.ru" },
    { "@type": "ListItem", "position": 2, "name": "Занятия", "item": "https://princulissart.ru/zanyatiya" },
    { "@type": "ListItem", "position": 3, "name": "Гончарный круг" }
  ]
}
```

У последнего элемента `item` не указывается: это текущая страница.

---

## 11. Открытый граф для мессенджеров

Отдельно от schema, потому что решает другую задачу: как выглядит ссылка, отправленная в Telegram или ВКонтакте.

На каждой странице: `og:title`, `og:description`, `og:image`, `og:type`, `og:url`, `og:site_name`, `og:locale` со значением `ru_RU`, плюс `twitter:card` со значением `summary_large_image`.

Картинка для превью: 1200 на 630 пикселей. Если у сущности своей нет, подставляется общая картинка студии.

---

## 12. Техническая часть индексации

| Что | Как |
|---|---|
| `robots.txt` | Генерируется, на тестовом домене запрещает всё |
| `sitemap.xml` | Собирается из опубликованных сущностей, обновляется при публикации |
| Канонический адрес | У каждой страницы, с абсолютным адресом |
| Язык | `<html lang="ru">` |
| Заголовки страниц | Свои, редактируются в панели, при пустом поле собираются из названия |
| Пагинация | Реальные адреса, не только кнопка «показать ещё» |
| Черновики | `noindex` и отсутствие в карте сайта |
| Смена адреса | Постоянный редирект со старого |
| Тестовый домен | `noindex` через переменную окружения плюс пароль |

---

## 13. Как это устроено в коде

Один общий помощник, чтобы разметка не расползлась по страницам:

```
lib/schema.ts
  organizationSchema()          общая, на всех страницах
  breadcrumbSchema(items)
  courseSchema(lesson)
  courseWithRunsSchema(lesson, runs)
  productSchema(work | shopItem)
  articleSchema(article)
  personSchema(master)
  eventSchema(event)
  serviceSchema(celebration)
  faqSchema(items)
  reviewsSchema(reviews)
```

Каждая функция возвращает объект, страница выводит его в теге `script` с типом `application/ld+json`. Все ссылки абсолютные, собираются из переменной окружения с адресом сайта.

Правило: если поле нечем заполнить, оно не выводится вовсе. Пустое или выдуманное значение хуже отсутствия и может привести к санкциям.

---

## 14. Проверка

Обязательные проверки на этапе 9 и повторно перед боевым запуском:

- [ ] Валидатор разметки Яндекса: ошибок нет на всех типах страниц
- [ ] Проверка расширенных результатов Google: ошибок нет
- [ ] Ссылка на занятие, отправленная в Telegram, разворачивается в карточку с фотографией
- [ ] `sitemap.xml` содержит все опубликованные страницы и не содержит черновики
- [ ] `robots.txt` на боевом разрешает, на тестовом запрещает
- [ ] Каноническая ссылка присутствует на каждой странице
- [ ] Цены в разметке числом, совпадают с ценами на странице
- [ ] Агрегированный рейтинг отсутствует, пока нет настоящих отзывов
- [ ] Страницы отдают готовый текст с выключенным JavaScript
