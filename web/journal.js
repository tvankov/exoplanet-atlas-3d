// The journal: a note on a planet, collections of places ("My favourite worlds"), and the export and the deletion of everything that is
// stored for the visitor. Notes and collections are written in the info panel of a place and listed in My Universe (universe.js). They live in the
// explorer's log (explorer.js, fields "notes" and "collections"), so they are saved to the account and merged with it like the rest. The data rules
// are in journal-data.js. A place is kept by its name in the NASA list; if a place cannot be found any more, its note stays and says so.

import { track } from "./stats.js";
import { NOTE_MAX, TITLE_MAX, cleanNotes, liveNotes, cleanCollections, liveCollections, exportBundle } from "./journal-data.js";

export const JOURNAL_TEXT = {
  en: {
    note: "Note", editNote: "Edit note", placeholder: "What do you want to remember about this place?", save: "Save", del: "Delete", cancel: "Cancel",
    toCollection: "Add to a collection …", newCollection: "+ New collection", collectionName: "Name of the collection", create: "Create",
    journal: "Journal", notes: "Notes", noNotes: "Write a note in the info panel of a planet, it appears here.",
    showAll: (n) => `Show all ${n}`, showLess: "Show fewer", collections: "Collections", noCollections: "Make a collection in the info panel of a planet.",
    items: (n) => (n === 1 ? "1 place" : `${n} places`), deleteCollection: "Delete the collection", gone: "not found any more",
    data: "Your data", exportAll: "Export everything (JSON)", deleteAll: "Delete everything",
    deleteAsk: "Delete everything in this browser: the log, the profile, the journal and the answers? With an account, the log in the account is emptied too. Language and look stay.",
    deleteYes: "Yes, delete everything", deleted: "Everything is deleted.",
  },
  de: {
    note: "Notiz", editNote: "Notiz bearbeiten", placeholder: "Was möchtest du dir zu diesem Ort merken?", save: "Speichern", del: "Löschen", cancel: "Abbrechen",
    toCollection: "Zu einer Sammlung …", newCollection: "+ Neue Sammlung", collectionName: "Name der Sammlung", create: "Anlegen",
    journal: "Journal", notes: "Notizen", noNotes: "Schreib eine Notiz im Info-Fenster eines Planeten, sie erscheint hier.",
    showAll: (n) => `Alle ${n} zeigen`, showLess: "Weniger zeigen", collections: "Sammlungen", noCollections: "Leg eine Sammlung im Info-Fenster eines Planeten an.",
    items: (n) => (n === 1 ? "1 Ort" : `${n} Orte`), deleteCollection: "Sammlung löschen", gone: "nicht mehr gefunden",
    data: "Deine Daten", exportAll: "Alles exportieren (JSON)", deleteAll: "Alles löschen",
    deleteAsk: "Alles in diesem Browser löschen: Logbuch, Profil, Journal und Antworten? Mit einem Konto wird auch das Logbuch im Konto geleert. Sprache und Darstellung bleiben.",
    deleteYes: "Ja, alles löschen", deleted: "Alles ist gelöscht.",
  },
  ja: {
    note: "メモ", editNote: "メモを編集", placeholder: "この場所について覚えておきたいことは？", save: "保存", del: "削除", cancel: "キャンセル",
    toCollection: "コレクションに追加 …", newCollection: "+ 新しいコレクション", collectionName: "コレクションの名前", create: "作成",
    journal: "ジャーナル", notes: "メモ", noNotes: "惑星の情報パネルでメモを書くと、ここに表示されます。",
    showAll: (n) => `${n}件すべて表示`, showLess: "表示を減らす", collections: "コレクション", noCollections: "場所の情報パネルでコレクションを作れます。",
    items: (n) => `${n}か所`, deleteCollection: "コレクションを削除", gone: "見つかりません",
    data: "あなたのデータ", exportAll: "すべて書き出す（JSON）", deleteAll: "すべて削除",
    deleteAsk: "このブラウザ内のすべて（記録、プロフィール、ジャーナル、回答）を削除しますか？アカウントがある場合は、アカウントの記録も空になります。言語と表示設定は残ります。",
    deleteYes: "はい、すべて削除します", deleted: "すべて削除しました。",
  },
  bg: {
    note: "Бележка", editNote: "Редактирай бележката", placeholder: "Какво искаш да запомниш за това място?", save: "Запази", del: "Изтрий", cancel: "Отказ",
    toCollection: "Добави към колекция …", newCollection: "+ Нова колекция", collectionName: "Име на колекцията", create: "Създай",
    journal: "Дневник", notes: "Бележки", noNotes: "Напиши бележка в информационния панел на планета и тя ще се появи тук.",
    showAll: (n) => `Покажи всички ${n}`, showLess: "Покажи по-малко", collections: "Колекции", noCollections: "Създай колекция в информационния панел на място.",
    items: (n) => (n === 1 ? "1 място" : `${n} места`), deleteCollection: "Изтрий колекцията", gone: "вече не е намерено",
    data: "Твоите данни", exportAll: "Изнеси всичко (JSON)", deleteAll: "Изтрий всичко",
    deleteAsk: "Да се изтрие ли всичко в този браузър: дневник, профил, бележки и отговори? С профил дневникът в профила също се изпразва. Езикът и изгледът остават.",
    deleteYes: "Да, изтрий всичко", deleted: "Всичко е изтрито.",
  },
};

