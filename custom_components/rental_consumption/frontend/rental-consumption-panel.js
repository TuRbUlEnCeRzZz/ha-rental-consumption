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
        subtitle: "Décomptes historiques, répartition Recorder et export time-series.",
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
        providerDefault: "GRD / fournisseur par défaut",
        providerDefaultHelp: "Utilisé pour préremplir les nouvelles périodes. Les périodes existantes conservent leur fournisseur.",
        provider: "GRD / fournisseur",
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
        vmDb: "Label db VM",
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
        peakOffpeak: "On-peak / Off-peak",
        peakConsumption: "Consommation on-peak",
        offpeakConsumption: "Consommation off-peak",
        peakCost: "Coût on-peak",
        offpeakCost: "Coût off-peak",
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
        effectiveDistribution: "Répartition effective",
        configuredDistribution: "Répartition configurée",
        temperatureCoverage: "Couverture température",
        meanTemperature: "Température moyenne",
        exportBackend: "Destination",
        none: "Désactivé",
        url: "URL",
        database: "Database",
        retention: "Retention policy",
        organization: "Organisation",
        bucket: "Bucket",
        username: "Utilisateur",
        password: "Mot de passe",
        token: "Token",
        deleteKey: "deleteAuthKey",
        autoSync: "Synchroniser automatiquement après modification",
        test: "Tester la connexion",
        testing: "Test en cours…",
        sync: "Reconstruire dans la base",
        syncing: "Reconstruction…",
        connectionOk: "Connexion validée.",
        lastStatus: "Dernier état",
        health: "Serveur",
        write: "Écriture",
        read: "Lecture",
        deleteStep: "Suppression",
        rebuildStep: "Reconstruction",
        statusOk: "OK",
        statusError: "Erreur",
        statusTesting: "Test en cours",
        never: "Jamais testé",
        v3Warning: "InfluxDB 3 : écriture prise en charge. La suppression/reconstruction sûre reste désactivée.",
        vmHelp: "Pour VictoriaMetrics, seule l’URL est obligatoire dans une installation locale sans authentification. Database, identifiants, token et deleteAuthKey restent optionnels.",
        confirmDelete: "Supprimer définitivement cette période ?",
        confirmRebuild: "Reconstruire toutes les statistiques Recorder ?",
        confirmSync: "Effacer puis réécrire les séries de cet appartement dans la base externe ?",
        addSuccess: "Période ajoutée.",
        editSuccess: "Période modifiée.",
        deleteSuccess: "Période supprimée.",
        rebuildSuccess: "Statistiques Recorder reconstruites.",
        syncSuccess: "Historique externe reconstruit.",
        tariffHelp: "La somme on-peak + off-peak doit être égale à la consommation totale.",
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
        analysisLoadError: "Impossible de calculer les données d’analyse."
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
        database: "Database",
        retention: "Retention policy",
        organization: "Organization",
        bucket: "Bucket",
        username: "Username",
        password: "Password",
        token: "Token",
        deleteKey: "deleteAuthKey",
        autoSync: "Automatically sync after changes",
        test: "Test connection",
        testing: "Testing…",
        sync: "Rebuild external history",
        syncing: "Rebuilding…",
        connectionOk: "Connection validated.",
        lastStatus: "Last status",
        health: "Server",
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
        analysisLoadError: "Unable to calculate analysis data."
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
      this._message = { kind: "error", text: this._friendlyError(error) };
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
      this._message = { kind: "error", text: `${this._t("analysisLoadError")} ${this._friendlyError(error)}` };
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

  _render() {
    if (!this._data) {
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main><div class="loading">…</div></main>`;
      return;
    }
    const entry = this._entry;
    if (!entry) {
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style><main><h1>${this._t("title")}</h1><p>Aucune configuration.</p></main>`;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main>
        <header class="page-header">
          <div><h1>${this._t("title")}</h1><p>${this._t("subtitle")}</p></div>
          <button class="icon-button" data-action="refresh" title="${this._t("refresh")}">↻</button>
        </header>
        ${this._message ? `<div class="message ${this._message.kind}">${this._escape(this._message.text)}</div>` : ""}
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
              ${addMode ? this._field(this._t("heatingUnit"), `<select name="heating_unit"><option value="kWh" ${settings.heating_unit === "kWh" ? "selected" : ""}>kWh</option><option value="MWh" ${settings.heating_unit === "MWh" ? "selected" : ""}>MWh</option><option value="GJ" ${settings.heating_unit === "GJ" ? "selected" : ""}>GJ</option><option value="allocation_units" ${settings.heating_unit === "allocation_units" ? "selected" : ""}>Unités de répartition</option></select>`) : ""}
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
      <section class="summary-grid">
        ${types.map((type) => `<article class="summary-card"><span>${this._typeLabel(type)}</span><strong>${this._num(entry.totals[type], 3)} <small>${this._escape(entry.units[type])}</small></strong><div>${this._num(entry.costs[type]?.total, 2)} ${this._escape(entry.units.currency)}</div><small>${entry.costs[type]?.average_unit_price == null ? "—" : `${this._num(entry.costs[type].average_unit_price, 4)} ${this._escape(entry.units.unit_prices[type])}`}</small></article>`).join("")}
      </section>
      <section class="overview-grid">
        <article class="card compact-card"><h2>${this._t("electricity")}</h2>${this._analysisSummary(entry.electricity_analysis, false)}</article>
        <article class="card compact-card"><h2>${this._t("heating")}</h2>${this._analysisSummary(entry.heating_analysis, true)}</article>
        <article class="card compact-card"><h2>${this._t("exportSettings")}</h2>${this._exportStatus(entry, exportStatus, true)}</article>
      </section>`;
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
          <button class="button subtle" data-action="rebuild" ${this._busyAction ? "disabled" : ""}>${this._busyAction === "rebuild" ? "…" : this._t("rebuild")}</button>
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
        <article class="card compact-card"><span>${this._t("normalizedUse")}</span><strong>${latest ? `${this._num(latest.daily_average,3)} ${this._escape(typeData.unit||"")}/j` : "—"}</strong>${this._changeBadge(changes.daily_average_pct)}</article>
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
    return `
      <form id="settings-form">
        <section class="card settings-card">
          <div class="section-header"><div><h2>${this._t("general")}</h2></div></div>
          <div class="form-grid">
            ${this._field(this._t("providerDefault"), `<input name="grid_operator" value="${this._escape(settings.grid_operator || "")}"><small>${this._t("providerDefaultHelp")}</small>`)}
            ${this._field(this._t("currency"), `<input name="currency" value="${this._escape(settings.currency || "CHF")}">`)}
          </div>
        </section>
        <section class="card settings-card">
          <h2>${this._t("heatingSettings")}</h2>
          <div class="form-grid">
            ${this._field(this._t("heatingDistribution"), `<select name="heating_distribution"><option value="uniform_daily" ${settings.heating_distribution === "uniform_daily" ? "selected" : ""}>${this._t("uniform")}</option><option value="outdoor_temperature" ${settings.heating_distribution === "outdoor_temperature" ? "selected" : ""}>${this._t("degreeDays")}</option></select>`)}
            ${this._field(this._t("outdoorSensor"), `<input name="outdoor_temperature_sensor" value="${this._escape(settings.outdoor_temperature_sensor || "")}" placeholder="sensor.temperature_exterieure">`)}
            ${this._field(this._t("baseTemp"), `<input name="heating_base_temperature" type="number" min="5" max="30" step="0.1" value="${this._escape(settings.heating_base_temperature ?? 20)}">`)}
          </div>
        </section>
        <section class="card settings-card">
          <h2>${this._t("electricitySettings")}</h2>
          <div class="form-grid">
            ${this._field(this._t("electricityDistribution"), `<select name="electricity_distribution"><option value="uniform_daily" ${settings.electricity_distribution === "uniform_daily" ? "selected" : ""}>${this._t("uniform")}</option><option value="load_curve" ${settings.electricity_distribution === "load_curve" ? "selected" : ""}>${this._t("loadCurve")}</option></select>`)}
            ${this._field(this._t("loadSensor"), `<input name="electricity_load_sensor" value="${this._escape(settings.electricity_load_sensor || "")}" placeholder="sensor.introduction_puissance">`)}
            ${this._field(this._t("loadSource"), `<select name="load_curve_source"><option value="auto" ${settings.load_curve_source === "auto" ? "selected" : ""}>${this._t("auto")}</option><option value="victoriametrics" ${settings.load_curve_source === "victoriametrics" ? "selected" : ""}>${this._t("victoriametrics")}</option><option value="recorder" ${settings.load_curve_source === "recorder" ? "selected" : ""}>${this._t("recorder")}</option></select>`)}
            ${this._field(this._t("minCoverage"), `<input name="load_curve_min_coverage" type="number" min="0.1" max="1" step="0.01" value="${this._escape(settings.load_curve_min_coverage ?? 0.9)}">`)}
            ${this._field(this._t("vmMetric"), `<input name="vm_load_metric" value="${this._escape(settings.vm_load_metric || "W_value")}">`)}
            ${this._field(this._t("vmDb"), `<input name="vm_load_db_label" value="${this._escape(settings.vm_load_db_label || "homeassistant")}">`)}
            <div class="help wide">${this._t("loadHelp")}</div>
          </div>
        </section>
        <div class="sticky-actions"><button class="button primary" type="submit" ${this._busyAction ? "disabled" : ""}>${this._t("saveGeneral")}</button></div>
      </form>
      ${this._exportSettingsCard(entry, exportSettings)}`;
  }

  _exportSettingsCard(entry, exportSettings) {
    const backend = exportSettings.backend || "none";
    const status = exportSettings.last_status || {};
    return `
      <section class="card settings-card" id="export-card">
        <div class="section-header"><div><h2>${this._t("exportSettings")}</h2></div></div>
        <form id="export-form">
          <div class="form-grid">
            ${this._field(this._t("exportBackend"), `<select name="export_backend" id="export-backend"><option value="none" ${backend === "none" ? "selected" : ""}>${this._t("none")}</option><option value="victoriametrics" ${backend === "victoriametrics" ? "selected" : ""}>VictoriaMetrics</option><option value="influxdb_v1" ${backend === "influxdb_v1" ? "selected" : ""}>InfluxDB 1.x</option><option value="influxdb_v2" ${backend === "influxdb_v2" ? "selected" : ""}>InfluxDB 2.x</option><option value="influxdb_v3" ${backend === "influxdb_v3" ? "selected" : ""}>InfluxDB 3.x</option></select>`)}
            <label class="backend-field" data-backends="victoriametrics influxdb_v1 influxdb_v2 influxdb_v3"><span>${this._t("url")}</span><input name="export_url" value="${this._escape(exportSettings.url || "")}" placeholder="http://192.168.1.10:8428"></label>
            <label class="backend-field" data-backends="victoriametrics influxdb_v1 influxdb_v3"><span>${this._t("database")}</span><input name="export_database" value="${this._escape(exportSettings.database || "")}"></label>
            <label class="backend-field" data-backends="influxdb_v1"><span>${this._t("retention")}</span><input name="export_retention_policy" value="${this._escape(exportSettings.retention_policy || "")}"></label>
            <label class="backend-field" data-backends="influxdb_v2"><span>${this._t("organization")}</span><input name="export_org" value="${this._escape(exportSettings.org || "")}"></label>
            <label class="backend-field" data-backends="influxdb_v2"><span>${this._t("bucket")}</span><input name="export_bucket" value="${this._escape(exportSettings.bucket || "")}"></label>
            <label class="backend-field" data-backends="victoriametrics influxdb_v1"><span>${this._t("username")}</span><input name="export_username" value="${this._escape(exportSettings.username || "")}"></label>
            <label class="backend-field" data-backends="victoriametrics influxdb_v1"><span>${this._t("password")}</span><input name="export_password" type="password" placeholder="${exportSettings.has_password ? "••••••••" : ""}"></label>
            <label class="backend-field" data-backends="victoriametrics influxdb_v2 influxdb_v3"><span>${this._t("token")}</span><input name="export_token" type="password" placeholder="${exportSettings.has_token ? "••••••••" : ""}"></label>
            <label class="backend-field" data-backends="victoriametrics"><span>${this._t("deleteKey")}</span><input name="export_delete_auth_key" type="password" placeholder="${exportSettings.has_delete_auth_key ? "••••••••" : ""}"></label>
            <label class="check wide backend-field" data-backends="victoriametrics influxdb_v1 influxdb_v2"><input name="export_auto_sync" type="checkbox" ${exportSettings.auto_sync ? "checked" : ""}> ${this._t("autoSync")}</label>
            <div class="help wide backend-field" data-backends="victoriametrics">${this._t("vmHelp")}</div>
            <div class="warning wide backend-field" data-backends="influxdb_v3">${this._t("v3Warning")}</div>
          </div>
          <div class="export-actions">
            <button class="button" type="submit" ${this._busyAction ? "disabled" : ""}>${this._t("save")}</button>
            <button class="button" type="button" data-action="test-export" ${this._busyAction ? "disabled" : ""}>${this._busyAction === "test-export" ? this._t("testing") : this._t("test")}</button>
            <button class="button" type="button" data-action="sync-export" ${(this._busyAction || !exportSettings.capabilities?.supports_safe_rebuild) ? "disabled" : ""}>${this._busyAction === "sync-export" ? this._t("syncing") : this._t("sync")}</button>
          </div>
        </form>
        ${this._exportStatus(entry, status, false)}
      </section>`;
  }

  _exportStatus(entry, status, compact) {
    const state = status.status || "never";
    const stateLabel = state === "ok" ? this._t("statusOk") : state === "error" ? this._t("statusError") : state === "testing" ? this._t("statusTesting") : this._t("never");
    const steps = status.steps || {};
    const stepLabels = { health: this._t("health"), write: this._t("write"), read: this._t("read"), delete: this._t("deleteStep"), rebuild: this._t("rebuildStep") };
    return `<div class="export-status ${compact ? "compact-status" : ""}">
      <div class="status-head"><span class="status-dot ${state}"></span><strong>${stateLabel}</strong><span class="muted">${status.at ? this._dateTime(status.at) : ""}</span></div>
      ${status.message && status.message !== "connection_test" ? `<div class="status-message">${this._escape(status.message)}</div>` : ""}
      ${Object.keys(steps).length ? `<div class="status-steps">${Object.entries(steps).map(([key, value]) => `<span class="step ${value === "ok" ? "ok" : "error"}">${value === "ok" ? "✓" : "!"} ${this._escape(stepLabels[key] || key)}</span>`).join("")}</div>` : ""}
      ${entry.export?.backend === "none" && compact ? `<div class="muted">${this._t("exportInactive")}</div>` : ""}
    </div>`;
  }

  _analysisSummary(analysis, heating) {
    const coverage = heating ? analysis?.temperature_coverage : analysis?.coverage;
    return `<div class="analysis-mini">
      <div><span>${this._t("effectiveDistribution")}</span><strong>${this._distributionLabel(analysis?.effective_distribution)}</strong></div>
      <div><span>${this._t("coverage")}</span><strong>${this._num((coverage || 0) * 100, 1)} %</strong></div>
      <div><span>${this._t("source")}</span><strong>${this._escape(heating ? (analysis?.outdoor_temperature_sensor || "—") : (analysis?.source || "—"))}</strong></div>
    </div>`;
  }

  _analysisDetails(analysis, heating) {
    const coverage = heating ? analysis?.temperature_coverage : analysis?.coverage;
    return `<div class="analysis-grid">
      <div><span>${this._t("configuredDistribution")}</span><strong>${this._distributionLabel(analysis?.configured_distribution)}</strong></div>
      <div><span>${this._t("effectiveDistribution")}</span><strong>${this._distributionLabel(analysis?.effective_distribution)}</strong></div>
      <div><span>${heating ? this._t("temperatureCoverage") : this._t("coverage")}</span><strong>${this._num((coverage || 0) * 100, 1)} %</strong></div>
      <div><span>${this._t("weightedPeriods")}</span><strong>${analysis?.weighted_periods || 0}</strong></div>
      <div><span>${this._t("fallbackPeriods")}</span><strong>${analysis?.fallback_periods || 0}</strong></div>
      ${heating ? `<div><span>${this._t("meanTemperature")}</span><strong>${analysis?.mean_outdoor_temperature == null ? "—" : `${this._num(analysis.mean_outdoor_temperature, 1)} °C`}</strong></div>` : `<div><span>${this._t("source")}</span><strong>${this._escape(analysis?.source || "—")}</strong></div>`}
    </div>`;
  }

  _periodForm(entry) {
    const period = this._editingPeriodId ? entry.periods.find((item) => item.period_id === this._editingPeriodId) : null;
    const type = period?.consumption_type || "electricity";
    const tariff = period?.tariff_mode || "single";
    const provider = period
      ? (period.provider || "")
      : (entry.settings.grid_operator || entry.providers?.[0] || "");
    return `<section class="card edit-card">
      <div class="section-header"><h2>${period ? this._t("editPeriod") : this._t("addPeriod")}</h2>${period ? `<button class="button subtle" data-action="cancel-edit">${this._t("cancel")}</button>` : ""}</div>
      <form id="period-form"><div class="form-grid">
        ${this._field(this._t("type"), `<select name="consumption_type" id="consumption-type">${["electricity", "pv_electricity", "water", "hot_water", "heating"].map((item) => `<option value="${item}" ${type === item ? "selected" : ""}>${this._typeLabel(item)}</option>`).join("")}</select>`)}
        ${this._field(this._t("start"), `<input name="start_date" type="date" value="${period?.start_date || ""}" required>`)}
        ${this._field(this._t("end"), `<input name="end_date" type="date" value="${period?.end_date || ""}" required>`)}
        ${this._field(this._t("provider"), `<input name="provider" value="${this._escape(provider)}" placeholder="${this._escape(entry.settings.grid_operator || "")}">`)}
        ${this._field(this._t("consumption"), `<div class="input-unit"><input name="value" type="number" min="0.001" step="any" value="${period?.value ?? ""}" required><span id="value-unit">${this._escape(entry.units[type])}</span></div>`)}
        ${this._field(this._t("totalCost"), `<div class="input-unit"><input name="cost" type="number" min="0" step="any" value="${period?.cost ?? ""}"><span>${this._escape(entry.units.currency)}</span></div>`)}
        <label id="tariff-field"><span>${this._t("tariff")}</span><select name="tariff_mode" id="tariff-mode"><option value="single" ${tariff === "single" ? "selected" : ""}>${this._t("single")}</option><option value="peak_offpeak" ${tariff === "peak_offpeak" ? "selected" : ""}>${this._t("peakOffpeak")}</option></select></label>
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

  _field(label, control) {
    return `<label><span>${label}</span>${control}</label>`;
  }

  _periodRow(entry, period) {
    const analysis = period.electricity_analysis || period.heating_analysis || {};
    const coverage = analysis.coverage ?? analysis.temperature_coverage;
    return `<article class="period-row">
      <div class="period-main"><div class="type-icon">${period.consumption_type === "electricity" ? "⚡" : period.consumption_type === "pv_electricity" ? "☀️" : period.consumption_type === "heating" ? "♨" : "💧"}</div><div><strong>${this._typeLabel(period.consumption_type)}</strong><span>${this._date(period.start_date)} – ${this._date(period.end_date)} · ${period.days} j</span><small class="provider-line">${this._escape(period.provider || this._t("noProvider"))}</small></div></div>
      <div class="metric"><span>${this._t("consumption")}</span><strong>${this._num(period.value, 3)} ${this._escape(entry.units[period.consumption_type])}</strong><small>${this._num(period.daily_average, 3)}/j</small></div>
      <div class="metric"><span>${this._t("totalCost")}</span><strong>${period.cost == null ? "—" : `${this._num(period.cost, 2)} ${this._escape(entry.units.currency)}`}</strong><small>${period.unit_price == null ? "—" : `${this._num(period.unit_price, 4)} ${this._escape(entry.units.unit_prices[period.consumption_type])}`}</small></div>
      <div class="badges">${period.consumption_type === "electricity" ? `<span class="badge">${this._tariffLabel(period.tariff_mode)}</span>` : ""}<span class="badge">${this._distributionLabel(analysis.distribution || "uniform_daily")}</span>${analysis.source ? `<span class="badge accent">${this._escape(analysis.source)}</span>` : ""}${coverage != null ? `<span class="badge">${this._num(coverage * 100, 0)}%</span>` : ""}</div>
      <div class="period-actions"><button class="button compact" data-action="edit" data-id="${period.period_id}">${this._t("edit")}</button><button class="button danger compact" data-action="delete" data-id="${period.period_id}">${this._t("delete")}</button></div>
      ${period.tariff_mode === "peak_offpeak" ? `<div class="tariff-detail"><span>On-peak: <b>${this._num(period.peak_value, 3)} kWh</b>${period.peak_cost != null ? ` · ${this._num(period.peak_cost, 2)} ${entry.units.currency}` : ""}</span><span>Off-peak: <b>${this._num(period.offpeak_value, 3)} kWh</b>${period.offpeak_cost != null ? ` · ${this._num(period.offpeak_cost, 2)} ${entry.units.currency}` : ""}</span></div>` : ""}
      ${period.note ? `<div class="period-note">${this._escape(period.note)}</div>` : ""}
    </article>`;
  }

  _bind() {
    this.shadowRoot.querySelector('[data-action="refresh"]')?.addEventListener("click", async () => {
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
      this._selectedEntryId = event.target.value;
      this._editingPeriodId = null;
      this._historyProvider = "all";
      this._invalidateAnalysis();
      this._render();
      if (this._activeTab === "analysis") this._loadAnalysis();
    });
    this.shadowRoot.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
      this._activeTab = button.dataset.tab;
      this._message = null;
      this._render();
      if (this._activeTab === "analysis") this._loadAnalysis();
    }));
    this.shadowRoot.querySelector("#history-type")?.addEventListener("change", (event) => { this._historyType = event.target.value; this._render(); });
    this.shadowRoot.querySelector("#history-year")?.addEventListener("change", (event) => { this._historyYear = event.target.value; this._render(); });
    this.shadowRoot.querySelector("#history-provider")?.addEventListener("change", (event) => { this._historyProvider = event.target.value; this._render(); });
    this.shadowRoot.querySelector("#period-form")?.addEventListener("submit", (event) => this._handlePeriod(event));
    this.shadowRoot.querySelector("#settings-form")?.addEventListener("submit", (event) => this._handleSettings(event));
    this.shadowRoot.querySelector("#export-form")?.addEventListener("submit", (event) => this._saveExport(event));
    this.shadowRoot.querySelector("#export-backend")?.addEventListener("change", () => this._updateExportFields());
    this.shadowRoot.querySelector("#consumption-type")?.addEventListener("change", (event) => this._periodTypeChanged(event.target.value));
    this.shadowRoot.querySelector("#tariff-mode")?.addEventListener("change", () => this._periodTypeChanged(this.shadowRoot.querySelector("#consumption-type")?.value));
    this.shadowRoot.querySelector('[data-action="cancel-edit"]')?.addEventListener("click", () => { this._editingPeriodId = null; this._render(); });
    this.shadowRoot.querySelector('[data-action="rebuild"]')?.addEventListener("click", () => this._rebuild());
    this.shadowRoot.querySelector('[data-action="test-export"]')?.addEventListener("click", () => this._testExport());
    this.shadowRoot.querySelector('[data-action="sync-export"]')?.addEventListener("click", () => this._syncExport());
    this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach((button) => button.addEventListener("click", () => {
      this._editingPeriodId = button.dataset.id;
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
    this._periodTypeChanged(this.shadowRoot.querySelector("#consumption-type")?.value);
    this._updateExportFields();
  }

  _periodTypeChanged(type) {
    if (!type) return;
    const entry = this._entry;
    const unit = this.shadowRoot.querySelector("#value-unit");
    if (unit && entry) unit.textContent = entry.units[type];
    const tariffField = this.shadowRoot.querySelector("#tariff-field");
    if (tariffField) tariffField.classList.toggle("hidden", type !== "electricity");
    const dual = this.shadowRoot.querySelector("#dual-tariff");
    if (dual) dual.classList.toggle("hidden", type !== "electricity" || this.shadowRoot.querySelector("#tariff-mode")?.value !== "peak_offpeak");
    if (!this._editingPeriodId) {
      const start = this.shadowRoot.querySelector('input[name="start_date"]');
      if (start && !start.value) {
        const dates = entry.periods.filter((period) => period.consumption_type === type).map((period) => period.end_date).sort();
        if (dates.length) {
          const date = new Date(`${dates.at(-1)}T12:00:00`);
          date.setDate(date.getDate() + 1);
          start.value = date.toISOString().slice(0, 10);
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
      this._message = { kind: "success", text: this._t(edit ? "editSuccess" : "addSuccess") };
    });
  }

  async _handleSettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      type: "rental_consumption/update_settings",
      entry_id: this._entry.entry_id,
      grid_operator: form.get("grid_operator") || "",
      currency: form.get("currency") || "CHF",
      heating_distribution: form.get("heating_distribution"),
      outdoor_temperature_sensor: form.get("outdoor_temperature_sensor") || "",
      heating_base_temperature: Number(form.get("heating_base_temperature")),
      electricity_distribution: form.get("electricity_distribution"),
      electricity_load_sensor: form.get("electricity_load_sensor") || "",
      load_curve_source: form.get("load_curve_source"),
      load_curve_min_coverage: Number(form.get("load_curve_min_coverage")),
      vm_load_metric: form.get("vm_load_metric") || "W_value",
      vm_load_db_label: form.get("vm_load_db_label") || "homeassistant"
    };
    await this._run("save-settings", async () => {
      const updated = await this._hass.callWS(payload);
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("saved") };
    });
  }

  _exportPayload() {
    const formElement = this.shadowRoot.querySelector("#export-form");
    if (!formElement) return null;
    const form = new FormData(formElement);
    const payload = {
      type: "rental_consumption/update_export_settings",
      entry_id: this._entry.entry_id,
      export_backend: form.get("export_backend"),
      export_url: form.get("export_url") || "",
      export_auto_sync: form.get("export_auto_sync") === "on",
      export_database: form.get("export_database") || "",
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
      if (!options.silent) this._message = { kind: "success", text: this._t("exportSaved") };
    }, { keepMessage: options.silent });
    return result;
  }

  async _testExport() {
    if (this._busyAction) return;
    const savePayload = this._exportPayload();
    this._busyAction = "test-export";
    this._render();
    try {
      if (savePayload) {
        const updated = await this._hass.callWS(savePayload);
        this._replaceEntry(updated);
      }
      await this._hass.callWS({ type: "rental_consumption/test_export", entry_id: this._entry.entry_id });
      this._message = { kind: "success", text: this._t("connectionOk") };
    } catch (error) {
      this._message = { kind: "error", text: this._friendlyError(error) };
    } finally {
      this._busyAction = null;
      try {
        const fresh = await this._hass.callWS({ type: "rental_consumption/get_data" });
        this._data = fresh;
      } catch (_error) {
        // Keep the visible local feedback even if refreshing the persisted status fails.
      }
      this._activeTab = "settings";
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
    if (!confirm(this._t("confirmDelete"))) return;
    await this._run("delete-period", async () => {
      const updated = await this._hass.callWS({ type: "rental_consumption/delete_period", entry_id: this._entry.entry_id, period_id: id });
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("deleteSuccess") };
    });
  }

  async _rebuild() {
    if (!confirm(this._t("confirmRebuild"))) return;
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
      this._message = { kind: "error", text: this._friendlyError(error) };
    } finally {
      this._busyAction = null;
      this._render();
    }
  }

  _friendlyError(error) {
    const raw = String(error?.message || error || "");
    const fr = {
      tariff_total_mismatch: "La somme on-peak + off-peak doit être égale à la consommation totale.",
      tariff_cost_mismatch: "La somme des coûts on-peak + off-peak doit être égale au coût total.",
      invalid_tariff_values: "Les consommations on-peak / off-peak sont invalides.",
      export_not_configured: "La base externe n’est pas configurée.",
      safe_rebuild_not_supported: "Cette destination ne permet pas une reconstruction sûre avec suppression.",
      delete_not_supported: "La suppression sûre n’est pas disponible pour cette destination.",
      recorder_unavailable: "Recorder n’est pas disponible.",
      recorder_error: "La reconstruction Recorder a échoué. Le détail technique est conservé ci-dessous.",
      apartment_exists: "Un logement portant ce nom existe déjà.",
      invalid_name: "Le nom du logement n’est pas valide.",
      apartment_create_failed: "La création du logement a échoué.",
      apartment_setup_failed: "Le logement a été créé mais son chargement dans Home Assistant a échoué.",
      overlap: "Cette période chevauche une période existante du même type.",
      future_end: "La date de fin ne peut pas être dans le futur.",
      database_required: "Le champ Database est obligatoire pour cette destination.",
      org_bucket_required: "Organisation et Bucket sont obligatoires pour InfluxDB 2.",
      read_failed: "VictoriaMetrics est joignable et accepte l’écriture, mais le point de test n’a pas pu être relu.",
      write_failed: "La connexion au serveur fonctionne, mais l’écriture du point de test a échoué.",
      delete_failed: "Le test d’écriture fonctionne, mais la suppression du point de test a échoué. Vérifie deleteAuthKey si tu l’utilises.",
      health_failed: "VictoriaMetrics n’est pas joignable avec les paramètres actuels."
    };
    const en = {
      tariff_total_mismatch: "Peak + off-peak consumption must equal total consumption.",
      tariff_cost_mismatch: "Peak + off-peak costs must equal total cost.",
      invalid_tariff_values: "Peak / off-peak values are invalid.",
      export_not_configured: "The external database is not configured.",
      safe_rebuild_not_supported: "This destination does not support a safe delete-and-rebuild.",
      delete_not_supported: "Safe deletion is not available for this destination.",
      recorder_unavailable: "Recorder is unavailable.",
      recorder_error: "Recorder reconstruction failed. The technical detail is preserved below.",
      apartment_exists: "A dwelling with this name already exists.",
      invalid_name: "The dwelling name is invalid.",
      apartment_create_failed: "Creating the dwelling failed.",
      apartment_setup_failed: "The dwelling was created but could not be loaded in Home Assistant.",
      overlap: "This period overlaps an existing period of the same type.",
      future_end: "The end date cannot be in the future.",
      database_required: "Database is required for this destination.",
      org_bucket_required: "Organization and Bucket are required for InfluxDB 2.",
      read_failed: "VictoriaMetrics accepted the write, but the test point could not be read back.",
      write_failed: "The server is reachable, but writing the test point failed.",
      delete_failed: "The write test worked, but deleting the test point failed. Check deleteAuthKey if you use it.",
      health_failed: "VictoriaMetrics is not reachable with the current settings."
    };
    const map = this._lang === "fr" ? fr : en;
    for (const [code, message] of Object.entries(map)) if (raw.includes(code)) return `${message}${raw.includes(":") ? ` (${raw})` : ""}`;
    return raw;
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
      .modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.48);backdrop-filter:blur(4px)}.modal-card{width:min(720px,100%);max-height:90vh;overflow:auto;padding:20px;background:var(--ha-card-background,var(--card-background-color));border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,14px);box-shadow:0 18px 55px rgba(0,0,0,.32)}.modal-card .section-header{margin-bottom:16px}
      .hidden{display:none!important}
      @media(max-width:1100px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.overview-grid{grid-template-columns:1fr}.form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.analysis-layout{grid-template-columns:1fr}.analysis-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.period-row{grid-template-columns:1.4fr 1fr 1fr}.badges{grid-column:1/3}.period-actions{grid-column:3;grid-row:2}}
      @media(max-width:700px){main{padding:14px 10px 40px}.page-header,.section-header{align-items:flex-start;flex-direction:column}.summary-grid,.form-grid,.analysis-grid,.tariff-grid,.analysis-toolbar,.analysis-kpi-grid{grid-template-columns:1fr}.wide{grid-column:auto}.picker-row{grid-template-columns:1fr}.picker-card label{grid-template-columns:1fr}.apartment-actions .button{flex:1}.tabs{border-radius:10px}.tab{padding:9px 12px}.history-toolbar{flex-direction:column}.history-toolbar select{width:100%}.period-row{grid-template-columns:1fr;gap:12px;padding:14px}.badges,.period-actions,.tariff-detail,.period-note{grid-column:1}.period-actions{grid-row:auto;justify-content:flex-end}.tariff-detail{flex-direction:column;gap:6px}.actions,.export-actions,.sticky-actions{flex-wrap:wrap;justify-content:stretch}.actions .button,.export-actions .button,.sticky-actions .button{flex:1}.sticky-actions{bottom:4px}}
    `;
  }
}

if (!customElements.get("rental-consumption-panel")) {
  customElements.define("rental-consumption-panel", RentalConsumptionPanel);
}
