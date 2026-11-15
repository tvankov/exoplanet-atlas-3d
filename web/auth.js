// The optional account (Supabase: Auth and a PostgreSQL database in Frankfurt, see supabase/schema.sql). Nobody has to sign in: the map, the
// missions and the log work without it, and the log stays in this browser. An account saves the log (favourites, history, missions, XP, badges)
// so that it is the same on every device. The browser talks to Supabase directly, with the public (publishable) key: what a person can read
// or change is decided by the access rules of the database (row level security), not by this file.
//
// The library (220 KB) is only loaded when it is needed: when somebody opens the sign-in, when a session is stored in this browser, or when a
// link of a confirmation mail brings somebody back. A visitor without an account never loads it.
//
// The log of this browser and the one of the account are merged at the sign-in (state-merge.js) and saved again at every change.

import { track } from "./stats.js";

const SUPABASE_URL = "https://hkfdvsteynrtyhzhbqkl.supabase.co";
const SUPABASE_KEY = "sb_publishable_HbhnZFf4NAslbfV-clhcuA_BWZ9XzCR"; // public by design, see above
const SESSION_KEY = "sb-hkfdvsteynrtyhzhbqkl-auth-token"; // where the library keeps the session in this browser
const PUSH_DELAY = 2000;
const USERNAME = /^[A-Za-z0-9_]{3,20}$/;

