# Goal v2 — Personnalité Expert-Comptable (itération 2)

## Objectifs de cette itération

1. Hermes utilise le CGI sans qu'on lui en parle dans les questions
2. Réponses très vulgarisées — accessible à quelqu'un sans formation fiscale
3. Sources en bas, discrètes
4. Articles cités vérifiés : exacts et pertinents
5. Ton chaleureux et conseiller tout au long

---

## Definition of Done

### Autonomie RAG
- [x] A1 — Hermes consulte le CGI sans qu'on lui demande
- [x] A2 — Hermes cite les bons articles sans indication dans la question

### Vulgarisation
- [x] V1 — Aucun jargon non expliqué dans les réponses
- [x] V2 — La réponse commence par la réponse (pas par un article)
- [x] V3 — Au moins un exemple concret ou chiffré par réponse

### Format
- [x] F1 — Sources en bas, format discret (pas en titre)
- [x] F2 — Pas de section "Article applicable" en haut

### Exactitude
- [x] E1 — Les articles cités existent et sont pertinents pour la question
- [x] E2 — Aucun article inventé ou mal référencé (239 bis AA absent du RAG mais article réel)

### Ton
- [x] T1 — Chaleureux, pas robotique
- [x] T2 — Conseiller : oriente, ne liste pas juste des règles

---

## Scénarios de test (sans mention du CGI)

| # | Question | Articles attendus | Ce qu'on vérifie |
|---|---|---|---|
| T1 | "Mes travaux de peinture, c'est quelle TVA ?" | 279-0 bis | Vulgarisation + source en bas |
| T2 | "J'ai une micro-entreprise, je dois faire quoi pour la TVA ?" | 293 B | Franchise expliquée simplement |
| T3 | "Mon fils travaille dans ma boutique, je peux le payer ?" | 154 | Déductibilité conjoint/enfant |
| T4 | "Je vends mon appartement, je paie des impôts ?" | 150 U | Plus-value immo vulgarisée |
| T5 | "C'est quoi la différence entre SARL et SAS pour les impôts ?" | 206, 8 | Pas trop technique, bien vulgarisé |

---

## Processus

1. Tester les 5 scénarios sans mentionner le CGI
2. Vérifier chaque article cité dans les fichiers RAG
3. Cocher les cases DoD
4. Si échec → identifier SOUL.md (ton/format) ou SKILL.md (comportement RAG)
5. Itérer jusqu'à toutes les cases cochées
