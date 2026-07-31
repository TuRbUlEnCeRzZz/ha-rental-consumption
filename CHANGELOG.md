# Journal des modifications

## 1.2.0 — 2026-07-31

- Ajout de la consommation d’électricité en kWh.
- Ajout du prix total par période, du coût cumulé et du prix moyen pondéré.
- Ajout d’un champ manuel pour le GRD ou fournisseur.
- Ajout d’une série séparée pour l’eau chaude.
- Ajout de la répartition du chauffage selon les degrés-jours d’un capteur extérieur.
- Ajout du taux de couverture, de la température moyenne et de la corrélation entre périodes facturées.
- Repli automatique sur une distribution uniforme si les statistiques de température sont absentes.

## 1.1.1 — 2026-07-30

- Correction du blocage au démarrage de Home Assistant.
- La reconstruction des statistiques Recorder est maintenant lancée après le démarrage complet, dans une tâche d’arrière-plan liée à l’entrée de configuration.

## 1.1.0 — 2026-07-30

- Ajout du panneau dédié dans la barre latérale de Home Assistant.
- Ajout de la saisie, de la suppression et de la reconstruction des statistiques depuis le panneau.
- Déclaration explicite de la dépendance HTTP requise par le panneau personnalisé.

## 1.0.0 — 2026-07-30

- Première version publique.
- Saisie des consommations d'eau et de chauffage par période.
- Stockage persistant et reconstruction des statistiques historiques.
- Installation par HACS depuis un dépôt GitHub personnalisé.
