# Paramètres fonctionnels du MVP — conception

## Objectif

Rendre chaque réglage visible du dashboard réellement utile. Une valeur enregistrée doit être consommée par le site public ou le checkout. Les fonctions qui nécessitent un service externe non encore configuré sont retirées de l'interface jusqu'à leur second lot.

## Périmètre

Le premier lot comprend quatre rubriques : Général, Livraison, Paiements et Sécurité.

### Général

L'administrateur peut modifier :

- le nom de la boutique ;
- l'adresse e-mail publique ;
- le numéro de téléphone public ;
- le pays par défaut ;
- la devise par défaut ;
- le fuseau horaire ;
- l'état ouvert ou fermé de la boutique.

Le nom, l'e-mail et le téléphone sont affichés dans le footer et sur la page Contact. Le pays, la devise et le fuseau horaire deviennent les valeurs par défaut des flux qui en ont besoin. Les réglages de ce lot ne réécrivent pas les contenus historiques d'une commande.

### Livraison

L'administrateur peut modifier :

- le seuil de livraison gratuite, exprimé dans la devise de la boutique ;
- le délai de retour : 14, 30 ou 60 jours.

Le checkout lit le seuil enregistré pour calculer et expliquer les frais de livraison. Les pages publiques liées à la livraison et aux retours affichent le seuil et le délai enregistrés. Les anciennes commandes conservent leurs montants historiques.

### Paiements

Les interrupteurs Europe et Afrique restent les contrôles de disponibilité par région. Une région désactivée ne peut pas démarrer un paiement. Une région activée n'est proposée que si son prestataire est aussi configuré côté serveur.

Le dashboard distingue clairement trois états : activé et configuré, activé mais prestataire non configuré, désactivé.

### Sécurité

Le propriétaire peut modifier l'e-mail de connexion et le mot de passe administrateur après confirmation du mot de passe actuel. Une modification réussie invalide les sessions existantes et renvoie vers la connexion.

## Fermeture de la boutique

Le réglage `shop_enabled` est enregistré côté serveur.

Quand la boutique est fermée :

- les pages commerciales publiques affichent un écran localisé « Boutique momentanément fermée » ;
- l'ajout au panier et le démarrage d'un paiement sont refusés côté serveur ;
- les pages légales restent accessibles ;
- la page de connexion et tout le dashboard restent accessibles afin de permettre la réouverture.

Le blocage serveur du checkout est obligatoire : masquer seulement les boutons côté navigateur ne suffit pas.

## Source de vérité et flux de données

La table `store_settings` reste la source de vérité. Une couche serveur typée expose les réglages publics avec leurs valeurs par défaut. L'API administrateur conserve l'accès complet aux quatre rubriques autorisées.

Les composants publics consomment uniquement les réglages nécessaires. Les secrets et les données de sécurité ne sont jamais exposés dans la réponse publique.

Après un enregistrement réussi, les pages concernées voient la nouvelle configuration sans redéploiement. Le mécanisme de lecture évite de conserver indéfiniment une ancienne valeur en cache.

## Interface du dashboard

La page Paramètres contient uniquement Général, Livraison, Paiements et Sécurité.

- Un état de chargement empêche l'affichage de fausses valeurs par défaut pendant la requête.
- Une erreur de chargement affiche un message et un bouton Réessayer.
- Enregistrer est désactivé tant qu'aucune valeur n'a changé ou pendant la requête.
- Annuler restaure les dernières valeurs reçues du serveur.
- Une réussite confirme l'enregistrement sans prétendre à une sauvegarde automatique.
- Une erreur conserve les modifications saisies et affiche une explication exploitable.

Les cartes Logo, Favicon, Notifications, WhatsApp API et les faux boutons de connexion aux prestataires sont retirés de ce premier lot.

## Validation et erreurs

- Le seuil de livraison gratuite doit être un montant positif ou nul avec au plus deux décimales.
- Les e-mails et mots de passe conservent les validations existantes.
- Les valeurs inconnues sont rejetées par le schéma serveur.
- Les routes publiques utilisent des valeurs par défaut sûres si aucun réglage n'a encore été enregistré.
- Une erreur de base de données ne doit jamais être présentée comme un enregistrement réussi.

## Tests

Les tests couvrent :

- lecture et écriture des réglages autorisés ;
- annulation réelle et états chargement/erreur de l'interface ;
- affichage du nom et des coordonnées publiques ;
- calcul du seuil de livraison gratuite ;
- affichage du délai de retour ;
- refus du checkout lorsque la boutique ou la région est désactivée ;
- maintien de l'accès au dashboard lorsque la boutique est fermée ;
- changement sécurisé des identifiants administrateur.

## Hors périmètre

Le stockage et le redimensionnement du logo et du favicon, l'envoi automatique de notifications, la connexion à WhatsApp Business et l'assistant de configuration des prestataires de paiement appartiennent au second lot. Aucun contrôle inactif correspondant ne reste visible dans le MVP.
