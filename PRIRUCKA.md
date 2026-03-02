# 📚 Příručka správce webu – TJ Sokol Postoupky

Vítej! Tady návod jak editovat obsah webu pomocí administrace.

---

## 🔓 Přihlášení do administrace

1. Jdi na adresu: `https://tvůj-web.cz/admin/`
2. Klikni na "Přihlásit přes GitHub"
3. Povolí se ti přístup (musíš mít přístup k repozitáři na GitHubu)

---

## 📰 Novinky – Jak napsat článek

1. V adminu klkni na: **Novinky**
2. Klikni **Nová novinka** (zelené tlačítko)
3. Vyplň:
   - **Titulek** – nadpis články, např. "Frajer vítězství 3:2 nad Hulínem"
   - **Datum** – kdy byl článek napsán
   - **Perex** – krátký úryvek (bude se zobrazovat v seznamu)
   - **Obsah** – celý text, můžeš používat **Markdown**:
     - `# Nadpis`  
     - `**tučný text**`
     - `[odkaz](https://example.com)`
     - `![obrázek](https://example.com/foto.jpg)`

4. Klikni **Uložit** – článek se automaticky publikuje

---

## 👥 Hráči – Jak přidat hráče

### Muži

1. Jdi na: **Data** → **Hráči** → **Muži**
2. Klikni **Přidat** (bílé tlačítko)
3. Vyplň:
   - **Jméno** – jméno hráče (povinné)
   - **Číslo** – číslo dresu (např. 7)
   - **Pozice** – vyber: Brankář, Obránce, Záložník, Útočník
   - **Fotka** – klikni na fotku a nahraj z počítače
4. Klikni **Uložit**

### Mládež – Dorostenci, Starší žáci, atd.

1. Jdi na: **Data** → **Hráči** → **Mládež – [KATEGORIE]**
2. Postup je stejný jako u Mužů
3. Je oddělená sekce pro každou věkovou kategorii

---

## 🏆 Zápasy – Jak přidat zápas

1. Jdi na: **Data** → **Zápasy**
2. Klikni **Přidat zápas** (bílé tlačítko)
3. Vyplň:
   - **Tým** – vyber "Muži" nebo "Mládež"
   - **Sezóna** – např. "2025/2026"
   - **Soutěž** – název soutěže, např. "1. Divize"
   - **Kolo** – např. "18. kolo" (nepovinn)
   - **Datum** – přinesení data zápasu
   - **Čas** – začátek zápasu, např. "16:30"
   - **Jsme doma** – zatrhni, pokud hraji doma v Postoupkách
   - **Místo** – kde se zápas koná, např. "Sokolovna Postoupky"
   - **Domácí** – název domácího týmu, např. "Sokol Postoupky"
   - **Hosté** – název hostujícího týmu, např. "Hulín"
   - **Skóre domácí** / **Skóre hosté** – až se zápas hraje, vyplň výsledek (números)
   - **Rozhodčí** – jméno rozhodčího (pokud víš)
   - **Report** – krátký popis průběhu zápasu (nepovinné)
   - **Video URL** – odkaz na video z YouTubu, Facebooku nebo `.mp4` soubor

4. Klikni **Uložit**

> **Tip:** Video URL se automaticky vloží do stránky zápasu a přehraje se odpovídajícím způsobem (YouTube iframe, MP4 video, atd.)

---

## 🎭 Realizační tým – Trenéři, fyzio, atd.

1. Jdi na: **Data** → **Realizační tým**
2. Klikni **Přidat osobu**
3. Vyplň:
   - **Jméno**
   - **Role** – např. "Trenér", "Asistent", "Fyzioterapeut"
   - **Telefon** – tel. číslo (nepovinné)
   - **Email** – emailová adresa (nepovinné)
   - **Fotka** – profilovka (nepovinné)
4. Klikni **Uložit**

---

## 📸 Galerie – Alba fotek

1. Jdi na: **Data** → **Galerie**
2. Klikni **Přidat album**
3. Vyplň:
   - **Název alba** – např. "Meziligový turnaj 2026"
   - **Datum** – kdy byla fotka pořízena
   - **Slug** – název bez mezer a háčků, např. "meziligovy-turnaj-2026"
   - **Úvodní fotka** – hlavní fotka alba
   - **Fotky** – klikni **Přidat fotku** a nahraj všechny fotky z akce
4. Klikni **Uložit**

> Fotky se budou zobrazovat na stránce `/galerie/`

---

## 🤝 Partneři – Sponzoři

1. Jdi na: **Data** → **Partneři**
2. Klikni **Přidat partnera**
3. Vyplň:
   - **Název** – jméno firmy, např. "Stavební firma ABC"
   - **Logo** – logo firmy (nepovinné)
   - **Odkaz** – www stránka partnera, např. "https://abc.cz"
4. Klikni **Uložit**

---

## 📍 Kontakty – Adresy a tréninky

1. Jdi na: **Data** → **Kontakty**
2. Vyplň:
   - **Adresa** – fyzická adresa klubu
   - **Mapa URL** – odkaz z Google Map (nepovinné)
   - **Kontaktní osoby** – klikni **Přidat osobu** pro vedoucího, hospodáře, atd.
   - **Tréninky** – klikni **Přidat trénink** pro každý tým:
     - Tým: "Muži"
     - Den: "Středa"
     - Čas: "18:00–19:30"
     - Místo: "Sokolovna Postoupky"
3. Klikni **Uložit**

---

## 📚 Kategorie mládeže

1. Jdi na: **Data** → **Kategorie mládeže**
2. Zde vidíš seznam všech věkových kategorií: Dorostenci, Starší žáci, atd.
3. Pokud chceš přidat novou kategorii, klikni **Přidat kategorii**
4. Vyplň:
   - **ID** – interní identifikátor, bez mezer, bez háčků, např. "dorostenci"
   - **Název** – např. "Dorostenci"
   - **Zkratka** – např. "U19"

---

## ⚙️ Globální nastavení

1. Jdi na: **Data** → (plán budoucího rozšíření – dál se týká generálních obecných nastavení webu - URL klubu, jméno klubu, fotka na social media, atd.)

---

## 💡 Tipy

✅ **Vždy klikni Uložit**, jinak se změny neuloží!  
✅ **Fotky** – Používej JPG nebo PNG, maximálně ~2 MB  
✅ **Video** – Nejjednodušší je YouTube odkaz, ale jde i `.mp4`  
✅ **Markdown v novinkách** – Můžeš psát **tučný**, *kurzívu*, seznamy, atd.
✅ **Zatím nelze** – Mazat členy, aby se neztratila data. Pokud potřebuješ smazat, piš správcovi.

---

## ❓ Pomoc a problémy

- Admin se **načítá pomalu**? Obnoví si stránku (F5)
- **Nemůžu nahrát fotku**? Zkontroluj velikost (max 2 MB) a formát (JPG, PNG)
- **Změny se neukazují na webu**? Může trvat pár minut, až se web znovu vygeneneruje a publikuje
- **Zapomenuté heslo?** Napiš správcovi na mail 📧

---

**Hodně štěstí s editací! 🎉**
