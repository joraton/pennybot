# Pennybot — Extension Chrome

## Vision

Extension Chrome side panel pour les **experts-comptables** qui utilisent **Penny Lane**.
Permet de parler à un agent IA contextualisé sur un client précis, d'interroger ses données comptables et de déclencher des actions directement depuis le navigateur, sans quitter la page en cours.

---

## Stack technique

- **Vite + React 19 + TypeScript** — build toolchain
- **CSS global** — design system Audacieux (dark teal + electric green)
- **Manifest V3** — compatible Chrome, Edge, Firefox
- **`npm run dev`** — rebuild auto (watch mode)
- **`npm run build`** — build prod dans `dist/`

---

## Structure du projet

```
pennybot/
  src/
    App.tsx                  — état global (screen, client sélectionné, overlays)
    sidepanel.tsx            — point d'entrée React
    style.css                — design system complet (Audacieux)
    components/
      Header.tsx             — barre du haut, boutons adaptés selon l'écran
      ClientSelector.tsx     — écran 1 : liste clients, recherche, ajout
      ChatView.tsx           — écran 2 : messages, composer, suggestions
      AddClientFlow.tsx      — overlay 3 étapes : clé API → loading → succès
      SettingsPanel.tsx      — overlay paramètres (clé API globale)
      BotMark.tsx            — SVG du logo robot réutilisable
    hooks/
      useClients.ts          — liste clients, filtrage, ajout
      useChat.ts             — messages, envoi, mock réponses
    lib/
      types.ts               — types TypeScript (Client, Message, Screen)
      data.ts                — données mock + helpers (avatarClass, greetingByHour)
      mockResponses.ts       — réponses simulées par mot-clé
  public/
    manifest.json            — config Chrome extension (Manifest V3)
    background.js            — service worker (ouvre le side panel au clic)
    icons/                   — icônes 16/32/48/128px (logo robot)
    design-system/           — assets logo (SVG mark, PNG)
  sidepanel.html             — entry point HTML Vite
  vite.config.ts
  tsconfig.json
  package.json
```

---

## Commandes

```bash
cd pennybot

npm run dev      # rebuild automatique à chaque sauvegarde (mode watch)
npm run build    # build prod → dist/
```

**Charger dans Chrome :**
1. `chrome://extensions` → Mode développeur activé
2. "Charger l'extension non empaquetée" → sélectionner `pennybot/dist/`
3. Après chaque `npm run build` : cliquer ↺ dans `chrome://extensions`

---

## Design system — Audacieux

| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#001f1f` | fond principal |
| `--green` | `#00f872` | accent principal, CTA |
| `--green-dim` | `rgba(0,248,114,0.16)` | badges, backgrounds légers |
| `--border-green` | `rgba(0,248,114,0.45)` | bordures actives, inputs focus |
| `--text-1` | `#ffffff` | texte principal |
| `--text-3` | `#8fc8c8` | texte secondaire |
| `--text-4` | `#59a8a8` | texte muted |

Font : **Manrope** (400/500/600/700/800) via Google Fonts.

Bulles chat :
- **Bot** → carte blanche avec `box-shadow: 0 0 0 1px rgba(0,248,114,0.35)` (glow vert)
- **User** → dark glass `rgba(255,255,255,0.08)` avec bordure subtile

---

## État actuel

- [x] UI complète — sélecteur client, chat, add client flow, paramètres
- [x] Architecture React + TypeScript + Vite
- [x] Design Audacieux (dark teal + electric green)
- [x] Icône extension = logo robot Pennybot
- [x] Réponses mock contextuelles (CA, factures, rapprochement, notes de frais)
- [x] Flow "Ajouter un client" via clé API (3 étapes : input → loading → succès)
- [ ] Connexion réelle à l'API Penny Lane
- [ ] Authentification cabinet / multi-utilisateurs
- [ ] Historique des conversations (persistance)
- [ ] Déploiement Chrome Web Store

---

## Prochaines étapes

1. **API Penny Lane** — brancher `src/lib/pennylane.ts` sur les vrais endpoints (clients, factures, soldes)
2. **Auth** — clé API par cabinet ou OAuth Penny Lane
3. **Historique** — persister les conversations dans `chrome.storage.local`
4. **Tests terrain** — vrais utilisateurs experts-comptables
5. **Chrome Web Store** — packager et soumettre

---

## Ajouter une fonctionnalité

- Nouveau composant UI → `src/components/`
- Nouvelle logique métier → `src/hooks/` ou `src/lib/`
- Appel API Penny Lane → `src/lib/pennylane.ts` (à créer)
- Ne jamais modifier `public/manifest.json` pour des features UI — c'est uniquement pour les permissions Chrome
