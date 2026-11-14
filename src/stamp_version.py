"""Puts a version into the addresses of the scripts and the style sheet of web/, for the publishing workflow (.github/workflows/pages.yml).

GitHub Pages lets a browser keep a file for ten minutes. After a new publication a visitor can then get a new index.html together with an old
main.js, and when the two do not fit the page does not start (it happened on a phone). With ?v=<commit> on every script and on the style sheet,
a new page always asks for the new files. The files in the repository stay as they are; only the copy that is published is stamped.

    python src/stamp_version.py <commit>
"""

import re
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent / "web"


def stamp_file(path: Path, pattern: str, stamp: str) -> int:
    text = path.read_text(encoding="utf-8")
    new, n = re.subn(pattern, rf"\1?v={stamp}\3", text)
    if n:
        path.write_text(new, encoding="utf-8", newline="")
    return n


def main() -> None:
    stamp = re.sub(r"\W", "", sys.argv[1])[:8] if len(sys.argv) > 1 else "dev"
    count = 0
    for script in WEB.glob("*.js"):
        # import { x } from "./other.js";  (also after a line break of a long import)
        count += stamp_file(script, r'(from "\./[\w-]+\.js)(\?v=\w+)?(")', stamp)
    count += stamp_file(WEB / "index.html", r'((?:src="main\.js|href="style\.css))(\?v=\w+)?(")', stamp)
    print(f"stamped {count} addresses with ?v={stamp}")


if __name__ == "__main__":
    main()
