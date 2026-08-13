import { StatusPage } from "@/components/StatusPage";

// Корневой not-found: срабатывает на адрес, для которого нет вообще никакого
// маршрута (Next не может выбрать даже группу (site), поэтому свой not-found
// внутри неё сюда не долетает). components/StatusPage.tsx общий с (site).
export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Такой страницы нет"
      text="Проверьте адрес или вернитесь на главную: оттуда есть ссылки на все разделы."
    />
  );
}
