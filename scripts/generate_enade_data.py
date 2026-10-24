from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PROVAS_DIR = ROOT / "Provas"
OUTPUT_FILE = ROOT / "app" / "data" / "enade-data.json"

CONNECTION_WORDS = {
    "da",
    "de",
    "do",
    "dos",
    "das",
    "e",
    "em",
    "a",
    "o",
    "as",
    "os",
    "pad",
    "resp",
    "baixa",
    "pr",
    "gb",
    "pv",
    "rp",
}


def normalize_slug(value: str) -> str:
    clean = value.lower().replace(".pdf", "")
    clean = re.sub(r"^(\d{4})[_-]", "", clean)
    clean = re.sub(r"^(pv|gb|pr|rp)[_-]*", "", clean)
    clean = clean.replace("-", "_")
    tokens = [token for token in re.split(r"[_\s]+", clean) if token]
    numeric_tokens = [token for token in tokens if token.isdigit()]
    if numeric_tokens:
        return numeric_tokens[0]
    filtered = [token for token in tokens if token not in CONNECTION_WORDS]
    return "".join(filtered)


def title_for_file(file_name: str) -> str:
    stem = file_name.replace(".pdf", "")
    parts = [part for part in re.split(r"[_-]+", stem) if part]
    if len(parts) >= 2:
        year = parts[0] if parts[0].isdigit() else ""
        extra = parts[1:]
        if extra and extra[0].lower() in {"pv", "gb", "pr", "rp"}:
            extra = extra[1:]
        cleaned = []
        for part in extra:
            if part.lower() in {"pv", "gb", "pr", "rp", "pad", "resp", "baixa"}:
                continue
            cleaned.append(part)
        if cleaned:
            label = " ".join(cleaned).lower()
            replacements = {
                "cie": "Ciência",
                "ciencia": "Ciência",
                "ciência": "Ciência",
                "eng": "Engenharia",
                "engenharia": "Engenharia",
                "sis": "Sistemas",
                "sistema": "Sistema",
                "informacao": "Informação",
                "informatica": "Informática",
                "computacao": "Computação",
                "tecnologia": "Tecnologia",
                "red": "Redes",
                "redes": "Redes",
                "analise": "Análise",
                "desenvolvimento": "Desenvolvimento",
                "bacharel": "Bacharel",
                "bacharelado": "Bacharelado",
                "licenciatura": "Licenciatura",
                "gestao": "Gestão",
                "gestão": "Gestão",
                "tecnologia": "Tecnologia",
                "tad": "TADS",
                "tads": "TADS",
                "gti": "GTI",
            }
            human = " ".join(
                replacements.get(token, token).title() if token.isalpha() and token not in {"da", "de", "do", "das", "dos", "em", "e"} else replacements.get(token, token)
                for token in re.split(r"\s+", label)
            )
            human = human.replace("Ciênciacia", "Ciência").replace("Computaçãoputacao", "Computação")
            human = human.replace("Sistemaastema", "Sistema")
            human = human.replace("Tecnologianologia", "Tecnologia")
            human = human.replace("Engenhariaenharia", "Engenharia")
            human = re.sub(r"\s+", " ", human).strip()
            if year:
                return f"{year} · {human}"
            return human
    return stem.replace("_", " ").title()


def extract_answers(pdf_path: Path) -> list[tuple[int, str]]:
    reader = PdfReader(str(pdf_path))
    answers: list[tuple[int, str]] = []

    for page in reader.pages:
        text = page.extract_text() or ""
        for raw in text.splitlines():
            line = " ".join(raw.split())
            if not line:
                continue
            lowered = line.lower()
            if "discur" in lowered:
                continue
            if "item gabarito" in lowered or "gabarito" in lowered:
                continue

            match = re.search(r"^\s*(\d+)\s+([A-E]|ANULADA)\s*$", line, flags=re.IGNORECASE)
            if match is None:
                match = re.search(r"questão\s+(\d+)\s+([A-E]|ANULADA)", line, flags=re.IGNORECASE)

            if match is None:
                continue

            number = int(match.group(1))
            value = match.group(2).upper()
            if value == "ANULADA":
                continue
            answers.append((number, value))

    answers.sort(key=lambda item: item[0])
    return answers


def pair_exams() -> list[dict]:
    pv_files = sorted(PROVAS_DIR.glob("*_PV_*.pdf"))
    gb_files = sorted(PROVAS_DIR.glob("*_GB_*.pdf"))

    gb_by_year: dict[str, list[Path]] = {}
    for item in gb_files:
        gb_by_year.setdefault(item.name[:4], []).append(item)

    pairs: list[dict] = []
    seen: set[str] = set()

    for pv_file in pv_files:
        year = pv_file.name[:4]
        pv_slug = normalize_slug(pv_file.name)
        matched = None

        for gb_file in gb_by_year.get(year, []):
            gb_slug = normalize_slug(gb_file.name)
            if gb_slug == pv_slug or gb_slug in pv_slug or pv_slug in gb_slug:
                matched = gb_file
                break

        if matched is None:
            continue

        key = f"{year}:{pv_file.name}:{matched.name}"
        if key in seen:
            continue
        seen.add(key)

        answers = extract_answers(matched)
        if not answers:
            continue

        question_map = {number: correct for number, correct in answers}
        ordered = [
            {"number": number, "correct": question_map[number]}
            for number in sorted(question_map)
        ]

        pairs.append(
            {
                "id": f"{year}_{normalize_slug(pv_file.name) or 'prova'}",
                "year": int(year),
                "name": title_for_file(pv_file.name),
                "provaPdf": str(pv_file.relative_to(ROOT)),
                "gabaritoPdf": str(matched.relative_to(ROOT)),
                "questions": ordered,
            }
        )

    pairs.sort(key=lambda item: (item["year"], item["name"]))
    return pairs


def main() -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    exams = pair_exams()
    OUTPUT_FILE.write_text(json.dumps(exams, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gerado {len(exams)} provas em {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
