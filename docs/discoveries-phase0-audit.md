# SPACE DISCOVERIES: Phase 0, Bestandsaufnahme

Stand: 18. November 2026, Commit 98bf1c2. Nur gelesen, nichts am Code geändert.

## 1. Architektur

| Teil | Was es ist |
|---|---|
| Frontend | Reine statische Seite in `web/`: `index.html`, ES-Module ohne Build-Schritt, three.js r160 in `web/vendor`. Kein Framework, kein Router. |
| Größe | 24 Module, rund 23.700 Zeilen. Die größten: `learn.js` (8.601), `main.js` (6.345), `universe.js` (1.026). |
| Hosting | GitHub Pages (`.github/workflows/pages.yml`), nur von Hand gestartet. `src/stamp_version.py` hängt `?v=<commit>` an Skripte und CSS. Die Startseite wird 10 Minuten zwischengespeichert. |
| Server | **Keiner.** Es gibt keinen eigenen Backend-Code und keine laufende Server-Logik. |
| Konten | Supabase (Auth und PostgreSQL in Frankfurt), nur mit dem öffentlichen Schlüssel aus dem Browser. Zwei Tabellen, Zugriff über Row Level Security (`supabase/schema.sql`, getestet in `database-tests.yml`). |
| Statistik | GoatCounter, nur Ereignisnamen, ohne Personenbezug (`web/stats.js`). |
| Daten | Python-Skripte in `src/` holen Daten (NASA Exoplanet Archive, JPL, ESA Gaia) und schreiben JSON und Binärdateien nach `web/data/`. Die Dateien liegen im Repository. |
| Adressen | Eine einzige Seite. Nur der Parameter `?learn=<pfad>` (Zertifikat-Links) und `?safe` werden gelesen. Es gibt keine eigenen Adressen pro Objekt. |
| Tests | 136 Node-Tests (`tests/*.test.mjs`, `unit-tests.yml`) und SQL-Tests für die Zugriffsregeln. |

## 2. Vorhandene Funktionen

**3D-Explorer (`main.js`)**
- 6.000+ Exoplaneten mit Wirtssternen aus der NASA-Tabelle, Sonnensystem mit echten Bahnen (JPL), Zwergplaneten Ceres und Pluto.
- Monde: der Erdmond sowie Io, Europa, Ganymed und Kallisto.
- „Besucher“ mit echten Bahnen: Kometen (Halley, Hale-Bopp, 67P, Swift-Tuttle, Encke, NEOWISE), **interstellare Objekte (ʻOumuamua, Borisov, 3I/ATLAS)** und Raumsonden (Voyager 1 und 2, New Horizons, Juno, Parker Solar Probe, JWST).
- Gaia-Schichten (nahe Sterne und rund eine Million helle Sterne), 88 Sternbilder mit Atlas, echter Maßstab, Reiseplaner, Nahansichten, Geschichten zu jedem Planeten.

**Mein Universum (`universe.js`)**
- Bereiche: Übersicht, Entdecken, Lernen, Du im Kosmos, Sammlung, Zertifikate.
- 17 Lernpfade mit Quellen pro Schritt (`learn.js`), Abzeichen, Zertifikate, Missionen (`explorer.js`).
- Journal mit Notizen, Sammlungen und Favoriten (`journal.js`), Empfehlungen mit Begründung (`recommend.js`).

**Was es schon an „Entdeckungen“ gibt**

| Vorhanden | Datei | Zustand |
|---|---|---|
| Entdeckung des Tages | `web/data/daily.json`, `daily.js` | 31 Einträge in Englisch und Deutsch, je ein Ziel auf der Karte. Laut eigener Notiz von Hand geschrieben. Die Zahlen stimmen mit NASA überein, **die Geschichte ist „Lehrbuchwissen“ ohne Quelle pro Aussage.** |
| Himmelsereignisse | `web/data/events.json`, `events.js` | 17 Ereignisse bis Dezember 2027, mit Quelle pro Eintrag. |
| Flug des Tages | `dailyflight.js` | Ein Ziel pro Tag. |
| Lernpfade | `learn.js` | 17 Pfade mit geprüften Quellen pro Schritt. Das ist das Vorbild für das Quellenmodell. |
| Missionen | `explorer.js` (`MISSIONS`, `BADGES`) | Tages- und Wochenziele aus Ereignissen der Karte. Erweiterbar, aber ohne „Ziel auf der Karte“. |

