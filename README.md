##Darri_Immo – ImmoPlusRN
DarriImmo est une application mobile immobilière multiplateforme développée avec Expo et React Native.

L'application permet aux utilisateurs de consulter des annonces immobilières, de rechercher et filtrer des biens, d'ajouter des annonces aux favoris, de publier leurs propres annonces, de contacter les vendeurs, d'échanger des messages et de gérer leur profil.

Le projet est configuré pour fonctionner sur Android, iOS et Web. Le nom actuel de l'application est ImmoPlusRN, tandis que le nom affiché aux utilisateurs dans les interfaces d'authentification est DariImmo.
Objectifs du projet
###Les principaux objectifs de DarriImmo sont :
- Proposer une expérience simple et intuitive de recherche immobilière.
- Aider les utilisateurs à trouver des biens immobiliers à vendre ou à louer.
- Permettre aux utilisateurs de publier et de gérer leurs annonces immobilières.
- Faciliter la communication directe entre les acheteurs et les propriétaires.
- Conserver les informations importantes du compte et les favoris entre les sessions.
- Garantir une interface cohérente sur les plateformes mobiles et Web.
##Fonctionnalités principales
- Inscription et connexion avec une adresse e-mail et un mot de passe via Firebase Authentication.
- Vérification de l'adresse e-mail et réinitialisation du mot de passe.
- Gestion des sessions authentifiées avec React Native AsyncStorage.
- Affichage en temps réel des annonces immobilières depuis Cloud Firestore.
- Recherche par titre, ville ou adresse.
- Filtres pour afficher toutes les annonces, les ventes ou les locations.
- Consultation des détails d'un bien avec galerie de photos, équipements, prix, localisation et informations du vendeur.
- Ajout et suppression des annonces dans les favoris, stockés localement pour chaque utilisateur authentifié.
- Publication d'annonces avec 1 à 8 photos.
- Redimensionnement et téléchargement des photos vers Cloudinary.
- Sélection de la localisation d'un bien sur une carte OpenStreetMap/Leaflet ou utilisation de la position actuelle de l'appareil.
- Création et réutilisation des conversations entre un acheteur et le propriétaire d'une annonce.
- Messagerie privée en temps réel avec compteurs de messages non lus.
- Appel téléphonique et copie du numéro de téléphone depuis une annonce.
- Gestion du profil utilisateur : photo, nom et numéro de téléphone.
- Paramètres du compte et réinitialisation du mot de passe.
- Barre de navigation inférieure adaptative.
- Gestion des états de chargement, des listes vides, des erreurs, de l'authentification obligatoire et des permissions refusées.
Remarque : Google Sign-In est présent sous forme de module provisoire, mais n'est pas encore entièrement activé dans les interfaces de connexion et d'inscription.

