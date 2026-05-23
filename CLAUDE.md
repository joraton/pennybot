# Pennybot — Extension Chrome

## Vision

Extension Chrome side panel pour les **experts-comptables** qui utilisent **Penny Lane**.
Permet de parler à **Hermès** (agent IA Nous Research) contextualisé sur un client précis, d'interroger ses données comptables et de déclencher des actions directement depuis le navigateur, sans quitter la page en cours.

---

## Stack technique

- **Vite + React 19 + TypeScript** — build toolchain
- **CSS global** — design system Audacieux (dark teal + electric green)
- **Manifest V3** — compatible Chrome, Edge, Firefox
- **Hermès Agent** (Nous Research) — modèle `gpt-5.4` via `openai-codex`, abonnement Codex
- **`npm run dev`** — rebuild auto (watch mode)
- **`npm run build`** — build prod dans `dist/`

---

## Démarrer l'appli (à faire à chaque session)

### 1. Lancer la gateway Hermès
```bash
hermes gateway
```
Hermès écoute sur `http://localhost:8642`. Sans ça, le chat tombe en mode mock.

### 2. Builder et recharger l'extension
```bash
cd pennybot
npm run build
```
Puis `chrome://extensions` → ↺

### 3. Configurer la clé locale (une seule fois)
Paramètres (⚙) dans l'extension → **"Agent Hermès — Clé locale"** → coller la valeur de `API_SERVER_KEY` dans `~/.hermes/.env` → Enregistrer.

Bouton **"Tester Hermès gateway"** pour vérifier que la connexion est active.

---

## Configuration Hermès (`~/.hermes/.env`)

Ces 3 lignes doivent être présentes dans `~/.hermes/.env` :

```
API_SERVER_ENABLED=true
API_SERVER_KEY=mon-token-perso
API_SERVER_CORS_ORIGINS=*
```

Le modèle et le provider sont dans `~/.hermes/config.yaml` :
- `model.default: gpt-5.4`
- `model.provider: openai-codex`
- Aucune clé LLM externe — utilise l'abonnement Codex existant.

L'agent expert-comptable est configuré dans `agents/expert-comptable/` :
- `SOUL.md` — persona, style, règles
- `skill/SKILL.md` — comportement RAG sur le CGI
- `goal-v2.md` — objectifs et définition of done

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
      SettingsPanel.tsx      — overlay paramètres (clé Hermès + clé Penny Lane)
      BotMark.tsx            — SVG du logo robot réutilisable
    hooks/
      useChat.ts             — messages, envoi ; appelle Hermès si clé dispo, sinon mock
    lib/
      types.ts               — types TypeScript (Client, Message, Screen)
      data.ts                — données mock + helpers (avatarClass, greetingByHour)
      mockResponses.ts       — réponses simulées par mot-clé (fallback sans gateway)
      hermes.ts              — appel HTTP à localhost:8642, conversion markdown→HTML
  public/
    manifest.json            — config Chrome extension (Manifest V3)
    background.js            — service worker (ouvre le side panel au clic)
    icons/                   — icônes 16/32/48/128px (logo robot)
    design-system/           — assets logo (SVG mark, PNG)
  sidepanel.html             — entry point HTML Vite
  vite.config.ts
  tsconfig.json
  package.json

agents/
  expert-comptable/
    SOUL.md                  — persona Hermès (style, règles, disclaimer)
    skill/SKILL.md           — skill CGI (RAG, format de réponse)
    goal-v2.md               — objectifs et scénarios de test
```

---

## Comment fonctionne le chat

1. L'utilisateur envoie un message
2. `useChat.ts` récupère `hermesKey` depuis `chrome.storage.local`
3. Si clé présente → appel `POST http://localhost:8642/v1/chat/completions` avec historique multi-tour et contexte client
4. Sinon → fallback sur `mockResponses.ts`
5. La réponse markdown est convertie en HTML par `hermes.ts`

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
- [x] Agent Hermès (Nous Research) branché — modèle gpt-5.4, abonnement Codex
- [x] Historique multi-tour dans la session (conversationHistory)
- [x] Fallback mock si gateway non démarrée
- [ ] Connexion réelle à l'API Penny Lane
- [ ] Authentification cabinet / multi-utilisateurs
- [ ] Persistance historique entre sessions (`chrome.storage.local`)
- [ ] Déploiement Chrome Web Store

---

## Prochaines étapes

1. **API Penny Lane** — brancher `src/lib/pennylane.ts` sur les vrais endpoints (clients, factures, soldes)
2. **Auth** — clé API par cabinet ou OAuth Penny Lane
3. **Historique persistant** — sauvegarder les conversations dans `chrome.storage.local`
4. **Tests terrain** — vrais utilisateurs experts-comptables
5. **Chrome Web Store** — packager et soumettre

---

## Ajouter une fonctionnalité

- Nouveau composant UI → `src/components/`
- Nouvelle logique métier → `src/hooks/` ou `src/lib/`
- Appel API Penny Lane → `src/lib/pennylane.ts` (à créer)
- Modifier le persona Hermès → `agents/expert-comptable/SOUL.md`
- Ne jamais modifier `public/manifest.json` pour des features UI — c'est uniquement pour les permissions Chrome
