"use client";

// Известный случай после выкатки новой версии: вкладка со страницей входа,
// открытая ДО обновления, отправляет форму на серверное действие старой сборки.
// Next отвечает 500 «Failed to find Server Action», и без этого экрана владелец
// видит общее «что-то пошло не так» и думает, что не подходит пароль.
// Ни пароль, ни данные тут ни при чём: лечится перезагрузкой, новая страница
// получает действие новой сборки. reset() не помогает, он переигрывает рендер с
// той же устаревшей разметкой, поэтому кнопка перезагружает страницу целиком.
import { useEffect } from "react";
import { Button } from "@/components/Button";
import styles from "./login.module.css";

export default function LoginError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.screen}>
      <div className={styles.box}>
        <h1 className={styles.title}>Страница устарела</h1>
        <p className={styles.intro}>
          Сайт обновился, пока эта страница была открыта. Нажмите кнопку ниже и войдите заново:
          почта и пароль в порядке.
        </p>
        <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
      </div>
    </main>
  );
}