Namenskonflikt: Der Bereich heißt auf Deutsch schon „Entdecken“. „Discoveries“ bräuchte einen eigenen Namen, zum Beispiel „Entdeckungen“ als eigene Seite.

## 3. Datenbank, Daten, Anmeldung, Veröffentlichung

- **`profiles`**: Benutzername pro Konto.
- **`explorer_state`**: **ein** JSON-Dokument pro Person (bis 200 KB) mit Favoriten, Verlauf, Missionen, XP, Abzeichen, Notizen und Sammlungen. Nur die Person selbst kann es lesen und ändern.
- Die XP-Regeln laufen im Browser, der Server prüft sie nicht. Deshalb gibt es keine gemeinsamen Ranglisten.
- **Daten im Repository:** `stars.json` (NASA), `orbits.json` (JPL), `gaia_*.bin` (ESA Gaia DR3, CC BY-NC 3.0 IGO), `constellations.json` (d3-celestial und Hipparcos), `star-names.json` (132 Namen von Hand, **nicht an einer Quelle geprüft**), `places.json` (GeoNames).
- **Geheimnisse:** Im Browser liegt nur der öffentliche Supabase-Schlüssel. Andere Schlüssel gibt es nicht.

## 4. IDs und Koordinaten für die Anbindung an den Explorer

| Objektart | Stabile ID heute | Beispiel |
|---|---|---|
| Exoplanet | `pl_name` der NASA-Tabelle | `TRAPPIST-1 e` |
| Wirtsstern | `hostname` der NASA-Tabelle | `Proxima Cen` |
| Planet, Zwergplanet | englischer Name | `Jupiter`, `Ceres` |
| Mond | Mond-ID aus `moons.js` | `Europa`, `Ganymede` |
| Besucher | `key` in `main.js` | `oumuamua`, `3i-atlas`, `voyager-1`, `jwst` |
| Sternbild | IAU-Kürzel | `Ori`, `Tau` |
| Stern ohne Planeten | Hipparcos-Nummer oder Gaia-Name | `71683`, `van Maanen's Star` |
| Lernschritt | Schritt-ID aus `learn.js` | `nebCrab`, `bhCenter` |

- **Koordinaten:** `stars.json` hat x, y, z in Lichtjahren im äquatorialen System (aus RA, Dec und Entfernung). Die Karte staucht die Entfernung mit der Wurzel und tauscht die Achsen (`toMapPosition`). Das Sonnensystem kommt aus ekliptikalen Bahnelementen (`mapEcliptic`).
- **Fertige Einstiege in den Explorer:**
  - `resolvePlace(name)` findet Planeten, Sterne und Exoplaneten.
  - `learnShow("moon:<id>" | "sky:<IAU>" | "view:…")` zeigt Monde, Sternbilder und Ausschnitte des Sonnensystems.
  - `selectBody`, `showSystem` und `flyToView` steuern die Kamera.
- **Ohne Objekt auf der Karte:** Enceladus, Titan, Sagittarius A*, M87, der Orionnebel und Galaxien haben kein eigenes Objekt. Für sie gibt es nur den Blick ins Sternbild (`sky:`). Nach der Spezifikation werden dafür keine Koordinaten erfunden.

## 5. Vorgeschlagenes Datenmodell, angepasst an diese Seite

Ohne Server ist das einfachste und sicherste Modell: **Entdeckungen sind Dateien im Repository, wie heute `daily.json` und `events.json`.** Git liefert damit Revisionsgeschichte, Prüfung und Veröffentlichung gleich mit.

