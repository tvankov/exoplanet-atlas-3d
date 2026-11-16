// Atmosphere: a short true fact on the loading screen, and a calm sound of space. The sound is on by default and starts with the first click or
// key of the visit, because browsers do not allow sound before that; one click on the button switches it off. The sound is made in the browser
// (Web Audio: two tones a fifth apart, a slowly moving filter and a soft hiss), so there is no sound file and nothing to license. The choice is
// remembered in this browser (localStorage "sound").

import { track } from "./stats.js";

// Facts for the loading screen: rounded, well known values (NASA fact sheets), one is chosen at random.
const FACTS = {
  en: [
    "Sunlight needs about 8 minutes and 20 seconds to reach the Earth.",
    "One light year is about 9.46 trillion kilometres.",
    "Proxima Centauri, the nearest star after the Sun, is 4.24 light years away.",
    "A day on Venus is longer than its year.",
    "Jupiter has more than twice the mass of all the other planets together.",
    "Saturn is less dense than water.",
    "The Moon moves away from the Earth by about 3.8 centimetres a year.",
    "Neptune needs about 165 years for one trip round the Sun.",
  ],
  de: [
    "Sonnenlicht braucht etwa 8 Minuten und 20 Sekunden bis zur Erde.",
    "Ein Lichtjahr sind etwa 9,46 Billionen Kilometer.",
    "Proxima Centauri, der nächste Stern nach der Sonne, ist 4,24 Lichtjahre entfernt.",
    "Ein Tag auf der Venus ist länger als ihr Jahr.",
    "Jupiter hat mehr als doppelt so viel Masse wie alle anderen Planeten zusammen.",
    "Saturn hat eine geringere Dichte als Wasser.",
    "Der Mond entfernt sich jedes Jahr etwa 3,8 Zentimeter von der Erde.",
    "Neptun braucht etwa 165 Jahre für einen Umlauf um die Sonne.",
  ],
  ja: [
    "太陽の光が地球に届くまで約8分20秒かかります。",
    "1光年は約9兆4600億キロメートルです。",
    "太陽の次に近い恒星プロキシマ・ケンタウリまでは4.24光年です。",
    "金星の1日は、金星の1年より長いのです。",
    "木星の質量は、ほかのすべての惑星を合わせた質量の2倍以上です。",
    "土星の密度は水より小さいのです。",
    "月は1年に約3.8センチずつ地球から遠ざかっています。",
    "海王星は太陽のまわりを1周するのに約165年かかります。",
  ],
  bg: [
    "Слънчевата светлина стига до Земята за около 8 минути и 20 секунди.",
    "Една светлинна година е около 9 460 милиарда километра.",
    "Проксима Кентавър, най-близката звезда след Слънцето, е на 4,24 светлинни години.",
    "Денят на Венера е по-дълъг от нейната година.",
    "Юпитер има повече от два пъти масата на всички други планети взети заедно.",
    "Сатурн е с по-малка плътност от водата.",
    "Луната се отдалечава от Земята с около 3,8 сантиметра годишно.",
    "Нептун обикаля Слънцето за около 165 години.",
  ],
};
const LOADING = { en: "Loading the sky ...", de: "Der Himmel wird geladen ...", ja: "空を読み込み中 ...", bg: "Небето се зарежда ..." };

// The language as main.js will choose it (the remembered one, else the browser's), read here because this runs before main.js has it.
function firstLang() {
  let saved = null;
  try {
    saved = localStorage.getItem("lang");
  } catch {
    // storage blocked
  }
  if (saved && FACTS[saved]) return saved;
  return ["de", "ja", "bg"].find((l) => navigator.language?.startsWith(l)) ?? "en";
}
// at once, while the rest of the page loads
{
  const lang = firstLang();
  const facts = FACTS[lang];
  const box = document.getElementById("loading-fact");
  if (box) box.textContent = facts[Math.floor(Math.random() * facts.length)];
  const small = document.querySelector("#loading small");
  if (small) small.textContent = LOADING[lang];
}

const SOUND_TEXT = {
  en: { on: "Sound: on", off: "Sound: off" },
  de: { on: "Klang: an", off: "Klang: aus" },
  ja: { on: "サウンド：オン", off: "サウンド：オフ" },
  bg: { on: "Звук: включен", off: "Звук: изключен" },
};

export function initAmbient({ getLang }) {
  const button = document.getElementById("sound-toggle");
  let wanted = true;
  try {
    wanted = localStorage.getItem("sound") !== "off";
  } catch {
    // storage blocked: on, as for everyone
  }
  let ctx = null;
  let master = null;
  let playing = false;

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    // a low filter that opens and closes very slowly
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 650;
    filter.Q.value = 0.6;
    filter.connect(master);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.04;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 200;
    lfo.connect(lfoDepth).connect(filter.frequency);
    lfo.start();
    // two tones a fifth apart, and a third one a little out of tune, so that it moves. An octave higher than a deep drone would be, because the
    // small speakers of laptops and phones hardly play anything below 100 Hz (the first version was too quiet there). All sine waves and a dark
    // filter: the second version, with a brighter third tone, was found a little tiring.
    for (const [freq, type, level] of [[110, "sine", 0.5], [164.81, "sine", 0.3], [220.8, "sine", 0.1]]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(filter);
      osc.start();
    }
    // a soft hiss: brown noise through a band filter
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 700;
    band.Q.value = 0.7;
    const hiss = ctx.createGain();
    hiss.gain.value = 0.03;
    noise.connect(band).connect(hiss).connect(master);
    noise.start();
  }
  function fadeTo(value, seconds) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(value, now + seconds);
  }
  async function start() {
    if (playing) return;
    if (!ctx) build();
    await ctx.resume();
    playing = true;
    fadeTo(0.07, 4);
    render();
  }
  function stop() {
    if (!playing) return;
    playing = false;
    fadeTo(0, 1.5);
    setTimeout(() => !playing && ctx?.suspend(), 1700);
    render();
  }
  function render() {
    const tx = SOUND_TEXT[getLang()] ?? SOUND_TEXT.en;
    const on = playing || wanted;
    button.textContent = on ? tx.on : tx.off;
    button.setAttribute("aria-pressed", String(on));
  }
  button.addEventListener("click", () => {
    wanted = !wanted;
    try {
      localStorage.setItem("sound", wanted ? "on" : "off");
    } catch {
      // not remembered
    }
    if (wanted) {
      start();
      track("sound-on");
    } else stop();
    render();
  });
  // on (by default, or remembered): the first click or key of the visit starts it. A click on the button itself is left to the button, so
  // that the first click there switches it off and does not start it.
  if (wanted) {
    const first = (e) => {
      window.removeEventListener("pointerdown", first);
      window.removeEventListener("keydown", first);
      if (wanted && !button.contains(e.target)) start();
    };
    window.addEventListener("pointerdown", first);
    window.addEventListener("keydown", first);
  }
  render();
  return { render };
}
