// app/uploads/[...put]/route.ts
// Отдаёт загруженные через панель файлы, читая их с диска на каждый запрос.
//
// Зачем это нужно. Next в режиме output:"standalone" составляет список файлов
// public/ при старте сервера и дальше отдаёт только их. Загрузки панели попадают
// в public/uploads уже после запуска контейнера, в списке их нет, и сервер
// отвечает на них 404 — фотография в карточке выглядит битой, пока контейнер не
// перезапустят. Проверено 08.09.2026 на боевом: файл от 13:49 отдавал 404 при
// живом контейнере и 200 сразу после restart, сосед по той же папке от 4 сентября
// (то есть попавший в список при старте) отдавался всё это время нормально.
//
// Статика public/ имеет приоритет над маршрутами, поэтому файлы, известные при
// старте, по-прежнему отдаёт быстрый статический обработчик, а сюда попадает
// только то, чего он не знает. Оптимизатор next/image ходит за исходником по
// этому же адресу через свой сервер, поэтому чинится и он: без этого он отвечал
// 400 на любую свежую загрузку.
//
// Каталог uploads лежит на постоянном томе (docker-compose, app_uploads), файлы
// именуются uuid и никогда не переписываются, поэтому кэш можно ставить вечный.

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.join(process.cwd(), "public", "uploads");

// Отдаём только то, что кладёт наш же конвейер (lib/media.ts): webp всех
// размеров. Список закрытый: каталог общий с томом, и превращать его в раздачу
// произвольных файлов не нужно.
const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ put: string[] }> },
): Promise<Response> {
  const { put } = await params;

  // Защита от выхода из каталога: сегменты приходят уже декодированными, но
  // «..» и абсолютный путь всё равно проверяем по итоговому пути, а не по виду
  // сегментов — так надёжнее любой проверки подстрокой.
  const target = path.resolve(ROOT, ...put);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  try {
    const info = await stat(target);
    if (!info.isFile()) {
      return new NextResponse("Не найдено", { status: 404 });
    }
    const body = await readFile(target);
    const etag = `"${createHash("sha1").update(body).digest("hex")}"`;
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
      },
    });
  } catch {
    return new NextResponse("Не найдено", { status: 404 });
  }
}
