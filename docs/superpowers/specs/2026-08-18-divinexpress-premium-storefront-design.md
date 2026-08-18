# DivinExpress — refonte premium de la boutique publique

**Date :** 18 août 2026  
**Statut :** design validé en conversation, en attente de revue du document  
**Périmètre :** boutique publique uniquement ; le dashboard administrateur est exclu

## Contexte

DivinExpress dispose déjà d’une boutique e-commerce complète : accueil, catalogue filtrable, recherche, favoris, fiches produit, panier, commande invitée, paiements, pages d’aide et expérience bilingue FR/EN. Les fonctionnalités et les données sont avancées, mais la finition visuelle varie encore selon les pages. Certaines zones sont déjà soignées tandis que d’autres restent utilitaires, génériques ou insuffisamment hiérarchisées.

La refonte doit donner l’impression d’un produit unique et intentionnel sans reconstruire les fondations fonctionnelles existantes. Elle doit également préserver les changements locaux actuellement présents dans le dépôt.

## Objectif

Transformer toute la boutique publique en une expérience de commerce « hybride premium » : une base luxueuse, éditoriale et sobre, ponctuée de compositions plus expressives et d’animations mesurées.

La réussite signifie :

- une identité immédiatement reconnaissable et cohérente sur toutes les routes publiques ;
- une hiérarchie visuelle claire qui met les produits et les actions principales au premier plan ;
- un rendu convaincant du mobile au grand écran ;
- des parcours d’achat plus rassurants et plus faciles à comprendre ;
- aucune régression sur l’i18n, les devises, le panier, les favoris, les promotions ou le checkout ;
- des interactions accessibles, notamment lorsque l’utilisateur réduit les animations.

## Hors périmètre

- Refonte du dashboard administrateur.
- Modification du modèle de données, des routes API ou des fournisseurs de paiement.
- Remplacement complet du catalogue ou intégration des photos encore inutilisées.
- Invention des informations légales manquantes ou du futur domaine de production.
- Changement des règles commerciales, des frais de livraison ou des promotions.

Ces sujets pourront être traités séparément. Les placeholders légaux et le domaine SEO devront néanmoins être signalés dans le bilan de préparation à la production.

## Direction artistique

### Personnalité

La boutique doit évoquer un concept store contemporain : calme, précis et désirable, sans pasticher une maison de luxe traditionnelle. Le système visuel privilégie l’espace, les images, la typographie et les contrastes plutôt que les effets décoratifs.

### Palette

- Base claire : blanc cassé et surfaces chaudes très légères, plutôt qu’une succession de blancs identiques.
- Texte : noir profond pour la lecture et gris chauds pour les informations secondaires.
- Sections fortes : noir ou charbon pour créer quelques ruptures éditoriales.
- Couleur signature : une seule couleur d’accent, définie à partir de l’identité DivinExpress et utilisée avec parcimonie pour les actions, états actifs et détails importants.
- Couleurs sémantiques : succès, avertissement et erreur réservés à leur fonction.

La couleur d’accent ne doit pas devenir une couleur de remplissage omniprésente. Les surfaces, les textes essentiels et les longues zones de lecture restent neutres.

### Typographie et rythme

- Titres éditoriaux expressifs, associés à une sans-serif nette pour l’interface et le commerce.
- Échelle typographique cohérente entre accueil, catalogue, produits et pages secondaires.
- Largeurs de lecture contrôlées et espaces verticaux généreux.
- Rythme plus compact dans les interfaces transactionnelles, sans perdre la sensation premium.

### Formes et profondeur

- Rayons, bordures et ombres normalisés par familles de composants.
- Ombres discrètes ; la profondeur vient surtout des niveaux de surface et des superpositions utiles.
- Pas d’accumulation de pilules, dégradés, halos ou effets de verre.
- Icônes cohérentes en poids et en taille.

## Système de composants

La refonte s’appuie sur les composants existants et ajoute une couche de primitives partagées lorsque cela réduit les divergences. Les composants suivants doivent partager des règles communes :