##Technologies et bibliothèques utilisées
Application mobile
- React 19.2.3
- React Native 0.86.3
- Expo SDK 57
- Expo Router 57 pour la navigation basée sur les fichiers
- TypeScript 6
- React Native Web
##Backend et services externes
- Firebase Authentication
- Cloud Firestore
- Initialisation de Firebase Storage
- Cloudinary pour le téléchargement des images sans authentification
- OpenStreetMap et Leaflet intégrés via WebView
- Expo Location
##Interface utilisateur et API des appareils
- @expo/vector-icons
- React Native Safe Area Context
- React Native WebView
- Expo Image
- Expo Image Picker
- Expo Image Manipulator
- Expo Clipboard
- Expo Linking
- React Native Gesture Handler
- React Native Reanimated
- React Native Worklets
- AsyncStorage
Outils de développement
- ESLint 9 avec la configuration Expo
- TypeScript en mode strict
- npm
- Expo CLI
Architecture du projet
App_Immo/
|-- assets/
|   |-- images/
|   `-- expo.icon/
|-- scripts/
|   `-- reset-project.js
|-- src/
|   |-- app/                  # Écrans et routes Expo Router
|   |   |-- chat/[id].tsx
|   |   `-- listing/[id].tsx
|   |-- components/           # Composants réutilisables
|   |-- constants/            # Équipements et valeurs du thème
|   |-- context/              # Contextes d'authentification et de vérification
|   |-- hooks/                # Hooks du thème et du mode de couleur
|   |-- services/             # Logique Firebase, Cloudinary, favoris et messagerie
|   |-- utils/                # Fonctions utilitaires pour annonces et conversations
|   |-- firebaseConfig.ts     # Configuration Firebase
|   `-- global.css
|-- app.json                  # Configuration Expo
|-- package.json
|-- tsconfig.json
|-- eslint.config.js
|-- .env.example
`-- FIRESTORE_MESSAGING_RULES.md


Prérequis d'installation
##Avant d'installer le projet, il faut disposer de :
- Node.js compatible avec Expo SDK 57.
- npm.
- Un projet Firebase avec l'authentification par e-mail et mot de passe activée.
- Une clé API Firebase Web.
- Un compte Cloudinary ou un accès à un preset de téléchargement non authentifié.
- Android Studio et un émulateur Android, Xcode et un simulateur iOS, ou un navigateur Web récent.
- Expo Go ou un development build pour les tests sur appareil physique.
Google Sign-In natif n'est pas nécessaire pour exécuter la version actuelle, car cette fonctionnalité n'est pas activée dans les écrans de connexion existants.
Installation du projet
1. Cloner le dépôt GitHub
git clone https://github.com/manellt/App_Immo.git
cd App_Immo


2. Installer les dépendances
npm install


3. Configurer Firebase
Copier le fichier d'exemple des variables d'environnement :
cp .env.example .env


Sous Windows PowerShell :
Copy-Item .env.example .env


Configurer la clé API Firebase :
EXPO_PUBLIC_FIREBASE_API_KEY=votre_cle_api_firebase


Les autres paramètres Firebase sont déjà définis dans src/firebaseConfig.ts pour le projet configuré dariimmo-app-6b7ec.

L'authentification Firebase par e-mail et mot de passe doit être activée pour permettre l'inscription et la connexion.
4. Configurer Firestore
Utiliser les règles présentes dans FIRESTORE_MESSAGING_RULES.md comme base pour configurer les règles Firebase déployées.

La création du fichier ou sa consultation en local ne signifie pas que les règles sont automatiquement déployées sur Firebase.

L'application utilise les collections Firestore suivantes :
- profiles
- listings
- conversations
- conversations/{conversationId}/messages
5. Configurer Cloudinary
Le service de téléchargement des photos des annonces utilise les paramètres suivants :
- Nom du Cloud : qqs1qnzj
- Upload Preset : dariimmo_unsigned
- Dossier de destination : dariimmo/listings
Si ces paramètres ne correspondent pas à votre compte Cloudinary, il faut les remplacer dans src/services/cloudinary.ts par un preset de téléchargement non authentifié compatible.
Exécution de l'application
Démarrer le serveur de développement Expo :
npm start


Exécuter sur Android :
npm run android


Exécuter sur iOS :
npm run ios


Exécuter sur le navigateur Web :
npm run web


Il est également possible de démarrer Expo et d'utiliser le QR code affiché, un émulateur ou l'URL Web.
Commandes utiles
npm run lint
npx tsc --noEmit
npx expo-doctor
npx expo install --fix


Le script reset-project permet de réinitialiser le contenu du projet de démarrage :
npm run reset-project


Attention : cette commande peut modifier les fichiers du projet. Il faut l'utiliser avec précaution.
Écrans principaux
Écran	Route	Fonctionnalité
##Accueil	/	Affiche les annonces en temps réel, la recherche et les filtres vente/location.
Explorer	/explore	Affiche la documentation et les exemples du projet Expo de démarrage.
Connexion	/login	Permet de connecter un utilisateur et de gérer la vérification et la réinitialisation du mot de passe.
Inscription	/register	Permet de créer un compte et d'envoyer un e-mail de vérification.
Profil	/profil	Affiche les informations du compte et permet de gérer la photo du profil.
Paramètres	/parametres	Permet de modifier le nom et le numéro de téléphone et de demander une réinitialisation du mot de passe.
Favoris	/favoris	Affiche les annonces enregistrées localement pour l'utilisateur connecté.
Ajouter une annonce	/ajouter-annonce	Permet de publier un bien avec ses photos, ses caractéristiques, ses équipements et sa localisation.
Mes annonces	/mes-annonces	Affiche et permet de supprimer les annonces de l'utilisateur connecté.
Détails d'une annonce	/listing/[id]	Affiche les photos, le prix, les caractéristiques, la localisation et les coordonnées du vendeur.
Carte complète	/carte	Affiche la localisation des annonces sur OpenStreetMap et permet d'ouvrir une application de navigation externe.
Messages	/messages	Affiche les conversations en temps réel et le nombre de messages non lus.
Discussion	/chat/[id]	Permet d'afficher et d'envoyer des messages dans une conversation.

Structure de navigation
L'application utilise Expo Router, un système de navigation basé sur les fichiers.

Les écrans présents dans src/app deviennent automatiquement des routes. Le fichier _layout.tsx définit la navigation principale avec un Stack Expo et des en-têtes natifs désactivés.

Les écrans de connexion et d'inscription sont présentés sous forme de fenêtres modales.

Les routes dynamiques utilisent des paramètres :
/listing/[id]
/chat/[id]


Une barre de navigation inférieure personnalisée permet d'accéder aux sections suivantes :
- Accueil
- Favoris
- Ajouter une annonce
- Messages
- Profil
La publication des annonces et l'accès aux espaces personnels nécessitent une authentification lorsque cela est nécessaire.

La barre de navigation affiche également un indicateur du nombre total de messages non lus.
Intégration Backend et services externes
Firebase
Firebase est initialisé dans le fichier src/firebaseConfig.ts et fournit les services suivants :
- Authentification avec adresse e-mail et mot de passe.
- Vérification des adresses e-mail.
- Réinitialisation du mot de passe.
- Gestion des sessions persistantes sur React Native.
- Lecture et écriture des données dans Firestore.
- Instance partagée de la base de données Firestore.
- Initialisation du service Firebase Storage.
Les images des annonces et des profils n'utilisent pas actuellement Firebase Storage dans le processus de téléchargement implémenté. Les photos des annonces sont téléchargées vers Cloudinary.
Cloudinary
Le fichier src/services/cloudinary.ts gère le téléchargement des images.

Son fonctionnement se déroule en plusieurs étapes :
1. Compression et redimensionnement éventuel de la photo.
2. Conversion de l'image au format JPEG en base64.
3. Envoi d'une requête de téléchargement vers Cloudinary avec un preset non authentifié.
4. Récupération de l'URL sécurisée secure_url de l'image.
OpenStreetMap et Leaflet
La carte est générée sous forme de code HTML Leaflet et affichée dans un composant react-native-webview.

Elle permet :
- De sélectionner un emplacement lors de la publication d'une annonce.
- D'utiliser la position actuelle de l'appareil.
- D'afficher la localisation d'un bien immobilier.
- D'ouvrir une application externe de navigation.
- De gérer les erreurs de chargement de Leaflet et des cartes.
Base de données
Cloud Firestore
L'application utilise Cloud Firestore pour stocker les informations des utilisateurs, les annonces et les conversations.

1. Collection profiles

Chaque utilisateur authentifié possède un document dans :

profiles/{uid}

Les informations enregistrées comprennent :
- Nom.
- Adresse e-mail.
- Numéro de téléphone.
- URL de l'avatar ou image en base64.
- Dates de création et de mise à jour.
2. Collection listings

Les annonces immobilières sont enregistrées dans :

listings/{listingId}

Les informations comprennent :
- Titre et description.
- Type de bien immobilier.
- Type de transaction : vente ou location.
- Prix.
- Nombre de chambres et de salles de bain.
- Surface.
- Ville et adresse.
- Latitude et longitude.
- URLs des images.
- Équipements disponibles.
- Identifiant, nom et téléphone du propriétaire.
- Statut et date de création.
Les annonces sont récupérées en temps réel et converties vers le modèle Listing utilisé dans l'application.

3. Collection conversations

Chaque conversation privée est enregistrée dans :

##conversations/{conversationId}

Une conversation contient :
- Les identifiants des deux participants.
- Les noms des participants.
- L'identifiant, le titre et l'image de l'annonce concernée.
- Le dernier message et son expéditeur.
- Les compteurs de messages non lus pour chaque participant.
- Les dates de création et de mise à jour.
Les messages sont stockés dans la sous-collection :

conversations/{conversationId}/messages/{messageId}
AsyncStorage
Les favoris ne sont pas stockés dans Firestore. Ils sont enregistrés localement avec AsyncStorage, à l'aide d'une clé propre à chaque utilisateur :
favorites:{uid}


Le cache des favoris en mémoire et la file d'écriture permettent de gérer les actions rapides sur les favoris pour chaque compte.
Captures d'écran de l'application
Les captures d'écran de l'application peuvent être ajoutées dans le dossier docs/screenshots/.
Page d'accueil
Détails d'une annonce
Publication d'une annonce
Messagerie
Profil utilisateur
Améliorations futures
Plusieurs améliorations peuvent être envisagées pour les prochaines versions :
- Finaliser et sécuriser Google Sign-In avec une configuration native et un development build.
- Ajouter la modification des annonces et la gestion de leur statut.
- Ajouter le tri et la pagination pour les grandes collections d'annonces et de conversations.
- Intégrer les notifications Push pour les nouveaux messages.
- Renforcer et centraliser les règles de validation Firestore.
- Ajouter des tests unitaires, d'intégration et de bout en bout.
- Améliorer le fonctionnement hors ligne et la synchronisation des données.
- Optimiser le cache des images et l'utilisation du stockage.
- Ajouter des filtres immobiliers avancés : fourchette de prix, surface, nombre de chambres et équipements.
- Ajouter une recherche immobilière sur carte ou par proximité.
- Mettre en place un système de modération des images et des annonces.
- Améliorer l'accessibilité et la navigation au clavier.
- Ajouter d'autres langues en complément de l'interface française actuelle.
- Supprimer le contenu du projet Expo de démarrage présent dans la route Explorer.
##Informations sur le projet et auteur
- Nom du projet : DarriImmo
- Nom de l'application : ImmoPlusRN
- Nom utilisé dans les interfaces : DariImmo
- Nom du package : immoplusrn
- Version de l'application : 1.0.0
- Dépôt GitHub : manellt/App_Immo
- Dépôt Git distant : https://github.com/manellt/App_Immo.git
- Technologies principales : Expo, React Native et TypeScript.
Les métadonnées du dépôt identifient manellt comme propriétaire actuel du dépôt. Le dernier commit inspecté utilise l'adresse e-mail associée à ce compte. Les autres contributeurs peuvent être ajoutés à partir de l'historique Git ou dans une section dédiée aux auteurs.
