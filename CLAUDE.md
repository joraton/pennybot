# Hermes Project

## Vision

Construire une suite d'agents IA métier avec une personnalité forte, une mémoire travaillée, un RAG fiable, et des workflows connectés aux outils des entreprises. L'objectif final : passer du freelance sur mesure à des offres packagées.

Voir `hermes.md` pour la vision complète.

---

## Stack technique

- **Hermes Agent** (Nous Research) — le runtime des agents. Installé dans `~/.hermes/`. Lance avec `hermes` en CLI.
- **Modèle actuel** : gpt-5.4 via abonnement ChatGPT (openai-codex). Zéro coût API pour l'instant.
- **RAG** : fichiers markdown dans `~/.hermes/rag/` + recherche ripgrep native dans Hermes (pas encore de vector DB).
- **viewer.py** — interface web locale pour observer les sessions Hermes en direct (port 7842).

---

## Fichiers clés Hermes

| Fichier | Rôle |
|---|---|
| `~/.hermes/SOUL.md` | Personnalité de base commune à tous les agents |
| `~/.hermes/config.yaml` | Config Hermes (modèle, mémoire, délégation...) |
| `~/.hermes/skills/` | 89 skills bundlés + skills métier custom dans `metier/` |
| `~/.hermes/memories/` | Mémoire persistante apprise au fil des conversations |
| `~/.hermes/rag/` | Base documentaire pour le RAG (vide — à alimenter) |
| `~/.hermes/state.db` | Base SQLite des sessions et messages |

---

## Structure du projet

```
agents/
  expert-comptable/
    SOUL.md          — personnalité de l'agent (lancer avec --soul)
    skill/
      SKILL.md       — comportement RAG + citation CGI (installé dans Hermes)

viewer.py            — interface web : sessions + piliers (port 7842)
hermes.md            — vision produit complète
example-skill.md     — exemple de skill Hermes pour référence
```

---

## Comment lancer un agent

**Agent de base (personnalité commune) :**
```bash
hermes
```

**Agent expert-comptable :**
```bash
# Pas encore supporté nativement avec --soul, à scripter
# En attendant : copier le SOUL.md de l'agent dans ~/.hermes/SOUL.md
cp agents/expert-comptable/SOUL.md ~/.hermes/SOUL.md && hermes
```

**Interface de visualisation :**
```bash
python3 viewer.py
# → http://localhost:7842
```

**Envoyer un message sans terminal interactif :**
```bash
hermes -z "ton message ici"
```

---

## Comment fonctionne Hermes

1. **SOUL.md** est chargé à chaque message — modifiable en live, pas de redémarrage.
2. **Skills** : Hermes reçoit la liste de tous les skills dans son system prompt. Le LLM décide lequel charger selon la pertinence sémantique du `name` + `description` dans le frontmatter.
3. **Mémoire** : faits persistants appris entre les sessions (`memory_enabled: true`).
4. **Délégation** : Hermes peut spawner des sous-agents pour des tâches longues (`delegate_task`).
5. **RAG natif** : Hermes utilise `search_files` + ripgrep pour chercher dans les fichiers locaux.

---

## Agent expert-comptable — état actuel

- [x] SOUL.md rédigé — personnalité rigoureuse, cite le CGI, disclaimer systématique
- [x] SKILL.md rédigé + installé dans `~/.hermes/skills/metier/expert-comptable/`
- [x] Dossier RAG créé : `~/.hermes/rag/cgi/`
- [x] CGI extrait en markdown : ~1800 articles dans `~/.hermes/rag/cgi/` via `scripts/extract_cgi.py`
- [x] Tests goal v1 + goal v2 passés — autonomie RAG, vulgarisation, ton chaleureux, sources en bas
- [x] WhatsApp connecté — gateway Hermes + Baileys, autorisé via LID (`~/.hermes/.env`)
- [ ] Interface client
- [ ] Tests terrain (vrais utilisateurs)

---

## WhatsApp — config

Le gateway lit `~/.hermes/.env`. Variables clés :
```
WHATSAPP_ENABLED=true
WHATSAPP_MODE=self-chat
WHATSAPP_ALLOWED_USERS=<LID>@lid   # format LID, pas le numéro de téléphone
```

Pour trouver son LID : lancer `hermes gateway`, envoyer un message, lire le WARNING dans les logs.

---

## Extraction CGI

Le PDF du CGI (~15 Mo) n'est pas dans le repo. Pour régénérer le RAG :
```bash
# Placer le PDF dans le dossier du projet, puis :
python3 scripts/extract_cgi.py
# → 1800 articles dans ~/.hermes/rag/cgi/
```

---

## Prochaines étapes (ordre logique)

1. **Interface client** simple pour livrer l'agent (web ou WhatsApp)
2. **Tests terrain** sur des cas réels
3. **Décliner** le même pattern sur d'autres agents métier (SAV, finance-admin, assistant interne)

---

## Personas métier prévus

| Agent | Ton | Fonctions clés |
|---|---|---|
| **expert-comptable** | Rigoureux, précis, prudent | CGI, TVA, IS, IR, déclarations |
| **SAV** | Empathique, rassurant, calme | FAQ, CGV, escalade humain |
| **assistant-logiciel** | Pédagogue, patient, step-by-step | Doc, tickets, onboarding |
| **finance-admin** | Sobre, structuré, traçable | Relances, factures, synthèses |
| **assistant-interne** | Efficace, contextuel, informel | Procédures, templates, workflows |

---

## Pattern de création d'un agent

Pour chaque nouvel agent :
```
agents/<nom>/
  SOUL.md     — personnalité spécifique (hérite de la base commune)
  skill/
    SKILL.md  — comportement, RAG, format réponse, limites, exemples
```
Puis installer le skill :
```bash
cp agents/<nom>/skill/SKILL.md ~/.hermes/skills/metier/<nom>/SKILL.md
```

---

## Chunking RAG (règle importante)

Ne pas découper par token count. Découper par structure sémantique :
- Un article = un chunk
- Métadonnées obligatoires : `source`, `section`, `article`, `date`, `type`

Exemple de header de fichier markdown :
```
# Article 44 sexies — Exonération des entreprises nouvelles
Source: CGI | Livre: I | Titre: II | Mise à jour: 2024 | Type: exonération
```