- conteneurs et sections éditoriales ;
- titres, surtitres et textes d’accompagnement ;
- boutons principaux, secondaires, textuels et iconiques ;
- champs, sélecteurs, messages d’aide et erreurs ;
- cartes produit, badges, prix et actions rapides ;
- panneaux, modales, tiroirs et accordéons ;
- états vides, erreurs, chargements et confirmations ;
- informations de confiance liées à la livraison et au paiement.

Les primitives restent suffisamment souples pour les compositions éditoriales, mais évitent que chaque page réinvente ses espacements, couleurs ou interactions.

## Parcours et pages

### 1. Navigation et cadre global

Le header doit être plus équilibré, lisible et stable. La navigation desktop conserve les catégories et sous-catégories, avec des menus plus soignés et une indication d’état claire. Sur mobile, le menu, la recherche, les favoris et le panier doivent rester immédiatement accessibles sans comprimer le logo.

Le footer est redessiné dans la même direction, avec une hiérarchie nette entre marque, navigation, réassurance, moyens de paiement, langue et devise. Sa disposition mobile est verticale et met le logo en valeur. Les liens sociaux ne doivent pas utiliser de destinations factices dans la version destinée à la production.

### 2. Accueil

- Hero immersif, lisible sur toutes les images, avec un message principal et des actions clairement hiérarchisées.
- Transitions de carousel lentes et maîtrisées, contrôles accessibles et comportement réduit lorsque demandé par le système.
- Collections conçues comme des entrées de lookbook plutôt que comme de simples tuiles.
- Nouveautés et produits mis en scène avec des cartes plus sobres et une navigation fluide.
- Promotion dynamique conservée, mais présentée comme une rupture éditoriale crédible.
- FAQ harmonisée avec le système de sections et d’accordéons.
- Alternance de surfaces claires et sombres pour structurer la page sans multiplier les couleurs.

### 3. Catalogue, recherche et favoris

- Barre de contexte claire : titre, nombre de résultats, filtres actifs et tri.
- Filtres utilisables sur desktop et dans un panneau mobile dédié.
- Grille stable avec cartes produit homogènes, images prioritaires et informations secondaires discrètes.
- États sans résultat et favoris vides utiles, élégants et accompagnés d’une prochaine action.
- Conservation des contrats d’URL existants pour les catégories et sous-catégories.

### 4. Fiche produit

- Galerie plus immersive, mais rapide et exploitable au clavier.
- Nom, prix, variantes, tailles et disponibilité clairement hiérarchisés.
- Sélection des variantes compréhensible, y compris pour les combinaisons indisponibles.
- Action d’ajout au panier dominante sans masquer les informations essentielles.
- Livraison, retours, guide des tailles et moyens de paiement regroupés dans une zone de réassurance concise.
- Recommandations cohérentes avec les cartes du catalogue.

### 5. Panier et mini-panier

- Tiroir plus structuré : produits, quantités, variantes, sous-total et progression de livraison.
- Modifications de quantité et suppression avec retours immédiats et accessibles.
- Page panier plus respirante sur desktop et compacte sur mobile.
- Action de commande clairement prioritaire ; aucune fausse urgence.

### 6. Checkout

- Étapes livraison, paiement et confirmation visuellement cohérentes.
- Résumé de commande persistant sur grand écran et facilement consultable sur mobile.
- Formulaires plus lisibles, avec labels permanents, erreurs proches des champs et états de chargement explicites.
- Sélection des pays, régions et adresses conforme aux règles fonctionnelles existantes.
- Moyens de paiement et messages de sécurité présentés sans surcharge graphique.
- Confirmation de commande claire, rassurante et orientée vers la suite du parcours.

### 7. Pages secondaires

Contact, aide, livraison et retours, guide des tailles, à propos, confidentialité, mentions légales et autres contenus éditoriaux utilisent une même structure : introduction courte, navigation interne si nécessaire, blocs de contenu lisibles et appels à l’action mesurés.

Les pages légales restent sobres. Les informations d’entreprise manquantes ne sont pas inventées et demeurent identifiées comme prérequis de production.

### 8. États système

Les pages 404, erreurs, chargements, absence de données et confirmations doivent paraître appartenir au même produit. Chaque état explique la situation, propose une action utile et évite le jargon technique.

## Mouvement et interactions

