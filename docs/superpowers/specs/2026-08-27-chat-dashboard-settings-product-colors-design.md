# DivinExpress — chat unifié, réglages simplifiés et couleurs produit

## Objectif

Relier le chatbot public à la messagerie du dashboard afin que le client, l’IA et l’administrateur partagent un seul fil de discussion. Simplifier ensuite la page Paramètres autour des réglages réellement actifs et permettre à chaque variante produit d’enregistrer un nom de couleur accompagné d’un code HEX fidèle.

## Périmètre

Le travail est livré en trois blocs successifs :

1. chat public et messagerie du dashboard connectés ;
2. couleurs HEX des variantes produit ;
3. page Paramètres simplifiée.

Les statistiques avancées, l’export de conversations, les notifications sonores, les pièces jointes et la création de comptes clients depuis le chat restent hors périmètre.

## 1. Chat public connecté au dashboard

### Identité du visiteur

Le navigateur crée un identifiant aléatoire opaque au premier usage et le conserve localement. Cet identifiant est transmis aux appels du chat et devient l’`external_id` d’une conversation de canal `web`. Il ne contient aucune donnée personnelle et ne doit jamais être séquentiel.

Le client peut fournir facultativement son e-mail dans le widget. L’API normalise l’adresse et tente de rattacher la conversation à un client existant. En l’absence de correspondance, la conversation reste une conversation visiteur ; aucun compte client n’est créé automatiquement.

### Flux d’un message

Lorsqu’un client envoie un message :

1. l’API valide le texte, la langue, l’identifiant visiteur et l’e-mail facultatif ;
2. elle crée ou retrouve la conversation `web` ;
3. elle enregistre le message entrant avec l’auteur `customer` ;
4. si l’IA est active, elle construit la réponse avec l’historique récent, puis enregistre la réponse avec l’auteur `ai` ;
5. elle renvoie le fil actualisé au widget.

Si un administrateur a désactivé l’IA, le message client est tout de même enregistré et visible dans le dashboard, mais aucune réponse automatique n’est générée. Le widget affiche alors une phrase sobre indiquant qu’un conseiller répondra prochainement.

### Réponses administrateur

La page Messages continue d’utiliser les conversations et messages existants. Une réponse envoyée depuis le dashboard est enregistrée avec l’auteur `admin`, désactive l’IA pour matérialiser la prise en charge humaine et devient récupérable par le widget public.

Le widget interroge périodiquement l’API pour les nouveaux messages tant qu’il est ouvert et effectue aussi une synchronisation à l’ouverture et après chaque envoi. La première version utilise un polling léger ; les WebSockets ou Server-Sent Events ne sont pas nécessaires maintenant.

L’administrateur conserve le contrôle « IA active ». Sa réactivation autorise de nouveau les réponses automatiques aux prochains messages, sans produire rétroactivement une réponse aux anciens messages.

### API publique et sécurité

L’API du chat expose :

- l’envoi d’un message et la réponse éventuelle de l’IA ;
- la lecture du fil associé à l’identifiant visiteur ;
- le rattachement facultatif d’un e-mail.

Les réponses ne renvoient que les champs utiles au widget. Les informations internes du client, les notes administrateur, les commandes et les identifiants d’administration ne sont jamais exposés.

La validation existante de longueur est conservée. Un rate limiting est appliqué par visiteur et adresse réseau lorsque celle-ci est disponible. Les identifiants invalides, les conversations inconnues et les charges mal formées reçoivent une erreur explicite sans divulgation technique.

### Expérience utilisateur

Le widget distingue visuellement les messages du client, de l’assistant et du conseiller. Il affiche les états d’envoi, l’erreur avec possibilité de réessayer, et restaure l’historique sur le même navigateur. Une demande d’e-mail facultative apparaît après le début de la conversation, sans bloquer le premier message.

Dans le dashboard, le canal est nommé « Chat du site », avec un badge distinct. Les nouveaux messages augmentent le compteur non lu existant. Ouvrir une conversation la marque comme lue.

## 2. Codes couleur des produits

### Modèle de données

Une colonne nullable `color_hex` est ajoutée à `product_variants`. Sa valeur canonique suit le format `#RRGGBB`. Le nom actuel de la couleur reste dans `color` et continue d’identifier la variante avec la taille.

Le code HEX est facultatif pour assurer la compatibilité avec les produits existants. Lorsqu’il manque, l’interface utilise la table de correspondance actuelle ou une teinte grise neutre.

