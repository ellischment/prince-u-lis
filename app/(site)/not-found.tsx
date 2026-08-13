import { StatusPage } from "@/components/StatusPage";

// Ловит notFound() из страниц сайта (несуществующее занятие, курс и так
// далее). Корневой app/not-found.tsx ловит адреса без маршрута вообще.
export default function SiteNotFound() {
  return (
    <StatusPage
      code="404"
      title="Такой страницы нет"
      text="Проверьте адрес или вернитесь на главную: оттуда есть ссылки на все разделы."
    />
  );
}
