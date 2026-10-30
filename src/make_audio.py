"""Turn data/processed/stories.json into audio clips with the Piper voices.

Run from the project root:
    python src/make_audio.py --voices <folder with the .onnx files> [--only proxima-cen-b] [--out <folder>]
"""
import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent

# Both voices were trained from scratch on freely licensed data (LJ Speech is public domain,
# MLS is CC BY 4.0). Other Piper voices are fine tuned from the Lessac voice, whose data
# licence only allows research use, so they are not used for a public app.
VOICES = {"de": "de_DE-mls-medium", "en": "en_US-ljspeech-high"}

# A short pause between paragraphs, otherwise the whole story is one breath.
PAUSE_SECONDS = 0.7


def synthesize(voice: PiperVoice, paragraphs: list[str], speaker: int | None) -> tuple[np.ndarray, int]:
    pieces = []
    rate = voice.config.sample_rate
    silence = np.zeros(int(rate * PAUSE_SECONDS), dtype=np.int16)
    # Only multi speaker voices (the German one) need a speaker id.
    config = SynthesisConfig(speaker_id=speaker) if speaker is not None else None
    for text in paragraphs:
        for chunk in voice.synthesize(text, syn_config=config):
            pieces.append(np.frombuffer(chunk.audio_int16_bytes, dtype=np.int16))
        pieces.append(silence)
    return np.concatenate(pieces), rate


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=ROOT / "web" / "audio")
    parser.add_argument("--only", help="build just this story id, for listening tests")
    parser.add_argument("--format", default="MP3", choices=["MP3", "OGG"])
    parser.add_argument("--de-speaker", type=int, default=0, help="speaker id of the German MLS voice")
    args = parser.parse_args()

    stories = json.loads((ROOT / "data" / "processed" / "stories.json").read_text(encoding="utf-8"))
    voices = {lang: PiperVoice.load(args.voices / f"{name}.onnx") for lang, name in VOICES.items()}

    for story in stories:
        if args.only and story["id"] != args.only:
            continue
        speaker = args.de_speaker if story["lang"] == "de" else None
        audio, rate = synthesize(voices[story["lang"]], story["paragraphs"], speaker)
        target = args.out / story["lang"] / f"{story['id']}.{args.format.lower()}"
        target.parent.mkdir(parents=True, exist_ok=True)
        sf.write(target, audio, rate, format=args.format)
        print(f"{target}  {len(audio) / rate:.0f}s  {target.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