### Administration

Chaque ligne de variante présente côte à côte :

- le nom de couleur ;
- un sélecteur visuel natif ;
- un champ HEX éditable et validé ;
- la taille et le stock.

Le sélecteur et le champ HEX restent synchronisés. La création, l’édition et les API de variantes enregistrent la même donnée. Une valeur invalide bloque l’enregistrement avec un message près du champ.

### Boutique

Les adaptateurs de catalogue exposent le code HEX avec la variante. Les pastilles de la fiche produit et de l’aperçu administrateur utilisent cette valeur. Le panier et le récapitulatif de commande continuent d’afficher le nom lisible ; une petite pastille peut l’accompagner lorsque le code est disponible.

## 3. Paramètres simplifiés

Le second menu vertical interne à la page Paramètres est supprimé. La page devient une seule vue responsive composée de sections courtes.

Sont conservés :

- informations de la boutique : nom, e-mail, téléphone et adresse ;
- fonctionnement commercial : devise, fuseau horaire, seuil de livraison gratuite et délai de retour ;
- chatbot : activation de l’IA, message de prise en charge humaine et identité affichée de l’assistant ;
- bouton unique d’enregistrement et indication claire des modifications non sauvegardées.

Sont retirés de l’interface actuelle tant qu’ils ne pilotent pas une fonction réelle :

- Paiements ;
- Notifications ;
- Équipe et permissions ;
- Sécurité ;
- Facturation ;
- configuration WhatsApp et synchronisation WhatsApp ;
- aperçu de marque redondant et couleur d’accent globale si elle n’est pas consommée par la boutique.

Les anciennes clés de réglage ne sont pas supprimées de la base lors de cette livraison, afin d’éviter une migration destructive. Elles cessent simplement d’être affichées et modifiées.

## Architecture et limites

La table de conversations existante reste la source unique pour WhatsApp, e-mail et chat web. Aucun état de conversation ne doit vivre uniquement dans le composant React. Le repository de messagerie porte les opérations de stockage ; les routes se limitent à l’authentification, la validation et l’orchestration.

Le dashboard n’expose aucune route privée au widget. Les réponses publiques sont filtrées par conversation `web` et par identifiant visiteur opaque. Le changement de mot de passe administrateur et les réglages sensibles restent hors de cette page simplifiée.

## Gestion des erreurs

- Une réponse IA indisponible ne doit pas perdre le message du client ; le fil est conservé et bascule vers la phrase de prise en charge.
- Une erreur d’enregistrement empêche d’afficher un faux message comme envoyé.
- Un code HEX invalide ne doit jamais atteindre la base.
- Une conversation supprimée ou un identifiant local corrompu déclenche la création d’une nouvelle identité visiteur sans bloquer le widget.
- Une erreur de chargement des réglages conserve un formulaire utilisable avec des valeurs sûres et affiche une erreur non ambiguë.

## Vérification

Les tests automatisés couvrent au minimum :

- création et reprise d’une conversation web par identifiant visiteur ;
- persistance des messages client, IA et administrateur dans le bon ordre ;
- absence de réponse IA pendant une prise en charge humaine ;
- visibilité de la conversation et du badge « Chat du site » dans le dashboard ;
- absence de fuite des données internes dans l’API publique ;
- validation, stockage et restitution de `color_hex` ;
- compatibilité des variantes existantes sans code HEX ;
- affichage et synchronisation du sélecteur de couleur ;
- disparition du menu interne et des sections fictives de Paramètres ;
- sauvegarde des seules clés encore présentées.

Une vérification manuelle responsive est effectuée sur mobile, tablette et ordinateur pour le widget, la messagerie, le formulaire produit et la page Paramètres. Le build de production, les tests ciblés, le contrôle de types et le lint des fichiers touchés doivent réussir avant déploiement.

## Critères d’acceptation

- Une discussion commencée sur le site apparaît dans Messages sans action manuelle.
- Les réponses IA et administrateur sont visibles des deux côtés dans le même ordre.
- La prise en charge humaine suspend réellement l’IA et sa réactivation fonctionne.
- Le visiteur retrouve son fil sur le même navigateur.
- Une couleur saisie avec son code HEX produit la bonne pastille sur la boutique.
- Paramètres ne contient plus de second menu ni de rubriques fictives.
- Les parcours WhatsApp existants ne régressent pas.