| Aus der Spezifikation | Umsetzung hier |
|---|---|
| Discoveries | `web/data/discoveries/<id>.json`, ein Eintrag pro Datei: Texte pro Sprache, Status (CONFIRMED, CANDIDATE, OPEN QUESTION), Belegarten pro Aussage, drei Datumsfelder |
| Categories, Types, Tags | eine kleine Datei `discoveries/index.json` (Kategorien, Typen, Aliase, Suchwörter), erzeugt durch ein Skript |
| Sources | im Eintrag selbst, als Liste wie `SOURCES` der Lernpfade (Titel, URL, abgerufen am, veröffentlicht am) |
| Updates | Git-Verlauf, dazu ein Feld `updates` mit Datum und Satz pro wissenschaftlicher Änderung |
| Media | im Eintrag: Datei, Urheber, Lizenz, Link. Bilder in `web/media/` |
| Relations | Feld `explorer` mit den IDs aus Abschnitt 4, Feld `learn` mit Schritt-IDs, Feld `related` mit anderen Einträgen |
| DailyPicks | eine Liste im Index, oder `daily.json` wird zum Verweis auf Einträge |
| Missions | `MISSIONS` in `explorer.js` um ein Ziel auf der Karte und einen Verweis auf Einträge erweitern |
| UserDiscoveries | **keine neue Tabelle:** gespeichert, erkundet und Sammlungen kommen in `explorer_state`, wie Favoriten und Sammlungen heute |

Eine eigene Admin-Oberfläche und eigene Datenbanktabellen für Inhalte wären auf dieser Seite erst einmal nicht nötig. Die Prüfung läuft über GitHub (Pull Request = Prüfwarteschlange). Das spart Server-Code, Rollen und Rechte.

## 6. Betroffene Dateien in späteren Phasen

- **Neu:**
  - `web/discoveries.js` (Bibliothek, Suche, Filter, Detailansicht)
  - `web/data/discoveries/*`
  - `src/build_discoveries.py` (Index, statische Detailseiten, `sitemap.xml`)
  - `src/fetch_discoveries.py` (tägliche Prüfung)
  - `.github/workflows/discoveries-daily.yml`
  - `tests/discoveries.test.mjs`
- **Geändert:**
  - `index.html` (Einstieg)
  - `universe.js` (Bereich oder Verweis, gespeicherte Einträge)
  - `main.js` (Verweis vom Explorer auf Einträge, Parameter `?d=<id>`)
  - `explorer.js` (Missionen, gespeicherte Einträge im Zustand)
  - `learn.js` (Verweise von Schritten)
  - `pages.yml` (Build-Schritt für die statischen Seiten)
  - `legal.html` (Bildrechte)
- **Datenbank:** keine Migration nötig, solange gespeicherte Einträge in `explorer_state` passen.

## 7. Risiken und offene Punkte

1. **Kein Server.** Die tägliche Recherche kann nicht in der Seite laufen. Mein Vorschlag ist ein täglicher GitHub-Actions-Job, der Quellen abruft, mit vorhandenen Einträgen vergleicht und **einen Pull Request oder ein Issue mit Entwurf und Quellen** anlegt. Erst Prüfen, Mergen und das manuelle Veröffentlichen machen etwas öffentlich.
2. **Suchmaschinen und feste Adressen.** Eine einzige Seite ohne Server liefert keine eigene Adresse pro Eintrag. Lösung: Beim Veröffentlichen erzeugt ein Skript für jeden Eintrag eine statische Seite `web/d/<id>/index.html` mit Titel, Beschreibung und Vorschaubild. Sie öffnet den Eintrag in der App.
3. **Prüfaufwand.** Bei den Lernpfaden waren viele offizielle Seiten umgezogen oder nicht erreichbar (zum Beispiel ganze Bereiche der IAU-Seite). Für 30 tiefe Einträge mit Quelle pro Aussage ist das der größte Aufwand.
4. **Vier Sprachen.** Tiefe Artikel in Englisch, Deutsch, Japanisch und Bulgarisch vervierfachen Text und Prüfung. Vorschlag: zuerst Englisch und Deutsch, die anderen Sprachen später.
5. **Bildrechte.** NASA-Bilder sind meist gemeinfrei, ESA- und ESO-Bilder stehen meist unter CC BY 4.0 und brauchen eine Namensnennung. Jedes Bild bekommt Urheber und Lizenz im Eintrag.
6. **Externe Schnittstellen.** Ratenlimits, Bedingungen und Schlüssel von NASA Open APIs, NASA ADS (braucht ein Token) und den RSS-Feeds von ESA und NASA müssen vor Phase 4 an ihrer aktuellen Dokumentation geprüft werden. Schlüssel kämen nur als GitHub-Secret in den Job, nie in die Seite.
7. **KI-Entwürfe.** Ein Entwurf darf keine Quellen, Zahlen, Daten oder Zitate erfinden. Jeder Entwurf bleibt bis zur Prüfung als Entwurf markiert.
8. **Vorhandene Texte.** Die 31 Einträge der Entdeckung des Tages und die 132 Sternnamen sind nicht pro Aussage belegt. Vor einer Übernahme müssen sie geprüft werden.
9. **Größe von `main.js` und `learn.js`.** Neuer Code gehört in eigene Module und wird erst beim Öffnen geladen, damit die Startseite nicht langsamer wird.
10. **Zwischenspeicher.** Neue Daten erscheinen bis zu 10 Minuten verzögert. Für Daten-Dateien gehört die Version mit in die Adresse.

