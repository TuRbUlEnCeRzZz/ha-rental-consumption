# Mise en ligne sur ton compte GitHub — sans script local

Aucune commande Python n'est nécessaire sur ton ordinateur. Le workflow GitHub
**Initialize repository** détecte automatiquement :

- ton identifiant GitHub ;
- le nom réel du dépôt ;
- l'adresse des issues et de la documentation.

Il remplace ensuite les marqueurs du modèle, crée un commit de personnalisation,
puis lance les validations HACS, Hassfest et Python.

## 1. Créer le dépôt

1. Sur GitHub, créer un dépôt **public** nommé de préférence `ha-rental-consumption`.
2. Ne pas demander à GitHub d'ajouter un README, une licence ou un `.gitignore`.
3. Décompresser l'archive sur l'ordinateur.
4. Dans le dépôt GitHub, choisir **Add file → Upload files**.
5. Glisser tout le contenu du dossier décompressé dans la zone d'envoi, y compris
   les dossiers `.github` et `custom_components`.
6. Valider avec **Commit changes**.

## 2. Laisser GitHub personnaliser le dépôt

Après le premier commit :

1. Ouvrir l'onglet **Actions**.
2. Le workflow **Initialize repository** démarre automatiquement.
3. Il crée un second commit intitulé `Initialize repository for ...`.
4. Il lance ensuite le workflow **Validate**.

Si les Actions étaient désactivées, les activer dans l'onglet **Actions**, puis
ouvrir **Initialize repository → Run workflow**.

## 3. Compléter les informations du dépôt

Dans la page principale du dépôt, ajouter :

- Description : `Saisie des consommations d'eau et de chauffage par période pour Home Assistant.`
- Topics : `home-assistant`, `hacs`, `water-consumption`, `heating`, `rental`.

Vérifier également que les **Issues** sont activées.

## 4. Créer la première release

La branche principale peut déjà être utilisée dans HACS. Une release est toutefois
recommandée pour recevoir proprement les futures mises à jour.

1. Ouvrir **Actions → Create release**.
2. Choisir **Run workflow**.
3. Conserver `v1.0.0`.
4. Lancer le workflow.

## 5. Ajouter le dépôt à HACS

Dans Home Assistant OS :

1. Ouvrir **HACS**.
2. Choisir **⋮ → Dépôts personnalisés**.
3. Coller l'adresse de ton dépôt GitHub.
4. Choisir **Intégration**.
5. Ajouter puis télécharger **Consommation locative**.
6. Redémarrer Home Assistant.