- Apparitions au défilement réservées aux grandes sections éditoriales.
- Transitions courtes sur les cartes, menus, boutons, filtres et panneaux.
- Effets d’image limités à un zoom ou un changement de vue subtil.
- Aucun mouvement qui ralentit l’achat ou masque une information.
- Respect systématique de `prefers-reduced-motion` : contenu immédiatement visible, transitions supprimées ou fortement réduites.
- États hover toujours accompagnés d’un état clavier ou tactile pertinent.

## Responsive et accessibilité

La conception est vérifiée au minimum aux largeurs mobile étroite, mobile large, tablette, desktop et grand écran. Les points de rupture répondent au contenu plutôt qu’à un appareil particulier.

Exigences :

- navigation complète au clavier ;
- focus visible et cohérent ;
- contrastes suffisants pour tout texte ou contrôle essentiel ;
- tailles tactiles adaptées ;
- libellés accessibles sur les boutons iconiques ;
- annonces appropriées pour les mises à jour du panier et les erreurs de formulaire ;
- ordre de lecture logique dans les tiroirs et modales ;
- images avec alternatives pertinentes ou décoratives selon leur rôle.

## Données et comportement

La refonte ne change pas les contrats de données. Les composants continuent à utiliser :

- `next-intl` pour le français et l’anglais ;
- les contextes existants pour panier, favoris, devise et checkout ;
- les produits et promotions provenant des repositories actuels ;
- les routes et paramètres d’URL déjà utilisés par la navigation ;
- les mécanismes de paiement et de commande existants.

Les nouveaux textes visibles doivent être ajoutés aux dictionnaires FR et EN. Aucun texte métier ne doit être dupliqué en dur si une clé de traduction est appropriée.

## Gestion des erreurs

- Les erreurs réseau ou serveur restent visibles jusqu’à une action de l’utilisateur ou une nouvelle tentative réussie.
- Les boutons asynchrones exposent un état occupé et empêchent les doubles soumissions.
- Les erreurs de formulaire indiquent précisément quoi corriger sans effacer les valeurs saisies.
- Les images manquantes utilisent un fallback cohérent qui conserve les dimensions de la mise en page.
- Les composants dépendant de données optionnelles disparaissent proprement ou affichent un état honnête ; ils n’inventent pas de contenu promotionnel.

## Stratégie d’implémentation

La livraison se fait par vagues afin de réduire les régressions :

1. Fondations visuelles et primitives partagées.
2. Header, navigation, footer et cadre global.
3. Accueil complet.
4. Catalogue, recherche, favoris et cartes produit.
5. Fiche produit, panier et mini-panier.
6. Livraison, paiement et confirmation.
7. Pages secondaires et états système.
8. Passe globale responsive, accessibilité, performance et cohérence.

Chaque vague doit laisser le projet utilisable et être vérifiée avant la suivante. Les fichiers déjà modifiés localement sont inspectés avant édition et leurs changements sont préservés.

## Vérification

La validation combine :

- tests unitaires et composants existants ;
- nouveaux tests pour les primitives et comportements modifiés ;
- vérification TypeScript ;
- lint ;
- build Next.js de production ;
- contrôle visuel des routes principales en FR et EN ;
- contrôle mobile, tablette et desktop ;
- navigation clavier et mode mouvement réduit ;
- vérification des parcours panier → livraison → paiement → confirmation.

Les problèmes préexistants sont distingués des régressions introduites. Aucun résultat n’est déclaré valide sans sortie de commande ou contrôle visuel récent.

## Critères d’acceptation

- Toutes les routes publiques utilisent le nouveau langage visuel.
- Le dashboard n’est pas modifié par la refonte.
- Header et footer sont cohérents et pleinement utilisables sur mobile et desktop.
- Accueil, catalogue et produit possèdent une hiérarchie éditoriale claire.
- Panier et checkout conservent leurs comportements et gagnent en lisibilité.
- Les états vides, erreurs et chargements sont traités.
- FR/EN, EUR/GBP, favoris, panier et promotions fonctionnent toujours.
- Le mode mouvement réduit ne cache jamais de contenu.
- Les tests ciblés, le lint, la vérification TypeScript et le build sont exécutés avec leurs résultats consignés.
- Les placeholders légaux et SEO restants sont explicitement listés avant une mise en production.
