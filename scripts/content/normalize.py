#!/usr/bin/env python
# Нормализатор наполнения: Excel «Принц и Лис» -> prisma/content/lessons.json.
# Фаза 1: занятия, курсы, потоки курсов, привязка фото. Остальные листы (мастера,
# расписание, праздники, статьи, события, FAQ) — следующим заходом.
#
# Читает xlsx напрямую (zipfile + xml), без сторонних библиотек. Логика разбора и
# чистки собрана здесь, в одном месте, чтобы результат можно было глазами свериться
# в JSON до загрузки в базу. Slug адресов НЕ считаем тут — их делает TS-импортёр
# через lib/slug.ts, тем же кодом, что и панель.

import json
import re
import sys
import zipfile
import datetime as dt
import xml.etree.ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def load_sheets(path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root:
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid2t = {r.get("Id"): r.get("Target") for r in rels}
    sheets = {}
    for s in wb.iter(NS + "sheet"):
        rid = s.get(RNS + "id")
        target = rid2t.get(rid)
        path_in = "xl/" + target if not target.startswith("/") else target[1:]
        sheets[s.get("name")] = parse_sheet(z.read(path_in), shared)
    return sheets


def col_index(ref):
    m = re.match(r"([A-Z]+)", ref)
    n = 0
    for ch in m.group(1):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def parse_sheet(data, shared):
    root = ET.fromstring(data)
    rows = []
    for row in root.iter(NS + "row"):
        cells = {}
        for c in row.findall(NS + "c"):
            ci = col_index(c.get("r"))
            t = c.get("t")
            v = c.find(NS + "v")
            val = ""
            if v is not None:
                val = shared[int(v.text)] if t == "s" else (v.text or "")
            else:
                isv = c.find(NS + "is")
                if isv is not None:
                    val = "".join(x.text or "" for x in isv.iter(NS + "t"))
            cells[ci] = val
        width = (max(cells) + 1) if cells else 0
        rows.append([cells.get(i, "") for i in range(width)])
    return rows


def clean(s):
    if s is None:
        return ""
    # Внутренние переводы строк приводим к \n, хвостовые пробелы убираем.
    s = s.replace("_x000A_", "\n").replace("\r\n", "\n").replace("\r", "\n")
    return s.strip()


def lines(cell):
    """Многострочная ячейка -> список непустых строк (Alt+Enter в Excel)."""
    return [ln.strip() for ln in clean(cell).split("\n") if ln.strip()]


def yes(cell):
    return clean(cell).lower() in ("да", "yes", "true", "1", "опубликована", "опубликован")


def to_int(cell, default=0):
    s = clean(cell)
    if not s:
        return default
    try:
        return int(float(s))
    except ValueError:
        return default


def excel_date(cell):
    """Серийная дата Excel (база 1899-12-30) -> 'YYYY-MM-DD'. Строку-дату пропускаем как есть."""
    s = clean(cell)
    if not s:
        return None
    try:
        serial = float(s)
        return (dt.date(1899, 12, 30) + dt.timedelta(days=int(serial))).isoformat()
    except ValueError:
        return s  # уже строка вида 2026-09-06


# Русский тег анкеты -> внутренний тег (schema: duo|kids|gift|self|company|practice).
TAG_MAP = {
    "вдвоём": "duo",
    "вдвоем": "duo",
    "с ребёнком": "kids",
    "с ребенком": "kids",
    "подарок": "gift",
    "для себя": "self",
    "компанией": "company",
    "уже умею": "practice",
    "практик": "practice",
}


def map_tags(cell):
    out = []
    for part in re.split(r"[,\n]", clean(cell)):
        key = part.strip().lower()
        if key and key in TAG_MAP and TAG_MAP[key] not in out:
            out.append(TAG_MAP[key])
    return out


def parse_step(line):
    """«Название | описание» -> {title, text}. Без черты — только текст."""
    if "|" in line:
        title, text = line.split("|", 1)
        return {"title": title.strip(), "text": text.strip()}
    return {"title": "", "text": line.strip()}


def header_index(rows):
    """Строка-заголовок таблицы (где первая ячейка «Показывать»/«Раздел»/«Занятие …»)."""
    for i, r in enumerate(rows):
        first = clean(r[0]) if r else ""
        if first in ("Показывать", "Раздел", "День недели") or first.startswith("Занятие"):
            return i
    return 0


def find_sheet(sheets, needle):
    for name in sheets:
        if needle.lower() in name.lower():
            return sheets[name]
    return None


def build(sheets):
    out = {"directions": [], "formats": [], "lessons": [], "runs": [], "media": []}

    # --- Категории из листа «Категории и списки» ---
    cats = find_sheet(sheets, "Категории")
    if cats:
        hi = next((i for i, r in enumerate(cats) if r and clean(r[0]) == "Направления занятий"), None)
        if hi is not None:
            for r in cats[hi + 1:]:
                d = clean(r[0]) if len(r) > 0 else ""
                f = clean(r[1]) if len(r) > 1 else ""
                if d:
                    out["directions"].append({"title": d})
                if f:
                    out["formats"].append({"title": f, "isCourse": "курс" in f.lower()})

    # --- Занятия ---
    ls = find_sheet(sheets, "Занятия")
    hi = header_index(ls)
    for r in ls[hi + 1:]:
        title = clean(r[1]) if len(r) > 1 else ""
        if not title:
            continue
        col = lambda i: clean(r[i]) if len(r) > i else ""
        out["lessons"].append({
            "visible": yes(col(0)),
            "title": title,
            "directionTitle": col(2),
            "formatTitle": col(3),
            "price": col(4),
            "duration": col(5),
            "level": col(6),
            "formatText": col(7),
            "intro": col(8),
            "notForBeginnersText": col(9),
            "note": col(10),
            "fits": lines(r[11]) if len(r) > 11 else [],
            "steps": [parse_step(x) for x in (lines(r[12]) if len(r) > 12 else [])],
            "includes": lines(r[13]) if len(r) > 13 else [],
            "taskTags": map_tags(r[14]) if len(r) > 14 else [],
            "seoTitle": col(16),
            "seoDescription": col(17),
            "sort": to_int(col(18), 0),
        })

    # --- Потоки курсов ---
    # Названия курсов в этом листе не совпадают с названиями занятий дословно,
    # сводим через алиасы; несопоставленные помечаем, чтобы разобрать вручную.
    RUN_ALIAS = {
        "курс «гончарный круг»": "Курс по гончарному кругу",
        "курс «ручная лепка»": "Курс по ручной лепке",
        "курс «ваза»": "Интенсив-курс «Ваза»",
    }
    runs = find_sheet(sheets, "Потоки")
    if runs:
        rhi = header_index(runs)
        for r in runs[rhi + 1:]:
            name = clean(r[0]) if len(r) > 0 else ""
            if not name:
                continue
            resolved = RUN_ALIAS.get(name.lower(), name)
            out["runs"].append({
                "lessonTitle": resolved,
                "rawTitle": name,
                "matched": name.lower() in RUN_ALIAS,
                "startDate": excel_date(r[1]) if len(r) > 1 else None,
                "sessionsCount": to_int(r[2]) if len(r) > 2 else 0,
                "timeText": clean(r[3]) if len(r) > 3 else "",
                "note": clean(r[4]) if len(r) > 4 else "",
                "visible": yes(r[5]) if len(r) > 5 else True,
            })

    # --- Фото занятий ---
    media = find_sheet(sheets, "Фото")
    if media:
        mhi = header_index(media)
        for r in media[mhi + 1:]:
            section = clean(r[0]) if len(r) > 0 else ""
            card = clean(r[1]) if len(r) > 1 else ""
            kind = clean(r[2]) if len(r) > 2 else ""
            ref = clean(r[3]) if len(r) > 3 else ""
            if section != "Занятия" or not card or not ref:
                continue
            out["media"].append({
                "lessonTitle": card,
                "kind": "video" if "видео" in kind.lower() else "image",
                "file": ref,
                "alt": clean(r[4]) if len(r) > 4 else "",
                "sort": to_int(r[5], 0) if len(r) > 5 else 0,
            })

    return out


def main():
    src = sys.argv[1]
    dst = sys.argv[2]
    sheets = load_sheets(src)
    data = build(sheets)
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("directions:", len(data["directions"]),
          "formats:", len(data["formats"]),
          "lessons:", len(data["lessons"]),
          "runs:", len(data["runs"]),
          "media:", len(data["media"]))
    unmatched = [r["rawTitle"] for r in data["runs"] if not r["matched"]]
    if unmatched:
        print("ПОТОКИ без сопоставления с занятием:", unmatched)


if __name__ == "__main__":
    main()
