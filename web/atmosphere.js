// Atmosphere: a short true fact on the loading screen, and the sounds of a trip through hyperspace (a rising tone before the jump, a thump at
// the jump, a rushing in hyperspace, a falling hiss at the arrival). The sound is on by default and can play after the first click or key of
// the visit, because browsers do not allow sound before that; one click on the button switches it off. The sounds are made in the browser
// (Web Audio), so there is no sound file and nothing to license. The choice is remembered in this browser (localStorage "sound").

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
  let playing = false;

  // The steady sound of space in the background is gone (November 2026: found unpleasant). The button now switches the sounds of the
  // trips: the jump into hyperspace, the rushing in it and the arrival (below). The context is made at the first click of the visit.
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  async function start() {
    if (playing) return;
    if (!ctx) build();
    await ctx.resume();
    playing = true;
    render();
  }
  // Hyperspace: a soft rushing while the ship flies through it, faded in and out with the streaks. main.js gives the level (0 to 1) every
  // frame. Made in the browser like the rest: dark (brown) noise through a gentle filter that opens a little with the speed, swaying slowly.
  // (A deep hum under it, and a brighter white noise, were found unpleasant over the length of a trip and taken out.) Only with the sound on;
  // built at the first jump.
  let warp = null;
  let warpLevel = 0;
  // brown noise: each value a small random step from the one before, so the low sounds are strong and the hiss is weak
  const brownNoise = (seconds) => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    return buffer;
  };
  function buildWarp() {
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 200;
    filter.Q.value = 0.5;
    filter.connect(out);
    const noise = ctx.createBufferSource();
    noise.buffer = brownNoise(4);
    noise.loop = true;
    noise.connect(filter);
    noise.start();
    const wobble = ctx.createOscillator();
    wobble.frequency.value = 0.15;
    const depth = ctx.createGain();
    depth.gain.value = 60;
    wobble.connect(depth).connect(filter.frequency);
    wobble.start();
    warp = { out, filter };
  }
  function hyperspace(level) {
    level = Math.max(0, Math.min(1, level || 0));
    if (Math.abs(level - warpLevel) < 0.02 && (level > 0 || warpLevel === 0)) return;
    warpLevel = level;
    if (!ctx || !playing) return;
    if (!warp) {
      if (level === 0) return;
      buildWarp();
    }
    const now = ctx.currentTime;
    warp.out.gain.setTargetAtTime(0.14 * level, now, 1.2); // in and out over about three to four seconds
    warp.filter.frequency.setTargetAtTime(180 + 550 * level, now, 1.2);
  }
  // The jump in four parts, our own sounds made in the browser (no recording of a film): before it a rushing that swells and rises in pitch
  // while the ship turns, the mirror of the arrival ("spool", over the seconds until the jump; rising tones were found artificial); the jump
  // itself a short, very soft low thump ("jump"); then the rushing of hyperspace above; at the arrival a hiss that falls in pitch ("exit"). "stop"
  // ends the swell of a trip that was stopped.
  let fx = null;
  let spool = null;
  const noiseBuffer = (seconds) => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  };
  function endSpool(seconds) {
    if (!spool) return;
    const now = ctx.currentTime;
    spool.gain.gain.cancelScheduledValues(now);
    spool.gain.gain.setValueAtTime(spool.gain.gain.value, now);
    spool.gain.gain.linearRampToValueAtTime(0, now + seconds);
    spool.src.stop(now + seconds + 0.05);
    spool = null;
  }
  function jumpSound(part, seconds = 3) {
    if (!ctx || !playing) return;
    if (!fx) {
      fx = ctx.createGain();
      fx.gain.value = 1;
      fx.connect(ctx.destination);
    }
    const now = ctx.currentTime;
    if (part === "stop") return endSpool(0.3);
    if (part === "spool") {
      endSpool(0.1);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(Math.ceil(seconds) + 1);
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 0.7;
      band.frequency.setValueAtTime(150, now);
      band.frequency.exponentialRampToValueAtTime(1100, now + seconds);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + seconds); // quiet for long, then swelling, as a sound coming nearer
      src.connect(band).connect(gain).connect(fx);
      src.start(now);
      spool = { gain, src };
      return;
    }
    if (part === "jump") {
      endSpool(0.12);
      const thump = ctx.createOscillator();
      thump.frequency.setValueAtTime(95, now);
      thump.frequency.exponentialRampToValueAtTime(32, now + 0.7);
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0.0001, now);
      tg.gain.exponentialRampToValueAtTime(0.12, now + 0.08); // a soft start, no click
      tg.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      thump.connect(tg).connect(fx);
      thump.start(now);
      thump.stop(now + 1.7);
      return;
    }
    if (part === "exit") {
      const hiss = ctx.createBufferSource();
      hiss.buffer = noiseBuffer(2.5);
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 1.5;
      band.frequency.setValueAtTime(2600, now);
      band.frequency.exponentialRampToValueAtTime(180, now + 2);
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(0, now);
      hg.gain.linearRampToValueAtTime(0.14, now + 0.15);
      hg.gain.linearRampToValueAtTime(0, now + 2.1);
      hiss.connect(band).connect(hg).connect(fx);
      hiss.start(now);
    }
  }
  function stop() {
    if (!playing) return;
    playing = false;
    warp?.out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    endSpool(0.3);
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
  return { render, hyperspace, jumpSound };
}
