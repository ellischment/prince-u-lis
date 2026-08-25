import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge, Table } from "@/components/admin/Panel";
import { formatBytes, getMediaStats, getMediaUsage } from "@/lib/media-usage";
import styles from "./media-library.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Фото и видео",
  robots: { index: false, follow: false },
};

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Moscow",
});

export default async function MediaLibraryPage() {
  const usage = await getMediaUsage();
  const stats = await getMediaStats(usage);

  return (
    <>
      <h1>Фото и видео</h1>
      <p className={styles.lead}>
        Все фотографии и видео сайта в одном месте. Фото загружаются в своих разделах: у занятия,
        мастера, работы, статьи и так далее. Здесь видно, где что используется и сколько занято места.
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{stats.images}</span>
          <span className={styles.statLabel}>фотографий</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{stats.videos}</span>
          <span className={styles.statLabel}>видео ссылками</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{formatBytes(stats.diskBytes)}</span>
          <span className={styles.statLabel}>занято на диске</span>
        </div>
        {stats.unusedImages > 0 ? (
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.unusedImages}</span>
            <span className={styles.statLabel}>фото ни к чему не привязано</span>
          </div>
        ) : null}
      </div>

      {stats.unusedImages > 0 ? (
        <p className={styles.note}>
          Фото без привязки остаются после загрузки, если запись не сохранили. На боевом сервере
          их убирает еженедельная чистка осиротевших файлов (этап 11), вручную удалять не нужно.
        </p>
      ) : null}

      {usage.length === 0 ? (
        <p className={styles.empty}>Пока ничего не загружено.</p>
      ) : (
        <Table head={["Файл", "Тип", "Где используется", "Размер", "Загружено"]} label="Список медиа">
          {usage.map((item) => (
            <tr key={item.id}>
              <td>
                <div className={styles.fileCell}>
                  {item.kind === "image" && item.path ? (
                    <Image
                      src={item.path}
                      alt={item.alt ?? ""}
                      width={64}
                      height={48}
                      className={styles.thumb}
                    />
                  ) : (
                    <span className={styles.videoMark} aria-hidden="true">
                      ▶
                    </span>
                  )}
                  <span className={styles.fileName}>{item.alt || item.path || item.url}</span>
                </div>
              </td>
              <td>
                {item.kind === "image" ? (
                  <Badge tone="info">фото</Badge>
                ) : (
                  <Badge tone="info">видео</Badge>
                )}
              </td>
              <td>
                {item.usage ? (
                  <span className={styles.usage}>
                    <span className={styles.usageSection}>{item.usage.section}:</span>{" "}
                    {item.usage.href ? (
                      <Link href={item.usage.href} className={styles.usageLink} target="_blank">
                        {item.usage.title}
                      </Link>
                    ) : (
                      item.usage.title
                    )}
                  </span>
                ) : (
                  <Badge tone="warn">не привязано</Badge>
                )}
              </td>
              <td className={styles.size}>
                {item.kind === "image" && item.bytes ? formatBytes(item.bytes) : "—"}
              </td>
              <td className={styles.date}>{DATE_FMT.format(item.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
