# HopHop Napuhanci - Dashboard

Interni dashboard za praćenje rezervacija, prihoda i troškova.

## Setup

### 1. Supabase projekt

1. Idi na [supabase.com](https://supabase.com) i kreiraj novi besplatni projekt
2. Idi u **SQL Editor** i pokreni sadržaj datoteke `supabase-setup.sql`
3. Idi u **Authentication > Users** i klikni "Add user" za kreiranje svog admin računa (email + lozinka)
4. Kopiraj **Project URL** i **anon public key** iz **Settings > API**

### 2. Environment varijable

Kreiraj `.env` datoteku u root direktoriju:

```
VITE_SUPABASE_URL=https://tvoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=tvoj-anon-key
```

### 3. Lokalni razvoj

```bash
npm install
npm run dev
```

### 4. Deploy na GitHub Pages

```bash
npm run build
```

Buildani `dist/` folder deployas na GitHub Pages ili Netlify.

Za Netlify: dodaj environment varijable u Netlify dashboard (Site settings > Build & deploy > Environment).

## Funkcionalnosti

- **Pregled** - ROI, ukupni prihod, troškovi, nadolazeće rezervacije
- **Rezervacije** - Kalendar, copy-paste unos, ručni unos, popusti
- **Prihodi** - Po napuhancu, po mjesecima, ukupno
- **Troškovi** - Gorivo, marketing, amortizacija, garaža