**Empfohlene Tests:** Pflichtfelder und Status jedes Eintrags, Quelle für jede Aussage, gültige Explorer-IDs (gegen `stars.json`, Monde, Besucher, Sternbilder), keine doppelten IDs oder Aliase, Verweise auf Lernschritte, der Abgleich des täglichen Jobs (neu oder Aktualisierung) mit Beispieldaten und die Erzeugung der statischen Seiten.

## 8. Plan in Phasen

| Phase | Wiederverwendet | Wirklich neu |
|---|---|---|
| 1 Grundlage | Gestaltung, Mein Universum, Suche (`resolvePlace`), Quellenmodell der Lernpfade | Schema der Einträge, Index, 8 Kategorien, 7 Typen, Bibliothek mit Filtern, Vorlage der Detailseite, Tests |
| 2 Inhalte | geprüfte Fakten und Quellen der 17 Lernpfade | Statusangaben, Abschnitte und Kernaussagen der Artikel, Bildrechte, die ersten 30 Einträge (Englisch und Deutsch) |
| 3 Explorer | `resolvePlace`, `learnShow`, Besucher, Monde, Sternbilder | Knopf „Im Explorer ansehen“ auf Einträgen, „Entdeckungen dazu“ in der Geschichte eines Objekts, Parameter `?d=` |
| 4 Tägliche Prüfung | Abruf-Skripte in `src/`, GitHub Actions | täglicher Job, Abgleich, Pull Request als Prüfwarteschlange, Protokolle |
| 5 Erlebnis | Entdeckung des Tages, Missionen, Sammlungen, `explorer_state` | Neueste Entdeckungen, Kosmische Missionen mit Ziel auf der Karte, gespeicherte Einträge |
| 6 Ausbau | i18n-Muster | weitere Sprachen, statische Seiten und Sitemap für Suchmaschinen, Leistung |

**Vorschlag für die 30 ersten Einträge**, zuerst mit Objekten, die es auf der Karte schon gibt:

| Kategorie | Einträge |
|---|---|
| Interstellar | ʻOumuamua, Borisov, 3I/ATLAS, interstellare Besucher allgemein |
| Verborgene Welten | Europa, Ganymed, Enceladus*, Titan* |
| Exoplaneten | Proxima b, TRAPPIST-1, 51 Pegasi b, TOI-700 d, PDS 70 |
| Rätsel | Sagittarius A*, M87*, Dunkle Materie, Dunkle Energie |
| Sterne | Krebsnebel (1054), PSR B1257+12, Weiße Zwerge (WD 1856+534), AU Mic |
| Tiefe Zeit | MoM-z14, Hintergrundstrahlung, Hubble Deep Field |
| Menschheit im All | Voyager 1, New Horizons, JWST |
| Kartierung | Gaia DR3, Plejaden, Lokale Gruppe |

\* ohne Objekt auf der Karte: Seite ohne Explorer-Knopf.

**Nächster Schritt:** Freigabe von Phase 1. Vorher zu entscheiden: Inhalte als Dateien im Repository (mein Vorschlag) oder in der Datenbank mit eigener Admin-Oberfläche.
