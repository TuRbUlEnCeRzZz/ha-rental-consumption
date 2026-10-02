import {
  calculateTotalCost,
  calculateUnitPrice,
  classifyError,
  coverageToPercent,
  exportStatusLevel,
  percentToCoverage,
  periodDurationDays,
} from "./ui-utils.mjs";

class RentalConsumptionPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._data = null;
    this._selectedEntryId = null;
    this._editingPeriodId = null;
    this._activeTab = "overview";
    this._historyType = "all";
    this._historyYear = "all";
    this._historyProvider = "all";
    this._busyAction = null;
    this._message = null;
    this._apartmentDialog = null;
    this._analysisData = null;
    this._analysisEntryId = null;
    this._analysisLoading = false;
    this._analysisType = "electricity";
    this._analysisGranularity = "monthly";
    this._analysisMetric = "consumption";
    this._settingsDirty = false;
    this._exportDirty = false;
    this._advancedSettingsOpen = false;
    this._newPeriodType = null;
    this._priceDriver = "cost";
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._loadData();
  }

  get _lang() {
    return (this._hass?.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
  }

  _t(key) {
    const t = {
      fr: {
        title: "Consommation locative",
        subtitle: "Décomptes historiques, répartition des consommations et export vers une base de données.",
        refresh: "Actualiser",
        apartment: "Logement",
        addApartment: "Ajouter un logement",
        editApartment: "Modifier le logement",
        apartmentName: "Nom du logement",
        heatingUnit: "Unité du chauffage",
        createApartment: "Créer le logement",
        renameApartment: "Renommer",
        apartmentCreated: "Logement ajouté.",
        apartmentRenamed: "Logement renommé.",
        apartmentHelp: "Chaque logement possède ses propres périodes, statistiques Recorder et paramètres d’export.",
        overview: "Vue d’ensemble",
        periods: "Périodes",
        analysis: "Analyse",
        settings: "Paramètres",
        water: "Eau totale",
        hotWater: "Eau chaude",
        heating: "Chauffage",
        electricity: "Électricité réseau",
        pvElectricity: "Fourniture PV",
        providerDefault: "Fournisseur d’électricité (GRD) par défaut",
        providerDefaultHelp: "Utilisé pour préremplir les nouvelles périodes. Les périodes existantes conservent leur fournisseur.",
        provider: "Fournisseur d’électricité (GRD)",
        allProviders: "Tous les fournisseurs",
        currency: "Devise",
        save: "Enregistrer",
        saveGeneral: "Enregistrer les paramètres",
        saved: "Paramètres enregistrés.",
        exportSaved: "Paramètres de la base externe enregistrés.",
        general: "Général",
        heatingSettings: "Répartition chauffage",
        electricitySettings: "Répartition électricité",
        exportSettings: "Base externe",
        heatingDistribution: "Répartition du chauffage",
        uniform: "Uniforme par jour",
        degreeDays: "Selon température extérieure",
        outdoorSensor: "Capteur extérieur",
        baseTemp: "Température de base",
        electricityDistribution: "Répartition de l’électricité",
        loadCurve: "Selon la courbe de charge",
        loadSensor: "Capteur de puissance de l’introduction",
        loadSource: "Source de la courbe",
        auto: "Automatique",
        recorder: "Recorder",
        victoriametrics: "VictoriaMetrics",
        minCoverage: "Couverture minimale",
        vmMetric: "Métrique VM",
        vmDb: "Étiquette « db » VM",
        loadHelp: "Automatique : VictoriaMetrics est privilégié lorsqu’il est configuré, puis Recorder est utilisé en secours.",
        addPeriod: "Ajouter une période",
        editPeriod: "Modifier la période",
        type: "Type",
        start: "Date de début",
        end: "Date de fin incluse",
        consumption: "Consommation totale",
        totalCost: "Coût total",
        note: "Note",
        tariff: "Tarif",
        single: "Unitaire",
        peakLabel: "Heures pleines",
        offpeakLabel: "Heures creuses",
        peakOffpeak: "Heures pleines / heures creuses",
        peakConsumption: "Consommation heures pleines",
        offpeakConsumption: "Consommation heures creuses",
        peakCost: "Coût heures pleines",
        offpeakCost: "Coût heures creuses",
        add: "Ajouter",
        edit: "Modifier",
        delete: "Supprimer",
        cancel: "Annuler",
        history: "Historique",
        allTypes: "Tous les types",
        allYears: "Toutes les années",
        rebuild: "Reconstruire Recorder",
        noPeriods: "Aucune période pour ces filtres.",
        distribution: "Répartition",
        source: "Source",
        coverage: "Couverture",
        weightedPeriods: "Périodes pondérées",
        fallbackPeriods: "Périodes uniformes",
        effectiveDistribution: "Méthode réellement utilisée",
        configuredDistribution: "Méthode configurée",
        temperatureCoverage: "Couverture température",
        meanTemperature: "Température moyenne",
        exportBackend: "Destination",
        none: "Désactivé",
        url: "URL",
        database: "Base de données",
        retention: "Politique de rétention",
        organization: "Organisation",
        bucket: "Bucket (compartiment)",
        username: "Utilisateur",
        password: "Mot de passe",
        token: "Jeton",
        deleteKey: "Clé de suppression (deleteAuthKey)",
        autoSync: "Synchroniser automatiquement après modification",
        test: "Tester la connexion",
        testing: "Test en cours…",
        sync: "Reconstruire dans la base",
        syncing: "Reconstruction…",
        connectionOk: "Connexion validée.",
        lastStatus: "Dernier état",
        health: "Serveur joignable",
        write: "Écriture",
        read: "Lecture",
        deleteStep: "Suppression",
        rebuildStep: "Reconstruction",
        statusOk: "OK",
        statusError: "Erreur",
        statusTesting: "Test en cours",
        never: "Jamais testé",
        v3Warning: "InfluxDB 3 : écriture prise en charge. La suppression/reconstruction sûre reste désactivée.",
        vmHelp: "Pour VictoriaMetrics en local, seule l’URL est nécessaire. La base de données, les identifiants, le jeton et la clé de suppression sont facultatifs.",
        confirmDelete: "Supprimer définitivement cette période ?",
        confirmRebuild: "Reconstruire toutes les statistiques Recorder ?",
        confirmSync: "Effacer puis réécrire les séries de cet appartement dans la base externe ?",
        addSuccess: "Période ajoutée.",
        editSuccess: "Période modifiée.",
        deleteSuccess: "Période supprimée.",
        rebuildSuccess: "Statistiques Recorder reconstruites.",
        syncSuccess: "Historique externe reconstruit.",
        tariffHelp: "La somme heures pleines + heures creuses doit être égale à la consommation totale.",
        distributionUniform: "Uniforme",
        distributionLoad: "Courbe de charge",
        distributionTemperature: "Degrés-jours",
        exportInactive: "Export désactivé",
        noProvider: "Non renseigné",
        charts: "Graphiques",
        analysisType: "Énergie analysée",
        granularity: "Granularité",
        metric: "Valeur",
        byPeriod: "Par période",
        monthly: "Mensuel",
        annual: "Annuel",
        unitPrice: "Prix unitaire",
        refreshAnalysis: "Actualiser l’analyse",
        loadingAnalysis: "Calcul des données d’analyse…",
        noAnalysisData: "Pas encore assez de données pour ce graphique.",
        latestPeriod: "Dernière période",
        vsPrevious: "par rapport à la période précédente",
        normalizedUse: "Consommation/jour",
        daysShort: "j",
        daysLong: "jours",
        perDay: "/j",
        trend: "Tendance",
        trendUp: "En hausse",
        trendDown: "En baisse",
        trendStable: "Stable",
        electricityMix: "Répartition réseau / PV",
        gridSupply: "Réseau",
        pvSupply: "PV",
        pvShare: "Part PV",
        totalSupply: "Fourniture totale",
        deterministicAnalysis: "Analyse déterministe basée sur les périodes enregistrées et la même répartition que Recorder.",
        analysisLoadError: "Impossible de calculer les données d’analyse.",
        noConfiguration: "Aucune configuration.",
        noPeriodEntered: "Aucune période saisie",
        addFirstPeriod: "Ajouter une période",
        setupTitle: "Démarrage",
        setupIntro: "Quelques étapes permettent de terminer la configuration du logement.",
        setupApartment: "Créer le logement",
        setupLoadSensor: "Choisir le capteur d’introduction",
        setupFirstPeriod: "Saisir une première période",
        setupExternal: "Vérifier la base externe",
        setupDone: "Terminé",
        setupOptional: "Facultatif",
        configure: "Configurer",
        heatingNoPeriods: "Aucune période de chauffage n’est encore saisie.",
        heatingSensorMissing: "Le capteur de température extérieure n’est pas configuré.",
        coverageNotRequired: "Non requise avec une répartition uniforme",
        notRequired: "Non requis",
        periodDuration: "Durée de la période",
        endIncludedHelp: "La date de fin est incluse dans le décompte.",
        unitPriceInput: "Prix unitaire",
        costPriceHelp: "Saisissez le coût total ou le prix unitaire : l’autre valeur est calculée automatiquement.",
        badgeTariff: "Tarif",
        badgeMethod: "Méthode",
        badgeSource: "Source",
        badgeData: "Données",
        rebuildDescription: "Efface puis recrée les statistiques historiques Recorder à partir des périodes enregistrées.",
        rebuildRunning: "Reconstruction Recorder en cours…",
        recorderRebuildConfirm: "Reconstruire l’historique Recorder à partir de toutes les périodes enregistrées ?",
        datePlaceholder: "jj.mm.aaaa",
        advancedSettings: "Paramètres avancés",
        showAdvanced: "Afficher les paramètres avancés",
        hideAdvanced: "Masquer les paramètres avancés",
        optionalAuth: "Authentification et options facultatives",
        optional: "Facultatif",
        required: "Obligatoire",
        unsavedChanges: "Modifications non enregistrées",
        unsavedPrompt: "Des modifications ne sont pas enregistrées. Les abandonner ?",
        technicalDetails: "Voir les détails techniques",
        suggestedAction: "Action suggérée",
        statusPartial: "Partiellement fonctionnel",
        stepOk: "OK",
        stepFailed: "échec",
        stepNotTested: "non testé",
        openSettings: "Ouvrir les paramètres",
        fallbackNotice: "La courbe de charge complète n’est pas disponible. La répartition utilise une méthode de secours pour au moins une période.",
        fallbackImpact: "Les totaux facturés restent exacts, mais leur répartition dans le temps peut être moins précise.",
        externalErrorNotice: "La base externe signale une erreur de connexion ou de synchronisation.",
        externalErrorImpact: "Les chiffres affichés restent disponibles depuis les périodes enregistrées et Recorder ; seul l’export externe est concerné tant qu’aucune méthode de répartition n’en dépend directement.",
        baseExternalHelp: "Connexion facultative à VictoriaMetrics ou InfluxDB pour conserver les données reconstruites dans une base historique externe.",
        syncDescription: "Supprime puis réécrit les séries historiques appartenant à ce logement. L’opération peut prendre quelques instants.",
        providerHelp: "Entreprise qui fournit ou distribue l’électricité pour cette période. En Suisse, le GRD est le gestionnaire du réseau de distribution.",
        recorderHelp: "Base de données interne de Home Assistant utilisée pour l’historique et les statistiques à long terme.",
        loadCurveHelp: "Profil réel de puissance mesuré dans le temps, utilisé pour répartir une facture sur les jours où l’énergie a réellement été consommée.",
        configuredDistributionHelp: "Méthode demandée dans les paramètres avant vérification de la disponibilité des données.",
        effectiveDistributionHelp: "Méthode effectivement appliquée après contrôle des données disponibles et des méthodes de secours.",
        coverageHelp: "Part de la période pour laquelle des données exploitables sont disponibles.",
        coverageAvailable: "Données disponibles",
        coverageAvailableFull: "Données disponibles sur toute la période",
        weightedPeriodsHelp: "Périodes réparties à partir de données mesurées plutôt que de façon uniforme.",
        uniformPeriodsHelp: "Périodes réparties uniformément parce qu’aucune pondération fiable n’était disponible.",
        singleTariffHelp: "Un seul tarif d’électricité est appliqué à toute la période.",
        baseTempHelp: "Température de référence utilisée pour calculer les degrés-jours de chauffage.",
        vmMetricHelp: "Nom de la métrique VictoriaMetrics contenant la puissance à utiliser pour la courbe de charge.",
        vmDbHelp: "Valeur de l’étiquette « db » utilisée pour retrouver les séries Home Assistant dans VictoriaMetrics.",
        deleteKeyHelp: "Clé facultative qui protège les opérations de suppression dans VictoriaMetrics si cette protection est activée côté serveur.",
        tokenHelp: "Jeton d’authentification facultatif utilisé par la base externe ou son proxy d’accès.",
        loadSourceHelp: "Source de données utilisée pour reconstruire la courbe : automatique, VictoriaMetrics ou Recorder.",
        minCoverageHelp: "Pourcentage minimal de données disponibles avant d’utiliser la courbe de charge au lieu d’une méthode de secours.",
        entityPowerHelp: "Capteur Home Assistant représentant la puissance instantanée de l’introduction électrique.",
        entityTemperatureHelp: "Capteur Home Assistant représentant la température extérieure.",
        errorUnknown: "Une opération a échoué. Consultez les détails techniques si le problème persiste.",
        errorRead: "Impossible de relire les données dans VictoriaMetrics.",
        errorReadAction: "Vérifiez l’URL du serveur puis relancez le test de connexion.",
        errorWrite: "La base externe est joignable, mais l’écriture a échoué.",
        errorWriteAction: "Vérifiez les droits d’écriture et les paramètres d’authentification.",
        errorDelete: "L’écriture fonctionne, mais la suppression de test a échoué.",
        errorDeleteAction: "Vérifiez deleteAuthKey et les droits de suppression avant d’activer la synchronisation automatique.",
        errorHealth: "Impossible de joindre la base externe.",
        errorHealthAction: "Vérifiez l’URL, le port et que le serveur est démarré.",
        errorRecorder: "Recorder n’a pas pu terminer l’opération demandée.",
        errorRecorderAction: "Vérifiez Recorder dans Home Assistant puis réessayez.",
        errorAuth: "L’authentification de la base externe a été refusée.",
        errorAuthAction: "Vérifiez l’utilisateur, le mot de passe ou le jeton.",
        errorNotFound: "Le service demandé n’a pas été trouvé sur le serveur.",
        errorNotFoundAction: "Vérifiez l’URL et le type de base sélectionné.",
        errorTimeout: "La base externe n’a pas répondu à temps.",
        errorTimeoutAction: "Vérifiez la disponibilité du serveur et le réseau, puis réessayez.",
        errorDatabaseRequired: "Une base de données doit être renseignée pour cette destination.",
        errorOrgBucketRequired: "L’organisation et le bucket doivent être renseignés pour InfluxDB 2.",
        errorOverlap: "Cette période chevauche une période existante du même type.",
        errorFutureEnd: "La date de fin ne peut pas être dans le futur.",
        errorExportNotConfigured: "La base externe n’est pas encore configurée.",
        errorTariffTotal: "La somme des consommations heures pleines et heures creuses doit être égale à la consommation totale.",
        errorTariffCost: "La somme des coûts heures pleines et heures creuses doit être égale au coût total.",
        errorTariffValues: "Les valeurs heures pleines / heures creuses ne sont pas valides.",
        errorEndBeforeStart: "La date de fin doit être postérieure ou égale à la date de début.",
        errorInvalidValue: "La consommation doit être supérieure à zéro.",
        errorInvalidCost: "Le coût ne peut pas être négatif.",
        errorPeriodNotFound: "La période sélectionnée n’existe plus.",
        errorInvalidDistribution: "La méthode de répartition sélectionnée n’est pas valide.",
        errorInvalidBaseTemp: "La température de base doit être comprise entre 5 et 30 °C.",
        errorTemperatureSensorRequired: "Sélectionnez un capteur de température extérieure.",
        errorApartmentExists: "Un logement portant ce nom existe déjà.",
        errorInvalidName: "Le nom du logement n’est pas valide.",
        errorApartmentCreate: "La création du logement a échoué.",
        errorApartmentSetup: "Le logement a été créé mais son chargement dans Home Assistant a échoué.",
        errorSafeRebuild: "Cette destination ne permet pas une reconstruction sûre avec suppression.",
        errorDeleteUnsupported: "La suppression sûre n’est pas disponible pour cette destination.",
        allocationUnits: "Unités de répartition"
      },
      en: {
        title: "Rental consumption",
        subtitle: "Historical bills, Recorder allocation and time-series export.",
        refresh: "Refresh",
        apartment: "Dwelling",
        addApartment: "Add dwelling",
        editApartment: "Edit dwelling",
        apartmentName: "Dwelling name",
        heatingUnit: "Heating unit",
        createApartment: "Create dwelling",
        renameApartment: "Rename",
        apartmentCreated: "Dwelling added.",
        apartmentRenamed: "Dwelling renamed.",
        apartmentHelp: "Each dwelling has its own billing periods, Recorder statistics and export settings.",
        overview: "Overview",
        periods: "Periods",
        analysis: "Analysis",
        settings: "Settings",
        water: "Total water",
        hotWater: "Hot water",
        heating: "Heating",
        electricity: "Grid electricity",
        pvElectricity: "PV electricity supply",
        providerDefault: "Default DSO / supplier",
        providerDefaultHelp: "Used to prefill new periods. Existing periods keep their own supplier.",
        provider: "DSO / supplier",
        allProviders: "All suppliers",
        currency: "Currency",
        save: "Save",
        saveGeneral: "Save settings",
        saved: "Settings saved.",
        exportSaved: "External database settings saved.",
        general: "General",
        heatingSettings: "Heating allocation",
        electricitySettings: "Electricity allocation",
        exportSettings: "External database",
        heatingDistribution: "Heating distribution",
        uniform: "Uniform per day",
        degreeDays: "Outdoor-temperature degree days",
        outdoorSensor: "Outdoor sensor",
        baseTemp: "Base temperature",
        electricityDistribution: "Electricity distribution",
        loadCurve: "Load-curve weighted",
        loadSensor: "Main incoming power sensor",
        loadSource: "Load-curve source",
        auto: "Automatic",
        recorder: "Recorder",
        victoriametrics: "VictoriaMetrics",
        minCoverage: "Minimum coverage",
        vmMetric: "VM metric",
        vmDb: "VM db label",
        loadHelp: "Automatic mode prefers VictoriaMetrics when configured, then falls back to Recorder.",
        addPeriod: "Add a period",
        editPeriod: "Edit period",
        type: "Type",
        start: "Start date",
        end: "End date included",
        consumption: "Total consumption",
        totalCost: "Total cost",
        note: "Note",
        tariff: "Tariff",
        single: "Single",
        peakLabel: "Peak",
        offpeakLabel: "Off-peak",
        peakOffpeak: "Peak / off-peak",
        peakConsumption: "Peak consumption",
        offpeakConsumption: "Off-peak consumption",
        peakCost: "Peak cost",
        offpeakCost: "Off-peak cost",
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        cancel: "Cancel",
        history: "History",
        allTypes: "All types",
        allYears: "All years",
        rebuild: "Rebuild Recorder",
        noPeriods: "No periods for these filters.",
        distribution: "Distribution",
        source: "Source",
        coverage: "Coverage",
        weightedPeriods: "Weighted periods",
        fallbackPeriods: "Uniform periods",
        effectiveDistribution: "Effective distribution",
        configuredDistribution: "Configured distribution",
        temperatureCoverage: "Temperature coverage",
        meanTemperature: "Mean temperature",
        exportBackend: "Destination",
        none: "Disabled",
        url: "URL",
        database: "Base de données",
        retention: "Politique de rétention",
        organization: "Organization",
        bucket: "Bucket (compartiment)",
        username: "Username",
        password: "Password",
        token: "Jeton",
        deleteKey: "deleteAuthKey",
        autoSync: "Automatically sync after changes",
        test: "Test connection",
        testing: "Testing…",
        sync: "Rebuild external history",
        syncing: "Rebuilding…",
        connectionOk: "Connection validated.",
        lastStatus: "Last status",
        health: "Server reachable",
        write: "Write",
        read: "Read",
        deleteStep: "Delete",
        rebuildStep: "Rebuild",
        statusOk: "OK",
        statusError: "Error",
        statusTesting: "Testing",
        never: "Never tested",
        v3Warning: "InfluxDB 3: writing is supported. Safe delete/rebuild remains disabled.",
        vmHelp: "For VictoriaMetrics, only the URL is required on a local unauthenticated install. Database, credentials, token and deleteAuthKey are optional.",
        confirmDelete: "Permanently delete this period?",
        confirmRebuild: "Rebuild all Recorder statistics?",
        confirmSync: "Delete then rewrite this apartment's external series?",
        addSuccess: "Period added.",
        editSuccess: "Period updated.",
        deleteSuccess: "Period deleted.",
        rebuildSuccess: "Recorder statistics rebuilt.",
        syncSuccess: "External history rebuilt.",
        tariffHelp: "Peak + off-peak consumption must equal total consumption.",
        distributionUniform: "Uniform",
        distributionLoad: "Load curve",
        distributionTemperature: "Degree days",
        exportInactive: "Export disabled",
        noProvider: "Not set",
        charts: "Charts",
        analysisType: "Energy type",
        granularity: "Granularity",
        metric: "Metric",
        byPeriod: "By period",
        monthly: "Monthly",
        annual: "Annual",
        unitPrice: "Unit price",
        refreshAnalysis: "Refresh analysis",
        loadingAnalysis: "Calculating analysis data…",
        noAnalysisData: "Not enough data for this chart yet.",
        latestPeriod: "Latest period",
        vsPrevious: "compared with the previous period",
        normalizedUse: "Consumption/day",
        daysShort: "d",
        daysLong: "days",
        perDay: "/day",
        trend: "Trend",
        trendUp: "Increasing",
        trendDown: "Decreasing",
        trendStable: "Stable",
        electricityMix: "Grid / PV supply mix",
        gridSupply: "Grid",
        pvSupply: "PV",
        pvShare: "PV share",
        totalSupply: "Total supply",
        deterministicAnalysis: "Deterministic analysis based on stored periods and the same allocation used by Recorder.",
        analysisLoadError: "Unable to calculate analysis data.",
        noConfiguration: "No configuration.",
        noPeriodEntered: "No period entered",
        addFirstPeriod: "Add a period",
        setupTitle: "Getting started",
        setupIntro: "A few steps complete the dwelling configuration.",
        setupApartment: "Create the dwelling",
        setupLoadSensor: "Choose the incoming power sensor",
        setupFirstPeriod: "Enter a first period",
        setupExternal: "Check the external database",
        setupDone: "Done",
        setupOptional: "Optional",
        configure: "Configure",
        heatingNoPeriods: "No heating period has been entered yet.",
        heatingSensorMissing: "The outdoor temperature sensor is not configured.",
        coverageNotRequired: "Not required with uniform distribution",
        notRequired: "Not required",
        periodDuration: "Period duration",
        endIncludedHelp: "The end date is included in the billing period.",
        unitPriceInput: "Unit price",
        costPriceHelp: "Enter either the total cost or the unit price; the other value is calculated automatically.",
        badgeTariff: "Tariff",
        badgeMethod: "Method",
        badgeSource: "Source",
        badgeData: "Data",
        rebuildDescription: "Clears and recreates Recorder long-term statistics from the saved periods.",
        rebuildRunning: "Rebuilding Recorder…",
        recorderRebuildConfirm: "Rebuild Recorder history from all saved periods?",
        datePlaceholder: "dd.mm.yyyy",
        advancedSettings: "Advanced settings",
        showAdvanced: "Show advanced settings",
        hideAdvanced: "Hide advanced settings",
        optionalAuth: "Authentication and optional settings",
        optional: "Optional",
        required: "Required",
        unsavedChanges: "Unsaved changes",
        unsavedPrompt: "Some changes are not saved. Discard them?",
        technicalDetails: "Show technical details",
        suggestedAction: "Suggested action",
        statusPartial: "Partially functional",
        stepOk: "OK",
        stepFailed: "failed",
        stepNotTested: "not tested",
        openSettings: "Open settings",
        fallbackNotice: "The complete load curve is unavailable. A fallback method is being used for at least one period.",
        fallbackImpact: "Billed totals remain exact, but their distribution over time may be less precise.",
        externalErrorNotice: "The external database reports a connection or synchronization error.",
        externalErrorImpact: "Displayed figures remain available from stored periods and Recorder; only external export is affected unless an allocation method directly depends on it.",
        baseExternalHelp: "Optional connection to VictoriaMetrics or InfluxDB to keep reconstructed data in an external historical database.",
        syncDescription: "Deletes and rewrites the historical series owned by this dwelling. The operation may take a moment.",
        providerHelp: "Company that supplies or distributes electricity for the period. In Switzerland, the DSO operates the distribution grid.",
        recorderHelp: "Home Assistant's internal database used for history and long-term statistics.",
        loadCurveHelp: "Measured power profile over time, used to distribute a bill across the days when energy was actually consumed.",
        configuredDistributionHelp: "Method requested in settings before checking data availability.",
        effectiveDistributionHelp: "Method actually applied after checking available data and fallbacks.",
        coverageHelp: "Share of the period for which usable data is available.",
        coverageAvailable: "Data available",
        coverageAvailableFull: "Data available for the entire period",
        weightedPeriodsHelp: "Periods distributed from measured data instead of uniformly.",
        uniformPeriodsHelp: "Periods distributed uniformly because no reliable weighting data was available.",
        singleTariffHelp: "One electricity tariff applies to the entire period.",
        baseTempHelp: "Reference temperature used to calculate heating degree days.",
        vmMetricHelp: "VictoriaMetrics metric containing the power values used for the load curve.",
        vmDbHelp: "Value of the « db » label used to find Home Assistant series in VictoriaMetrics.",
        deleteKeyHelp: "Optional key protecting VictoriaMetrics deletion operations when enabled on the server.",
        tokenHelp: "Optional authentication token used by the external database or its access proxy.",
        loadSourceHelp: "Data source used to reconstruct the curve: automatic, VictoriaMetrics, or Recorder.",
        minCoverageHelp: "Minimum percentage of available data required before using the load curve instead of a fallback.",
        entityPowerHelp: "Home Assistant sensor representing instantaneous incoming electrical power.",
        entityTemperatureHelp: "Home Assistant sensor representing outdoor temperature.",
        errorUnknown: "An operation failed. Check the technical details if the problem persists.",
        errorRead: "Unable to read the data back from VictoriaMetrics.",
        errorReadAction: "Check the server URL and retry the connection test.",
        errorWrite: "The external database is reachable, but writing failed.",
        errorWriteAction: "Check write permissions and authentication settings.",
        errorDelete: "Writing works, but deleting the test point failed.",
        errorDeleteAction: "Check deleteAuthKey and delete permissions before enabling automatic synchronization.",
        errorHealth: "Unable to reach the external database.",
        errorHealthAction: "Check the URL, port, and that the server is running.",
        errorRecorder: "Recorder could not complete the requested operation.",
        errorRecorderAction: "Check Recorder in Home Assistant and retry.",
        errorAuth: "External database authentication was rejected.",
        errorAuthAction: "Check the username, password, or token.",
        errorNotFound: "The requested service was not found on the server.",
        errorNotFoundAction: "Check the URL and selected database type.",
        errorTimeout: "The external database did not respond in time.",
        errorTimeoutAction: "Check server availability and network connectivity, then retry.",
        errorDatabaseRequired: "A database must be provided for this destination.",
        errorOrgBucketRequired: "Organization and bucket are required for InfluxDB 2.",
        errorOverlap: "This period overlaps an existing period of the same type.",
        errorFutureEnd: "The end date cannot be in the future.",
        errorExportNotConfigured: "The external database is not configured yet.",
        errorTariffTotal: "Peak and off-peak consumption must equal total consumption.",
        errorTariffCost: "Peak and off-peak costs must equal total cost.",
        errorTariffValues: "Peak / off-peak values are invalid.",
        errorEndBeforeStart: "The end date must be on or after the start date.",
        errorInvalidValue: "Consumption must be greater than zero.",
        errorInvalidCost: "Cost cannot be negative.",
        errorPeriodNotFound: "The selected period no longer exists.",
        errorInvalidDistribution: "The selected allocation method is invalid.",
        errorInvalidBaseTemp: "Base temperature must be between 5 and 30 °C.",
        errorTemperatureSensorRequired: "Select an outdoor temperature sensor.",
        errorApartmentExists: "A dwelling with this name already exists.",
        errorInvalidName: "The dwelling name is invalid.",
        errorApartmentCreate: "Creating the dwelling failed.",
        errorApartmentSetup: "The dwelling was created but could not be loaded in Home Assistant.",
        errorSafeRebuild: "This destination does not support a safe delete-and-rebuild.",
        errorDeleteUnsupported: "Safe deletion is not available for this destination.",
        allocationUnits: "Allocation units"
      }
    };
    return t[this._lang][key] ?? key;
  }

  async _loadData() {
    if (!this._hass) return;
    try {
      this._data = await this._hass.callWS({ type: "rental_consumption/get_data" });
      if (!this._selectedEntryId && this._data.entries?.length) {
        this._selectedEntryId = this._data.entries[0].entry_id;
      }
    } catch (error) {
      this._message = this._errorMessage(error);
    }
    this._render();
  }

  async _loadAnalysis(force = false) {
    const entry = this._entry;
    if (!this._hass || !entry || this._analysisLoading) return;
    if (!force && this._analysisData && this._analysisEntryId === entry.entry_id) return;
    this._analysisLoading = true;
    this._render();
    try {
      const payload = await this._hass.callWS({
        type: "rental_consumption/get_analysis_data",
        entry_id: entry.entry_id
      });
      if (this._entry?.entry_id === entry.entry_id) {
        this._analysisData = payload;
        this._analysisEntryId = entry.entry_id;
      }
    } catch (error) {
      this._message = this._errorMessage(error, this._t("analysisLoadError"));
    } finally {
      this._analysisLoading = false;
      this._render();
    }
  }

  _invalidateAnalysis() {
    this._analysisData = null;
    this._analysisEntryId = null;
  }

  get _entry() {
    return this._data?.entries?.find((entry) => entry.entry_id === this._selectedEntryId) || this._data?.entries?.[0];
  }

  _escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  _num(value, digits = 2) {
    if (value == null || Number.isNaN(Number(value))) return "—";
    return new Intl.NumberFormat(this._lang, { maximumFractionDigits: digits }).format(Number(value));
  }

  _date(value) {
    if (!value) return "—";
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }

  _dateTime(value) {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat(this._lang, { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
    } catch (_error) {
      return value;
    }
  }

  _typeLabel(type) {
    return ({ water: this._t("water"), hot_water: this._t("hotWater"), heating: this._t("heating"), electricity: this._t("electricity"), pv_electricity: this._t("pvElectricity") })[type] || type;
  }

  _distributionLabel(value) {
    return ({ uniform_daily: this._t("distributionUniform"), load_curve: this._t("distributionLoad"), outdoor_temperature: this._t("distributionTemperature") })[value] || value || "—";
  }

  _tariffLabel(value) {
    return value === "peak_offpeak" ? this._t("peakOffpeak") : this._t("single");
  }

  _helpIcon(helpKey) {
    const text = this._t(helpKey);
    return `<span class="help-icon" tabindex="0" role="img" aria-label="${this._escape(text)}" data-tooltip="${this._escape(text)}">?</span>`;
  }

  _fieldLabel(label, helpKey = null, options = {}) {
    const marker = options.required ? `<span class="required-marker" aria-label="${this._t("required")}">*</span>` : options.optional ? `<span class="optional-marker">${this._t("optional")}</span>` : "";
    return `<span class="field-label"><span>${label}${marker}</span>${helpKey ? this._helpIcon(helpKey) : ""}</span>`;
  }

  _entityPicker(name, value, deviceClass, helpKey) {
    const id = `picker-${name}`;
    return `<div class="entity-picker-wrap"><ha-entity-picker id="${id}" data-hidden-name="${name}" data-value="${this._escape(value || "")}" data-device-class="${deviceClass}" allow-custom-entity show-entity-id></ha-entity-picker><input class="entity-picker-fallback" data-picker-fallback="${name}" value="${this._escape(value || "")}" placeholder="sensor.exemple"><input type="hidden" name="${name}" value="${this._escape(value || "")}"><small>${this._t(helpKey)}</small></div>`;
  }

  _technicalDetail(raw) {
    const detail = String(raw ?? "").trim();
    if (!detail) return "";
    return `<details class="technical-details"><summary>${this._t("technicalDetails")}</summary><pre>${this._escape(detail)}</pre></details>`;
  }

  _errorPresentation(error) {
    const raw = String(error?.message || error || "");
    const code = classifyError(raw);
    const map = {
      tariff_total_mismatch: ["errorTariffTotal", null],
      tariff_cost_mismatch: ["errorTariffCost", null],
      invalid_tariff_values: ["errorTariffValues", null],
      end_before_start: ["errorEndBeforeStart", null],
      invalid_value: ["errorInvalidValue", null],
      invalid_cost: ["errorInvalidCost", null],
      period_not_found: ["errorPeriodNotFound", null],
      invalid_distribution: ["errorInvalidDistribution", null],
      invalid_base_temperature: ["errorInvalidBaseTemp", null],
      temperature_sensor_required: ["errorTemperatureSensorRequired", null],
      apartment_exists: ["errorApartmentExists", null],
      invalid_name: ["errorInvalidName", null],
      apartment_create_failed: ["errorApartmentCreate", null],
      apartment_setup_failed: ["errorApartmentSetup", null],
      read_failed: ["errorRead", "errorReadAction"],
      write_failed: ["errorWrite", "errorWriteAction"],
      delete_failed: ["errorDelete", "errorDeleteAction"],
      health_failed: ["errorHealth", "errorHealthAction"],
      recorder_unavailable: ["errorRecorder", "errorRecorderAction"],
      recorder_error: ["errorRecorder", "errorRecorderAction"],
      http_401: ["errorAuth", "errorAuthAction"],
      http_403: ["errorAuth", "errorAuthAction"],
      http_404: ["errorNotFound", "errorNotFoundAction"],
      timeout: ["errorTimeout", "errorTimeoutAction"],
      database_required: ["errorDatabaseRequired", null],
      org_bucket_required: ["errorOrgBucketRequired", null],
      overlap: ["errorOverlap", null],
      future_end: ["errorFutureEnd", null],
      export_not_configured: ["errorExportNotConfigured", null],
      safe_rebuild_not_supported: ["errorSafeRebuild", null],
      delete_not_supported: ["errorDeleteUnsupported", null]
    };
    const keys = map[code] || ["errorUnknown", null];
    return { code, text: this._t(keys[0]), action: keys[1] ? this._t(keys[1]) : "", detail: raw };
  }

  _errorMessage(error, prefix = "") {
    const info = this._errorPresentation(error);
    return { kind: "error", text: `${prefix}${prefix ? " " : ""}${info.text}`, action: info.action, detail: info.detail };
  }

  _messageMarkup() {
    if (!this._message) return "";
    return `<div class="message ${this._message.kind}" role="status" aria-live="polite"><div>${this._escape(this._message.text)}</div>${this._message.action ? `<div class="message-action"><strong>${this._t("suggestedAction")} :</strong> ${this._escape(this._message.action)}</div>` : ""}${this._message.detail ? this._technicalDetail(this._message.detail) : ""}</div>`;
  }

  _confirmDiscardChanges() {
    if (!this._settingsDirty && !this._exportDirty) return true;
    return confirm(this._t("unsavedPrompt"));
  }

  _coverageText(value) {
    const percent = coverageToPercent(value || 0);
    return percent >= 99.95 ? this._t("coverageAvailableFull") : `${this._num(percent, 1)} %`;
  }

  _render() {
    if (!this._data) {
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main><div class="loading">…</div></main>`;
      return;
    }
    const entry = this._entry;
    if (!entry) {
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main><h1>${this._t("title")}</h1><p>${this._t("noConfiguration")}</p></main>`;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main>
        <header class="page-header">
          <div><h1>${this._t("title")}</h1><p>${this._t("subtitle")}</p></div>
          <button class="icon-button" data-action="refresh" title="${this._t("refresh")}">↻</button>
        </header>
        ${this._messageMarkup()}
        <section class="card picker-card">
          <div class="picker-row">
            <label><span>${this._t("apartment")}</span><select id="entry-select">${this._data.entries.map((item) => `<option value="${item.entry_id}" ${item.entry_id === entry.entry_id ? "selected" : ""}>${this._escape(item.title)}</option>`).join("")}</select></label>
            <div class="apartment-actions">
              <button class="button" data-action="add-apartment" ${this._busyAction ? "disabled" : ""}>＋ ${this._t("addApartment")}</button>
              <button class="button" data-action="edit-apartment" ${this._busyAction ? "disabled" : ""}>✎ ${this._t("editApartment")}</button>
            </div>
          </div>
          <small class="picker-help">${this._t("apartmentHelp")}</small>
        </section>
        ${this._tabs()}
        ${this._activeTab === "overview" ? this._overview(entry) : ""}
        ${this._activeTab === "periods" ? this._periodsTab(entry) : ""}
        ${this._activeTab === "analysis" ? this._analysisTab(entry) : ""}
        ${this._activeTab === "settings" ? this._settingsTab(entry) : ""}
        ${this._apartmentDialog ? this._apartmentDialogMarkup(entry) : ""}
      </main>`;
    this._bind();
  }

  _apartmentDialogMarkup(entry) {
    const addMode = this._apartmentDialog === "add";
    const settings = entry.settings || {};
    return `
      <div class="modal-backdrop" data-action="close-apartment-dialog">
        <section class="modal-card" role="dialog" aria-modal="true" aria-label="${this._escape(this._t(addMode ? "addApartment" : "editApartment"))}" data-modal-card>
          <div class="section-header">
            <h2>${this._t(addMode ? "addApartment" : "editApartment")}</h2>
            <button type="button" class="icon-button" data-action="close-apartment-dialog" aria-label="${this._t("cancel")}">×</button>
          </div>
          <form id="apartment-form">
            <div class="form-grid">
              ${this._field(this._t("apartmentName"), `<input name="apartment_name" required value="${addMode ? "" : this._escape(entry.title)}" autofocus>`)}
              ${addMode ? this._field(this._t("heatingUnit"), `<select name="heating_unit"><option value="kWh" ${settings.heating_unit === "kWh" ? "selected" : ""}>kWh</option><option value="MWh" ${settings.heating_unit === "MWh" ? "selected" : ""}>MWh</option><option value="GJ" ${settings.heating_unit === "GJ" ? "selected" : ""}>GJ</option><option value="allocation_units" ${settings.heating_unit === "allocation_units" ? "selected" : ""}>${this._t("allocationUnits")}</option></select>`) : ""}
              ${addMode ? this._field(this._t("providerDefault"), `<input name="grid_operator" value="${this._escape(settings.grid_operator || "")}">`) : ""}
              ${addMode ? this._field(this._t("currency"), `<input name="currency" value="${this._escape(settings.currency || "CHF")}">`) : ""}
            </div>
            <div class="actions">
              <button type="button" class="button" data-action="close-apartment-dialog">${this._t("cancel")}</button>
              <button class="button primary" type="submit" ${this._busyAction ? "disabled" : ""}>${this._t(addMode ? "createApartment" : "renameApartment")}</button>
            </div>
          </form>
        </section>
      </div>`;
  }

  _tabs() {
    const tabs = [
      ["overview", this._t("overview")],
      ["periods", this._t("periods")],
      ["analysis", this._t("analysis")],
      ["settings", this._t("settings")]
    ];
    return `<nav class="tabs">${tabs.map(([id, label]) => `<button class="tab ${this._activeTab === id ? "active" : ""}" data-tab="${id}">${label}</button>`).join("")}</nav>`;
  }

  _overview(entry) {
    const types = ["water", "hot_water", "heating", "electricity", "pv_electricity"];
    const exportStatus = entry.export?.last_status || {};
    return `
      ${this._setupChecklist(entry)}
      ${this._overviewNotices(entry)}
      <section class="summary-grid">
        ${types.map((type) => this._summaryCard(entry, type)).join("")}
      </section>
      <section class="overview-grid">
        ${this._overviewAnalysisCard(entry, "electricity", false)}
        ${this._overviewAnalysisCard(entry, "heating", true)}
        <article class="card compact-card"><h2>${this._t("exportSettings")}</h2>${this._exportStatus(entry, exportStatus, true)}</article>
      </section>`;
  }

  _summaryCard(entry, type) {
    const count = Number(entry.counts?.[type] || 0);
    if (!count) {
      return `<article class="summary-card empty-summary"><span>${this._typeLabel(type)}</span><strong class="empty-title">${this._t("noPeriodEntered")}</strong><button class="button compact" data-action="add-period-type" data-type="${type}">${this._t("addFirstPeriod")}</button></article>`;
    }
    return `<article class="summary-card"><span>${this._typeLabel(type)}</span><strong>${this._num(entry.totals[type], 3)} <small>${this._escape(entry.units[type])}</small></strong><div>${this._num(entry.costs[type]?.total, 2)} ${this._escape(entry.units.currency)}</div><small>${entry.costs[type]?.average_unit_price == null ? "—" : `${this._num(entry.costs[type].average_unit_price, 4)} ${this._escape(entry.units.unit_prices[type])}`}</small></article>`;
  }

  _overviewAnalysisCard(entry, type, heating) {
    const count = Number(entry.counts?.[type] || 0);
    const title = this._typeLabel(type);
    if (!count) {
      const text = heating ? this._t("heatingNoPeriods") : this._t("noPeriodEntered");
      return `<article class="card compact-card"><h2>${title}</h2><div class="inline-empty"><span>${text}</span><button class="button compact" data-action="add-period-type" data-type="${type}">${this._t("addFirstPeriod")}</button></div></article>`;
    }
    if (heating && entry.heating_analysis?.configured_distribution === "outdoor_temperature" && !entry.settings?.outdoor_temperature_sensor) {
      return `<article class="card compact-card"><h2>${title}</h2><div class="inline-empty warning-inline"><span>${this._t("heatingSensorMissing")}</span><button class="button compact" data-action="open-settings">${this._t("configure")}</button></div></article>`;
    }
    return `<article class="card compact-card"><h2>${title}</h2>${this._analysisSummary(heating ? entry.heating_analysis : entry.electricity_analysis, heating)}</article>`;
  }

  _setupChecklist(entry) {
    const hasApartment = Boolean(entry?.entry_id);
    const hasPeriods = Number(entry?.counts?.all || 0) > 0;
    const needsLoadSensor = entry?.settings?.electricity_distribution === "load_curve" || Number(entry?.counts?.electricity || 0) > 0;
    const hasLoadSensor = !needsLoadSensor || Boolean(entry?.settings?.electricity_load_sensor);
    const exportConfigured = entry?.export?.backend && entry.export.backend !== "none";
    const exportReady = !exportConfigured || entry?.export?.last_status?.status === "ok";
    if (hasApartment && hasPeriods && hasLoadSensor && exportReady) return "";
    const steps = [
      { ok: hasApartment, label: this._t("setupApartment"), action: "setup-apartment", optional: false },
      { ok: hasLoadSensor, label: this._t("setupLoadSensor"), action: "setup-settings", optional: !needsLoadSensor },
      { ok: hasPeriods, label: this._t("setupFirstPeriod"), action: "setup-period", optional: false },
      { ok: exportConfigured && entry?.export?.last_status?.status === "ok", label: this._t("setupExternal"), action: "setup-export", optional: !exportConfigured },
    ];
    return `<section class="card setup-card"><div class="section-header"><div><h2>${this._t("setupTitle")}</h2><p class="muted">${this._t("setupIntro")}</p></div></div><div class="setup-steps">${steps.map((step) => `<div class="setup-step ${step.ok ? "done" : "pending"}"><span class="setup-check">${step.ok ? "✓" : (step.optional ? "○" : "•")}</span><div><strong>${step.label}</strong>${step.optional ? `<small>${this._t("setupOptional")}</small>` : ""}</div>${!step.ok ? `<button class="button compact" data-action="${step.action}">${this._t("configure")}</button>` : `<span class="setup-done">${this._t("setupDone")}</span>`}</div>`).join("")}</div></section>`;
  }

  _overviewNotices(entry) {
    const electricity = entry.electricity_analysis || {};
    const fallback = Number(electricity.fallback_periods || 0) > 0 || (electricity.configured_distribution === "load_curve" && electricity.effective_distribution !== "load_curve");
    const externalError = entry.export?.backend !== "none" && entry.export?.last_status?.status === "error";
    const alerts = [];
    if (fallback) {
      alerts.push(`<div class="context-alert warning-alert"><div><strong>${this._t("fallbackNotice")}</strong><div>${this._t("fallbackImpact")}</div></div><button class="button" data-action="open-settings">${this._t("openSettings")}</button></div>`);
    }
    if (externalError) {
      alerts.push(`<div class="context-alert error-alert"><div><strong>${this._t("externalErrorNotice")}</strong><div>${this._t("externalErrorImpact")}</div></div><button class="button" data-action="open-settings-advanced">${this._t("openSettings")}</button></div>`);
    }
    return alerts.join("");
  }

  _periodsTab(entry) {
    const years = [...new Set(entry.periods.map((period) => period.start_date.slice(0, 4)))].sort().reverse();
    const providers = [...new Set((entry.providers || []).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const filtered = entry.periods.filter((period) =>
      (this._historyType === "all" || period.consumption_type === this._historyType) &&
      (this._historyYear === "all" || period.start_date.startsWith(this._historyYear)) &&
      (this._historyProvider === "all" || (period.provider || "") === this._historyProvider)
    );
    return `
      ${this._periodForm(entry)}
      <section class="card history-card">
        <div class="section-header">
          <div><h2>${this._t("history")}</h2><span class="muted">${filtered.length} ${this._t("periods").toLowerCase()}</span></div>
          <div class="recorder-action">
            <button class="button subtle" data-action="rebuild" ${this._busyAction ? "disabled" : ""} aria-busy="${this._busyAction === "rebuild" ? "true" : "false"}" title="${this._escape(this._t("recorderHelp"))}">${this._busyAction === "rebuild" ? this._t("rebuildRunning") : this._t("rebuild")}</button>
            <small>${this._t("rebuildDescription")}</small>
          </div>
        </div>
        <div class="history-toolbar">
          <select id="history-type"><option value="all">${this._t("allTypes")}</option>${["electricity", "pv_electricity", "water", "hot_water", "heating"].map((type) => `<option value="${type}" ${this._historyType === type ? "selected" : ""}>${this._typeLabel(type)}</option>`).join("")}</select>
          <select id="history-year"><option value="all">${this._t("allYears")}</option>${years.map((year) => `<option value="${year}" ${this._historyYear === year ? "selected" : ""}>${year}</option>`).join("")}</select>
          <select id="history-provider"><option value="all">${this._t("allProviders")}</option>${providers.map((provider) => `<option value="${this._escape(provider)}" ${this._historyProvider === provider ? "selected" : ""}>${this._escape(provider)}</option>`).join("")}</select>
        </div>
        <div class="period-list">${filtered.length ? filtered.map((period) => this._periodRow(entry, period)).join("") : `<div class="empty">${this._t("noPeriods")}</div>`}</div>
      </section>`;
  }

  _analysisTab(entry) {
    if (this._analysisLoading) {
      return `<section class="card"><h2>${this._t("analysis")}</h2><div class="empty">${this._t("loadingAnalysis")}</div></section>`;
    }
    const data = this._analysisEntryId === entry.entry_id ? this._analysisData : null;
    if (!data) {
      return `<section class="card"><div class="section-header"><div><h2>${this._t("analysis")}</h2><p class="muted">${this._t("deterministicAnalysis")}</p></div><button class="button primary" data-action="load-analysis">${this._t("refreshAnalysis")}</button></div></section>`;
    }
    const typeData = data.types?.[this._analysisType] || {};
    const rows = typeData[this._analysisGranularity] || [];
    const metric = this._analysisMetric;
    const metricUnit = metric === "consumption" ? (typeData.unit || "") : metric === "cost" ? (typeData.currency || entry.units.currency) : (entry.units.unit_prices?.[this._analysisType] || "");
    const comparison = typeData.comparison || null;
    const latest = comparison?.latest || null;
    const changes = comparison?.changes || {};
    const trendLabel = ({up:this._t("trendUp"),down:this._t("trendDown"),stable:this._t("trendStable")})[typeData.trend] || "—";
    const mix = data.electricity_mix || [];
    const latestMix = mix.length ? mix[mix.length - 1] : null;
    return `
      <section class="card analysis-controls">
        <div class="section-header"><div><h2>${this._t("charts")}</h2><p class="muted">${this._t("deterministicAnalysis")}</p></div><button class="button" data-action="refresh-analysis">${this._t("refreshAnalysis")}</button></div>
        <div class="analysis-toolbar">
          <label><span>${this._t("analysisType")}</span><select id="analysis-type">${["electricity","pv_electricity","water","hot_water","heating"].map((type)=>`<option value="${type}" ${this._analysisType===type?"selected":""}>${this._typeLabel(type)}</option>`).join("")}</select></label>
          <label><span>${this._t("granularity")}</span><select id="analysis-granularity"><option value="period" ${this._analysisGranularity==="period"?"selected":""}>${this._t("byPeriod")}</option><option value="monthly" ${this._analysisGranularity==="monthly"?"selected":""}>${this._t("monthly")}</option><option value="annual" ${this._analysisGranularity==="annual"?"selected":""}>${this._t("annual")}</option></select></label>
          <label><span>${this._t("metric")}</span><select id="analysis-metric"><option value="consumption" ${metric==="consumption"?"selected":""}>${this._t("consumption")}</option><option value="cost" ${metric==="cost"?"selected":""}>${this._t("totalCost")}</option><option value="unit_price" ${metric==="unit_price"?"selected":""}>${this._t("unitPrice")}</option></select></label>
        </div>
      </section>
      <section class="analysis-kpi-grid">
        <article class="card compact-card"><span>${this._t("latestPeriod")}</span><strong>${latest ? `${this._num(latest.consumption,3)} ${this._escape(typeData.unit||"")}` : "—"}</strong><small>${latest ? `${this._date(latest.start_date)} – ${this._date(latest.end_date)}` : "—"}</small></article>
        <article class="card compact-card"><span>${this._t("normalizedUse")}</span><strong>${latest ? `${this._num(latest.daily_average,3)} ${this._escape(typeData.unit||"")}${this._t("perDay")}` : "—"}</strong>${this._changeBadge(changes.daily_average_pct)}</article>
        <article class="card compact-card"><span>${this._t("totalCost")}</span><strong>${latest?.cost == null ? "—" : `${this._num(latest.cost,2)} ${this._escape(typeData.currency||entry.units.currency)}`}</strong>${this._changeBadge(changes.cost_pct)}</article>
        <article class="card compact-card"><span>${this._t("unitPrice")}</span><strong>${latest?.unit_price == null ? "—" : `${this._num(latest.unit_price,4)} ${this._escape(entry.units.unit_prices?.[this._analysisType]||"")}`}</strong>${this._changeBadge(changes.unit_price_pct)}</article>
        <article class="card compact-card"><span>${this._t("trend")}</span><strong>${trendLabel}</strong><small>${this._t("vsPrevious")}</small></article>
      </section>
      <section class="card chart-card">
        <h2>${this._typeLabel(this._analysisType)} · ${metric === "consumption" ? this._t("consumption") : metric === "cost" ? this._t("totalCost") : this._t("unitPrice")}</h2>
        ${this._lineChart(rows, metric, metricUnit)}
      </section>
      ${(this._analysisType === "electricity" || this._analysisType === "pv_electricity") ? `<section class="card chart-card"><div class="section-header"><div><h2>${this._t("electricityMix")}</h2>${latestMix ? `<span class="muted">${this._t("pvShare")}: ${latestMix.pv_share == null ? "—" : `${this._num(latestMix.pv_share,1)} %`} · ${this._t("totalSupply")}: ${this._num(latestMix.total,2)} kWh</span>` : ""}</div></div>${this._mixChart(mix)}</section>` : ""}
      <section class="analysis-layout">
        <article class="card"><h2>${this._t("electricity")}</h2>${this._analysisDetails(entry.electricity_analysis, false)}</article>
        <article class="card"><h2>${this._t("heating")}</h2>${this._analysisDetails(entry.heating_analysis, true)}</article>
      </section>`;
  }

  _changeBadge(value) {
    if (value == null || Number.isNaN(Number(value))) return `<small class="muted">${this._t("vsPrevious")}: —</small>`;
    const numeric = Number(value);
    const sign = numeric > 0 ? "+" : "";
    const cls = Math.abs(numeric) < 0.05 ? "neutral" : numeric > 0 ? "up" : "down";
    return `<small class="change ${cls}">${sign}${this._num(numeric,1)} % ${this._t("vsPrevious")}</small>`;
  }

  _lineChart(rows, metric, unit) {
    const values = (rows || []).map((row) => ({ label: row.label || row.key, value: row[metric] })).filter((row) => row.value != null && Number.isFinite(Number(row.value)));
    if (!values.length) return `<div class="empty">${this._t("noAnalysisData")}</div>`;
    const width = 920, height = 300, left = 64, right = 24, top = 22, bottom = 54;
    const innerW = width-left-right, innerH = height-top-bottom;
    const max = Math.max(...values.map((item)=>Number(item.value)), 0);
    const min = 0;
    const range = max-min || 1;
    const x = (index) => left + (values.length === 1 ? innerW/2 : index*innerW/(values.length-1));
    const y = (value) => top + innerH - ((Number(value)-min)/range)*innerH;
    const points = values.map((item,index)=>`${x(index).toFixed(1)},${y(item.value).toFixed(1)}`).join(" ");
    const tickEvery = Math.max(1, Math.ceil(values.length/8));
    const yTicks = Array.from({length:5},(_,i)=>max*i/4);
    return `<div class="svg-chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${this._escape(unit)}">
      ${yTicks.map((tick)=>{const yy=y(tick);return `<line x1="${left}" x2="${width-right}" y1="${yy}" y2="${yy}" class="grid-line"/><text x="${left-10}" y="${yy+4}" text-anchor="end" class="axis-text">${this._escape(this._num(tick, metric==="unit_price"?4:2))}</text>`}).join("")}
      <polyline points="${points}" class="chart-line"/>
      ${values.map((item,index)=>`<circle cx="${x(index)}" cy="${y(item.value)}" r="3.5" class="chart-point"><title>${this._escape(item.label)}: ${this._escape(this._num(item.value,metric==="unit_price"?4:2))} ${this._escape(unit)}</title></circle>`).join("")}
      ${values.map((item,index)=>index%tickEvery===0||index===values.length-1?`<text x="${x(index)}" y="${height-18}" text-anchor="middle" class="axis-text x-label">${this._escape(item.label)}</text>`:"").join("")}
    </svg><div class="chart-unit">${this._escape(unit)}</div></div>`;
  }

  _mixChart(rows) {
    const values = (rows || []).filter((row)=>Number(row.total||0)>0);
    if (!values.length) return `<div class="empty">${this._t("noAnalysisData")}</div>`;
    const width=920,height=300,left=64,right=24,top=22,bottom=54,innerW=width-left-right,innerH=height-top-bottom;
    const max=Math.max(...values.map((row)=>Number(row.total||0)),1);
    const slot=innerW/values.length;
    const barW=Math.min(46,slot*0.64);
    const y=(value)=>top+innerH-(Number(value)/max)*innerH;
    const tickEvery=Math.max(1,Math.ceil(values.length/8));
    return `<div class="svg-chart"><div class="chart-legend"><span><i class="legend-grid"></i>${this._t("gridSupply")}</span><span><i class="legend-pv"></i>${this._t("pvSupply")}</span></div><svg viewBox="0 0 ${width} ${height}">
      ${Array.from({length:5},(_,i)=>{const tick=max*i/4,yy=y(tick);return `<line x1="${left}" x2="${width-right}" y1="${yy}" y2="${yy}" class="grid-line"/><text x="${left-10}" y="${yy+4}" text-anchor="end" class="axis-text">${this._escape(this._num(tick,1))}</text>`}).join("")}
      ${values.map((row,index)=>{const xx=left+slot*index+(slot-barW)/2;const grid=Number(row.grid||0),pv=Number(row.pv||0);const gridH=innerH*grid/max,pvH=innerH*pv/max;return `<rect x="${xx}" y="${top+innerH-gridH}" width="${barW}" height="${gridH}" class="bar-grid"><title>${this._t("gridSupply")}: ${this._num(grid,2)} kWh</title></rect><rect x="${xx}" y="${top+innerH-gridH-pvH}" width="${barW}" height="${pvH}" class="bar-pv"><title>${this._t("pvSupply")}: ${this._num(pv,2)} kWh</title></rect>${index%tickEvery===0||index===values.length-1?`<text x="${xx+barW/2}" y="${height-18}" text-anchor="middle" class="axis-text x-label">${this._escape(row.label)}</text>`:""}`}).join("")}
    </svg><div class="chart-unit">kWh</div></div>`;
  }

  _settingsTab(entry) {
    const settings = entry.settings;
    const exportSettings = entry.export || {};
    const minCoveragePercent = coverageToPercent(settings.load_curve_min_coverage ?? 0.9);
    return `
      <form id="settings-form">
        <section class="card settings-card">
          <div class="section-header"><div><h2>${this._t("general")}</h2></div></div>
          <div class="form-grid">
            ${this._field(this._t("providerDefault"), `<input name="grid_operator" value="${this._escape(settings.grid_operator || "")}">`, { helpKey: "providerHelp", optional: true })}
            ${this._field(this._t("currency"), `<input name="currency" value="${this._escape(settings.currency || "CHF")}" required>`, { required: true })}
          </div>
        </section>
        <section class="card settings-card">
          <h2>${this._t("heatingSettings")}</h2>
          <div class="form-grid">
            ${this._field(this._t("heatingDistribution"), `<select name="heating_distribution"><option value="uniform_daily" ${settings.heating_distribution === "uniform_daily" ? "selected" : ""}>${this._t("uniform")}</option><option value="outdoor_temperature" ${settings.heating_distribution === "outdoor_temperature" ? "selected" : ""}>${this._t("degreeDays")}</option></select>`, { helpKey: "configuredDistributionHelp", required: true })}
            ${this._field(this._t("outdoorSensor"), this._entityPicker("outdoor_temperature_sensor", settings.outdoor_temperature_sensor || "", "temperature", "entityTemperatureHelp"), { helpKey: "entityTemperatureHelp", optional: true })}
          </div>
        </section>
        <section class="card settings-card">
          <h2>${this._t("electricitySettings")}</h2>
          <div class="form-grid">
            ${this._field(this._t("electricityDistribution"), `<select name="electricity_distribution"><option value="uniform_daily" ${settings.electricity_distribution === "uniform_daily" ? "selected" : ""}>${this._t("uniform")}</option><option value="load_curve" ${settings.electricity_distribution === "load_curve" ? "selected" : ""}>${this._t("loadCurve")}</option></select>`, { helpKey: "loadCurveHelp", required: true })}
            ${this._field(this._t("loadSensor"), this._entityPicker("electricity_load_sensor", settings.electricity_load_sensor || "", "power", "entityPowerHelp"), { helpKey: "entityPowerHelp", optional: true })}
          </div>
        </section>
        <section class="card settings-card advanced-toggle-card">
          <button class="button subtle advanced-toggle" type="button" data-action="toggle-advanced">${this._advancedSettingsOpen ? "▾" : "▸"} ${this._t("advancedSettings")}</button>
          <div id="advanced-settings-content" class="advanced-content ${this._advancedSettingsOpen ? "" : "hidden"}">
            <div class="form-grid">
              ${this._field(this._t("baseTemp"), `<input name="heating_base_temperature" type="number" min="5" max="30" step="0.1" value="${this._escape(settings.heating_base_temperature ?? 20)}">`, { helpKey: "baseTempHelp", optional: true })}
              ${this._field(this._t("loadSource"), `<select name="load_curve_source"><option value="auto" ${settings.load_curve_source === "auto" ? "selected" : ""}>${this._t("auto")}</option><option value="victoriametrics" ${settings.load_curve_source === "victoriametrics" ? "selected" : ""}>${this._t("victoriametrics")}</option><option value="recorder" ${settings.load_curve_source === "recorder" ? "selected" : ""}>${this._t("recorder")}</option></select>`, { helpKey: "loadSourceHelp", optional: true })}
              ${this._field(this._t("minCoverage"), `<div class="input-unit"><input name="load_curve_min_coverage_percent" type="number" min="10" max="100" step="1" value="${this._escape(minCoveragePercent)}"><span>%</span></div>`, { helpKey: "minCoverageHelp", optional: true })}
              ${this._field(this._t("vmMetric"), `<input name="vm_load_metric" value="${this._escape(settings.vm_load_metric || "W_value")}">`, { helpKey: "vmMetricHelp", optional: true })}
              ${this._field(this._t("vmDb"), `<input name="vm_load_db_label" value="${this._escape(settings.vm_load_db_label || "homeassistant")}">`, { helpKey: "vmDbHelp", optional: true })}
            </div>
            <div class="help">${this._t("loadHelp")}</div>
          </div>
        </section>
        <div class="unsaved-warning ${this._settingsDirty ? "" : "hidden"}" data-unsaved="settings">● ${this._t("unsavedChanges")}</div>
        <div class="sticky-actions"><button class="button primary" type="submit" ${this._busyAction ? "disabled" : ""}>${this._t("saveGeneral")}</button></div>
      </form>
      <div id="advanced-export-wrapper" class="${this._advancedSettingsOpen ? "" : "hidden"}">${this._exportSettingsCard(entry, exportSettings)}</div>`;
  }
  _exportSettingsCard(entry, exportSettings) {
    const backend = exportSettings.backend || "none";
    const status = exportSettings.last_status || {};
    return `
      <section class="card settings-card" id="export-card">
        <div class="section-header"><div><h2>${this._t("exportSettings")}</h2><p class="muted">${this._t("baseExternalHelp")}</p></div></div>
        <form id="export-form">
          <div class="form-grid">
            ${this._field(this._t("exportBackend"), `<select name="export_backend" id="export-backend"><option value="none" ${backend === "none" ? "selected" : ""}>${this._t("none")}</option><option value="victoriametrics" ${backend === "victoriametrics" ? "selected" : ""}>VictoriaMetrics</option><option value="influxdb_v1" ${backend === "influxdb_v1" ? "selected" : ""}>InfluxDB 1.x</option><option value="influxdb_v2" ${backend === "influxdb_v2" ? "selected" : ""}>InfluxDB 2.x</option><option value="influxdb_v3" ${backend === "influxdb_v3" ? "selected" : ""}>InfluxDB 3.x</option></select>`, { required: true })}
            <label class="backend-field" data-backends="victoriametrics influxdb_v1 influxdb_v2 influxdb_v3">${this._fieldLabel(this._t("url"), null, { required: true })}<input name="export_url" value="${this._escape(exportSettings.url || "")}" placeholder="http://192.168.1.10:8428"></label>
            <label class="backend-field" data-backends="influxdb_v1 influxdb_v3">${this._fieldLabel(this._t("database"), null, { required: true })}<input name="export_database" value="${this._escape(exportSettings.database || "")}"></label>
            <label class="backend-field" data-backends="influxdb_v2">${this._fieldLabel(this._t("organization"), null, { required: true })}<input name="export_org" value="${this._escape(exportSettings.org || "")}"></label>
            <label class="backend-field" data-backends="influxdb_v2">${this._fieldLabel(this._t("bucket"), null, { required: true })}<input name="export_bucket" value="${this._escape(exportSettings.bucket || "")}"></label>
          </div>
          <details class="backend-options backend-field" data-backends="victoriametrics influxdb_v1 influxdb_v2 influxdb_v3">
            <summary>${this._t("optionalAuth")}</summary>
            <div class="form-grid options-grid">
              <label class="backend-field" data-backends="victoriametrics">${this._fieldLabel(this._t("database"), null, { optional: true })}<input name="export_database_vm" value="${this._escape(exportSettings.database || "")}"></label>
              <label class="backend-field" data-backends="influxdb_v1">${this._fieldLabel(this._t("retention"), null, { optional: true })}<input name="export_retention_policy" value="${this._escape(exportSettings.retention_policy || "")}"></label>
              <label class="backend-field" data-backends="victoriametrics influxdb_v1">${this._fieldLabel(this._t("username"), null, { optional: true })}<input name="export_username" value="${this._escape(exportSettings.username || "")}"></label>
              <label class="backend-field" data-backends="victoriametrics influxdb_v1">${this._fieldLabel(this._t("password"), null, { optional: true })}<input name="export_password" type="password" placeholder="${exportSettings.has_password ? "••••••••" : ""}"></label>
              <label class="backend-field" data-backends="victoriametrics influxdb_v2 influxdb_v3">${this._fieldLabel(this._t("token"), "tokenHelp", { optional: true })}<input name="export_token" type="password" placeholder="${exportSettings.has_token ? "••••••••" : ""}"></label>
              <label class="backend-field" data-backends="victoriametrics">${this._fieldLabel(this._t("deleteKey"), "deleteKeyHelp", { optional: true })}<input name="export_delete_auth_key" type="password" placeholder="${exportSettings.has_delete_auth_key ? "••••••••" : ""}"></label>
              <label class="check wide backend-field" data-backends="victoriametrics influxdb_v1 influxdb_v2"><input name="export_auto_sync" type="checkbox" ${exportSettings.auto_sync ? "checked" : ""}> ${this._t("autoSync")}</label>
            </div>
          </details>
          <div class="help backend-field" data-backends="victoriametrics">${this._t("vmHelp")}</div>
          <div class="warning backend-field" data-backends="influxdb_v3">${this._t("v3Warning")}</div>
          <div class="unsaved-warning ${this._exportDirty ? "" : "hidden"}" data-unsaved="export">● ${this._t("unsavedChanges")}</div>
          <div class="export-actions">
            <button class="button" type="submit" ${this._busyAction ? "disabled" : ""}>${this._t("save")}</button>
            <button class="button primary" type="button" data-action="test-export" ${this._busyAction ? "disabled" : ""}>${this._busyAction === "test-export" ? this._t("testing") : this._t("test")}</button>
            <button class="button" type="button" data-action="sync-export" ${(this._busyAction || !exportSettings.capabilities?.supports_safe_rebuild) ? "disabled" : ""}>${this._busyAction === "sync-export" ? this._t("syncing") : this._t("sync")}</button>
          </div>
          <div class="action-description">${this._t("syncDescription")}</div>
        </form>
        ${this._exportStatus(entry, status, false)}
      </section>`;
  }
  _exportStatus(entry, status, compact) {
    const steps = status.steps || {};
    const level = exportStatusLevel(status.status || "never", steps);
    const stateLabel = status.status === "testing" ? this._t("statusTesting") : level === "ok" ? this._t("statusOk") : level === "warning" ? this._t("statusPartial") : level === "error" ? this._t("statusError") : this._t("never");
    const stepLabels = { health: this._t("health"), write: this._t("write"), read: this._t("read"), delete: this._t("deleteStep"), rebuild: this._t("rebuildStep") };
    const errorInfo = status.status === "error" && status.message ? this._errorPresentation(status.message) : null;
    return `<div class="export-status ${compact ? "compact-status" : ""} level-${level}">
      <div class="status-head"><span class="status-dot ${level}"></span><strong>${stateLabel}</strong><span class="muted">${status.at ? this._dateTime(status.at) : ""}</span></div>
      ${errorInfo ? `<div class="status-message">${this._escape(errorInfo.text)}</div>${errorInfo.action ? `<div class="status-action"><strong>${this._t("suggestedAction")} :</strong> ${this._escape(errorInfo.action)}</div>` : ""}${this._technicalDetail(errorInfo.detail)}` : ""}
      ${status.message && status.status === "ok" && status.message.startsWith("full_sync:") ? `<div class="status-message">${this._t("syncSuccess")}</div>` : ""}
      ${Object.keys(steps).length ? `<div class="status-steps">${Object.entries(steps).map(([key, value]) => `<span class="step ${value === "ok" ? "ok" : "error"}">${this._escape(stepLabels[key] || key)} : ${value === "ok" ? this._t("stepOk") : this._t("stepFailed")}</span>`).join("")}</div>` : ""}
      ${entry.export?.backend === "none" && compact ? `<div class="muted">${this._t("exportInactive")}</div>` : ""}
    </div>`;
  }
  _analysisSummary(analysis, heating) {
    const coverage = heating ? analysis?.temperature_coverage : analysis?.coverage;
    const uniformHeating = heating && analysis?.configured_distribution === "uniform_daily";
    const coverageText = uniformHeating ? this._t("coverageNotRequired") : this._coverageText(coverage);
    const sourceText = uniformHeating ? this._t("notRequired") : (heating ? (analysis?.outdoor_temperature_sensor || "—") : (analysis?.source || "—"));
    return `<div class="analysis-mini">
      <div><span>${this._t("effectiveDistribution")} ${this._helpIcon("effectiveDistributionHelp")}</span><strong>${this._distributionLabel(analysis?.effective_distribution)}</strong></div>
      <div><span>${this._t("coverageAvailable")} ${this._helpIcon("coverageHelp")}</span><strong>${this._escape(coverageText)}</strong></div>
      <div><span>${this._t("source")} ${!heating ? this._helpIcon("loadSourceHelp") : ""}</span><strong>${this._escape(sourceText)}</strong></div>
    </div>`;
  }
  _analysisDetails(analysis, heating) {
    const coverage = heating ? analysis?.temperature_coverage : analysis?.coverage;
    const uniformHeating = heating && analysis?.configured_distribution === "uniform_daily";
    const coverageText = uniformHeating ? this._t("coverageNotRequired") : this._coverageText(coverage);
    return `<div class="analysis-grid">
      <div><span>${this._t("configuredDistribution")} ${this._helpIcon("configuredDistributionHelp")}</span><strong>${this._distributionLabel(analysis?.configured_distribution)}</strong></div>
      <div><span>${this._t("effectiveDistribution")} ${this._helpIcon("effectiveDistributionHelp")}</span><strong>${this._distributionLabel(analysis?.effective_distribution)}</strong></div>
      <div><span>${this._t("coverageAvailable")} ${this._helpIcon("coverageHelp")}</span><strong>${this._escape(coverageText)}</strong></div>
      <div><span>${this._t("weightedPeriods")} ${this._helpIcon("weightedPeriodsHelp")}</span><strong>${analysis?.weighted_periods || 0}</strong></div>
      <div><span>${this._t("fallbackPeriods")} ${this._helpIcon("uniformPeriodsHelp")}</span><strong>${analysis?.fallback_periods || 0}</strong></div>
      ${heating ? `<div><span>${this._t("meanTemperature")}</span><strong>${uniformHeating ? this._t("notRequired") : (analysis?.mean_outdoor_temperature == null ? "—" : `${this._num(analysis.mean_outdoor_temperature, 1)} °C`)}</strong></div>` : `<div><span>${this._t("source")} ${this._helpIcon("loadSourceHelp")}</span><strong>${this._escape(analysis?.source || "—")}</strong></div>`}
    </div>`;
  }
  _periodForm(entry) {
    const period = this._editingPeriodId ? entry.periods.find((item) => item.period_id === this._editingPeriodId) : null;
    const type = period?.consumption_type || this._newPeriodType || "electricity";
    const tariff = period?.tariff_mode || "single";
    const provider = period
      ? (period.provider || "")
      : (entry.settings.grid_operator || entry.providers?.[0] || "");
    const duration = periodDurationDays(period?.start_date || "", period?.end_date || "");
    const unitPrice = period?.unit_price == null ? "" : this._formatInputNumber(period.unit_price, 6);
    return `<section class="card edit-card">
      <div class="section-header"><h2>${period ? this._t("editPeriod") : this._t("addPeriod")}</h2>${period ? `<button class="button subtle" data-action="cancel-edit">${this._t("cancel")}</button>` : ""}</div>
      <form id="period-form"><div class="form-grid">
        ${this._field(this._t("type"), `<select name="consumption_type" id="consumption-type">${["electricity", "pv_electricity", "water", "hot_water", "heating"].map((item) => `<option value="${item}" ${type === item ? "selected" : ""}>${this._typeLabel(item)}</option>`).join("")}</select>`)}
        ${this._dateField(this._t("start"), "start_date", period?.start_date || "", { required: true })}
        ${this._dateField(this._t("end"), "end_date", period?.end_date || "", { required: true, helpKey: "endIncludedHelp" })}
        ${this._field(this._t("provider"), `<input name="provider" value="${this._escape(provider)}" placeholder="${this._escape(entry.settings.grid_operator || "")}">`, { helpKey: "providerHelp", optional: true })}
        <div class="period-duration wide"><span>${this._t("periodDuration")}: <strong id="period-duration-value">${duration == null ? "—" : `${duration} ${this._t("daysLong")}`}</strong></span><small>${this._t("endIncludedHelp")}</small></div>
        ${this._field(this._t("consumption"), `<div class="input-unit"><input id="period-value" name="value" type="number" min="0.001" step="any" value="${period?.value ?? ""}" required><span id="value-unit">${this._escape(entry.units[type])}</span></div>`)}
        ${this._field(this._t("totalCost"), `<div class="input-unit"><input id="period-cost" name="cost" type="number" min="0" step="any" value="${period?.cost ?? ""}"><span>${this._escape(entry.units.currency)}</span></div>`, { optional: true })}
        ${this._field(this._t("unitPriceInput"), `<div class="input-unit"><input id="period-unit-price" name="unit_price_ui" type="number" min="0" step="any" value="${unitPrice}"><span id="unit-price-unit">${this._escape(entry.units.unit_prices[type])}</span></div>`, { optional: true })}
        <div class="help wide pricing-help">${this._t("costPriceHelp")}</div>
        <label id="tariff-field">${this._fieldLabel(this._t("tariff"), "singleTariffHelp")}<select name="tariff_mode" id="tariff-mode"><option value="single" ${tariff === "single" ? "selected" : ""}>${this._t("single")}</option><option value="peak_offpeak" ${tariff === "peak_offpeak" ? "selected" : ""}>${this._t("peakOffpeak")}</option></select></label>
        <div id="dual-tariff" class="tariff-grid wide ${tariff === "peak_offpeak" && type === "electricity" ? "" : "hidden"}">
          ${this._field(this._t("peakConsumption"), `<input name="peak_value" type="number" min="0" step="any" value="${period?.peak_value ?? ""}">`)}
          ${this._field(this._t("offpeakConsumption"), `<input name="offpeak_value" type="number" min="0" step="any" value="${period?.offpeak_value ?? ""}">`)}
          ${this._field(this._t("peakCost"), `<input name="peak_cost" type="number" min="0" step="any" value="${period?.peak_cost ?? ""}">`)}
          ${this._field(this._t("offpeakCost"), `<input name="offpeak_cost" type="number" min="0" step="any" value="${period?.offpeak_cost ?? ""}">`)}
          <div class="help wide">${this._t("tariffHelp")}</div>
        </div>
        <label class="wide"><span>${this._t("note")}</span><textarea name="note" rows="2">${this._escape(period?.note || "")}</textarea></label>
      </div><div class="actions"><button class="button primary" ${this._busyAction ? "disabled" : ""}>${period ? this._t("edit") : this._t("add")}</button></div></form>
    </section>`;
  }

  _dateField(label, name, value, options = {}) {
    return `<label>${this._fieldLabel(label, options.helpKey || null, options)}<div class="date-picker-wrap"><ha-date-input data-date-name="${name}" data-value="${this._escape(value)}" data-required="${options.required ? "1" : "0"}"></ha-date-input><input class="date-picker-fallback" data-date-fallback="${name}" type="date" value="${this._escape(value)}" ${options.required ? "required" : ""}><input type="hidden" name="${name}" value="${this._escape(value)}"></div></label>`;
  }

  _formatInputNumber(value, decimals = 6) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    return number.toFixed(decimals).replace(/\.?0+$/, "");
  }

  _updatePeriodDuration() {
    const start = this.shadowRoot.querySelector('input[type="hidden"][name="start_date"]')?.value || "";
    const end = this.shadowRoot.querySelector('input[type="hidden"][name="end_date"]')?.value || "";
    const days = periodDurationDays(start, end);
    const target = this.shadowRoot.querySelector("#period-duration-value");
    if (target) target.textContent = days == null ? "—" : `${days} ${this._t("daysLong")}`;
  }

  _syncPeriodPricing(driver = this._priceDriver) {
    const consumption = this.shadowRoot.querySelector("#period-value");
    const cost = this.shadowRoot.querySelector("#period-cost");
    const unitPrice = this.shadowRoot.querySelector("#period-unit-price");
    if (!consumption || !cost || !unitPrice) return;
    if (driver === "unit_price") {
      const calculated = calculateTotalCost(consumption.value, unitPrice.value);
      if (calculated != null) cost.value = this._formatInputNumber(calculated, 2);
      else if (!unitPrice.value || !(Number(consumption.value) > 0)) cost.value = "";
    } else {
      const calculated = calculateUnitPrice(consumption.value, cost.value);
      if (calculated != null) unitPrice.value = this._formatInputNumber(calculated, 6);
      else if (!cost.value || !(Number(consumption.value) > 0)) unitPrice.value = "";
    }
  }

  _setupDatePickers() {
    const bindFallbacks = () => {
      this.shadowRoot.querySelectorAll("[data-date-fallback]").forEach((fallback) => {
        if (fallback.dataset.bound === "1") return;
        fallback.dataset.bound = "1";
        fallback.addEventListener("change", () => {
          const hidden = this.shadowRoot.querySelector(`input[type="hidden"][name="${fallback.dataset.dateFallback}"]`);
          if (hidden) hidden.value = fallback.value || "";
          this._updatePeriodDuration();
        });
      });
    };
    bindFallbacks();
    customElements.whenDefined("ha-date-input").then(() => {
      this.shadowRoot.querySelectorAll("ha-date-input[data-date-name]").forEach((picker) => {
        if (!picker.isConnected || picker.dataset.bound === "1") return;
        picker.dataset.bound = "1";
        picker.locale = this._hass?.locale;
        picker.value = picker.dataset.value || "";
        picker.required = picker.dataset.required === "1";
        const fallback = picker.parentElement?.querySelector(`[data-date-fallback="${picker.dataset.dateName}"]`);
        if (fallback) fallback.classList.add("hidden");
        picker.addEventListener("value-changed", (event) => {
          const value = event.detail?.value || "";
          const hidden = this.shadowRoot.querySelector(`input[type="hidden"][name="${picker.dataset.dateName}"]`);
          if (hidden) hidden.value = value;
          if (fallback) fallback.value = value;
          this._updatePeriodDuration();
        });
      });
    });
  }

  _field(label, control, options = {}) {
    return `<label>${this._fieldLabel(label, options.helpKey || null, options)}${control}</label>`;
  }
  _periodRow(entry, period) {
    const analysis = period.electricity_analysis || period.heating_analysis || {};
    const coverage = analysis.coverage ?? analysis.temperature_coverage;
    return `<article class="period-row">
      <div class="period-main"><div class="type-icon">${period.consumption_type === "electricity" ? "⚡" : period.consumption_type === "pv_electricity" ? "☀️" : period.consumption_type === "heating" ? "♨" : "💧"}</div><div><strong>${this._typeLabel(period.consumption_type)}</strong><span>${this._date(period.start_date)} – ${this._date(period.end_date)} · ${period.days} ${this._t("daysShort")}</span><small class="provider-line">${this._escape(period.provider || this._t("noProvider"))}</small></div></div>
      <div class="metric"><span>${this._t("consumption")}</span><strong>${this._num(period.value, 3)} ${this._escape(entry.units[period.consumption_type])}</strong><small>${this._num(period.daily_average, 3)}${this._t("perDay")}</small></div>
      <div class="metric"><span>${this._t("totalCost")}</span><strong>${period.cost == null ? "—" : `${this._num(period.cost, 2)} ${this._escape(entry.units.currency)}`}</strong><small>${period.unit_price == null ? "—" : `${this._num(period.unit_price, 4)} ${this._escape(entry.units.unit_prices[period.consumption_type])}`}</small></div>
      <div class="badges">${period.consumption_type === "electricity" ? `<span class="badge" title="${this._escape(period.tariff_mode === "single" ? this._t("singleTariffHelp") : this._t("tariffHelp"))}">${this._t("badgeTariff")} : ${this._tariffLabel(period.tariff_mode)}</span>` : ""}<span class="badge" title="${this._escape(this._t("loadCurveHelp"))}">${this._t("badgeMethod")} : ${this._distributionLabel(analysis.distribution || "uniform_daily")}</span>${analysis.source ? `<span class="badge accent" title="${this._escape(this._t("loadSourceHelp"))}">${this._t("badgeSource")} : ${this._escape(analysis.source)}</span>` : ""}${coverage != null ? `<span class="badge" title="${this._escape(this._t("coverageHelp"))}">${this._t("badgeData")} : ${this._num(coverageToPercent(coverage), 0)}%</span>` : ""}</div>
      <div class="period-actions"><button class="button compact" data-action="edit" data-id="${period.period_id}">${this._t("edit")}</button><button class="button danger compact" data-action="delete" data-id="${period.period_id}">${this._t("delete")}</button></div>
      ${period.tariff_mode === "peak_offpeak" ? `<div class="tariff-detail"><span>${this._t("peakLabel")}: <b>${this._num(period.peak_value, 3)} kWh</b>${period.peak_cost != null ? ` · ${this._num(period.peak_cost, 2)} ${entry.units.currency}` : ""}</span><span>${this._t("offpeakLabel")}: <b>${this._num(period.offpeak_value, 3)} kWh</b>${period.offpeak_cost != null ? ` · ${this._num(period.offpeak_cost, 2)} ${entry.units.currency}` : ""}</span></div>` : ""}
      ${period.note ? `<div class="period-note">${this._escape(period.note)}</div>` : ""}
    </article>`;
  }

  _markDirty(kind) {
    if (kind === "settings") this._settingsDirty = true;
    if (kind === "export") this._exportDirty = true;
    this.shadowRoot.querySelector(`[data-unsaved="${kind}"]`)?.classList.remove("hidden");
  }

  _setupEntityPickers() {
    customElements.whenDefined("ha-entity-picker").then(() => {
      this.shadowRoot.querySelectorAll("ha-entity-picker[data-hidden-name]").forEach((picker) => {
        if (!picker.isConnected || picker.dataset.bound === "1") return;
        picker.dataset.bound = "1";
        picker.includeDomains = ["sensor"];
        picker.includeDeviceClasses = [picker.dataset.deviceClass];
        picker.value = picker.dataset.value || "";
        picker.allowCustomEntity = true;
        picker.showEntityId = true;
        const hidden = this.shadowRoot.querySelector(`input[type="hidden"][name="${picker.dataset.hiddenName}"]`);
        picker.addEventListener("value-changed", (event) => {
          if (hidden) hidden.value = event.detail?.value || "";
          this._markDirty("settings");
        });
      });
    });
  }

  _bind() {
    this.shadowRoot.querySelector('[data-action="refresh"]')?.addEventListener("click", async () => {
      if (!this._confirmDiscardChanges()) return;
      this._settingsDirty = false;
      this._exportDirty = false;
      this._invalidateAnalysis();
      await this._loadData();
      if (this._activeTab === "analysis") await this._loadAnalysis(true);
    });
    this.shadowRoot.querySelector('[data-action="add-apartment"]')?.addEventListener("click", () => { this._apartmentDialog = "add"; this._render(); });
    this.shadowRoot.querySelector('[data-action="edit-apartment"]')?.addEventListener("click", () => { this._apartmentDialog = "edit"; this._render(); });
    this.shadowRoot.querySelectorAll('[data-action="close-apartment-dialog"]').forEach((element) => element.addEventListener("click", (event) => {
      if (event.target.closest?.("[data-modal-card]") && event.currentTarget.classList.contains("modal-backdrop")) return;
      this._apartmentDialog = null;
      this._render();
    }));
    this.shadowRoot.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) { this._apartmentDialog = null; this._render(); }
    });
    this.shadowRoot.querySelector("#apartment-form")?.addEventListener("submit", (event) => this._handleApartment(event));
    this.shadowRoot.querySelector("#entry-select")?.addEventListener("change", (event) => {
      if (!this._confirmDiscardChanges()) { this._render(); return; }
      this._settingsDirty = false;
      this._exportDirty = false;
      this._selectedEntryId = event.target.value;
      this._editingPeriodId = null;
      this._historyProvider = "all";
      this._invalidateAnalysis();
      this._render();
      if (this._activeTab === "analysis") this._loadAnalysis();
    });
    this.shadowRoot.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
      if (this._activeTab === "settings" && button.dataset.tab !== "settings" && !this._confirmDiscardChanges()) return;
      if (button.dataset.tab !== "settings") { this._settingsDirty = false; this._exportDirty = false; }
      this._activeTab = button.dataset.tab;
      this._message = null;
      this._render();
      if (this._activeTab === "analysis") this._loadAnalysis();
    }));
    this.shadowRoot.querySelector('[data-action="open-settings"]')?.addEventListener("click", () => { this._activeTab = "settings"; this._render(); });
    this.shadowRoot.querySelector('[data-action="open-settings-advanced"]')?.addEventListener("click", () => { this._activeTab = "settings"; this._advancedSettingsOpen = true; this._render(); });
    this.shadowRoot.querySelectorAll('[data-action="add-period-type"]').forEach((button) => button.addEventListener("click", () => {
      this._newPeriodType = button.dataset.type || "electricity";
      this._editingPeriodId = null;
      this._activeTab = "periods";
      this._render();
      this.shadowRoot.querySelector(".edit-card")?.scrollIntoView({ behavior: "smooth" });
    }));
    this.shadowRoot.querySelector('[data-action="setup-apartment"]')?.addEventListener("click", () => { this._apartmentDialog = "add"; this._render(); });
    this.shadowRoot.querySelector('[data-action="setup-settings"]')?.addEventListener("click", () => { this._activeTab = "settings"; this._render(); });
    this.shadowRoot.querySelector('[data-action="setup-period"]')?.addEventListener("click", () => { this._newPeriodType = "electricity"; this._activeTab = "periods"; this._render(); });
    this.shadowRoot.querySelector('[data-action="setup-export"]')?.addEventListener("click", () => { this._activeTab = "settings"; this._advancedSettingsOpen = true; this._render(); });
    this.shadowRoot.querySelector('[data-action="toggle-advanced"]')?.addEventListener("click", (event) => {
      this._advancedSettingsOpen = !this._advancedSettingsOpen;
      this.shadowRoot.querySelector("#advanced-settings-content")?.classList.toggle("hidden", !this._advancedSettingsOpen);
      this.shadowRoot.querySelector("#advanced-export-wrapper")?.classList.toggle("hidden", !this._advancedSettingsOpen);
      event.currentTarget.textContent = `${this._advancedSettingsOpen ? "▾" : "▸"} ${this._t("advancedSettings")}`;
      if (this._advancedSettingsOpen) this._setupEntityPickers();
    });
    this.shadowRoot.querySelector("#history-type")?.addEventListener("change", (event) => { this._historyType = event.target.value; this._render(); });
    this.shadowRoot.querySelector("#history-year")?.addEventListener("change", (event) => { this._historyYear = event.target.value; this._render(); });
    this.shadowRoot.querySelector("#history-provider")?.addEventListener("change", (event) => { this._historyProvider = event.target.value; this._render(); });
    this.shadowRoot.querySelector("#period-form")?.addEventListener("submit", (event) => this._handlePeriod(event));
    const settingsForm = this.shadowRoot.querySelector("#settings-form");
    settingsForm?.addEventListener("submit", (event) => this._handleSettings(event));
    settingsForm?.querySelectorAll("input:not([type=hidden]),select,textarea").forEach((field) => {
      field.addEventListener("input", () => this._markDirty("settings"));
      field.addEventListener("change", () => this._markDirty("settings"));
    });
    const exportForm = this.shadowRoot.querySelector("#export-form");
    exportForm?.addEventListener("submit", (event) => this._saveExport(event));
    exportForm?.querySelectorAll("input,select,textarea").forEach((field) => {
      field.addEventListener("input", () => this._markDirty("export"));
      field.addEventListener("change", () => this._markDirty("export"));
    });
    this.shadowRoot.querySelector("#export-backend")?.addEventListener("change", () => this._updateExportFields());
    this.shadowRoot.querySelector("#consumption-type")?.addEventListener("change", (event) => this._periodTypeChanged(event.target.value));
    this.shadowRoot.querySelector("#tariff-mode")?.addEventListener("change", () => this._periodTypeChanged(this.shadowRoot.querySelector("#consumption-type")?.value));
    this.shadowRoot.querySelector('[data-action="cancel-edit"]')?.addEventListener("click", () => { this._editingPeriodId = null; this._newPeriodType = null; this._render(); });
    this.shadowRoot.querySelector('[data-action="rebuild"]')?.addEventListener("click", () => this._rebuild());
    this.shadowRoot.querySelector('[data-action="test-export"]')?.addEventListener("click", () => this._testExport());
    this.shadowRoot.querySelector('[data-action="sync-export"]')?.addEventListener("click", () => this._syncExport());
    this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach((button) => button.addEventListener("click", () => {
      this._editingPeriodId = button.dataset.id;
      this._newPeriodType = null;
      this._message = null;
      this._render();
      this.shadowRoot.querySelector(".edit-card")?.scrollIntoView({ behavior: "smooth" });
    }));
    this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach((button) => button.addEventListener("click", () => this._deletePeriod(button.dataset.id)));
    this.shadowRoot.querySelector('[data-action="load-analysis"]')?.addEventListener("click", () => this._loadAnalysis(true));
    this.shadowRoot.querySelector('[data-action="refresh-analysis"]')?.addEventListener("click", () => this._loadAnalysis(true));
    this.shadowRoot.querySelector("#analysis-type")?.addEventListener("change", (event) => { this._analysisType = event.target.value; this._render(); });
    this.shadowRoot.querySelector("#analysis-granularity")?.addEventListener("change", (event) => { this._analysisGranularity = event.target.value; this._render(); });
    this.shadowRoot.querySelector("#analysis-metric")?.addEventListener("change", (event) => { this._analysisMetric = event.target.value; this._render(); });
    this.shadowRoot.querySelectorAll("[data-picker-fallback]").forEach((field) => field.addEventListener("input", () => {
      const hidden = this.shadowRoot.querySelector(`input[type="hidden"][name="${field.dataset.pickerFallback}"]`);
      if (hidden) hidden.value = field.value;
      this._markDirty("settings");
    }));
    this.shadowRoot.querySelector("#period-cost")?.addEventListener("input", () => { this._priceDriver = "cost"; this._syncPeriodPricing("cost"); });
    this.shadowRoot.querySelector("#period-unit-price")?.addEventListener("input", () => { this._priceDriver = "unit_price"; this._syncPeriodPricing("unit_price"); });
    this.shadowRoot.querySelector("#period-value")?.addEventListener("input", () => this._syncPeriodPricing(this._priceDriver));
    this._setupDatePickers();
    this._periodTypeChanged(this.shadowRoot.querySelector("#consumption-type")?.value);
    this._updateExportFields();
    this._setupEntityPickers();
  }
  _periodTypeChanged(type) {
    if (!type) return;
    const entry = this._entry;
    const unit = this.shadowRoot.querySelector("#value-unit");
    if (unit && entry) unit.textContent = entry.units[type];
    const unitPriceUnit = this.shadowRoot.querySelector("#unit-price-unit");
    if (unitPriceUnit && entry) unitPriceUnit.textContent = entry.units.unit_prices[type];
    const tariffField = this.shadowRoot.querySelector("#tariff-field");
    if (tariffField) tariffField.classList.toggle("hidden", type !== "electricity");
    const dual = this.shadowRoot.querySelector("#dual-tariff");
    if (dual) dual.classList.toggle("hidden", type !== "electricity" || this.shadowRoot.querySelector("#tariff-mode")?.value !== "peak_offpeak");
    if (!this._editingPeriodId) {
      const start = this.shadowRoot.querySelector('input[type="hidden"][name="start_date"]');
      if (start && !start.value) {
        const dates = entry.periods.filter((period) => period.consumption_type === type).map((period) => period.end_date).sort();
        if (dates.length) {
          const date = new Date(`${dates.at(-1)}T12:00:00`);
          date.setDate(date.getDate() + 1);
          const value = date.toISOString().slice(0, 10);
          start.value = value;
          const picker = this.shadowRoot.querySelector('ha-date-input[data-date-name="start_date"]');
          if (picker) picker.value = value;
          const fallback = this.shadowRoot.querySelector('[data-date-fallback="start_date"]');
          if (fallback) fallback.value = value;
          this._updatePeriodDuration();
        }
      }
    }
  }

  _updateExportFields() {
    const backend = this.shadowRoot.querySelector("#export-backend")?.value || "none";
    this.shadowRoot.querySelectorAll(".backend-field").forEach((field) => {
      const allowed = (field.dataset.backends || "").split(/\s+/).filter(Boolean);
      field.classList.toggle("hidden", !allowed.includes(backend));
    });
  }

  _replaceEntry(updated) {
    const index = this._data.entries.findIndex((entry) => entry.entry_id === updated.entry_id);
    if (index >= 0) this._data.entries[index] = updated;
    if (updated.entry_id === this._analysisEntryId) this._invalidateAnalysis();
  }

  async _handleApartment(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const addMode = this._apartmentDialog === "add";
    if (addMode) {
      await this._run("create-apartment", async () => {
        const result = await this._hass.callWS({
          type: "rental_consumption/create_apartment",
          apartment_name: form.get("apartment_name") || "",
          heating_unit: form.get("heating_unit") || "kWh",
          grid_operator: form.get("grid_operator") || "",
          currency: form.get("currency") || "CHF"
        });
        this._data = { entries: result.entries || [] };
        this._selectedEntryId = result.entry_id;
        this._editingPeriodId = null;
        this._historyType = "all";
        this._historyYear = "all";
        this._historyProvider = "all";
        this._activeTab = "overview";
        this._apartmentDialog = null;
        this._message = { kind: "success", text: this._t("apartmentCreated") };
      });
      return;
    }

    await this._run("update-apartment", async () => {
      const updated = await this._hass.callWS({
        type: "rental_consumption/update_apartment",
        entry_id: this._entry.entry_id,
        apartment_name: form.get("apartment_name") || ""
      });
      this._replaceEntry(updated);
      this._apartmentDialog = null;
      this._message = { kind: "success", text: this._t("apartmentRenamed") };
    });
  }

  _periodPayload(form, edit) {
    const payload = {
      type: edit ? "rental_consumption/update_period" : "rental_consumption/add_period",
      entry_id: this._entry.entry_id,
      consumption_type: form.get("consumption_type"),
      start_date: form.get("start_date"),
      end_date: form.get("end_date"),
      value: Number(form.get("value")),
      provider: form.get("provider") || "",
      note: form.get("note") || "",
      tariff_mode: form.get("consumption_type") === "electricity" ? (form.get("tariff_mode") || "single") : "single"
    };
    if (edit) payload.period_id = this._editingPeriodId;
    ["cost", "peak_value", "offpeak_value", "peak_cost", "offpeak_cost"].forEach((key) => {
      const value = form.get(key);
      if (value !== "" && value != null) payload[key] = Number(value);
    });
    return payload;
  }

  async _handlePeriod(event) {
    event.preventDefault();
    const edit = !!this._editingPeriodId;
    const payload = this._periodPayload(new FormData(event.currentTarget), edit);
    await this._run(edit ? "edit-period" : "add-period", async () => {
      const updated = await this._hass.callWS(payload);
      this._replaceEntry(updated);
      this._editingPeriodId = null;
      this._newPeriodType = null;
      this._priceDriver = "cost";
      this._message = { kind: "success", text: this._t(edit ? "editSuccess" : "addSuccess") };
    });
  }

  async _handleSettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = this._entry.settings || {};
    const percentValue = form.get("load_curve_min_coverage_percent");
    const payload = {
      type: "rental_consumption/update_settings",
      entry_id: this._entry.entry_id,
      grid_operator: form.get("grid_operator") || "",
      currency: form.get("currency") || "CHF",
      heating_distribution: form.get("heating_distribution") || current.heating_distribution,
      outdoor_temperature_sensor: form.get("outdoor_temperature_sensor") || "",
      heating_base_temperature: form.get("heating_base_temperature") !== null ? Number(form.get("heating_base_temperature")) : Number(current.heating_base_temperature ?? 20),
      electricity_distribution: form.get("electricity_distribution") || current.electricity_distribution,
      electricity_load_sensor: form.get("electricity_load_sensor") || "",
      load_curve_source: form.get("load_curve_source") || current.load_curve_source || "auto",
      load_curve_min_coverage: percentValue !== null ? percentToCoverage(percentValue) : Number(current.load_curve_min_coverage ?? 0.9),
      vm_load_metric: form.get("vm_load_metric") || current.vm_load_metric || "W_value",
      vm_load_db_label: form.get("vm_load_db_label") || current.vm_load_db_label || "homeassistant"
    };
    await this._run("save-settings", async () => {
      const updated = await this._hass.callWS(payload);
      this._replaceEntry(updated);
      this._settingsDirty = false;
      this._message = { kind: "success", text: this._t("saved") };
    });
  }
  _exportPayload() {
    const formElement = this.shadowRoot.querySelector("#export-form");
    if (!formElement) return null;
    const form = new FormData(formElement);
    const backend = form.get("export_backend");
    const database = backend === "victoriametrics" ? (form.get("export_database_vm") || "") : (form.get("export_database") || "");
    const payload = {
      type: "rental_consumption/update_export_settings",
      entry_id: this._entry.entry_id,
      export_backend: backend,
      export_url: form.get("export_url") || "",
      export_auto_sync: form.get("export_auto_sync") === "on",
      export_database: database,
      export_retention_policy: form.get("export_retention_policy") || "",
      export_org: form.get("export_org") || "",
      export_bucket: form.get("export_bucket") || "",
      export_username: form.get("export_username") || ""
    };
    ["export_password", "export_token", "export_delete_auth_key"].forEach((key) => {
      const value = form.get(key);
      if (value) payload[key] = value;
    });
    return payload;
  }
  async _saveExport(event, options = {}) {
    if (event) event.preventDefault();
    const payload = this._exportPayload();
    if (!payload) return null;
    const action = options.action || "save-export";
    let result = null;
    await this._run(action, async () => {
      result = await this._hass.callWS(payload);
      this._replaceEntry(result);
      this._exportDirty = false;
      if (!options.silent) this._message = { kind: "success", text: this._t("exportSaved") };
    }, { keepMessage: options.silent });
    return result;
  }
  async _testExport() {
    if (this._busyAction) return;
    const savePayload = this._exportPayload();
    this._busyAction = "test-export";
    this._advancedSettingsOpen = true;
    this._render();
    try {
      if (savePayload) {
        const updated = await this._hass.callWS(savePayload);
        this._replaceEntry(updated);
        this._exportDirty = false;
      }
      await this._hass.callWS({ type: "rental_consumption/test_export", entry_id: this._entry.entry_id });
      this._message = { kind: "success", text: this._t("connectionOk") };
    } catch (error) {
      this._message = this._errorMessage(error);
    } finally {
      this._busyAction = null;
      try {
        const fresh = await this._hass.callWS({ type: "rental_consumption/get_data" });
        this._data = fresh;
      } catch (_error) {
        // Keep local feedback if refreshing persisted status fails.
      }
      this._activeTab = "settings";
      this._advancedSettingsOpen = true;
      this._render();
    }
  }
  async _syncExport() {
    if (!confirm(this._t("confirmSync"))) return;
    const savePayload = this._exportPayload();
    await this._run("sync-export", async () => {
      if (savePayload) {
        const updated = await this._hass.callWS(savePayload);
        this._replaceEntry(updated);
      }
      await this._hass.callWS({ type: "rental_consumption/sync_export", entry_id: this._entry.entry_id });
      this._message = { kind: "success", text: this._t("syncSuccess") };
      const fresh = await this._hass.callWS({ type: "rental_consumption/get_data" });
      this._data = fresh;
    });
  }

  async _deletePeriod(id) {
    const period = this._entry?.periods?.find((item) => item.period_id === id);
    const detail = period ? `\n\n${this._typeLabel(period.consumption_type)} · ${this._date(period.start_date)} – ${this._date(period.end_date)} · ${this._num(period.value, 3)} ${this._escape(this._entry.units[period.consumption_type])}` : "";
    if (!confirm(`${this._t("confirmDelete")}${detail}`)) return;
    await this._run("delete-period", async () => {
      const updated = await this._hass.callWS({ type: "rental_consumption/delete_period", entry_id: this._entry.entry_id, period_id: id });
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("deleteSuccess") };
    });
  }

  async _rebuild() {
    if (!confirm(`${this._t("recorderRebuildConfirm")}\n\n${this._t("rebuildDescription")}`)) return;
    await this._run("rebuild", async () => {
      const updated = await this._hass.callWS({ type: "rental_consumption/rebuild_statistics", entry_id: this._entry.entry_id });
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("rebuildSuccess") };
    });
  }

  async _run(action, fn, options = {}) {
    if (this._busyAction) return;
    this._busyAction = action;
    if (!options.keepMessage) this._message = null;
    this._render();
    try {
      await fn();
    } catch (error) {
      this._message = this._errorMessage(error);
    } finally {
      this._busyAction = null;
      this._render();
    }
  }
  _friendlyError(error) {
    return this._errorPresentation(error).text;
  }
  _styles() {
    return `
      :host{display:block;min-height:100%;background:var(--primary-background-color);color:var(--primary-text-color);font-family:var(--ha-font-family-body,Roboto,sans-serif)}
      *{box-sizing:border-box} main{max-width:1500px;margin:0 auto;padding:24px 20px 56px} h1,h2,p{margin-top:0} h1{font-size:28px;margin-bottom:6px} h2{font-size:19px;margin-bottom:14px}
      .page-header,.section-header{display:flex;justify-content:space-between;align-items:center;gap:16px}.page-header{margin-bottom:18px}.page-header p,.muted,.help,small{color:var(--secondary-text-color)}
      .card,.summary-card,.period-row{background:var(--ha-card-background,var(--card-background-color));border-radius:var(--ha-card-border-radius,12px);border:1px solid var(--divider-color);box-shadow:var(--ha-card-box-shadow,none)}.card{padding:20px;margin-bottom:16px}
      .picker-row{display:grid;grid-template-columns:minmax(280px,1fr) auto;align-items:end;gap:14px}.picker-card label{display:grid;grid-template-columns:auto minmax(240px,1fr);align-items:center;gap:14px}.picker-card span{color:var(--secondary-text-color);font-size:13px}.picker-help{display:block;margin-top:10px}.apartment-actions{display:flex;gap:8px;flex-wrap:wrap}
      .tabs{display:flex;gap:4px;overflow-x:auto;margin:0 0 16px;padding:4px;background:var(--secondary-background-color);border-radius:12px;border:1px solid var(--divider-color)}.tab{appearance:none;border:0;background:transparent;color:var(--secondary-text-color);font:inherit;font-weight:600;padding:10px 16px;border-radius:9px;cursor:pointer;white-space:nowrap}.tab.active{background:var(--card-background-color);color:var(--primary-color);box-shadow:var(--ha-card-box-shadow,0 1px 3px rgba(0,0,0,.12))}
      .summary-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:16px}.summary-card{padding:16px;border-top:3px solid var(--primary-color)}.summary-card>span,.metric>span,.analysis-grid span,.analysis-mini span{display:block;color:var(--secondary-text-color);font-size:12px;margin-bottom:5px}.summary-card strong{font-size:20px}.summary-card small{font-size:12px}
      .overview-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.compact-card{margin-bottom:0}.analysis-mini{display:grid;gap:10px}.analysis-mini>div{display:grid;grid-template-columns:1fr auto;gap:10px;padding-bottom:9px;border-bottom:1px solid var(--divider-color)}.analysis-mini>div:last-child{border-bottom:0;padding-bottom:0}
      .form-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.form-grid label,.tariff-grid label{display:flex;flex-direction:column;gap:6px;color:var(--secondary-text-color);font-size:12px}.form-grid label small{line-height:1.35}.wide{grid-column:1/-1}
      input,select,textarea{width:100%;min-height:42px;border:1px solid var(--divider-color);border-radius:8px;padding:9px 10px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}textarea{resize:vertical}.input-unit{display:flex;border:1px solid var(--divider-color);border-radius:8px;overflow:hidden;background:var(--secondary-background-color)}.input-unit input{border:0;background:transparent}.input-unit span{padding:11px;color:var(--secondary-text-color);white-space:nowrap}
      .check{flex-direction:row!important;align-items:center;font-size:14px!important}.check input{width:auto;min-height:auto}.help,.warning{padding:10px 12px;border-radius:8px;background:var(--secondary-background-color);font-size:12px}.warning{color:var(--warning-color,#ff9800)}
      .actions,.export-actions,.sticky-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:14px}.button,.icon-button{border:0;border-radius:8px;padding:9px 13px;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;font:inherit}.button.primary{background:var(--primary-color);color:var(--text-primary-color,#fff)}.button.subtle{background:transparent}.button.danger{background:transparent;border:1px solid var(--error-color,#db4437);color:var(--error-color,#db4437)}.button.compact{padding:6px 9px;font-size:12px}.button:disabled{opacity:.45;cursor:not-allowed}.icon-button{font-size:20px}
      .message{padding:12px 14px;border-radius:8px;margin-bottom:14px}.message.success{background:color-mix(in srgb,var(--success-color,#43a047) 16%,var(--card-background-color));border:1px solid var(--success-color,#43a047)}.message.error{background:color-mix(in srgb,var(--error-color,#db4437) 14%,var(--card-background-color));border:1px solid var(--error-color,#db4437)}
      .analysis-layout{display:grid;grid-template-columns:1fr 1fr;gap:16px}.analysis-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.analysis-grid>div{padding:13px;background:var(--secondary-background-color);border-radius:9px}.analysis-grid strong{word-break:break-word}
      .analysis-controls .section-header p{margin:5px 0 0}.analysis-toolbar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}.analysis-toolbar label{display:flex;flex-direction:column;gap:6px;color:var(--secondary-text-color);font-size:12px}.analysis-kpi-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:16px}.analysis-kpi-grid .compact-card{padding:15px}.analysis-kpi-grid span{display:block;color:var(--secondary-text-color);font-size:12px;margin-bottom:6px}.analysis-kpi-grid strong{font-size:17px;display:block}.analysis-kpi-grid small{display:block;margin-top:6px}.change.up{color:var(--warning-color,#f4b400)}.change.down{color:var(--primary-color)}.change.neutral{color:var(--secondary-text-color)}.chart-card h2{margin-bottom:14px}.svg-chart{position:relative;width:100%;overflow-x:auto}.svg-chart svg{width:100%;min-width:620px;height:auto;display:block}.grid-line{stroke:var(--divider-color);stroke-width:1}.axis-text{fill:var(--secondary-text-color);font-size:11px}.x-label{font-size:10px}.chart-line{fill:none;stroke:var(--primary-color);stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round}.chart-point{fill:var(--primary-color);stroke:var(--card-background-color);stroke-width:1.5}.chart-unit{position:absolute;top:0;left:0;color:var(--secondary-text-color);font-size:11px}.bar-grid{fill:var(--primary-color)}.bar-pv{fill:var(--warning-color,#f4b400)}.chart-legend{display:flex;gap:16px;justify-content:flex-end;color:var(--secondary-text-color);font-size:12px;margin-bottom:2px}.chart-legend span{display:flex;gap:6px;align-items:center}.chart-legend i{width:10px;height:10px;border-radius:2px;display:inline-block}.legend-grid{background:var(--primary-color)}.legend-pv{background:var(--warning-color,#f4b400)}
      .history-toolbar{display:flex;gap:10px;margin:16px 0;flex-wrap:wrap}.history-toolbar select{width:auto;min-width:180px}.period-list{display:grid;gap:10px}.period-row{display:grid;grid-template-columns:minmax(220px,1.4fr) minmax(160px,.8fr) minmax(170px,.9fr) minmax(220px,1fr) auto;gap:16px;align-items:center;padding:15px}.period-main{display:flex;align-items:center;gap:11px}.period-main strong,.period-main span,.period-main small{display:block}.period-main span,.provider-line{color:var(--secondary-text-color);font-size:12px;margin-top:4px}.provider-line{font-weight:600}.type-icon{font-size:22px;width:34px;height:34px;display:grid;place-items:center;background:var(--secondary-background-color);border-radius:9px}.metric strong{display:block;font-size:15px}.badges{display:flex;flex-wrap:wrap;gap:6px}.badge{font-size:11px;padding:5px 8px;border-radius:999px;background:var(--secondary-background-color);color:var(--secondary-text-color)}.badge.accent{color:var(--primary-color);border:1px solid color-mix(in srgb,var(--primary-color) 35%,transparent)}.period-actions{display:flex;gap:6px}.tariff-detail,.period-note{grid-column:1/-1;padding-top:10px;border-top:1px solid var(--divider-color);color:var(--secondary-text-color);font-size:12px}.tariff-detail{display:flex;gap:20px}.tariff-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.empty{text-align:center;padding:28px;color:var(--secondary-text-color)}
      .settings-card h2{margin-bottom:16px}.sticky-actions{position:sticky;bottom:8px;z-index:3;padding:10px;border-radius:12px;background:color-mix(in srgb,var(--card-background-color) 88%,transparent);backdrop-filter:blur(12px);border:1px solid var(--divider-color);margin-bottom:16px}.export-status{margin-top:18px;padding:14px;border:1px solid var(--divider-color);border-radius:10px;background:var(--secondary-background-color)}.compact-status{margin-top:8px}.status-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.status-dot{width:9px;height:9px;border-radius:50%;background:var(--disabled-text-color,#888)}.status-dot.ok{background:var(--success-color,#43a047)}.status-dot.error{background:var(--error-color,#db4437)}.status-dot.testing{background:var(--warning-color,#ff9800)}.status-message{margin-top:8px;color:var(--secondary-text-color);font-size:12px;word-break:break-word}.status-steps{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.step{font-size:11px;padding:5px 8px;border-radius:999px;background:var(--card-background-color);border:1px solid var(--divider-color)}.step.ok{color:var(--success-color,#43a047)}.step.error{color:var(--error-color,#db4437)}

      .field-label{display:flex!important;align-items:center;gap:6px!important;min-height:20px}.required-marker{color:var(--error-color,#db4437);margin-left:3px}.optional-marker{margin-left:6px;color:var(--secondary-text-color);font-size:11px;font-weight:400}.help-icon{position:relative;display:inline-grid;place-items:center;width:17px;height:17px;border-radius:50%;border:1px solid var(--divider-color);color:var(--secondary-text-color);font-size:11px;font-weight:700;cursor:help;flex:0 0 auto}.help-icon::after{content:attr(data-tooltip);position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%);width:max-content;max-width:320px;padding:8px 10px;border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);box-shadow:var(--ha-card-box-shadow,0 4px 12px rgba(0,0,0,.25));font-size:12px;font-weight:400;line-height:1.35;opacity:0;visibility:hidden;pointer-events:none;z-index:50;white-space:normal}.help-icon:hover::after,.help-icon:focus::after{opacity:1;visibility:visible}.entity-picker-wrap{display:grid;gap:5px}.entity-picker-wrap ha-entity-picker{width:100%}.entity-picker-fallback{display:none}.entity-picker-wrap ha-entity-picker:not(:defined){display:none}.entity-picker-wrap ha-entity-picker:not(:defined)+.entity-picker-fallback{display:block}.advanced-toggle-card{padding:14px 20px}.advanced-toggle{padding-left:0}.advanced-content{padding-top:14px;border-top:1px solid var(--divider-color);margin-top:10px}.backend-options{margin-top:14px;padding:12px 0;border-top:1px solid var(--divider-color);border-bottom:1px solid var(--divider-color)}.backend-options summary{cursor:pointer;font-weight:600;color:var(--primary-text-color);margin-bottom:12px}.options-grid{margin-top:12px}.unsaved-warning{margin:10px 0;padding:10px 12px;border-radius:8px;background:color-mix(in srgb,var(--warning-color,#ff9800) 12%,var(--card-background-color));border:1px solid color-mix(in srgb,var(--warning-color,#ff9800) 55%,var(--divider-color));color:var(--primary-text-color);font-size:13px}.message-action,.status-action{margin-top:8px;font-size:13px}.technical-details{margin-top:10px}.technical-details summary{cursor:pointer;color:var(--secondary-text-color);font-size:12px}.technical-details pre{white-space:pre-wrap;word-break:break-word;margin:8px 0 0;padding:10px;border-radius:8px;background:var(--secondary-background-color);color:var(--secondary-text-color);font-size:11px;max-height:180px;overflow:auto}.context-alert{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;margin-bottom:16px;border-radius:10px;border:1px solid var(--divider-color);background:var(--card-background-color);font-size:13px}.context-alert>div>div{margin-top:4px;color:var(--secondary-text-color)}.warning-alert{border-color:color-mix(in srgb,var(--warning-color,#ff9800) 55%,var(--divider-color));background:color-mix(in srgb,var(--warning-color,#ff9800) 9%,var(--card-background-color))}.error-alert{border-color:color-mix(in srgb,var(--error-color,#db4437) 55%,var(--divider-color));background:color-mix(in srgb,var(--error-color,#db4437) 8%,var(--card-background-color))}.action-description{margin-top:8px;color:var(--secondary-text-color);font-size:12px;text-align:right}.status-dot.warning{background:var(--warning-color,#ff9800)}.status-dot.neutral{background:var(--disabled-text-color,#888)}.export-status.level-warning{border-color:color-mix(in srgb,var(--warning-color,#ff9800) 50%,var(--divider-color))}.export-status.level-error{border-color:color-mix(in srgb,var(--error-color,#db4437) 50%,var(--divider-color))}.export-status.level-ok{border-color:color-mix(in srgb,var(--success-color,#43a047) 45%,var(--divider-color))}.status-steps .step{font-size:12px}.status-message{font-size:13px!important;color:var(--primary-text-color)!important}
      .setup-card{border-color:color-mix(in srgb,var(--primary-color) 35%,var(--divider-color))}.setup-card p{margin:5px 0 0}.setup-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.setup-step{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:12px;border:1px solid var(--divider-color);border-radius:10px;background:var(--secondary-background-color)}.setup-step.done{opacity:.82}.setup-check{width:24px;height:24px;display:grid;place-items:center;border-radius:50%;border:1px solid var(--divider-color);font-weight:700}.setup-step.done .setup-check{color:var(--success-color,#43a047);border-color:color-mix(in srgb,var(--success-color,#43a047) 60%,var(--divider-color))}.setup-step.pending .setup-check{color:var(--warning-color,#ff9800)}.setup-step strong,.setup-step small{display:block}.setup-step small,.setup-done{color:var(--secondary-text-color);font-size:12px}.empty-summary{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px}.empty-summary .empty-title{font-size:14px}.inline-empty{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;color:var(--secondary-text-color);font-size:13px}.warning-inline{color:var(--primary-text-color)}.period-duration{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 12px;border-radius:8px;background:var(--secondary-background-color);color:var(--primary-text-color);font-size:13px}.period-duration small{color:var(--secondary-text-color)}.date-picker-wrap{display:grid;gap:4px}.date-picker-wrap ha-date-input{width:100%}.date-picker-fallback{width:100%}.pricing-help{margin-top:-4px}.recorder-action{display:flex;flex-direction:column;align-items:flex-end;gap:4px;max-width:430px}.recorder-action small{color:var(--secondary-text-color);font-size:12px;text-align:right;line-height:1.35}.button[aria-busy="true"]{opacity:.72}.modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.48);backdrop-filter:blur(4px)}.modal-card{width:min(720px,100%);max-height:90vh;overflow:auto;padding:20px;background:var(--ha-card-background,var(--card-background-color));border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,14px);box-shadow:0 18px 55px rgba(0,0,0,.32)}.modal-card .section-header{margin-bottom:16px}
      .hidden{display:none!important}
      @media(max-width:1100px){.setup-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.overview-grid{grid-template-columns:1fr}.form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.analysis-layout{grid-template-columns:1fr}.analysis-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.period-row{grid-template-columns:1.4fr 1fr 1fr}.badges{grid-column:1/3}.period-actions{grid-column:3;grid-row:2}}
      @media(max-width:700px){main{padding:14px 10px 40px}.setup-steps{grid-template-columns:1fr}.setup-step{grid-template-columns:auto 1fr}.setup-step .button,.setup-done{grid-column:2}.inline-empty{align-items:flex-start;flex-direction:column}.period-duration{align-items:flex-start;flex-direction:column}.recorder-action{align-items:flex-start;max-width:none;width:100%}.recorder-action small{text-align:left}.context-alert{align-items:flex-start;flex-direction:column}.context-alert .button{width:100%}.help-icon::after{left:auto;right:0;transform:none;max-width:260px}.page-header,.section-header{align-items:flex-start;flex-direction:column}.summary-grid,.form-grid,.analysis-grid,.tariff-grid,.analysis-toolbar,.analysis-kpi-grid{grid-template-columns:1fr}.wide{grid-column:auto}.picker-row{grid-template-columns:1fr}.picker-card label{grid-template-columns:1fr}.apartment-actions .button{flex:1}.tabs{border-radius:10px}.tab{padding:9px 12px}.history-toolbar{flex-direction:column}.history-toolbar select{width:100%}.period-row{grid-template-columns:1fr;gap:12px;padding:14px}.badges,.period-actions,.tariff-detail,.period-note{grid-column:1}.period-actions{grid-row:auto;justify-content:flex-end}.tariff-detail{flex-direction:column;gap:6px}.actions,.export-actions,.sticky-actions{flex-wrap:wrap;justify-content:stretch}.actions .button,.export-actions .button,.sticky-actions .button{flex:1}.sticky-actions{bottom:4px}}
    `;
  }
}

if (!customElements.get("rental-consumption-panel")) {
  customElements.define("rental-consumption-panel", RentalConsumptionPanel);
}
