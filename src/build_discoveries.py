"""Make web/data/discoveries/index.json, the list of the library SPACE DISCOVERIES, from the entries in web/data/discoveries/entries/.

Run from the src folder after adding or changing an entry:
    cd src && python build_discoveries.py

Each entry is one JSON file named by its id. This script checks what the list needs (the id is the file name, no id or alias twice, the
fields of the list are there) and writes the list: per entry its id, categories, type, status, dates, aliases, its picture, the place it flies
to, and the hook, the title and the summary in each language. The full checks of an entry (sources of every fact, kinds of evidence, the links
to the map and to the learning steps) are in tests/discoveries.test.mjs, which also checks that the list is up to date.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENTRIES = ROOT / "web" / "data" / "discoveries" / "entries"
OUT = ROOT / "web" / "data" / "discoveries" / "index.json"
LIST_FIELDS = ["id", "categories", "type", "status", "dates", "aliases", "picture", "fly"]


def main():
    items = []
    seen = {}
    problems = []
    for path in sorted(ENTRIES.glob("*.json")):
        entry = json.loads(path.read_text(encoding="utf-8"))
        if entry.get("id") != path.stem:
            problems.append(f"{path.name}: the id is not the file name")
        for field in LIST_FIELDS:
            if field not in entry:
                problems.append(f"{path.name}: no field {field}")
        for name in [entry.get("id", "")] + entry.get("aliases", []):
            key = name.lower()
            if key in seen and seen[key] != entry.get("id"):
                problems.append(f"{path.name}: '{name}' is also used by {seen[key]}")
            seen[key] = entry.get("id")
        item = {field: entry.get(field) for field in LIST_FIELDS}
        item["title"] = {lang: t["title"] for lang, t in entry.get("text", {}).items()}
        item["hook"] = {lang: t["hook"] for lang, t in entry.get("text", {}).items()}
        item["summary"] = {lang: t["summary"] for lang, t in entry.get("text", {}).items()}
        items.append(item)
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    # the newest in the library first, then by title
    items.sort(key=lambda i: (i["dates"]["published"], i["title"].get("en", "")), reverse=True)
    data = {
        "note": "Made by src/build_discoveries.py from the files in entries/. Do not change by hand.",
        "entries": items,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(items)} entries -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
