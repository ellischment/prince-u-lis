"use client";

// Next требует Client Component для error.tsx. Логируется в консоль сервера
// через console.error в самом error boundary Next, здесь только показ гостю.
import { useEffect } from "react";
import { Button } from "@/components/Button";
import { StatusPage } from "@/components/StatusPage";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="500"
      title="Что-то пошло не так"
      text="Мы уже знаем об этой ошибке. Попробуйте обновить страницу или вернуться на главную."
      extraAction={
        <Button variant="ghost" onClick={reset}>
          Попробовать ещё раз
        </Button>
      }
    />
  );
}
