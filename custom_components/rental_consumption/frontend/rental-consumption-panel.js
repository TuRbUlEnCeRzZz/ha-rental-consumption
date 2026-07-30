const TRANSLATIONS = {
  fr: {
    title: "Consommation locative",
    subtitle: "Entrer ",
    apartment: "Appartement",
    water: "Eau",
    heating: "Chauffage",
    totalWater: "Total eau importée",
    totalHeating: "Total chauffage importé",
    periods: "Périodes enregistrées",
    addPeriod: "Ajouter une période",
    type: "Type de consommation",
    startDate: "Date de début",
    endDate: "Date de fin incluse",
    value: "Consommation totale",
    note: "Note facultative",
    add: "Ajouter",
    adding: "Ajout en cours…",
    history: "Historique des périodes",
    period: "Période",
    consumption: "Consommation",
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
    confirmDelete: "Supprimer définitivement cette période ?",
    confirmRebuild: "Reconstruire toutes les statistiques depuis les périodes enregistrées ?",
    noteEmpty: "—",
    days: "jours",
    close: "Fermer",
    errorGeneric: "Une erreur inattendue s’est produite.",
    error_end_before_start: "La date de fin doit être postérieure ou égale à la date de début.",
    error_future_end: "La date de fin ne peut pas être dans le futur.",
    error_invalid_value: "La consommation doit être supérieure à zéro.",
    error_overlap: "Cette période chevauche une période existante du même type.",
    error_period_not_found: "Cette période n’existe plus.",
    error_recorder_unavailable: "La base Recorder de Home Assistant n’est pas disponible.",
    error_entry_not_found: "L’appartement n’est plus chargé.",
  },
  en: {
    title: "Rental consumption",
    subtitle: "Enter consumption totals supplied by your landlord or property manager.",
    apartment: "Apartment",
    water: "Water",
    heating: "Heating",
    totalWater: "Imported water total",
    totalHeating: "Imported heating total",
    periods: "Stored periods",
    addPeriod: "Add a period",
    type: "Consumption type",
    startDate: "Start date",
    endDate: "End date included",
    value: "Total consumption",
    note: "Optional note",
    add: "Add",
    adding: "Adding…",
    history: "Period history",
    period: "Period",
    consumption: "Consumption",
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
    confirmDelete: "Permanently delete this period?",
    confirmRebuild: "Rebuild all statistics from the stored periods?",
    noteEmpty: "—",
    days: "days",
    close: "Close",
    errorGeneric: "An unexpected error occurred.",
    error_end_before_start: "The end date must be on or after the start date.",
    error_future_end: "The end date cannot be in the future.",
    error_invalid_value: "Consumption must be greater than zero.",
    error_overlap: "This period overlaps an existing period of the same type.",
    error_period_not_found: "This period no longer exists.",
    error_recorder_unavailable: "Home Assistant Recorder is unavailable.",
    error_entry_not_found: "The apartment is no longer loaded.",
  },
};

class RentalConsumptionPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = undefined;
    this._data = { entries: [] };
    this._selectedEntryId = undefined;
    this._loading = false;
    this._busy = false;
    this._message = undefined;
    this._initialized = false;
  }

  set hass(value) {
    const firstValue = !this._hass;
    this._hass = value;
    if (firstValue && this.isConnected) {
      this._loadData();
    }
  }

  get hass() {
    return this._hass;
  }

  set narrow(value) {
    this._narrow = value;
  }

  set route(value) {
    this._route = value;
  }

  set panel(value) {
    this._panel = value;
  }

  connectedCallback() {
    this._render();
    if (this._hass && !this._initialized) {
      this._loadData();
    }
  }

  get _language() {
    const language = this._hass?.language || navigator.language || "fr";
    return language.toLowerCase().startsWith("fr") ? "fr" : "en";
  }

  _t(key) {
    return TRANSLATIONS[this._language][key] || TRANSLATIONS.fr[key] || key;
  }

  get _selectedEntry() {
    const entries = this._data?.entries || [];
    return (
      entries.find((entry) => entry.entry_id === this._selectedEntryId) ||
      entries[0]
    );
  }

  async _loadData() {
    if (!this._hass || this._loading) return;
    this._loading = true;
    this._initialized = true;
    this._message = undefined;
    this._render();

    try {
      this._data = await this._hass.callWS({
        type: "rental_consumption/get_data",
      });
      const entries = this._data.entries || [];
      if (!entries.some((entry) => entry.entry_id === this._selectedEntryId)) {
        this._selectedEntryId = entries[0]?.entry_id;
      }
    } catch (error) {
      this._setError(error);
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _replaceEntry(updatedEntry) {
    const entries = [...(this._data.entries || [])];
    const index = entries.findIndex(
      (entry) => entry.entry_id === updatedEntry.entry_id,
    );
    if (index === -1) entries.push(updatedEntry);
    else entries[index] = updatedEntry;
    this._data = { ...this._data, entries };
  }

  async _handleAdd(event) {
    event.preventDefault();
    if (this._busy) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    this._busy = true;
    this._message = undefined;
    this._render();

    try {
      const updated = await this._hass.callWS({
        type: "rental_consumption/add_period",
        entry_id: this._selectedEntry.entry_id,
        consumption_type: values.get("consumption_type"),
        start_date: values.get("start_date"),
        end_date: values.get("end_date"),
        value: Number(values.get("value")),
        note: values.get("note") || "",
      });
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("addSuccess") };
    } catch (error) {
      this._setError(error);
    } finally {
      this._busy = false;
      this._render();
    }
  }

  async _handleDelete(periodId) {
    if (this._busy || !window.confirm(this._t("confirmDelete"))) return;
    this._busy = true;
    this._message = undefined;
    this._render();

    try {
      const updated = await this._hass.callWS({
        type: "rental_consumption/delete_period",
        entry_id: this._selectedEntry.entry_id,
        period_id: periodId,
      });
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("deleteSuccess") };
    } catch (error) {
      this._setError(error);
    } finally {
      this._busy = false;
      this._render();
    }
  }

  async _handleRebuild() {
    if (this._busy || !window.confirm(this._t("confirmRebuild"))) return;
    this._busy = true;
    this._message = undefined;
    this._render();

    try {
      const updated = await this._hass.callWS({
        type: "rental_consumption/rebuild_statistics",
        entry_id: this._selectedEntry.entry_id,
      });
      this._replaceEntry(updated);
      this._message = { kind: "success", text: this._t("rebuildSuccess") };
    } catch (error) {
      this._setError(error);
    } finally {
      this._busy = false;
      this._render();
    }
  }

  _setError(error) {
    const rawCode = error?.code || error?.message || "";
    const code = String(rawCode).replace(/^.*\(([^)]+)\).*$/, "$1");
    const translated = this._t(`error_${code}`);
    this._message = {
      kind: "error",
      text: translated.startsWith("error_")
        ? error?.message || this._t("errorGeneric")
        : translated,
    };
  }

  _formatNumber(value, maximumFractionDigits = 3) {
    return new Intl.NumberFormat(this._language, {
      maximumFractionDigits,
    }).format(Number(value || 0));
  }

  _formatDate(value) {
    if (!value) return "—";
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat(this._language, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _render() {
    if (!this.shadowRoot) return;

    const entries = this._data?.entries || [];
    const entry = this._selectedEntry;
    const today = new Date().toISOString().slice(0, 10);

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main>
        <header class="page-header">
          <div>
            <h1>${this._t("title")}</h1>
            <p>${this._t("subtitle")}</p>
          </div>
          <button class="button secondary" data-action="refresh" ${this._loading ? "disabled" : ""}>
            ${this._loading ? this._t("loading") : this._t("refresh")}
          </button>
        </header>

        ${this._message ? `
          <div class="message ${this._message.kind}" role="status">
            <span>${this._escape(this._message.text)}</span>
            <button class="message-close" data-action="close-message" aria-label="${this._t("close")}">×</button>
          </div>` : ""}

        ${this._loading && !entry ? `<section class="card empty">${this._t("loading")}</section>` : ""}
        ${!this._loading && entries.length === 0 ? `<section class="card empty">${this._t("noEntry")}</section>` : ""}

        ${entry ? `
          ${entries.length > 1 ? `
            <section class="card apartment-picker">
              <label for="entry-select">${this._t("apartment")}</label>
              <select id="entry-select">
                ${entries.map((item) => `<option value="${this._escape(item.entry_id)}" ${item.entry_id === entry.entry_id ? "selected" : ""}>${this._escape(item.title)}</option>`).join("")}
              </select>
            </section>` : ""}

          <section class="summary-grid">
            ${this._summaryCard("water", this._t("totalWater"), entry.totals.water, entry.units.water)}
            ${this._summaryCard("heating", this._t("totalHeating"), entry.totals.heating, entry.units.heating)}
            ${this._summaryCard("periods", this._t("periods"), entry.counts.all, "")}
          </section>

          <section class="card">
            <h2>${this._t("addPeriod")}</h2>
            <form id="period-form">
              <div class="form-grid">
                <label>
                  <span>${this._t("type")}</span>
                  <select name="consumption_type" id="consumption-type" required>
                    <option value="water">${this._t("water")}</option>
                    <option value="heating">${this._t("heating")}</option>
                  </select>
                </label>
                <label>
                  <span>${this._t("startDate")}</span>
                  <input type="date" name="start_date" max="${today}" required>
                </label>
                <label>
                  <span>${this._t("endDate")}</span>
                  <input type="date" name="end_date" max="${today}" required>
                </label>
                <label>
                  <span>${this._t("value")} (<strong id="value-unit">${this._escape(entry.units.water)}</strong>)</span>
                  <input type="number" name="value" min="0.001" step="any" inputmode="decimal" required>
                </label>
                <label class="wide">
                  <span>${this._t("note")}</span>
                  <input type="text" name="note" maxlength="250">
                </label>
              </div>
              <div class="form-actions">
                <button class="button primary" type="submit" ${this._busy ? "disabled" : ""}>
                  ${this._busy ? this._t("adding") : this._t("add")}
                </button>
              </div>
            </form>
          </section>

          <section class="card">
            <div class="section-header">
              <h2>${this._t("history")}</h2>
              <button class="button secondary" data-action="rebuild" ${this._busy ? "disabled" : ""}>
                ${this._busy ? this._t("rebuilding") : this._t("rebuild")}
              </button>
            </div>
            ${this._renderPeriods(entry)}
          </section>
        ` : ""}
      </main>
    `;

    this._bindEvents();
  }

  _summaryCard(kind, label, value, unit) {
    return `
      <article class="summary-card ${kind}">
        <span class="summary-label">${label}</span>
        <strong>${this._formatNumber(value)}${unit ? ` <small>${this._escape(unit)}</small>` : ""}</strong>
      </article>
    `;
  }

  _renderPeriods(entry) {
    if (!entry.periods.length) {
      return `<div class="empty">${this._t("noPeriods")}</div>`;
    }

    return `
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>${this._t("type")}</th>
              <th>${this._t("period")}</th>
              <th>${this._t("consumption")}</th>
              <th>${this._t("dailyAverage")}</th>
              <th>${this._t("note")}</th>
              <th class="actions-column">${this._t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            ${entry.periods.map((period) => {
              const unit = entry.units[period.consumption_type];
              const typeLabel = period.consumption_type === "water" ? this._t("water") : this._t("heating");
              return `
                <tr>
                  <td><span class="type-badge ${period.consumption_type}">${typeLabel}</span></td>
                  <td>
                    <strong>${this._formatDate(period.start_date)} – ${this._formatDate(period.end_date)}</strong>
                    <small>${period.days} ${this._t("days")}</small>
                  </td>
                  <td>${this._formatNumber(period.value, 6)} ${this._escape(unit)}</td>
                  <td>${this._formatNumber(period.daily_average, 6)} ${this._escape(unit)}/j</td>
                  <td>${period.note ? this._escape(period.note) : this._t("noteEmpty")}</td>
                  <td class="actions-column">
                    <button class="button danger compact" data-action="delete" data-period-id="${this._escape(period.period_id)}" ${this._busy ? "disabled" : ""}>
                      ${this._t("delete")}
                    </button>
                  </td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  _bindEvents() {
    this.shadowRoot.querySelector('[data-action="refresh"]')?.addEventListener("click", () => this._loadData());
    this.shadowRoot.querySelector('[data-action="close-message"]')?.addEventListener("click", () => {
      this._message = undefined;
      this._render();
    });
    this.shadowRoot.querySelector("#entry-select")?.addEventListener("change", (event) => {
      this._selectedEntryId = event.target.value;
      this._message = undefined;
      this._render();
    });
    this.shadowRoot.querySelector("#period-form")?.addEventListener("submit", (event) => this._handleAdd(event));
    this.shadowRoot.querySelector("#consumption-type")?.addEventListener("change", (event) => {
      const unit = this._selectedEntry.units[event.target.value];
      const unitElement = this.shadowRoot.querySelector("#value-unit");
      if (unitElement) unitElement.textContent = unit;
    });
    this.shadowRoot.querySelector('[data-action="rebuild"]')?.addEventListener("click", () => this._handleRebuild());
    this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach((button) => {
      button.addEventListener("click", () => this._handleDelete(button.dataset.periodId));
    });
  }

  _styles() {
    return `
      :host {
        display: block;
        min-height: 100%;
        background: var(--primary-background-color);
        color: var(--primary-text-color);
        font-family: var(--ha-font-family-body, Roboto, sans-serif);
      }
      * { box-sizing: border-box; }
      main { max-width: 1180px; margin: 0 auto; padding: 28px 20px 48px; }
      .page-header, .section-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .page-header { margin-bottom: 22px; }
      h1 { margin: 0; font-size: 28px; font-weight: 500; }
      h2 { margin: 0 0 20px; font-size: 20px; font-weight: 500; }
      .page-header p { margin: 7px 0 0; color: var(--secondary-text-color); }
      .section-header h2 { margin: 0; }
      .card, .summary-card {
        background: var(--card-background-color);
        border-radius: var(--ha-card-border-radius, 12px);
        box-shadow: var(--ha-card-box-shadow, 0 2px 2px rgba(0,0,0,.08));
        border: var(--ha-card-border-width, 0) solid var(--ha-card-border-color, transparent);
      }
      .card { padding: 22px; margin-bottom: 20px; }
      .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
      .summary-card { padding: 20px; border-left: 4px solid var(--primary-color); }
      .summary-card.water { border-left-color: var(--info-color, #039be5); }
      .summary-card.heating { border-left-color: var(--warning-color, #ff9800); }
      .summary-card.periods { border-left-color: var(--success-color, #43a047); }
      .summary-label { display: block; color: var(--secondary-text-color); font-size: 14px; margin-bottom: 9px; }
      .summary-card strong { font-size: 27px; font-weight: 500; }
      .summary-card small { font-size: 16px; color: var(--secondary-text-color); }
      .form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
      .form-grid label { display: flex; flex-direction: column; gap: 7px; color: var(--secondary-text-color); font-size: 13px; }
      .form-grid label.wide { grid-column: 1 / -1; }
      input, select {
        width: 100%; min-height: 44px; border: 1px solid var(--divider-color);
        border-radius: 8px; padding: 9px 11px; background: var(--card-background-color);
        color: var(--primary-text-color); font: inherit; color-scheme: light dark;
      }
      input:focus, select:focus { outline: 2px solid var(--primary-color); outline-offset: 1px; }
      .form-actions { display: flex; justify-content: flex-end; margin-top: 18px; }
      .button {
        min-height: 40px; border-radius: 8px; border: none; padding: 9px 16px;
        font: inherit; font-weight: 500; cursor: pointer; transition: opacity .15s, background .15s;
      }
      .button:disabled { opacity: .5; cursor: default; }
      .button.primary { background: var(--primary-color); color: var(--text-primary-color, white); }
      .button.secondary { background: var(--secondary-background-color); color: var(--primary-text-color); }
      .button.danger { background: transparent; color: var(--error-color, #db4437); border: 1px solid var(--error-color, #db4437); }
      .button.compact { min-height: 34px; padding: 6px 11px; font-size: 13px; }
      .message { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 16px; border-radius: 9px; margin-bottom: 18px; }
      .message.success { background: var(--success-color, #43a047); color: white; }
      .message.error { background: var(--error-color, #db4437); color: white; }
      .message-close { border: 0; background: transparent; color: inherit; font-size: 24px; cursor: pointer; }
      .apartment-picker { display: flex; align-items: center; gap: 16px; }
      .apartment-picker select { max-width: 360px; }
      .table-scroll { overflow-x: auto; margin: 18px -22px -22px; }
      table { width: 100%; border-collapse: collapse; min-width: 830px; }
      th, td { text-align: left; padding: 14px 18px; border-top: 1px solid var(--divider-color); vertical-align: middle; }
      th { color: var(--secondary-text-color); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; }
      td small { display: block; color: var(--secondary-text-color); margin-top: 4px; }
      .actions-column { text-align: right; }
      .type-badge { display: inline-block; padding: 5px 9px; border-radius: 999px; font-size: 12px; font-weight: 500; }
      .type-badge.water { color: var(--info-color, #039be5); background: var(--secondary-background-color); }
      .type-badge.heating { color: var(--warning-color, #ff9800); background: var(--secondary-background-color); }
      .empty { color: var(--secondary-text-color); padding: 22px; text-align: center; }
      @media (max-width: 850px) {
        main { padding: 18px 12px 36px; }
        .page-header, .section-header { align-items: flex-start; flex-direction: column; }
        .summary-grid { grid-template-columns: 1fr; }
        .form-grid { grid-template-columns: 1fr 1fr; }
        .table-scroll { margin-left: -16px; margin-right: -16px; }
        .card { padding: 16px; }
      }
      @media (max-width: 520px) {
        h1 { font-size: 24px; }
        .form-grid { grid-template-columns: 1fr; }
        .form-grid label.wide { grid-column: auto; }
        .form-actions .button, .page-header .button, .section-header .button { width: 100%; }
        .apartment-picker { align-items: stretch; flex-direction: column; }
        .apartment-picker select { max-width: none; }
      }
    `;
  }
}

if (!customElements.get("rental-consumption-panel")) {
  customElements.define("rental-consumption-panel", RentalConsumptionPanel);
}
