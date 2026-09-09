import { LoadingBar } from "@/components/LoadingBar";

// Полоска загрузки для этого сегмента. Ставится только там, где ниже нет
// страниц с notFound(): почему так — комментарий в components/LoadingBar.tsx.
export default function Loading() {
  return <LoadingBar />;
}
