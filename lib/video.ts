// lib/video.ts
// Ссылка на встроенный плеер площадки. Видео на сервере не хранится (SPEC §1):
// только VK Видео, Rutube, YouTube. Возвращает URL для <iframe> или null.

export function embedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    if (host === "rutube.ru") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://rutube.ru/play/embed/${id}` : null;
    }
    if (host === "vk.com" || host === "vkvideo.ru") {
      return url.replace("/video", "/video_ext.php?oid=");
    }
    return null;
  } catch {
    return null;
  }
}