export const AUTH_TEXT = {
  en: {
    title: "Account (optional)", profile: "Profile",
    intro: "Save your log on all your devices. Without an account everything stays in this browser.",
    open: "Sign in or create an account",
    email: "E-mail", password: "Password", passwordHint: "At least 8 characters",
    username: "User name", usernameHint: "3 to 20 letters, digits or _",
    consent: "I have read the privacy notice and agree that my e-mail address, my user name and my log are stored for this account.",
    privacy: "Privacy notice",
    signIn: "Sign in", signUp: "Create account", toSignUp: "No account yet? Create one", toSignIn: "Already have an account? Sign in",
    forgot: "Forgot the password?", sendReset: "Send the link", newPassword: "New password", savePassword: "Save the password",
    back: "Back", cancel: "Cancel",
    checkMail: "Almost done: we sent an e-mail. Open the link in it to confirm the address, then sign in.",
    resetSent: "If this address has an account, an e-mail with a link to set a new password was sent.",
    passwordSaved: "The new password is saved.",
    signedAs: (name, mail) => `Signed in as ${name ? `${name} (${mail})` : mail}`,
    saved: "The log is saved to the account.", saveFailed: "Could not save to the account just now, it is tried again at the next change.",
    signOut: "Sign out", deleteAccount: "Delete the account",
    deleteAsk: "Delete the account? It and the log saved on the server are removed for good. The log in this browser stays.",
    deleteYes: "Yes, delete the account", deleted: "The account is deleted.",
    signedInNow: "You are signed in.",
    wrongLogin: "The e-mail or the password is wrong, or the address is not confirmed yet.",
    nameTaken: "This user name is already taken, please choose another one.",
    badName: "The user name needs 3 to 20 letters, digits or _.", badPassword: "The password needs at least 8 characters.", needConsent: "Please agree to the privacy notice.",
    loadFailed: "The sign-in could not be loaded. Check the connection and try again.", failed: "That did not work: ",
  },
  de: {
    title: "Konto (freiwillig)", profile: "Profil",
    intro: "Speichere dein Logbuch auf allen Geräten. Ohne Konto bleibt alles in diesem Browser.",
    open: "Anmelden oder Konto erstellen",
    email: "E-Mail", password: "Passwort", passwordHint: "Mindestens 8 Zeichen",
    username: "Benutzername", usernameHint: "3 bis 20 Buchstaben, Ziffern oder _",
    consent: "Ich habe die Datenschutzerklärung gelesen und bin einverstanden, dass meine E-Mail-Adresse, mein Benutzername und mein Logbuch für dieses Konto gespeichert werden.",
    privacy: "Datenschutzerklärung",
    signIn: "Anmelden", signUp: "Konto erstellen", toSignUp: "Noch kein Konto? Eines erstellen", toSignIn: "Schon ein Konto? Anmelden",
    forgot: "Passwort vergessen?", sendReset: "Link senden", newPassword: "Neues Passwort", savePassword: "Passwort speichern",
    back: "Zurück", cancel: "Abbrechen",
    checkMail: "Fast geschafft: Wir haben dir eine E-Mail geschickt. Öffne den Link darin, um die Adresse zu bestätigen, und melde dich dann an.",
    resetSent: "Wenn es zu dieser Adresse ein Konto gibt, wurde eine E-Mail mit einem Link für ein neues Passwort gesendet.",
    passwordSaved: "Das neue Passwort ist gespeichert.",
    signedAs: (name, mail) => `Angemeldet als ${name ? `${name} (${mail})` : mail}`,
    saved: "Das Logbuch ist im Konto gespeichert.", saveFailed: "Gerade konnte nicht im Konto gespeichert werden, es wird bei der nächsten Änderung noch einmal versucht.",
    signOut: "Abmelden", deleteAccount: "Konto löschen",
    deleteAsk: "Das Konto löschen? Es und das auf dem Server gespeicherte Logbuch werden endgültig entfernt. Das Logbuch in diesem Browser bleibt.",
    deleteYes: "Ja, Konto löschen", deleted: "Das Konto ist gelöscht.",
    signedInNow: "Du bist angemeldet.",
    wrongLogin: "Die E-Mail oder das Passwort ist falsch, oder die Adresse ist noch nicht bestätigt.",
    nameTaken: "Dieser Benutzername ist schon vergeben, bitte wähle einen anderen.",
    badName: "Der Benutzername braucht 3 bis 20 Buchstaben, Ziffern oder _.", badPassword: "Das Passwort braucht mindestens 8 Zeichen.", needConsent: "Bitte stimme der Datenschutzerklärung zu.",
    loadFailed: "Die Anmeldung konnte nicht geladen werden. Prüfe die Verbindung und versuche es noch einmal.", failed: "Das hat nicht geklappt: ",
  },
  ja: {
    title: "アカウント（任意）", profile: "プロフィール",
    intro: "記録をすべての端末に保存できます。アカウントがなければ、すべてこのブラウザ内に残ります。",
    open: "ログインまたはアカウント作成",
    email: "メールアドレス", password: "パスワード", passwordHint: "8文字以上",
    username: "ユーザー名", usernameHint: "英数字または_で3〜20文字",
    consent: "プライバシーに関する説明を読み、メールアドレス、ユーザー名、記録がこのアカウントのために保存されることに同意します。",
    privacy: "プライバシーに関する説明",
    signIn: "ログイン", signUp: "アカウントを作成", toSignUp: "アカウントがない場合は作成", toSignIn: "アカウントをお持ちの場合はログイン",
    forgot: "パスワードを忘れた場合", sendReset: "リンクを送る", newPassword: "新しいパスワード", savePassword: "パスワードを保存",
    back: "戻る", cancel: "キャンセル",
    checkMail: "もう少しです。メールを送りました。中のリンクを開いてアドレスを確認し、そのあとログインしてください。",
    resetSent: "このアドレスのアカウントがある場合、新しいパスワードを設定するリンクをメールで送りました。",
    passwordSaved: "新しいパスワードを保存しました。",
    signedAs: (name, mail) => `${name ? `${name}（${mail}）` : mail} としてログイン中`,
    saved: "記録はアカウントに保存されました。", saveFailed: "いまはアカウントに保存できませんでした。次の変更時にもう一度試します。",
    signOut: "ログアウト", deleteAccount: "アカウントを削除",
    deleteAsk: "アカウントを削除しますか？アカウントとサーバーに保存された記録は完全に削除されます。このブラウザ内の記録は残ります。",
    deleteYes: "はい、削除します", deleted: "アカウントを削除しました。",
    signedInNow: "ログインしました。",
    wrongLogin: "メールアドレスかパスワードが違うか、アドレスがまだ確認されていません。",
    nameTaken: "このユーザー名はすでに使われています。別の名前を選んでください。",
    badName: "ユーザー名は英数字または_で3〜20文字にしてください。", badPassword: "パスワードは8文字以上にしてください。", needConsent: "プライバシーに関する説明への同意が必要です。",
    loadFailed: "ログイン機能を読み込めませんでした。接続を確認してもう一度お試しください。", failed: "うまくいきませんでした：",
  },
  bg: {
    title: "Профил (по желание)", profile: "Профил",
    intro: "Запази дневника си на всичките си устройства. Без профил всичко остава в този браузър.",
    open: "Вход или създаване на профил",
    email: "Имейл", password: "Парола", passwordHint: "Поне 8 знака",
    username: "Потребителско име", usernameHint: "3 до 20 букви, цифри или _",
    consent: "Прочетох бележката за поверителност и съм съгласен имейлът ми, потребителското ми име и дневникът ми да се съхраняват за този профил.",
    privacy: "Бележка за поверителност",
    signIn: "Вход", signUp: "Създай профил", toSignUp: "Нямаш профил? Създай", toSignIn: "Вече имаш профил? Влез",
    forgot: "Забравена парола?", sendReset: "Изпрати връзка", newPassword: "Нова парола", savePassword: "Запази паролата",
    back: "Назад", cancel: "Отказ",
    checkMail: "Почти готово: изпратихме имейл. Отвори връзката в него, за да потвърдиш адреса, и после влез.",
    resetSent: "Ако за този адрес има профил, е изпратен имейл с връзка за нова парола.",
    passwordSaved: "Новата парола е запазена.",
    signedAs: (name, mail) => `Влязъл като ${name ? `${name} (${mail})` : mail}`,
    saved: "Дневникът е запазен в профила.", saveFailed: "В момента не можа да се запази в профила, ще опитаме отново при следващата промяна.",
    signOut: "Изход", deleteAccount: "Изтрий профила",
    deleteAsk: "Да се изтрие ли профилът? Той и дневникът, запазен на сървъра, се премахват завинаги. Дневникът в този браузър остава.",
    deleteYes: "Да, изтрий профила", deleted: "Профилът е изтрит.",
    signedInNow: "Влязъл си.",
    wrongLogin: "Имейлът или паролата са грешни, или адресът още не е потвърден.",
    nameTaken: "Това потребителско име е заето, избери друго.",
    badName: "Потребителското име иска 3 до 20 букви, цифри или _.", badPassword: "Паролата иска поне 8 знака.", needConsent: "Моля, съгласи се с бележката за поверителност.",
    loadFailed: "Входът не можа да се зареди. Провери връзката и опитай пак.", failed: "Не се получи: ",
  },
};

