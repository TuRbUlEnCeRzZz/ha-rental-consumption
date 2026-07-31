const TRANSLATIONS = {
  fr: {
    title: "Consommation locative",
    subtitle: "Suivi manuel des décomptes d’un appartement sans compteurs accessibles.",
    apartment: "Appartement",
    gridOperator: "GRD / fournisseur",
    currency: "Devise",
    water: "Eau totale",
    hotWater: "Eau chaude",
    heating: "Chauffage",
    electricity: "Électricité",
    electricityCost: "Coût électricité",
    averagePrice: "Prix moyen",
    totalWater: "Eau totale importée",
    totalHotWater: "Eau chaude importée",
    totalHeating: "Chauffage importé",
    totalElectricity: "Électricité importée",
    periods: "Périodes enregistrées",
    settings: "Réglages",
    saveSettings: "Enregistrer les réglages",
    saving: "Enregistrement…",
    heatingDistribution: "Répartition du chauffage",
    uniformDaily: "Uniforme sur chaque jour",
    outdoorTemperature: "Selon la température extérieure (degrés-jours)",
    outdoorSensor: "Capteur de température extérieure",
    noSensor: "— Aucun capteur —",
    baseTemperature: "Température de base",
    heatingAnalysis: "Analyse du chauffage",
    effectiveDistribution: "Répartition effective",
    temperatureCoverage: "Couverture de température",
    meanOutdoorTemperature: "Température extérieure moyenne",
    temperatureCorrelation: "Corrélation entre périodes",
    correlationPeriods: "périodes exploitables",
    weightedPeriods: "Périodes pondérées",
    fallbackPeriods: "Périodes uniformes par défaut",
    fallbackInfo: "Sans statistiques journalières suffisantes, la répartition reste uniforme. La corrélation compare la température moyenne et la consommation journalière réellement facturée entre au moins trois périodes ayant 50 % de couverture.",
    addPeriod: "Ajouter une période",
    type: "Type de consommation",
    startDate: "Date de début",
    endDate: "Date de fin incluse",
    value: "Consommation totale",
    cost: "Prix total de la période",
    costOptional: "facultatif",
    note: "Note facultative",
    add: "Ajouter",
    adding: "Ajout en cours…",
    history: "Historique des périodes",
    period: "Période",
    consumption: "Consommation",
    price: "Prix",
    distribution: "Répartition",
    dailyAverage: "Moyenne journalière",
    actions: "Actions",
    delete: "Supprimer",
    noPeriods: "Aucune période n’est encore enregistrée.",
    refresh: "Actualiser",
    rebuild: "Reconstruire les statistiques",
    rebuilding: "Reconstruction…",
    loading: "Chargement…",
    noEntry: "Aucun appartement n’est configuré dans l’intégration.",
    addSuccess: "La période a été ajoutée.",
    deleteSuccess: "La période a été supprimée.",
    rebuildSuccess: "Les statistiques ont été reconstruites.",
    settingsSuccess: "Les réglages ont été enregistrés et les statistiques reconstruites.",
    confirmDelete: "Supprimer définitivement cette période ?",
    confirmRebuild: "Reconstruire toutes les statistiques depuis les périodes enregistrées ?",
    noteEmpty: "—",
    days: "jours",
    close: "Fermer",
    perUnit: "par unité",
    errorGeneric: "Une erreur inattendue s’est produite.",
    error_end_before_start: "La date de fin doit être postérieure ou égale à la date de début.",
    error_future_end: "La date de fin ne peut pas être dans le futur.",
    error_invalid_value: "La consommation doit être supérieure à zéro.",
    error_invalid_cost: "Le prix ne peut pas être négatif.",
    error_overlap: "Cette période chevauche une période existante du même type.",
    error_period_not_found: "Cette période n’existe plus.",
    error_recorder_unavailable: "La base Recorder de Home Assistant n’est pas disponible.",
    error_entry_not_found: "L’appartement n’est plus chargé.",
    error_invalid_distribution: "Le mode de répartition est invalide.",
    error_invalid_base_temperature: "La température de base doit être comprise entre 5 et 30 °C.",
    error_temperature_sensor_required: "Sélectionnez un capteur de température extérieure.",
  },
  en: {
    title: "Rental consumption",
    subtitle: "Manual billing-period tracking for a rental without accessible meters.",
    apartment: "Apartment",
    gridOperator: "Grid operator / supplier",
    currency: "Currency",
    water: "Total water",
    hotWater: "Hot water",
    heating: "Heating",
    electricity: "Electricity",
    electricityCost: "Electricity cost",
    averagePrice: "Average price",
    totalWater: "Imported total water",
    totalHotWater: "Imported hot water",
    totalHeating: "Imported heating",
    totalElectricity: "Imported electricity",
    periods: "Stored periods",
    settings: "Settings",
    saveSettings: "Save settings",
    saving: "Saving…",
    heatingDistribution: "Heating distribution",
    uniformDaily: "Uniform per day",
    outdoorTemperature: "Outdoor-temperature heating degree days",
    outdoorSensor: "Outdoor temperature sensor",
    noSensor: "— No sensor —",
    baseTemperature: "Base temperature",
    heatingAnalysis: "Heating analysis",
    effectiveDistribution: "Effective distribution",
    temperatureCoverage: "Temperature coverage",
    meanOutdoorTemperature: "Mean outdoor temperature",
    temperatureCorrelation: "Correlation across periods",
    correlationPeriods: "usable periods",
    weightedPeriods: "Weighted periods",
    fallbackPeriods: "Uniform fallback periods",
    fallbackInfo: "Without sufficient daily statistics, the period remains uniformly distributed.",
    addPeriod: "Add a period",
    type: "Consumption type",
    startDate: "Start date",
    endDate: "End date included",
    value: "Total consumption",
    cost: "Total period price",
    costOptional: "optional",
    note: "Optional note",
    add: "Add",
    adding: "Adding…",
    history: "Period history",
    period: "Period",
    consumption: "Consumption",
    price: "Price",
    distribution: "Distribution",
    dailyAverage: "Daily average",
    actions: "Actions",
    delete: "Delete",
    noPeriods: "No period has been stored yet.",
    refresh: "Refresh",
    rebuild: "Rebuild statistics",
    rebuilding: "Rebuilding…",
    loading: "Loading…",
    noEntry: "No apartment is configured in the integration.",
    addSuccess: "The period was added.",
    deleteSuccess: "The period was deleted.",
    rebuildSuccess: "Statistics were rebuilt.",
    settingsSuccess: "Settings were saved and statistics rebuilt.",
    confirmDelete: "Permanently delete this period?",
    confirmRebuild: "Rebuild all statistics from stored periods?",
    noteEmpty: "—",
    days: "days",
    close: "Close",
    perUnit: "per unit",
    errorGeneric: "An unexpected error occurred.",
    error_end_before_start: "The end date must be on or after the start date.",
    error_future_end: "The end date cannot be in the future.",
    error_invalid_value: "Consumption must be greater than zero.",
    error_invalid_cost: "The price cannot be negative.",
    error_overlap: "This period overlaps another period of the same type.",
    error_period_not_found: "This period no longer exists.",
    error_recorder_unavailable: "Home Assistant Recorder is unavailable.",
    error_entry_not_found: "The apartment is no longer loaded.",
    error_invalid_distribution: "The distribution mode is invalid.",
    error_invalid_base_temperature: "Base temperature must be between 5 and 30 °C.",
    error_temperature_sensor_required: "Select an outdoor temperature sensor.",
  },
};

class RentalConsumptionPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = undefined;
    this._selectedEntryId = undefined;
    this._busy = false;
    this._message = undefined;
    this._loaded = false;
  }

  set hass(value) {
    this._hass = value;
    if (!this._loaded) {
      this._loaded = true;
      this._loadData();
    }
  }

  set panel(value) {
    this._panel = value;
  }

  connectedCallback() {
    this._render();
  }

  get _language() {
    const language = this._hass?.language || "fr";
    return language.startsWith("fr") ? "fr" : "en";
  }

  get _selectedEntry() {
    const entries = this._data?.entries || [];
    return entries.find((entry) => entry.entry_id === this._selectedEntryId) || entries[0];
  }

  _t(key) {
    return TRANSLATIONS[this._language][key] || TRANSLATIONS.fr[key] || key;
  }

  async _loadData() {
    if (!this._hass) return;
    this._busy = true;
    this._render();
    try {
      this._data = await this._hass.callWS({ type: "rental_consumption/get_data" });
      if (!this._selectedEntryId || !this._data.entries.some((entry) => entry.entry_id === this._selectedEntryId)) {
        this._selectedEntryId = this._data.entries[0]?.entry_id;
      }
    } catch (error) {
      this._setError(error);
    } finally {
      this._busy = false;
      this._render();
    }
  }

  _replaceEntry(updated) {
    if (!this._data) this._data = { entries: [] };
    const index = this._data.entries.findIndex((entry) => entry.entry_id === updated.entry_id);
    if (index === -1) this._data.entries.push(updated);
    else this._data.entries[index] = updated;
  }

  _setError(error) {
    const code = error?.code || error?.message;
    const key = `error_${code}`;
    const text = TRANSLATIONS[this._language][key] || TRANSLATIONS.fr[key] || this._t("errorGeneric");
    this._message = { kind: "error", text };
  }

  _formatNumber(value, digits = 3) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    return new Intl.NumberFormat(this._language, { maximumFractionDigits: digits }).format(Number(value));
  }

  _formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat(this._language).format(new Date(`${value}T12:00:00`));
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _temperatureSensors() {
    if (!this._hass) return [];
    return Object.values(this._hass.states)
      .filter((state) => state.entity_id.startsWith("sensor.") && state.attributes?.device_class === "temperature")
      .sort((a, b) => (a.attributes.friendly_name || a.entity_id).localeCompare(b.attributes.friendly_name || b.entity_id));
  }

  _typeLabel(type) {
    return this._t({ water: "water", hot_water: "hotWater", heating: "heating", electricity: "electricity" }[type] || type);
  }

  _distributionLabel(mode) {
    return mode === "outdoor_temperature" ? this._t("outdoorTemperature") : this._t("uniformDaily");
  }

  _render() {
    if (!this.shadowRoot) return;
    const entry = this._selectedEntry;
    const message = this._message
      ? `<div class="message ${this._message.kind}"><span>${this._escape(this._message.text)}</span><button class="message-close" data-action="close-message" title="${this._t("close")}">×</button></div>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main>
        <header class="page-header">
          <div><h1>${this._t("title")}</h1><p>${this._t("subtitle")}</p></div>
          <button class="button secondary" data-action="refresh" ${this._busy ? "disabled" : ""}>${this._t("refresh")}</button>
        </header>
        ${message}
        ${!this._data ? `<section class="card empty">${this._t("loading")}</section>` : ""}
        ${this._data && !this._data.entries.length ? `<section class="card empty">${this._t("noEntry")}</section>` : ""}
        ${entry ? this._renderEntry(entry) : ""}
      </main>`;
    this._bindEvents();
  }

  _renderEntry(entry) {
    const settings = entry.settings;
    const analysis = entry.heating_analysis || {};
    const sensors = this._temperatureSensors();
    const sensorOptions = [
      `<option value="">${this._t("noSensor")}</option>`,
      ...sensors.map((state) => `<option value="${this._escape(state.entity_id)}" ${state.entity_id === settings.outdoor_temperature_sensor ? "selected" : ""}>${this._escape(state.attributes.friendly_name || state.entity_id)} (${this._escape(state.entity_id)})</option>`),
    ].join("");

    return `
      <section class="card apartment-picker">
        <label>${this._t("apartment")}</label>
        <select id="entry-select">${this._data.entries.map((item) => `<option value="${this._escape(item.entry_id)}" ${item.entry_id === entry.entry_id ? "selected" : ""}>${this._escape(item.title)}</option>`).join("")}</select>
        <span class="muted">${this._t("gridOperator")}: <strong>${settings.grid_operator ? this._escape(settings.grid_operator) : "—"}</strong></span>
      </section>

      <section class="summary-grid">
        ${this._summaryCard("water", this._t("totalWater"), entry.totals.water, entry.units.water)}
        ${this._summaryCard("hot-water", this._t("totalHotWater"), entry.totals.hot_water, entry.units.hot_water)}
        ${this._summaryCard("heating", this._t("totalHeating"), entry.totals.heating, entry.units.heating)}
        ${this._summaryCard("electricity", this._t("totalElectricity"), entry.totals.electricity, entry.units.electricity)}
        ${this._summaryCard("cost", this._t("electricityCost"), entry.totals.electricity_cost, entry.units.electricity_cost)}
        ${this._summaryCard("periods", this._t("periods"), entry.counts.all, "")}
      </section>

      <section class="card">
        <h2>${this._t("settings")}</h2>
        <form id="settings-form">
          <div class="form-grid settings-grid">
            <label>${this._t("gridOperator")}<input name="grid_operator" value="${this._escape(settings.grid_operator)}" maxlength="100"></label>
            <label>${this._t("currency")}<input name="currency" value="${this._escape(settings.currency)}" maxlength="8" required></label>
            <label>${this._t("heatingDistribution")}<select name="heating_distribution" id="heating-distribution"><option value="uniform_daily" ${settings.heating_distribution === "uniform_daily" ? "selected" : ""}>${this._t("uniformDaily")}</option><option value="outdoor_temperature" ${settings.heating_distribution === "outdoor_temperature" ? "selected" : ""}>${this._t("outdoorTemperature")}</option></select></label>
            <label>${this._t("baseTemperature")}<div class="input-unit"><input name="heating_base_temperature" type="number" min="5" max="30" step="0.1" value="${this._escape(settings.heating_base_temperature)}" required><span>°C</span></div></label>
            <label class="wide" id="outdoor-sensor-field">${this._t("outdoorSensor")}<select name="outdoor_temperature_sensor">${sensorOptions}</select></label>
          </div>
          <div class="form-actions"><button class="button primary" type="submit" ${this._busy ? "disabled" : ""}>${this._busy ? this._t("saving") : this._t("saveSettings")}</button></div>
        </form>
      </section>

      <section class="card analysis-card">
        <h2>${this._t("heatingAnalysis")}</h2>
        <div class="analysis-grid">
          <div><span>${this._t("effectiveDistribution")}</span><strong>${this._distributionLabel(analysis.effective_distribution)}</strong></div>
          <div><span>${this._t("temperatureCoverage")}</span><strong>${this._formatNumber((analysis.temperature_coverage || 0) * 100, 1)} %</strong></div>
          <div><span>${this._t("meanOutdoorTemperature")}</span><strong>${analysis.mean_outdoor_temperature == null ? "—" : `${this._formatNumber(analysis.mean_outdoor_temperature, 1)} °C`}</strong></div>
          <div><span>${this._t("temperatureCorrelation")}</span><strong>${analysis.temperature_correlation == null ? "—" : `r = ${this._formatNumber(analysis.temperature_correlation, 3)}`}</strong><small>${analysis.correlation_periods || 0} ${this._t("correlationPeriods")}</small></div>
          <div><span>${this._t("weightedPeriods")}</span><strong>${analysis.weighted_periods || 0}</strong></div>
          <div><span>${this._t("fallbackPeriods")}</span><strong>${analysis.fallback_periods || 0}</strong></div>
        </div>
        <p class="hint">${this._t("fallbackInfo")}</p>
      </section>

      <section class="card">
        <h2>${this._t("addPeriod")}</h2>
        <form id="period-form">
          <div class="form-grid">
            <label>${this._t("type")}<select name="consumption_type" id="consumption-type"><option value="water">${this._t("water")}</option><option value="hot_water">${this._t("hotWater")}</option><option value="heating">${this._t("heating")}</option><option value="electricity">${this._t("electricity")}</option></select></label>
            <label>${this._t("startDate")}<input type="date" name="start_date" required></label>
            <label>${this._t("endDate")}<input type="date" name="end_date" required></label>
            <label>${this._t("value")}<div class="input-unit"><input type="number" name="value" min="0.001" step="any" required><span id="value-unit">${this._escape(entry.units.water)}</span></div></label>
            <label id="cost-field" class="hidden">${this._t("cost")} <small>(${this._t("costOptional")})</small><div class="input-unit"><input type="number" name="cost" min="0" step="any"><span>${this._escape(entry.units.electricity_cost)}</span></div></label>
            <label class="wide">${this._t("note")}<input type="text" name="note" maxlength="250"></label>
          </div>
          <div class="form-actions"><button class="button primary" type="submit" ${this._busy ? "disabled" : ""}>${this._busy ? this._t("adding") : this._t("add")}</button></div>
        </form>
      </section>

      <section class="card">
        <div class="section-header"><h2>${this._t("history")}</h2><button class="button secondary" data-action="rebuild" ${this._busy ? "disabled" : ""}>${this._busy ? this._t("rebuilding") : this._t("rebuild")}</button></div>
        ${this._renderPeriods(entry)}
      </section>`;
  }

  _summaryCard(kind, label, value, unit) {
    return `<article class="summary-card ${kind}"><span class="summary-label">${label}</span><strong>${this._formatNumber(value)}${unit ? ` <small>${this._escape(unit)}</small>` : ""}</strong></article>`;
  }

  _renderPeriods(entry) {
    if (!entry.periods.length) return `<div class="empty">${this._t("noPeriods")}</div>`;
    return `<div class="table-scroll"><table><thead><tr><th>${this._t("type")}</th><th>${this._t("period")}</th><th>${this._t("consumption")}</th><th>${this._t("price")}</th><th>${this._t("distribution")}</th><th>${this._t("note")}</th><th class="actions-column">${this._t("actions")}</th></tr></thead><tbody>${entry.periods.map((period) => {
      const unit = entry.units[period.consumption_type];
      const price = period.cost == null ? "—" : `${this._formatNumber(period.cost, 2)} ${this._escape(entry.units.electricity_cost)}${period.unit_price == null ? "" : `<small>${this._formatNumber(period.unit_price, 5)} ${this._escape(entry.units.electricity_unit_price)}</small>`}`;
      const analysis = period.heating_analysis || {};
      const distribution = period.consumption_type === "heating" ? `${this._distributionLabel(analysis.distribution)}${analysis.temperature_coverage == null ? "" : `<small>${this._formatNumber(analysis.temperature_coverage * 100, 1)} %</small>`}` : this._t("uniformDaily");
      return `<tr><td><span class="type-badge ${period.consumption_type}">${this._typeLabel(period.consumption_type)}</span></td><td><strong>${this._formatDate(period.start_date)} – ${this._formatDate(period.end_date)}</strong><small>${period.days} ${this._t("days")}</small></td><td>${this._formatNumber(period.value, 6)} ${this._escape(unit)}<small>${this._formatNumber(period.daily_average, 6)} ${this._escape(unit)}/j</small></td><td>${price}</td><td>${distribution}</td><td>${period.note ? this._escape(period.note) : this._t("noteEmpty")}</td><td class="actions-column"><button class="button danger compact" data-action="delete" data-period-id="${this._escape(period.period_id)}" ${this._busy ? "disabled" : ""}>${this._t("delete")}</button></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  _bindEvents() {
    this.shadowRoot.querySelector('[data-action="refresh"]')?.addEventListener("click", () => this._loadData());
    this.shadowRoot.querySelector('[data-action="close-message"]')?.addEventListener("click", () => { this._message = undefined; this._render(); });
    this.shadowRoot.querySelector("#entry-select")?.addEventListener("change", (event) => { this._selectedEntryId = event.target.value; this._message = undefined; this._render(); });
    this.shadowRoot.querySelector("#period-form")?.addEventListener("submit", (event) => this._handleAdd(event));
    this.shadowRoot.querySelector("#settings-form")?.addEventListener("submit", (event) => this._handleSettings(event));
    this.shadowRoot.querySelector("#consumption-type")?.addEventListener("change", () => this._updatePeriodForm());
    this.shadowRoot.querySelector("#heating-distribution")?.addEventListener("change", () => this._updateSettingsForm());
    this.shadowRoot.querySelector('[data-action="rebuild"]')?.addEventListener("click", () => this._handleRebuild());
    this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach((button) => button.addEventListener("click", () => this._handleDelete(button.dataset.periodId)));
    this._updatePeriodForm();
    this._updateSettingsForm();
  }

  _updatePeriodForm() {
    const type = this.shadowRoot.querySelector("#consumption-type")?.value || "water";
    const entry = this._selectedEntry;
    const unitElement = this.shadowRoot.querySelector("#value-unit");
    if (unitElement && entry) unitElement.textContent = entry.units[type];
    this.shadowRoot.querySelector("#cost-field")?.classList.toggle("hidden", type !== "electricity");
  }

  _updateSettingsForm() {
    const mode = this.shadowRoot.querySelector("#heating-distribution")?.value;
    this.shadowRoot.querySelector("#outdoor-sensor-field")?.classList.toggle("disabled-field", mode !== "outdoor_temperature");
  }

  async _handleAdd(event) {
    event.preventDefault();
    if (this._busy || !this._selectedEntry) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      type: "rental_consumption/add_period",
      entry_id: this._selectedEntry.entry_id,
      consumption_type: form.get("consumption_type"),
      start_date: form.get("start_date"),
      end_date: form.get("end_date"),
      value: Number(form.get("value")),
      note: form.get("note") || "",
    };
    if (payload.consumption_type === "electricity" && form.get("cost") !== "") payload.cost = Number(form.get("cost"));
    this._busy = true; this._message = undefined; this._render();
    try {
      const updated = await this._hass.callWS(payload);
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("addSuccess") };
    } catch (error) { this._setError(error); }
    finally { this._busy = false; this._render(); }
  }

  async _handleSettings(event) {
    event.preventDefault();
    if (this._busy || !this._selectedEntry) return;
    const form = new FormData(event.currentTarget);
    this._busy = true; this._message = undefined; this._render();
    try {
      const updated = await this._hass.callWS({
        type: "rental_consumption/update_settings",
        entry_id: this._selectedEntry.entry_id,
        grid_operator: form.get("grid_operator") || "",
        currency: form.get("currency") || "CHF",
        heating_distribution: form.get("heating_distribution"),
        outdoor_temperature_sensor: form.get("outdoor_temperature_sensor") || "",
        heating_base_temperature: Number(form.get("heating_base_temperature")),
      });
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("settingsSuccess") };
    } catch (error) { this._setError(error); }
    finally { this._busy = false; this._render(); }
  }

  async _handleDelete(periodId) {
    if (this._busy || !window.confirm(this._t("confirmDelete"))) return;
    this._busy = true; this._message = undefined; this._render();
    try {
      const updated = await this._hass.callWS({ type: "rental_consumption/delete_period", entry_id: this._selectedEntry.entry_id, period_id: periodId });
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("deleteSuccess") };
    } catch (error) { this._setError(error); }
    finally { this._busy = false; this._render(); }
  }

  async _handleRebuild() {
    if (this._busy || !window.confirm(this._t("confirmRebuild"))) return;
    this._busy = true; this._message = undefined; this._render();
    try {
      const updated = await this._hass.callWS({ type: "rental_consumption/rebuild_statistics", entry_id: this._selectedEntry.entry_id });
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("rebuildSuccess") };
    } catch (error) { this._setError(error); }
    finally { this._busy = false; this._render(); }
  }

  _styles() {
    return `
      :host { display:block; min-height:100%; background:var(--primary-background-color); color:var(--primary-text-color); font-family:var(--ha-font-family-body, Roboto, sans-serif); }
      * { box-sizing:border-box; } main { max-width:1380px; margin:0 auto; padding:28px 20px 48px; }
      .page-header,.section-header { display:flex; align-items:center; justify-content:space-between; gap:16px; } .page-header { margin-bottom:22px; }
      h1 { margin:0; font-size:28px; font-weight:500; } h2 { margin:0 0 20px; font-size:20px; font-weight:500; } .page-header p,.hint,.muted { color:var(--secondary-text-color); }
      .card,.summary-card { background:var(--card-background-color); border-radius:var(--ha-card-border-radius,12px); box-shadow:var(--ha-card-box-shadow,0 2px 2px rgba(0,0,0,.08)); border:var(--ha-card-border-width,0) solid var(--ha-card-border-color,transparent); }
      .card { padding:22px; margin-bottom:20px; } .summary-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; margin-bottom:20px; }
      .summary-card { padding:20px; border-left:4px solid var(--primary-color); } .summary-card.water { border-left-color:var(--info-color,#039be5); } .summary-card.hot-water { border-left-color:#00acc1; } .summary-card.heating { border-left-color:var(--warning-color,#ff9800); } .summary-card.electricity { border-left-color:#fdd835; } .summary-card.cost { border-left-color:#8e24aa; } .summary-card.periods { border-left-color:var(--success-color,#43a047); }
      .summary-label { display:block; color:var(--secondary-text-color); font-size:14px; margin-bottom:9px; } .summary-card strong { font-size:27px; font-weight:500; } .summary-card small { font-size:16px; color:var(--secondary-text-color); }
      .form-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; } .settings-grid { grid-template-columns:repeat(4,minmax(0,1fr)); } .form-grid label { display:flex; flex-direction:column; gap:7px; color:var(--secondary-text-color); font-size:13px; } .form-grid label.wide { grid-column:1/-1; }
      input,select { width:100%; min-height:44px; border:1px solid var(--divider-color); border-radius:8px; padding:9px 11px; background:var(--card-background-color); color:var(--primary-text-color); font:inherit; color-scheme:light dark; } input:focus,select:focus { outline:2px solid var(--primary-color); outline-offset:1px; }
      .input-unit { display:flex; align-items:center; border:1px solid var(--divider-color); border-radius:8px; overflow:hidden; } .input-unit input { border:0; border-radius:0; } .input-unit span { padding:0 11px; white-space:nowrap; color:var(--secondary-text-color); }
      .form-actions { display:flex; justify-content:flex-end; margin-top:18px; } .button { min-height:40px; border-radius:8px; border:none; padding:9px 16px; font:inherit; font-weight:500; cursor:pointer; } .button:disabled { opacity:.5; cursor:default; } .button.primary { background:var(--primary-color); color:var(--text-primary-color,white); } .button.secondary { background:var(--secondary-background-color); color:var(--primary-text-color); } .button.danger { background:transparent; color:var(--error-color,#db4437); border:1px solid var(--error-color,#db4437); } .button.compact { min-height:34px; padding:6px 11px; font-size:13px; }
      .message { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:13px 16px; border-radius:9px; margin-bottom:18px; } .message.success { background:var(--success-color,#43a047); color:white; } .message.error { background:var(--error-color,#db4437); color:white; } .message-close { border:0; background:transparent; color:inherit; font-size:24px; cursor:pointer; }
      .apartment-picker { display:flex; align-items:center; gap:16px; } .apartment-picker select { max-width:360px; } .analysis-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; } .analysis-grid div { background:var(--secondary-background-color); padding:14px; border-radius:9px; } .analysis-grid span { display:block; color:var(--secondary-text-color); font-size:12px; margin-bottom:6px; } .analysis-grid strong { font-size:16px; font-weight:500; } .analysis-grid small { display:block; color:var(--secondary-text-color); margin-top:5px; }
      .table-scroll { overflow-x:auto; margin:18px -22px -22px; } table { width:100%; border-collapse:collapse; min-width:1120px; } th,td { text-align:left; padding:14px 18px; border-top:1px solid var(--divider-color); vertical-align:middle; } th { color:var(--secondary-text-color); font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:.03em; } td small { display:block; color:var(--secondary-text-color); margin-top:4px; } .actions-column { text-align:right; }
      .type-badge { display:inline-block; padding:5px 9px; border-radius:999px; font-size:12px; font-weight:500; background:var(--secondary-background-color); } .type-badge.water { color:var(--info-color,#039be5); } .type-badge.hot_water { color:#00acc1; } .type-badge.heating { color:var(--warning-color,#ff9800); } .type-badge.electricity { color:#f9a825; }
      .empty { color:var(--secondary-text-color); padding:22px; text-align:center; } .hidden { display:none !important; } .disabled-field { opacity:.55; }
      @media (max-width:1000px) { .analysis-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .summary-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .form-grid,.settings-grid { grid-template-columns:1fr 1fr; } }
      @media (max-width:600px) { main { padding:18px 12px 36px; } .page-header,.section-header { align-items:flex-start; flex-direction:column; } .summary-grid,.analysis-grid,.form-grid,.settings-grid { grid-template-columns:1fr; } .form-grid label.wide { grid-column:auto; } .card { padding:16px; } .table-scroll { margin-left:-16px; margin-right:-16px; } .form-actions .button,.page-header .button,.section-header .button { width:100%; } .apartment-picker { align-items:stretch; flex-direction:column; } .apartment-picker select { max-width:none; } }
    `;
  }
}

if (!customElements.get("rental-consumption-panel")) {
  customElements.define("rental-consumption-panel", RentalConsumptionPanel);
}
