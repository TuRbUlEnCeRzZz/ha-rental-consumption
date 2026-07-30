# Consommation locative pour Home Assistant

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://www.hacs.xyz/)
[![Validate](https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption/actions/workflows/validate.yml/badge.svg)](https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption/actions/workflows/validate.yml)
[![Version](https://img.shields.io/github/v/release/TuRbUIEnCeRzZ/ha-rental-consumption?include_prereleases)](https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption/releases)

Intégration personnalisée pour **Home Assistant OS**, notamment sur Raspberry Pi 4, destinée aux appartements locatifs sans compteurs individuels accessibles. Elle permet de saisir les consommations communiquées par la régie ou le bailleur pour une période déterminée.

## Fonctions

- panneau **Consommation locative** directement dans la barre latérale ;
- saisie depuis l'interface Home Assistant, sans YAML obligatoire ;
- eau en m³ ;
- chauffage en kWh, MWh, GJ ou unités de répartition ;
- périodes indépendantes pour l'eau et le chauffage ;
- contrôle des chevauchements ;
- stockage persistant dans Home Assistant ;
- capteurs de total, dernière période et nombre de périodes ;
- statistiques historiques externes dans Recorder ;
- répartition uniforme du total sur les jours de la période ;
- actions Home Assistant pour automatiser des imports futurs.

## Compatibilité

- Home Assistant Core **2026.7.4 ou plus récent** ;
- Home Assistant OS sur Raspberry Pi 4 pris en charge ;
- HACS pour l'installation et les mises à jour ;
- aucune bibliothèque Python externe.

## Publication de ce modèle sur GitHub

Lors du premier envoi, le workflow **Initialize repository** remplace automatiquement les marqueurs par le propriétaire et le nom réels du dépôt. Aucune commande locale n'est nécessaire. Les instructions détaillées se trouvent dans `GITHUB_SETUP.md`.

## Installation avec HACS

[![Ouvrir le dépôt dans HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=TuRbUIEnCeRzZ&repository=ha-rental-consumption&category=integration)

Installation manuelle dans HACS :

1. Ouvrir **HACS**.
2. Ouvrir le menu **⋮ → Dépôts personnalisés**.
3. Ajouter `https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption`.
4. Choisir la catégorie **Intégration**.
5. Rechercher **Consommation locative** et cliquer sur **Télécharger**.
6. Redémarrer complètement Home Assistant.
7. Ouvrir **Paramètres → Appareils et services → Ajouter une intégration**.
8. Rechercher **Consommation locative**.

## Configuration

Lors de l'ajout, choisir :

- le nom de l'appartement ;
- l'unité utilisée sur le décompte de chauffage.

Après le redémarrage, ouvrir **Consommation locative** dans la barre latérale de Home Assistant. Le panneau permet de :

- visualiser les totaux d'eau et de chauffage ;
- ajouter une période d'eau ou de chauffage ;
- consulter l'historique des périodes ;
- supprimer une période ;
- reconstruire les statistiques Recorder.

Le panneau est réservé aux administrateurs. Les mêmes opérations restent disponibles dans **Paramètres → Appareils et services → Consommation locative → Configurer**.

La date de fin est incluse. Deux périodes du même type ne peuvent pas se chevaucher.

## Entités créées

- `sensor.<appartement>_eau_total_importe`
- `sensor.<appartement>_chauffage_total_importe`
- `sensor.<appartement>_eau_derniere_periode`
- `sensor.<appartement>_chauffage_derniere_periode`
- `sensor.<appartement>_periodes_enregistrees`

Les identifiants exacts dépendent du nom choisi et du registre d'entités.

## Statistiques historiques

Deux statistiques externes sont créées :

- `rental_consumption:<config_entry_id>_water`
- `rental_consumption:<config_entry_id>_heating`

L'identifiant exact apparaît dans l'attribut `external_statistic_id` du capteur total correspondant.

> La consommation réelle à l'intérieur d'une période est inconnue. L'intégration répartit donc uniformément le total entre tous les jours. Le total est exact, mais la courbe journalière reste une estimation comptable.

## Actions disponibles

- `rental_consumption.add_period`
- `rental_consumption.delete_period`
- `rental_consumption.rebuild_statistics`

Exemple :

```yaml
action: rental_consumption.add_period
data:
  config_entry_id: "0123456789abcdef0123456789abcdef"
  consumption_type: water
  start_date: "2026-01-01"
  end_date: "2026-03-31"
  value: 21.7
  note: "Décompte de la régie, 1er trimestre"
```

L'identifiant `config_entry_id` peut être obtenu dans **Outils de développement → Modèle** :

```jinja2
{{ config_entry_id('sensor.nom_de_votre_capteur_total') }}
```

## Mise à jour

Les mises à jour publiées dans les releases GitHub apparaissent directement dans HACS. Après une mise à jour de l'intégration, redémarrer Home Assistant.

## Données et sauvegardes

Les périodes sont conservées dans le stockage de Home Assistant et sont incluses dans les sauvegardes Home Assistant OS. Lorsqu'une période est ajoutée ou supprimée, les statistiques gérées par l'intégration sont reconstruites à partir des données enregistrées.

## Assistance

Les problèmes peuvent être signalés dans les [issues GitHub](https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption/issues).