// explorer: the module of the log (explorer.js): getState(), merge(remote), onChange(fn), open(). getLang() is the language of the page.
export function initAuth({ getLang, explorer, universe }) {
  const box = document.getElementById("account-box");
  const panel = document.getElementById("profile-panel");
  const button = document.getElementById("account-button");
  const t = () => AUTH_TEXT[getLang()] ?? AUTH_TEXT.en;
  let client = null;
  let loading = null;
  let user = null;
  let username = null;
  let view = "home"; // home, signin, signup, reset, newpassword
  let notice = null; // { text, error }
  let confirmDelete = false;
  let busy = false;
  let pushTimer = 0;
  let saved = null; // null: nothing yet, true: the last save worked, false: it did not

  // ---------------------------------------------------------------- the library and the session
  function loadClient() {
    loading ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "vendor/supabase/supabase.js";
      script.onload = () => {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        client.auth.onAuthStateChange((event, session) => {
          user = session?.user ?? null;
          if (event === "PASSWORD_RECOVERY") view = "newpassword";
          // the library does not want other calls inside this function, so they run right after it
          if (user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) setTimeout(afterSignIn, 0);
          if (!user) stopSaving();
          render();
        });
        resolve(client);
      };
      script.onerror = () => {
        loading = null;
        reject(new Error("load"));
      };
      document.head.append(script);
    });
    return loading;
  }

  // After the sign-in: the profile (made from the user name that was given at the registration), then the log of the account is merged
  // with the one of this browser, and saved again, and from now on every change is saved.
  let working = false;
  async function afterSignIn() {
    if (working || !user) return;
    working = true;
    try {
      let { data: profile } = await client.from("profiles").select("username").eq("id", user.id).maybeSingle();
      if (!profile && user.user_metadata?.username) {
        const wanted = user.user_metadata.username;
        const { error } = await client.from("profiles").insert({ id: user.id, username: wanted });
        if (!error) profile = { username: wanted };
        else if (error.code === "23505") notice = { text: t().nameTaken, error: true };
      }
      username = profile?.username ?? null;
      const { data: row } = await client.from("explorer_state").select("state").eq("user_id", user.id).maybeSingle();
      if (row?.state) explorer.merge(row.state);
      await push();
      explorer.onChange(schedulePush);
    } catch (error) {
      console.warn(error);
      saved = false;
    } finally {
      working = false;
      render();
    }
  }
  async function push() {
    if (!client || !user) return;
    const { error } = await client.from("explorer_state").upsert({ user_id: user.id, state: explorer.getState() }, { onConflict: "user_id" });
    saved = !error;
    if (error) console.warn(error);
  }
  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      await push();
      render();
    }, PUSH_DELAY);
  }
  function stopSaving() {
    clearTimeout(pushTimer);
    explorer.onChange(null);
    username = null;
    saved = null;
  }

  // ---------------------------------------------------------------- the actions
  const messageOf = (error) => {
    if (/invalid login|not confirmed|invalid credentials/i.test(error.message)) return t().wrongLogin;
    return error.message === t().nameTaken ? error.message : `${t().failed}${error.message}`;
  };
  async function run(task) {
    busy = true;
    notice = null;
    render();
    try {
      await loadClient();
      await task();
    } catch (error) {
      notice = { text: error.message === "load" ? t().loadFailed : messageOf(error), error: true };
    } finally {
      busy = false;
      render();
    }
  }
  const signIn = (email, password) =>
    run(async () => {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      track("account-signin");
      view = "home";
      notice = { text: t().signedInNow };
    });
  const signUp = (email, password, name) =>
    run(async () => {
      // a free user name is checked first (a visitor may ask only this, not read the profiles)
      const free = await client.rpc("username_available", { name });
      if (!free.error && free.data === false) throw new Error(t().nameTaken);
      const { error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname, data: { username: name } } });
      if (error) throw error;
      track("account-signup");
      view = "home";
      notice = { text: t().checkMail };
    });
  const sendReset = (email) =>
    run(async () => {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if (error) throw error;
      view = "home";
      notice = { text: t().resetSent };
    });
  const savePassword = (password) =>
    run(async () => {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      view = "home";
      notice = { text: t().passwordSaved };
    });
  const signOut = () =>
    run(async () => {
      await client.auth.signOut();
      user = null;
      stopSaving();
      view = "home";
      notice = null;
    });
  const deleteAccount = () =>
    run(async () => {
      stopSaving();
      const { error } = await client.rpc("delete_my_account");
      if (error) throw error;
      track("account-delete");
      await client.auth.signOut();
      user = null;
      confirmDelete = false;
      view = "home";
      notice = { text: t().deleted };
    });

  // ---------------------------------------------------------------- the profile panel and the button at the top
  const el = (tag, cls, content) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  };
  const makeButton = (label, cls, onClick) => {
    const b = el("button", cls, label);
    b.type = "button";
    b.disabled = busy;
    b.addEventListener("click", onClick);
    return b;
  };
  function field(label, type, name, hint, autocomplete) {
    const wrap = el("label", "account-field");
    const input = el("input");
    input.type = type;
    input.name = name;
    input.required = true;
    input.autocomplete = autocomplete;
    input.disabled = busy;
    wrap.append(el("span", "", label), input);
    if (hint) wrap.append(el("small", "", hint));
    return { wrap, input };
  }
  function form(fields, submitLabel, onSubmit, extra = []) {
    const f = el("form", "account-form");
    f.noValidate = true;
    f.append(...fields.map((x) => x.wrap), ...extra);
    const submit = makeButton(submitLabel, "account-main", () => {});
    submit.type = "submit";
    f.append(submit);
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      onSubmit();
    });
    return f;
  }
  const link = (label, onClick) => makeButton(label, "account-link", onClick);
  function go(next) {
    view = next;
    notice = null;
    confirmDelete = false;
    render();
    if (next !== "home") loadClient().catch(() => {}); // ready by the time the form is sent
  }
  // the panel: a click on the button at the top opens it (the sign-in if nobody is signed in), another click or the cross closes it
  function toggle(open = panel.hidden) {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (!open) return;
    notice = view === "home" ? notice : null;
    confirmDelete = false;
    render();
    if (!user) loadClient().catch(() => {});
  }
  button.addEventListener("click", () => toggle());
  document.getElementById("profile-close").addEventListener("click", () => toggle(false));
  window.addEventListener("keydown", (e) => e.key === "Escape" && !panel.hidden && toggle(false));

  function render() {
    const tx = t();
    const parts = [];
    document.getElementById("profile-title").textContent = universe.title();
    document.getElementById("profile-close").setAttribute("aria-label", tx.back);
    // the button at the top: "Sign in", or the name of the person
    const who = username ?? user?.email?.split("@")[0] ?? "";
    button.textContent = user ? who : universe.buttonLabel();
    button.title = user ? tx.signedAs(username, user.email) : tx.open;
    parts.push(el("h3", "", tx.title));
    if (notice) parts.push(el("p", notice.error ? "account-error" : "account-ok", notice.text));
    if (user && view !== "newpassword") {
      parts.push(el("p", "", tx.signedAs(username, user.email)));
      parts.push(explorer.profileEl());
      if (saved !== null) parts.push(el("p", "hint", saved ? tx.saved : tx.saveFailed));
      if (confirmDelete) {
        parts.push(el("p", "account-error", tx.deleteAsk));
        const row = el("div", "account-row");
        row.append(makeButton(tx.deleteYes, "account-danger", deleteAccount), makeButton(tx.cancel, "", () => ((confirmDelete = false), render())));
        parts.push(row);
      } else {
        const row = el("div", "account-row");
        row.append(makeButton(tx.signOut, "", signOut), makeButton(tx.deleteAccount, "account-link", () => ((confirmDelete = true), render())));
        parts.push(row);
      }
    } else if (view === "home") {
      parts.push(el("p", "hint", tx.intro), makeButton(tx.open, "account-main", () => go("signin")));
    } else if (view === "signin") {
      const email = field(tx.email, "email", "email", null, "email");
      const password = field(tx.password, "password", "password", null, "current-password");
      parts.push(
        form([email, password], tx.signIn, () => signIn(email.input.value.trim(), password.input.value)),
        link(tx.forgot, () => go("reset")),
        link(tx.toSignUp, () => go("signup")),
        link(tx.back, () => go("home"))
      );
    } else if (view === "signup") {
      const email = field(tx.email, "email", "email", null, "email");
      const name = field(tx.username, "text", "username", tx.usernameHint, "username");
      const password = field(tx.password, "password", "password", tx.passwordHint, "new-password");
      const consent = el("label", "account-consent");
      const box = el("input");
      box.type = "checkbox";
      const privacy = el("a", "", tx.privacy);
      privacy.href = "legal.html#datenschutz";
      privacy.target = "_blank";
      privacy.rel = "noopener";
      consent.append(box, el("span", "", `${tx.consent} `), privacy);
      parts.push(
        form([email, name, password], tx.signUp, () => {
          if (!USERNAME.test(name.input.value)) return fail(tx.badName);
          if (password.input.value.length < 8) return fail(tx.badPassword);
          if (!box.checked) return fail(tx.needConsent);
          signUp(email.input.value.trim(), password.input.value, name.input.value);
        }, [consent]),
        link(tx.toSignIn, () => go("signin")),
        link(tx.back, () => go("home"))
      );
    } else if (view === "reset") {
      const email = field(tx.email, "email", "email", null, "email");
      parts.push(form([email], tx.sendReset, () => sendReset(email.input.value.trim())), link(tx.back, () => go("signin")));
    } else if (view === "newpassword") {
      const password = field(tx.newPassword, "password", "password", tx.passwordHint, "new-password");
      parts.push(form([password], tx.savePassword, () => (password.input.value.length < 8 ? fail(tx.badPassword) : savePassword(password.input.value))));
    }
    box.replaceChildren(...parts);
    universe.render(document.getElementById("universe-body")); // the dashboard, the greeting
  }
  function fail(text) {
    notice = { text, error: true };
    render();
  }

  // ---------------------------------------------------------------- start
  // The library is loaded now only if there is a session in this browser, or the page was opened by a link of a mail of the account
  // (it ends in the address as ?code=... or #access_token=... or type=recovery).
  const fromMail = /[?&#](code|access_token|error_description)=|type=recovery/.test(location.search + location.hash);
  let hasSession = false;
  try {
    hasSession = !!localStorage.getItem(SESSION_KEY);
  } catch {
    // storage blocked: no session to restore
  }
  render();
  const start = () =>
    loadClient()
      .then(() => {
        if (fromMail) toggle(true);
      })
      .catch(() => {});
  if (fromMail) start();
  else if (hasSession) setTimeout(start, 6000); // not during the first flight
  return { render, open: () => toggle(true), close: () => toggle(false) };
}