// The keys of this site in localStorage that hold the visitor's own data (not the language and the look).
const OWN_KEYS = ["explorer", "daily", "daily-seen", "last-visit", "zone-seen", "dock", "birth-year"];

// explorer: the log (explorer.js). explore(name) flies to a place, exists(name) says whether it can be found. onChange() is called after a change
// that the dashboard shows.
export function initJournal({ getLang, explorer, explore, exists, onChange, onDeleteAll }) {
  const t = () => JOURNAL_TEXT[getLang()] ?? JOURNAL_TEXT.en;
  const area = document.getElementById("story-journal");
  const el = (tag, cls, content) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  };
  const button = (label, cls, onClick) => {
    const b = el("button", cls, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  };
  const notes = () => cleanNotes(explorer.getState().notes);
  const collections = () => liveCollections(explorer.getState().collections);
  const dateText = (time) => new Intl.DateTimeFormat(getLang(), { day: "numeric", month: "short", year: "numeric" }).format(new Date(time));
  const changed = () => onChange?.();

  function setNote(place, text) {
    explorer.update((s) => {
      s.notes = { ...cleanNotes(s.notes), [place]: { text: text.slice(0, NOTE_MAX), t: Date.now() } };
    });
    changed();
  }
  function setCollection(c) {
    explorer.update((s) => {
      s.collections = [...cleanCollections(s.collections).filter((x) => x.id !== c.id), { ...c, t: Date.now() }];
    });
    changed();
  }

  // ---------------------------------------------------------------- in the info panel of a place
  let editing = false;
  let naming = false;
  let shownFor = null;
  function renderArea() {
    const place = explorer.getCurrent();
    if (place !== shownFor) {
      editing = false;
      naming = false;
      shownFor = place;
    }
    area.hidden = !place;
    if (!place) return area.replaceChildren();
    const tx = t();
    const note = notes()[place];
    const hasNote = !!note?.text.trim();
    const parts = [];
    const row = el("div", "journal-row");
    row.append(button(`✎ ${hasNote ? tx.editNote : tx.note}`, "", () => ((editing = !editing), renderArea())));
    const pick = el("select", "journal-pick");
    pick.setAttribute("aria-label", tx.toCollection);
    pick.append(new Option(tx.toCollection, ""));
    for (const c of collections()) pick.append(new Option(`${c.items.includes(place) ? "✓ " : ""}${c.title}`, c.id));
    pick.append(new Option(tx.newCollection, "__new"));
    pick.addEventListener("change", () => {
      const value = pick.value;
      pick.value = "";
      if (value === "__new") {
        naming = true;
        return renderArea();
      }
      const c = collections().find((x) => x.id === value);
      if (!c) return;
      const items = c.items.includes(place) ? c.items.filter((x) => x !== place) : [...c.items, place];
      setCollection({ ...c, items });
      track("journal-collection-change");
      renderArea();
    });
    row.append(pick);
    parts.push(row);
    if (naming) {
      const wrap = el("div", "journal-row");
      const input = el("input");
      input.type = "text";
      input.maxLength = TITLE_MAX;
      input.placeholder = tx.collectionName;
      input.setAttribute("aria-label", tx.collectionName);
      wrap.append(
        input,
        button(tx.create, "journal-main", () => {
          const title = input.value.trim();
          if (!title) return;
          setCollection({ id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, title, items: [place] });
          track("journal-collection-new");
          naming = false;
          renderArea();
        }),
        button(tx.cancel, "", () => ((naming = false), renderArea()))
      );
      parts.push(wrap);
      setTimeout(() => input.focus(), 0);
    }
    if (editing) {
      const box = el("textarea", "journal-text");
      box.maxLength = NOTE_MAX;
      box.rows = 3;
      box.placeholder = tx.placeholder;
      box.value = note?.text ?? "";
      const actions = el("div", "journal-row");
      actions.append(
        button(tx.save, "journal-main", () => {
          setNote(place, box.value.trim());
          track("journal-note-save");
          editing = false;
          renderArea();
        })
      );
      if (hasNote) actions.append(button(tx.del, "", () => (setNote(place, ""), (editing = false), renderArea())));
      actions.append(button(tx.cancel, "", () => ((editing = false), renderArea())));
      parts.push(box, actions);
      setTimeout(() => box.focus(), 0);
    } else if (hasNote) {
      const quote = el("blockquote", "journal-note", note.text);
      quote.append(el("small", "", dateText(note.t)));
      parts.push(quote);
    }
    area.replaceChildren(...parts);
  }

  // ---------------------------------------------------------------- the section of My Universe
  let showAllNotes = false;
  let confirmDelete = false;
  let doneMessage = "";
  function placeButton(place, close) {
    const ok = exists(place);
    const b = button(ok ? place : `${place} (${t().gone})`, "uni-place", () => {
      if (!ok) return;
      close?.();
      explore(place);
    });
    b.disabled = !ok;
    return b;
  }
  function section(close) {
    const tx = t();
    const s = el("section", "uni-section");
    s.append(el("h3", "", tx.journal));
    // notes
    const all = liveNotes(explorer.getState().notes);
    s.append(el("small", "", tx.notes));
    if (!all.length) s.append(el("p", "hint", tx.noNotes));
    for (const n of showAllNotes ? all : all.slice(0, 4)) {
      const item = el("div", "journal-item");
      item.append(placeButton(n.place, close), el("span", "hint", dateText(n.t)), el("p", "", n.text));
      s.append(item);
    }
    if (all.length > 4) s.append(button(showAllNotes ? tx.showLess : tx.showAll(all.length), "account-link", () => ((showAllNotes = !showAllNotes), changed())));
    // collections
    const cols = collections();
    s.append(el("small", "", tx.collections));
    if (!cols.length) s.append(el("p", "hint", tx.noCollections));
    for (const c of cols) {
      const box = el("details", "journal-collection");
      box.append(el("summary", "", `${c.title} · ${tx.items(c.items.length)}`));
      const places = el("div", "uni-places");
      for (const place of c.items) places.append(placeButton(place, close));
      box.append(
        places,
        button(tx.deleteCollection, "account-link", () => {
          setCollection({ ...c, deleted: true, items: [] });
          track("journal-collection-delete");
        })
      );
      s.append(box);
    }
    // the data: export and delete
    s.append(el("small", "", tx.data));
    const row = el("div", "uni-places");
    row.append(
      button(tx.exportAll, "uni-place", () => {
        let daily = null;
        try {
          daily = JSON.parse(localStorage.getItem("daily"));
        } catch {
          // not readable: left out
        }
        let birthYear = null;
        try {
          birthYear = Number(localStorage.getItem("birth-year")) || null; // "your star", see mystar.js
        } catch {
          // not readable: left out
        }
        const blob = new Blob([JSON.stringify(exportBundle(explorer.getState(), { daily, birthYear }), null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `space-explorer-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        track("journal-export");
      }),
      button(tx.deleteAll, "uni-place", () => ((confirmDelete = true), (doneMessage = ""), changed()))
    );
    s.append(row);
    if (confirmDelete) {
      s.append(el("p", "account-error", tx.deleteAsk));
      const yes = el("div", "uni-places");
      yes.append(
        button(tx.deleteYes, "account-danger", () => {
          for (const key of OWN_KEYS) {
            try {
              localStorage.removeItem(key);
            } catch {
              // storage blocked: nothing stored
            }
          }
          explorer.resetAll(); // with an account, the empty log is saved to it (auth.js)
          onDeleteAll?.();
          track("journal-delete-all");
          confirmDelete = false;
          doneMessage = tx.deleted;
          changed();
        }),
        button(tx.cancel, "", () => ((confirmDelete = false), changed()))
      );
      s.append(yes);
    }
    if (doneMessage) s.append(el("p", "account-ok", doneMessage));
    return s;
  }

  explorer.onRender(renderArea);
  renderArea();
  return { section, render: renderArea };
}
