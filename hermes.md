
# Ce que je veux construire - Agents IA et Workflows

## Vision produit

Je veux construire une suite d'agents IA metier, avec une personnalite forte, une memoire/persona travaillée, une capacite RAG fiable et des workflows connectes aux outils des entreprises.

L'objectif n'est pas de construire un simple chatbot.

L'objectif est de construire des agents qui :

- comprennent un contexte metier ;
- parlent avec une voix agreable et professionnelle ;
- cherchent dans les documents de l'entreprise ;
- repondent avec prudence et precision ;
- savent quand demander une precision ;
- savent quand escalader ;
- peuvent preparer ou declencher des actions ;
- sont livrés avec une interface simple et utilisable.

## Idee Hermes

Je veux commencer par travailler la personnalite avec Hermes.

L'idee :

1. creer un agent mere avec une vraie "soul" ;
2. travailler son ton, son style, ses reflexes et sa maniere d'aider ;
3. sauvegarder cette base sous forme de fichiers propres ;
4. decliner ensuite cette personnalite en plusieurs agents RAG metier.

Hermes peut servir de laboratoire :

- pour tester la personnalite ;
- pour travailler la memoire ;
- pour observer ce qui rend l'agent vivant ou plat ;
- pour faire evoluer le prompt systeme ;
- pour creer des personas reutilisables.

Point important :

> Hermes peut etre l'atelier de personnalite, mais il ne faut pas enfermer toute la valeur dans la memoire opaque d'un seul agent.

Il faut extraire les bonnes versions dans des fichiers versionnes.

## Persona kit

Je veux construire un kit de personas reutilisables.

Structure possible :

```text
agent-personas/
  base/
    principles.md
    tone.md
    uncertainty.md
    escalation.md
    safety.md
  sav/
    system.md
    examples.md
    test-questions.md
  software-assistant/
    system.md
    examples.md
    test-questions.md
  finance-admin/
    system.md
    examples.md
    test-questions.md
  internal-assistant/
    system.md
    examples.md
    test-questions.md
```

## Ame commune des agents

Tous les agents doivent partager une base commune :

- clair ;
- chaleureux ;
- intelligent ;
- fiable ;
- jamais robotique ;
- oriente action ;
- honnete quand l'information manque ;
- capable d'escalader ;
- concis sans etre sec ;
- professionnel sans etre froid.

Puis chaque agent a sa variante.

## Declinaisons d'agents

### Agent SAV

Ton :

- empathique ;
- rassurant ;
- precis ;
- calme face aux clients enerves ;
- capable de proteger l'entreprise sans frustrer le client.

Fonctions :

- repondre aux questions courantes ;
- chercher dans FAQ, CGV, fiches produit, procedures ;
- preparer une reponse support ;
- detecter les cas sensibles ;
- escalader a un humain.

### Assistant logiciel

Ton :

- pedagogique ;
- patient ;
- clair ;
- etape par etape.

Fonctions :

- expliquer une fonctionnalite ;
- guider un utilisateur ;
- resoudre les problemes simples ;
- chercher dans la documentation ;
- preparer un ticket technique.

### Agent finance/admin

Ton :

- sobre ;
- rigoureux ;
- prudent ;
- structure ;
- tracable.

Fonctions :

- relances clients ;
- traitement de factures ;
- extraction de documents ;
- controle de coherence ;
- synthese administrative ;
- preparation de mails.

### Assistant interne

Ton :

- efficace ;
- contextuel ;
- moins formel ;
- oriente execution.

Fonctions :

- repondre aux questions internes ;
- retrouver des procedures ;
- aider a l'onboarding ;
- generer des modeles ;
- lancer des workflows internes.

## Architecture cible

Architecture generale :

```text
Documents client
-> parsing propre
-> chunking intelligent
-> embeddings
-> base vectorielle
-> retrieval
-> reranking eventuel
-> prompt systeme/persona
-> reponse avec sources
-> action eventuelle
-> logs + feedback
```

## Chunking

Le chunking doit etre travaille serieusement.

Erreur a eviter :

> decouper tous les 1000 tokens sans respecter la structure.

Le bon chunk doit etre comprehensible seul.

Pour des documents juridiques, SAV, logiciels ou procedures, il faut decouper par :

- titre ;
- section ;
- sous-section ;
- article ;
- question/reponse ;
- procedure complete ;
- page courte de documentation.

Chaque chunk doit contenir des metadonnees :

```json
{
  "source": "CGV",
  "section": "Retours et remboursements",
  "date": "2026-05",
  "type": "procedure"
}
```

## Evaluation

Je veux une boucle d'amelioration.

Pour chaque agent :

1. creer 20 a 50 questions test ;
2. definir les comportements attendus ;
3. lancer les tests ;
4. reperer les reponses fausses, froides, trop longues ou mal sourcees ;
5. modifier le prompt ou le chunking ;
6. relancer ;
7. garder un changelog.

Claude Code peut servir a iterer sur :

- le prompt systeme ;
- les exemples ;
- les tests ;
- les criteres de qualite ;
- les reponses types ;
- le style.

## Ordre de construction recommande

Pour eviter de tout melanger, l'ordre logique est :

1. personnalite/persona avec Hermes ;
2. extraction des personas dans des fichiers propres ;
3. RAG simple et fiable ;
4. interface de test ;
5. evaluations automatiques ;
6. workflows/actions ;
7. memoire persistante ;
8. agents plus autonomes.

## Stack possible

Options techniques possibles :

- Hermes pour le laboratoire de personnalite et memoire ;
- Claude API pour la qualite des reponses ;
- LangChain ou LlamaIndex pour prototyper ;
- Supabase Vector / pgvector ou Qdrant pour la base vectorielle ;
- Trigger.dev pour les workflows ;
- Next.js ou app web simple pour l'interface ;
- Pennylane, Gmail, CRM, outils support ou Notion comme integrations.

## Livrable client ideal

Un livrable client ne doit pas etre un script.

Il doit etre :

- une interface simple ;
- un agent avec un persona clair ;
- une base documentaire connectee ;
- des sources ou traces ;
- des regles d'escalade ;
- des workflows optionnels ;
- un minimum de documentation ;
- une maintenance possible.

## Produit final imagine

Au fil des missions, je veux construire une librairie de composants reutilisables :

- personas ;
- prompts ;
- workflows ;
- connecteurs ;
- schemas de donnees ;
- interfaces ;
- scripts d'ingestion ;
- tests d'evaluation.

Le but :

> transformer progressivement du freelance sur mesure en offres packagées, puis peut-etre en produit.

## Notes liees

- [[Life Choice Suite]]
- [[Agents RAG - Offre Commerciale]]
- [[Proposition-prestataire-Caderas]]
