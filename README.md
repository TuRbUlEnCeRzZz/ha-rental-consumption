# Consommation locative pour Home Assistant

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://www.hacs.xyz/)
[![Validate](https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption/actions/workflows/validate.yml/badge.svg)](https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption/actions/workflows/validate.yml)
[![Version](https://img.shields.io/github/v/release/TuRbUIEnCeRzZ/ha-rental-consumption?include_prereleases)](https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption/releases)

Intégration personnalisée pour **Home Assistant OS**, notamment sur Raspberry Pi 4, destinée aux appartements locatifs sans compteurs individuels accessibles. Elle permet de saisir les consommations et coûts communiqués par une régie, un bailleur ou un GRD pour des périodes déterminées.

## Fonctions

- saisie depuis un panneau dans la barre latérale ou depuis les options de l'intégration ;
- eau totale et eau chaude en m³, enregistrées séparément ;
- chauffage en kWh, MWh, GJ ou unités de répartition ;
- électricité en kWh avec prix total facultatif ;
- calcul du coût cumulé et du prix moyen pondéré de l'électricité ;
- nom du GRD ou fournisseur saisi manuellement ;
- répartition uniforme ou selon les degrés-jours d'un capteur extérieur ;
- repli automatique sur une répartition uniforme si Recorder ne possède pas assez de températures ;
- stockage persistant, capteurs Home Assistant et statistiques historiques externes ;
- contrôle des chevauchements et reconstruction après correction ou suppression.

## Compatibilité

- Home Assistant Core **2026.7.4 ou plus récent** ;
- Home Assistant OS sur Raspberry Pi 4 ;
- installation et mises à jour avec HACS ;
- aucune bibliothèque Python externe.

## Installation avec HACS

1. Ouvrir **HACS → Intégrations → ⋮ → Dépôts personnalisés**.
2. Ajouter `https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption` en catégorie **Intégration**.
3. Télécharger **Consommation locative**.
4. Redémarrer Home Assistant.
5. Ouvrir **Paramètres → Appareils et services → Ajouter une intégration**.

## Configuration du chauffage selon la température

Dans le panneau **Consommation locative → Réglages** :

1. choisir **Selon la température extérieure (degrés-jours)** ;
2. sélectionner un capteur extérieur ayant la classe d'appareil `temperature` ;
3. choisir la température de base, par défaut **20 °C** ;
4. enregistrer les réglages.

Pour chaque jour, le poids est calculé avec :

```text
max(température de base − température extérieure moyenne, 0)
```

La consommation exacte de la période est ensuite distribuée proportionnellement à ces poids. Les jours sans température utilisent un poids moyen. Si aucune statistique journalière n'est disponible, la période reste uniforme. Le panneau indique le taux de couverture, la température moyenne et le nombre de périodes pondérées. Dès que trois périodes possèdent au moins 50 % de températures disponibles, il calcule aussi la corrélation de Pearson entre leur température extérieure moyenne et leur consommation journalière réellement facturée.

> Le calcul utilise les statistiques journalières Recorder du capteur. Le capteur doit donc être conservé dans Recorder et idéalement disposer d'une classe d'état `measurement`. Une corrélation proche de `-1` indique que les périodes froides correspondent généralement à une consommation journalière plus forte ; elle ne prouve pas à elle seule une causalité ou une performance énergétique.

## Électricité et prix

Une période d'électricité contient :

- une consommation totale en kWh ;
- un prix total facultatif dans la devise configurée ;
- une note libre.

L'intégration produit notamment :

- le total d'électricité ;
- le coût total connu ;
- le prix moyen pondéré, par exemple en `CHF/kWh` ;
- une statistique historique distincte pour le coût.

## Eau chaude

`Eau totale` et `Eau chaude` sont deux séries séparées. L'eau chaude n'est pas ajoutée une seconde fois au total d'eau. Cela permet d'enregistrer un sous-décompte d'eau chaude lorsqu'il est fourni par la régie.

## Entités principales

- Eau totale – total importé
- Eau chaude – total importé
- Chauffage – total importé
- Électricité – total importé
- Électricité – coût total
- Électricité – prix moyen
- une entité « dernière période » pour chaque énergie
- Périodes enregistrées

## Statistiques externes

- `rental_consumption:<entry_id>_water`
- `rental_consumption:<entry_id>_hot_water`
- `rental_consumption:<entry_id>_heating`
- `rental_consumption:<entry_id>_electricity`
- `rental_consumption:<entry_id>_electricity_cost`

## Mise à jour depuis une version 1.0 ou 1.1

Les périodes déjà enregistrées restent compatibles. Après la mise à jour HACS :

1. redémarrer complètement Home Assistant ;
2. ouvrir le panneau latéral ;
3. enregistrer le GRD et, si souhaité, le capteur extérieur ;
4. lancer **Reconstruire les statistiques**.

## Actions disponibles

- `rental_consumption.add_period`
- `rental_consumption.delete_period`
- `rental_consumption.rebuild_statistics`

Exemple pour l'électricité :

```yaml
action: rental_consumption.add_period
data:
  config_entry_id: "0123456789abcdef0123456789abcdef"
  consumption_type: electricity
  start_date: "2026-05-01"
  end_date: "2026-07-31"
  value: 1320.5
  cost: 387.40
  note: "Décompte trimestriel du GRD"
```

## Données et sauvegardes

Les périodes sont stockées dans le stockage persistant de Home Assistant et sont incluses dans les sauvegardes Home Assistant OS.
