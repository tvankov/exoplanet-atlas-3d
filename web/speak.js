// A "Read aloud" button for any text of the page (the discoveries, the discovery of the day, the sky events). It reads only with a voice
// that runs on the device: an online voice (some of Chrome's) would send the text to a server. Without such a voice the button stays
// hidden; some browsers load their voices late, then it appears once they are there. One reading at a time on the whole page: a new one
// stops the one before. The button changes its own label, so the panel around it does not need to be drawn again.

import { track } from "./stats.js";

const SPEAK_TEXT = {
  en: { speak: "Read aloud", stop: "Stop", title: "Read with a voice on your device; nothing is sent." },
  de: { speak: "Vorlesen", stop: "Stopp", title: "Mit einer Stimme auf deinem Gerät vorlesen; es wird nichts gesendet." },
  ja: { speak: "読み上げ", stop: "停止", title: "端末内の音声で読み上げます。何も送信されません。" },
  bg: { speak: "Прочети на глас", stop: "Спри", title: "Чете се с глас на устройството ти; нищо не се изпраща." },
};

let reading = null; // the button whose text is being read
let token = 0; // a stopped reading must not report its end

const localVoice = (lang) => window.speechSynthesis?.getVoices().find((v) => v.localService && v.lang.toLowerCase().startsWith(lang)) ?? null;

function label(b, on) {
  const tx = SPEAK_TEXT[b.dataset.lang] ?? SPEAK_TEXT.en;
  b.textContent = on ? `■ ${tx.stop}` : `▶ ${tx.speak}`;
  b.classList.toggle("on", on);
  b.setAttribute("aria-pressed", String(on));
}

export function stopReading() {
  token += 1;
  if (!reading) return;
  window.speechSynthesis?.cancel();
  label(reading, false);
  reading = null;
}

// lang: the language of the page; texts: the paragraphs, or a function that gives them when the button is pressed; id: a short name for the
// statistics (only the name is counted, see stats.js).
export function speakButton(lang, texts, id) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "speak-button";
  b.dataset.lang = lang;
  b.title = (SPEAK_TEXT[lang] ?? SPEAK_TEXT.en).title;
  label(b, false);
  const synth = window.speechSynthesis;
  b.hidden = !localVoice(lang);
  if (b.hidden && synth) synth.addEventListener("voiceschanged", () => (b.hidden = !localVoice(lang)), { once: true });
  b.addEventListener("click", () => {
    if (reading === b) return stopReading();
    stopReading();
    const voice = localVoice(lang);
    const list = (typeof texts === "function" ? texts() : texts).filter(Boolean);
    if (!voice || !list.length) return;
    reading = b;
    label(b, true);
    const mine = token;
    // one utterance per paragraph: some browsers cut long texts off
    list.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      if (i === list.length - 1)
        u.onend = u.onerror = () => {
          if (mine !== token) return;
          label(b, false);
          reading = null;
        };
      synth.speak(u);
    });
    track(`speak-${id}`);
  });
  return b;
}
