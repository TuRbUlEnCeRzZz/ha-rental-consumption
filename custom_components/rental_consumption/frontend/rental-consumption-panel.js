class RentalConsumptionPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this._hass = null;
    this._data = null;
    this._selectedEntryId = null;
    this._editingPeriodId = null;
    this._busy = false;
    this._message = null;
    this._historyType = "all";
    this._historyYear = "all";
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
    const T = {
      fr: {
        title:"Consommation locative", subtitle:"Suivi des décomptes historiques d'un logement sans compteurs directement accessibles.",
        refresh:"Actualiser", apartment:"Appartement", settings:"Réglages", general:"Général", heating:"Chauffage",
        electricity:"Électricité", export:"Export time-series", supplier:"GRD / fournisseur", currency:"Devise",
        heatingDistribution:"Répartition du chauffage", uniform:"Uniforme par jour", degreeDays:"Selon température extérieure",
        outdoorSensor:"Capteur extérieur", baseTemp:"Température de base", electricityDistribution:"Répartition de l'électricité",
        loadCurve:"Selon la courbe de charge", loadSensor:"Capteur de puissance de l'introduction",
        loadSource:"Source de la courbe", auto:"Automatique", recorder:"Recorder", victoriametrics:"VictoriaMetrics",
        minCoverage:"Couverture minimale", vmMetric:"Métrique VM", vmDb:"Label db VM", save:"Enregistrer",
        addPeriod:"Ajouter une période", editPeriod:"Modifier la période", type:"Type", start:"Date de début", end:"Date de fin incluse",
        consumption:"Consommation totale", totalCost:"Coût total", note:"Note", add:"Ajouter", cancel:"Annuler",
        tariff:"Tarif", single:"Unitaire", peakOffpeak:"Heures pleines / creuses", peak:"On-peak", offpeak:"Off-peak",
        peakConsumption:"Consommation on-peak", offpeakConsumption:"Consommation off-peak",
        peakCost:"Coût on-peak", offpeakCost:"Coût off-peak", history:"Historique", rebuild:"Reconstruire Recorder",
        edit:"Modifier", delete:"Supprimer", distribution:"Répartition", source:"Source", coverage:"Couverture",
        all:"Tous", year:"Année", noPeriods:"Aucune période pour ce filtre.", periods:"Périodes",
        water:"Eau totale", hot_water:"Eau chaude", heatingType:"Chauffage", electricityType:"Électricité",
        loadAnalysis:"Analyse électricité", effectiveDistribution:"Répartition effective", weightedPeriods:"Périodes pondérées",
        fallbackPeriods:"Périodes uniformes", exportBackend:"Destination", none:"Désactivé", url:"URL",
        database:"Database", retention:"Retention policy", organization:"Organisation", bucket:"Bucket",
        username:"Utilisateur", password:"Mot de passe", token:"Token", deleteKey:"deleteAuthKey",
        autoSync:"Synchroniser automatiquement après modification", test:"Tester la connexion",
        sync:"Reconstruire dans la base", exportStatus:"Dernier état", settingsSaved:"Réglages enregistrés.",
        addSuccess:"Période ajoutée.", editSuccess:"Période modifiée.", deleteSuccess:"Période supprimée.",
        rebuildSuccess:"Statistiques Recorder reconstruites.", exportTestOk:"Connexion validée.",
        exportSyncOk:"Historique externe reconstruit.", confirmDelete:"Supprimer définitivement cette période ?",
        confirmRebuild:"Reconstruire toutes les statistiques Recorder ?", confirmSync:"Effacer puis réécrire les séries de cet appartement dans la base externe ?",
        v3Warning:"InfluxDB 3 : écriture prise en charge. La reconstruction/suppression automatique reste désactivée si le serveur ne fournit pas une suppression sûre.",
        loadCurveHelp:"En mode automatique, VictoriaMetrics est privilégié lorsqu'il est configuré, puis Recorder est utilisé en secours.",
        tariffHelp:"Pour un tarif heures pleines/creuses, la somme des deux consommations doit être égale au total.",
        distributionUniform:"Uniforme", distributionLoad:"Courbe de charge", distributionTemperature:"Degrés-jours",
      },
      en: {
        title:"Rental consumption", subtitle:"Historical billing tracking for homes without directly accessible meters.",
        refresh:"Refresh", apartment:"Apartment", settings:"Settings", general:"General", heating:"Heating",
        electricity:"Electricity", export:"Time-series export", supplier:"DSO / supplier", currency:"Currency",
        heatingDistribution:"Heating distribution", uniform:"Uniform per day", degreeDays:"Outdoor-temperature degree days",
        outdoorSensor:"Outdoor sensor", baseTemp:"Base temperature", electricityDistribution:"Electricity distribution",
        loadCurve:"Load-curve weighted", loadSensor:"Main incoming power sensor", loadSource:"Load-curve source",
        auto:"Automatic", recorder:"Recorder", victoriametrics:"VictoriaMetrics", minCoverage:"Minimum coverage",
        vmMetric:"VM metric", vmDb:"VM db label", save:"Save", addPeriod:"Add a period", editPeriod:"Edit period",
        type:"Type", start:"Start date", end:"End date included", consumption:"Total consumption", totalCost:"Total cost",
        note:"Note", add:"Add", cancel:"Cancel", tariff:"Tariff", single:"Single", peakOffpeak:"Peak / off-peak",
        peak:"Peak", offpeak:"Off-peak", peakConsumption:"Peak consumption", offpeakConsumption:"Off-peak consumption",
        peakCost:"Peak cost", offpeakCost:"Off-peak cost", history:"History", rebuild:"Rebuild Recorder",
        edit:"Edit", delete:"Delete", distribution:"Distribution", source:"Source", coverage:"Coverage", all:"All",
        year:"Year", noPeriods:"No periods for this filter.", periods:"Periods", water:"Total water", hot_water:"Hot water",
        heatingType:"Heating", electricityType:"Electricity", loadAnalysis:"Electricity analysis",
        effectiveDistribution:"Effective distribution", weightedPeriods:"Weighted periods", fallbackPeriods:"Uniform periods",
        exportBackend:"Destination", none:"Disabled", url:"URL", database:"Database", retention:"Retention policy",
        organization:"Organization", bucket:"Bucket", username:"Username", password:"Password", token:"Token",
        deleteKey:"deleteAuthKey", autoSync:"Automatically sync after changes", test:"Test connection",
        sync:"Rebuild external history", exportStatus:"Last status", settingsSaved:"Settings saved.",
        addSuccess:"Period added.", editSuccess:"Period updated.", deleteSuccess:"Period deleted.",
        rebuildSuccess:"Recorder statistics rebuilt.", exportTestOk:"Connection validated.",
        exportSyncOk:"External history rebuilt.", confirmDelete:"Permanently delete this period?",
        confirmRebuild:"Rebuild all Recorder statistics?", confirmSync:"Delete then rewrite this apartment's external series?",
        v3Warning:"InfluxDB 3: writing is supported. Automatic rebuild/deletion stays disabled when safe deletion is unavailable.",
        loadCurveHelp:"Automatic mode prefers VictoriaMetrics when configured, then falls back to Recorder.",
        tariffHelp:"With peak/off-peak billing, both consumption values must add up to the total.",
        distributionUniform:"Uniform", distributionLoad:"Load curve", distributionTemperature:"Degree days",
      }
    };
    return T[this._lang][key] ?? key;
  }

  async _loadData() {
    if (!this._hass) return;
    try {
      this._data = await this._hass.callWS({type:"rental_consumption/get_data"});
      if (!this._selectedEntryId && this._data.entries?.length) this._selectedEntryId = this._data.entries[0].entry_id;
      this._message = null;
    } catch (e) {
      this._message = {kind:"error", text:String(e.message || e)};
    }
    this._render();
  }

  get _entry() {
    return this._data?.entries?.find(e=>e.entry_id===this._selectedEntryId) || this._data?.entries?.[0];
  }

  _escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
  }
  _num(v,d=2){ return v==null||Number.isNaN(Number(v))?"—":new Intl.NumberFormat(this._lang,{maximumFractionDigits:d}).format(Number(v)); }
  _date(v){ if(!v)return"—"; const [y,m,d]=v.split("-"); return `${d}.${m}.${y}`; }
  _typeLabel(t){ return ({water:this._t("water"),hot_water:this._t("hot_water"),heating:this._t("heatingType"),electricity:this._t("electricityType")})[t]||t; }
  _distributionLabel(v){ return ({uniform_daily:this._t("distributionUniform"),load_curve:this._t("distributionLoad"),outdoor_temperature:this._t("distributionTemperature")})[v]||v||"—"; }
  _tariffLabel(v){ return v==="peak_offpeak"?this._t("peakOffpeak"):this._t("single"); }

  _render(){
    if(!this.shadowRoot) return;
    if(!this._data){ this.shadowRoot.innerHTML=`<style>${this._styles()}</style><main><div class="loading">…</div></main>`; return; }
    const entry=this._entry;
    if(!entry){ this.shadowRoot.innerHTML=`<style>${this._styles()}</style><main><h1>${this._t("title")}</h1><p>Aucune configuration.</p></main>`; return; }
    const years=[...new Set(entry.periods.map(p=>p.start_date.slice(0,4)))].sort().reverse();
    const filtered=entry.periods.filter(p=>(this._historyType==="all"||p.consumption_type===this._historyType)&&(this._historyYear==="all"||p.start_date.startsWith(this._historyYear)));
    this.shadowRoot.innerHTML=`
      <style>${this._styles()}</style>
      <main>
        <header class="page-header">
          <div><h1>${this._t("title")}</h1><p>${this._t("subtitle")}</p></div>
          <button class="icon-button" data-action="refresh" title="${this._t("refresh")}">↻</button>
        </header>
        ${this._message?`<div class="message ${this._message.kind}">${this._escape(this._message.text)}</div>`:""}
        <section class="card picker-card">
          <label>${this._t("apartment")}<select id="entry-select">${this._data.entries.map(e=>`<option value="${e.entry_id}" ${e.entry_id===entry.entry_id?"selected":""}>${this._escape(e.title)}</option>`).join("")}</select></label>
        </section>
        ${this._summary(entry)}
        ${this._settings(entry)}
        ${this._electricityAnalysis(entry)}
        ${this._periodForm(entry)}
        <section class="card history-card">
          <div class="section-header">
            <div><h2>${this._t("history")}</h2><span class="muted">${filtered.length} ${this._t("periods").toLowerCase()}</span></div>
            <button class="button subtle" data-action="rebuild">${this._t("rebuild")}</button>
          </div>
          <div class="history-toolbar">
            <select id="history-type">
              <option value="all">${this._t("all")}</option>
              ${["electricity","water","hot_water","heating"].map(t=>`<option value="${t}" ${this._historyType===t?"selected":""}>${this._typeLabel(t)}</option>`).join("")}
            </select>
            <select id="history-year"><option value="all">${this._t("year")}: ${this._t("all")}</option>${years.map(y=>`<option value="${y}" ${this._historyYear===y?"selected":""}>${y}</option>`).join("")}</select>
          </div>
          <div class="period-list">${filtered.length?filtered.map(p=>this._periodRow(entry,p)).join(""):`<div class="empty">${this._t("noPeriods")}</div>`}</div>
        </section>
      </main>`;
    this._bind();
  }

  _summary(e){
    const types=["water","hot_water","heating","electricity"];
    return `<section class="summary-grid">${types.map(t=>`<article class="summary-card"><span>${this._typeLabel(t)}</span><strong>${this._num(e.totals[t],3)} <small>${this._escape(e.units[t])}</small></strong><div>${this._num(e.costs[t]?.total,2)} ${this._escape(e.units.currency)}</div><small>${e.costs[t]?.average_unit_price==null?"—":`${this._num(e.costs[t].average_unit_price,4)} ${this._escape(e.units.unit_prices[t])}`}</small></article>`).join("")}<article class="summary-card"><span>${this._t("periods")}</span><strong>${e.counts.all}</strong><div class="muted">Recorder + billing</div></article></section>`;
  }

  _settings(e){
    const s=e.settings, x=e.export;
    return `<section class="card">
      <div class="section-header"><h2>${this._t("settings")}</h2><button form="settings-form" class="button primary">${this._t("save")}</button></div>
      <form id="settings-form">
        <details open><summary>${this._t("general")}</summary><div class="form-grid">
          ${this._field(this._t("supplier"),`<input name="grid_operator" value="${this._escape(s.grid_operator||"")}">`)}
          ${this._field(this._t("currency"),`<input name="currency" value="${this._escape(s.currency||"CHF")}">`)}
        </div></details>
        <details><summary>${this._t("heating")}</summary><div class="form-grid">
          ${this._field(this._t("heatingDistribution"),`<select name="heating_distribution"><option value="uniform_daily" ${s.heating_distribution==="uniform_daily"?"selected":""}>${this._t("uniform")}</option><option value="outdoor_temperature" ${s.heating_distribution==="outdoor_temperature"?"selected":""}>${this._t("degreeDays")}</option></select>`)}
          ${this._field(this._t("outdoorSensor"),`<input name="outdoor_temperature_sensor" value="${this._escape(s.outdoor_temperature_sensor||"")}" placeholder="sensor.temperature_exterieure">`)}
          ${this._field(this._t("baseTemp"),`<input name="heating_base_temperature" type="number" min="5" max="30" step="0.1" value="${this._escape(s.heating_base_temperature??20)}">`)}
        </div></details>
        <details open><summary>${this._t("electricity")}</summary><div class="form-grid">
          ${this._field(this._t("electricityDistribution"),`<select name="electricity_distribution"><option value="uniform_daily" ${s.electricity_distribution==="uniform_daily"?"selected":""}>${this._t("uniform")}</option><option value="load_curve" ${s.electricity_distribution==="load_curve"?"selected":""}>${this._t("loadCurve")}</option></select>`)}
          ${this._field(this._t("loadSensor"),`<input name="electricity_load_sensor" value="${this._escape(s.electricity_load_sensor||"")}" placeholder="sensor.introduction_puissance">`)}
          ${this._field(this._t("loadSource"),`<select name="load_curve_source"><option value="auto" ${s.load_curve_source==="auto"?"selected":""}>${this._t("auto")}</option><option value="victoriametrics" ${s.load_curve_source==="victoriametrics"?"selected":""}>${this._t("victoriametrics")}</option><option value="recorder" ${s.load_curve_source==="recorder"?"selected":""}>${this._t("recorder")}</option></select>`)}
          ${this._field(this._t("minCoverage"),`<input name="load_curve_min_coverage" type="number" min="0.1" max="1" step="0.01" value="${this._escape(s.load_curve_min_coverage??0.9)}">`)}
          ${this._field(this._t("vmMetric"),`<input name="vm_load_metric" value="${this._escape(s.vm_load_metric||"W_value")}">`)}
          ${this._field(this._t("vmDb"),`<input name="vm_load_db_label" value="${this._escape(s.vm_load_db_label||"homeassistant")}">`)}
          <div class="help wide">${this._t("loadCurveHelp")}</div>
        </div></details>
        <details><summary>${this._t("export")}</summary><div class="form-grid">
          ${this._field(this._t("exportBackend"),`<select name="export_backend" id="export-backend">
            <option value="none" ${x.backend==="none"?"selected":""}>${this._t("none")}</option>
            <option value="victoriametrics" ${x.backend==="victoriametrics"?"selected":""}>VictoriaMetrics</option>
            <option value="influxdb_v1" ${x.backend==="influxdb_v1"?"selected":""}>InfluxDB 1.x</option>
            <option value="influxdb_v2" ${x.backend==="influxdb_v2"?"selected":""}>InfluxDB 2.x</option>
            <option value="influxdb_v3" ${x.backend==="influxdb_v3"?"selected":""}>InfluxDB 3.x</option>
          </select>`)}
          ${this._field(this._t("url"),`<input name="export_url" value="${this._escape(x.url||"")}" placeholder="http://192.168.1.10:8428">`)}
          ${this._field(this._t("database"),`<input name="export_database" value="${this._escape(x.database||"")}">`)}
          ${this._field(this._t("retention"),`<input name="export_retention_policy" value="${this._escape(x.retention_policy||"")}">`)}
          ${this._field(this._t("organization"),`<input name="export_org" value="${this._escape(x.org||"")}">`)}
          ${this._field(this._t("bucket"),`<input name="export_bucket" value="${this._escape(x.bucket||"")}">`)}
          ${this._field(this._t("username"),`<input name="export_username" value="${this._escape(x.username||"")}">`)}
          ${this._field(this._t("password"),`<input name="export_password" type="password" placeholder="${x.has_password?"••••••••":""}">`)}
          ${this._field(this._t("token"),`<input name="export_token" type="password" placeholder="${x.has_token?"••••••••":""}">`)}
          ${this._field(this._t("deleteKey"),`<input name="export_delete_auth_key" type="password" placeholder="${x.has_delete_auth_key?"••••••••":""}">`)}
          <label class="check wide"><input name="export_auto_sync" type="checkbox" ${x.auto_sync?"checked":""}> ${this._t("autoSync")}</label>
          ${x.backend==="influxdb_v3"?`<div class="warning wide">${this._t("v3Warning")}</div>`:""}
          <div class="wide export-actions">
            <button type="button" class="button" data-action="test-export">${this._t("test")}</button>
            <button type="button" class="button" data-action="sync-export" ${x.capabilities?.supports_safe_rebuild?"":"disabled"}>${this._t("sync")}</button>
            <span class="muted">${this._t("exportStatus")}: ${this._escape(x.last_status?.status||"never")}</span>
          </div>
        </div></details>
      </form>
    </section>`;
  }

  _field(label,control){ return `<label><span>${label}</span>${control}</label>`; }

  _electricityAnalysis(e){
    const a=e.electricity_analysis||{};
    return `<section class="card analysis-card"><div class="section-header"><h2>${this._t("loadAnalysis")}</h2></div><div class="analysis-grid">
      <div><span>${this._t("effectiveDistribution")}</span><strong>${this._distributionLabel(a.effective_distribution)}</strong></div>
      <div><span>${this._t("coverage")}</span><strong>${this._num((a.coverage||0)*100,1)} %</strong></div>
      <div><span>${this._t("source")}</span><strong>${this._escape(a.source||"—")}</strong></div>
      <div><span>${this._t("weightedPeriods")}</span><strong>${a.weighted_periods||0}</strong></div>
      <div><span>${this._t("fallbackPeriods")}</span><strong>${a.fallback_periods||0}</strong></div>
    </div></section>`;
  }

  _periodForm(e){
    const p=this._editingPeriodId?e.periods.find(x=>x.period_id===this._editingPeriodId):null;
    const type=p?.consumption_type||"electricity";
    const tariff=p?.tariff_mode||"single";
    return `<section class="card edit-card">
      <div class="section-header"><h2>${p?this._t("editPeriod"):this._t("addPeriod")}</h2>${p?`<button class="button subtle" data-action="cancel-edit">${this._t("cancel")}</button>`:""}</div>
      <form id="period-form"><div class="form-grid">
        ${this._field(this._t("type"),`<select name="consumption_type" id="consumption-type">${["electricity","water","hot_water","heating"].map(t=>`<option value="${t}" ${type===t?"selected":""}>${this._typeLabel(t)}</option>`).join("")}</select>`)}
        ${this._field(this._t("start"),`<input name="start_date" type="date" value="${p?.start_date||""}" required>`)}
        ${this._field(this._t("end"),`<input name="end_date" type="date" value="${p?.end_date||""}" required>`)}
        ${this._field(this._t("consumption"),`<div class="input-unit"><input name="value" type="number" min="0.001" step="any" value="${p?.value??""}" required><span id="value-unit">${this._escape(e.units[type])}</span></div>`)}
        ${this._field(this._t("totalCost"),`<div class="input-unit"><input name="cost" type="number" min="0" step="any" value="${p?.cost??""}"><span>${this._escape(e.units.currency)}</span></div>`)}
        <label id="tariff-field"><span>${this._t("tariff")}</span><select name="tariff_mode" id="tariff-mode"><option value="single" ${tariff==="single"?"selected":""}>${this._t("single")}</option><option value="peak_offpeak" ${tariff==="peak_offpeak"?"selected":""}>${this._t("peakOffpeak")}</option></select></label>
        <div id="dual-tariff" class="tariff-grid wide ${tariff==="peak_offpeak"&&type==="electricity"?"":"hidden"}">
          ${this._field(this._t("peakConsumption"),`<input name="peak_value" type="number" min="0" step="any" value="${p?.peak_value??""}">`)}
          ${this._field(this._t("offpeakConsumption"),`<input name="offpeak_value" type="number" min="0" step="any" value="${p?.offpeak_value??""}">`)}
          ${this._field(this._t("peakCost"),`<input name="peak_cost" type="number" min="0" step="any" value="${p?.peak_cost??""}">`)}
          ${this._field(this._t("offpeakCost"),`<input name="offpeak_cost" type="number" min="0" step="any" value="${p?.offpeak_cost??""}">`)}
          <div class="help wide">${this._t("tariffHelp")}</div>
        </div>
        <label class="wide"><span>${this._t("note")}</span><textarea name="note" rows="2">${this._escape(p?.note||"")}</textarea></label>
      </div><div class="actions"><button class="button primary" ${this._busy?"disabled":""}>${p?this._t("edit"):this._t("add")}</button></div></form>
    </section>`;
  }

  _periodRow(e,p){
    const a=p.electricity_analysis||p.heating_analysis||{};
    const distribution=this._distributionLabel(a.distribution||"uniform_daily");
    const coverage=a.coverage??a.temperature_coverage;
    return `<article class="period-row">
      <div class="period-main">
        <div class="type-icon">${p.consumption_type==="electricity"?"⚡":p.consumption_type==="heating"?"♨":"💧"}</div>
        <div><strong>${this._typeLabel(p.consumption_type)}</strong><span>${this._date(p.start_date)} – ${this._date(p.end_date)} · ${p.days} j</span></div>
      </div>
      <div class="metric"><span>${this._t("consumption")}</span><strong>${this._num(p.value,3)} ${this._escape(e.units[p.consumption_type])}</strong><small>${this._num(p.daily_average,3)}/j</small></div>
      <div class="metric"><span>${this._t("totalCost")}</span><strong>${p.cost==null?"—":`${this._num(p.cost,2)} ${this._escape(e.units.currency)}`}</strong><small>${p.unit_price==null?"—":`${this._num(p.unit_price,4)} ${this._escape(e.units.unit_prices[p.consumption_type])}`}</small></div>
      <div class="badges">
        ${p.consumption_type==="electricity"?`<span class="badge">${this._tariffLabel(p.tariff_mode)}</span>`:""}
        <span class="badge">${distribution}</span>
        ${a.source?`<span class="badge accent">${this._escape(a.source)}</span>`:""}
        ${coverage!=null?`<span class="badge">${this._num(coverage*100,0)}%</span>`:""}
      </div>
      <div class="period-actions"><button class="button compact" data-action="edit" data-id="${p.period_id}">${this._t("edit")}</button><button class="button danger compact" data-action="delete" data-id="${p.period_id}">${this._t("delete")}</button></div>
      ${p.tariff_mode==="peak_offpeak"?`<div class="tariff-detail"><span>${this._t("peak")}: <b>${this._num(p.peak_value,3)} kWh</b>${p.peak_cost!=null?` · ${this._num(p.peak_cost,2)} ${e.units.currency}`:""}</span><span>${this._t("offpeak")}: <b>${this._num(p.offpeak_value,3)} kWh</b>${p.offpeak_cost!=null?` · ${this._num(p.offpeak_cost,2)} ${e.units.currency}`:""}</span></div>`:""}
      ${p.note?`<div class="period-note">${this._escape(p.note)}</div>`:""}
    </article>`;
  }

  _bind(){
    this.shadowRoot.querySelector('[data-action="refresh"]')?.addEventListener("click",()=>this._loadData());
    this.shadowRoot.querySelector("#entry-select")?.addEventListener("change",e=>{this._selectedEntryId=e.target.value;this._editingPeriodId=null;this._render();});
    this.shadowRoot.querySelector("#history-type")?.addEventListener("change",e=>{this._historyType=e.target.value;this._render();});
    this.shadowRoot.querySelector("#history-year")?.addEventListener("change",e=>{this._historyYear=e.target.value;this._render();});
    this.shadowRoot.querySelector("#settings-form")?.addEventListener("submit",e=>this._handleSettings(e));
    this.shadowRoot.querySelector("#period-form")?.addEventListener("submit",e=>this._handlePeriod(e));
    this.shadowRoot.querySelector("#consumption-type")?.addEventListener("change",e=>this._periodTypeChanged(e.target.value));
    this.shadowRoot.querySelector("#tariff-mode")?.addEventListener("change",()=>this._periodTypeChanged(this.shadowRoot.querySelector("#consumption-type").value));
    this.shadowRoot.querySelector('[data-action="cancel-edit"]')?.addEventListener("click",()=>{this._editingPeriodId=null;this._render();});
    this.shadowRoot.querySelector('[data-action="rebuild"]')?.addEventListener("click",()=>this._rebuild());
    this.shadowRoot.querySelector('[data-action="test-export"]')?.addEventListener("click",()=>this._testExport());
    this.shadowRoot.querySelector('[data-action="sync-export"]')?.addEventListener("click",()=>this._syncExport());
    this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach(b=>b.addEventListener("click",()=>{this._editingPeriodId=b.dataset.id;this._message=null;this._render();this.shadowRoot.querySelector(".edit-card")?.scrollIntoView({behavior:"smooth"});}));
    this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach(b=>b.addEventListener("click",()=>this._deletePeriod(b.dataset.id)));
    this._periodTypeChanged(this.shadowRoot.querySelector("#consumption-type")?.value);
  }

  _periodTypeChanged(type){
    const e=this._entry;
    const unit=this.shadowRoot.querySelector("#value-unit");
    if(unit&&e) unit.textContent=e.units[type];
    const tariff=this.shadowRoot.querySelector("#tariff-field");
    if(tariff) tariff.classList.toggle("hidden",type!=="electricity");
    const dual=this.shadowRoot.querySelector("#dual-tariff");
    if(dual) dual.classList.toggle("hidden",type!=="electricity"||this.shadowRoot.querySelector("#tariff-mode")?.value!=="peak_offpeak");
    if(!this._editingPeriodId){
      const start=this.shadowRoot.querySelector('input[name="start_date"]');
      if(start&&!start.value){
        const dates=e.periods.filter(p=>p.consumption_type===type).map(p=>p.end_date).sort();
        if(dates.length){ const d=new Date(`${dates.at(-1)}T12:00:00`); d.setDate(d.getDate()+1); start.value=d.toISOString().slice(0,10); }
      }
    }
  }

  _replaceEntry(updated){
    const i=this._data.entries.findIndex(e=>e.entry_id===updated.entry_id);
    if(i>=0)this._data.entries[i]=updated;
  }

  async _handlePeriod(ev){
    ev.preventDefault(); if(this._busy)return;
    const f=new FormData(ev.currentTarget), edit=!!this._editingPeriodId;
    const payload={
      type:edit?"rental_consumption/update_period":"rental_consumption/add_period",
      entry_id:this._entry.entry_id, consumption_type:f.get("consumption_type"),
      start_date:f.get("start_date"), end_date:f.get("end_date"), value:Number(f.get("value")),
      note:f.get("note")||"", tariff_mode:f.get("consumption_type")==="electricity"?(f.get("tariff_mode")||"single"):"single",
    };
    if(edit)payload.period_id=this._editingPeriodId;
    for(const k of ["cost","peak_value","offpeak_value","peak_cost","offpeak_cost"]){ if(f.get(k)!==""&&f.get(k)!=null)payload[k]=Number(f.get(k)); }
    await this._run(async()=>{const updated=await this._hass.callWS(payload);this._replaceEntry(updated);this._editingPeriodId=null;this._message={kind:"success",text:this._t(edit?"editSuccess":"addSuccess")};});
  }

  async _handleSettings(ev){
    ev.preventDefault();
    const f=new FormData(ev.currentTarget), payload={
      type:"rental_consumption/update_settings",entry_id:this._entry.entry_id,
      grid_operator:f.get("grid_operator")||"",currency:f.get("currency")||"CHF",
      heating_distribution:f.get("heating_distribution"),outdoor_temperature_sensor:f.get("outdoor_temperature_sensor")||"",
      heating_base_temperature:Number(f.get("heating_base_temperature")),
      electricity_distribution:f.get("electricity_distribution"),electricity_load_sensor:f.get("electricity_load_sensor")||"",
      load_curve_source:f.get("load_curve_source"),load_curve_min_coverage:Number(f.get("load_curve_min_coverage")),
      vm_load_metric:f.get("vm_load_metric")||"W_value",vm_load_db_label:f.get("vm_load_db_label")||"homeassistant",
      export_backend:f.get("export_backend"),export_url:f.get("export_url")||"",export_auto_sync:f.get("export_auto_sync")==="on",
      export_database:f.get("export_database")||"",export_retention_policy:f.get("export_retention_policy")||"",
      export_org:f.get("export_org")||"",export_bucket:f.get("export_bucket")||"",export_username:f.get("export_username")||"",
    };
    for(const k of ["export_password","export_token","export_delete_auth_key"]){ const v=f.get(k); if(v)payload[k]=v; }
    await this._run(async()=>{const updated=await this._hass.callWS(payload);this._replaceEntry(updated);this._message={kind:"success",text:this._t("settingsSaved")};});
  }

  async _deletePeriod(id){
    if(!confirm(this._t("confirmDelete")))return;
    await this._run(async()=>{const updated=await this._hass.callWS({type:"rental_consumption/delete_period",entry_id:this._entry.entry_id,period_id:id});this._replaceEntry(updated);this._message={kind:"success",text:this._t("deleteSuccess")};});
  }
  async _rebuild(){
    if(!confirm(this._t("confirmRebuild")))return;
    await this._run(async()=>{const updated=await this._hass.callWS({type:"rental_consumption/rebuild_statistics",entry_id:this._entry.entry_id});this._replaceEntry(updated);this._message={kind:"success",text:this._t("rebuildSuccess")};});
  }
  async _testExport(){
    await this._run(async()=>{await this._hass.callWS({type:"rental_consumption/test_export",entry_id:this._entry.entry_id});this._message={kind:"success",text:this._t("exportTestOk")};});
  }
  async _syncExport(){
    if(!confirm(this._t("confirmSync")))return;
    await this._run(async()=>{await this._hass.callWS({type:"rental_consumption/sync_export",entry_id:this._entry.entry_id});this._message={kind:"success",text:this._t("exportSyncOk")};await this._loadData();});
  }
  _friendlyError(error){
    const raw=String(error?.message||error||"");
    const mapFr={
      tariff_total_mismatch:"La somme on-peak + off-peak doit être égale à la consommation totale.",
      tariff_cost_mismatch:"La somme des coûts on-peak + off-peak doit être égale au coût total.",
      invalid_tariff_values:"Les consommations on-peak / off-peak sont invalides.",
      export_not_configured:"L'export externe n'est pas configuré.",
      safe_rebuild_not_supported:"Cette destination ne permet pas encore une reconstruction sûre avec suppression.",
      delete_not_supported:"La suppression sûre n'est pas disponible pour cette destination.",
      recorder_unavailable:"Recorder n'est pas disponible.",
      overlap:"Cette période chevauche une période existante du même type.",
      future_end:"La date de fin ne peut pas être dans le futur."
    };
    const mapEn={
      tariff_total_mismatch:"Peak + off-peak consumption must equal the total consumption.",
      tariff_cost_mismatch:"Peak + off-peak costs must equal the total cost.",
      invalid_tariff_values:"Peak / off-peak values are invalid.",
      export_not_configured:"External export is not configured.",
      safe_rebuild_not_supported:"This destination does not currently support a safe delete-and-rebuild.",
      delete_not_supported:"Safe deletion is not available for this destination.",
      recorder_unavailable:"Recorder is unavailable.",
      overlap:"This period overlaps an existing period of the same type.",
      future_end:"The end date cannot be in the future."
    };
    const map=this._lang==="fr"?mapFr:mapEn;
    for(const [code,message] of Object.entries(map)){if(raw.includes(code))return message;}
    return raw;
  }
  async _run(fn){
    if(this._busy)return;this._busy=true;this._render();
    try{await fn();}catch(e){this._message={kind:"error",text:this._friendlyError(e)};}
    finally{this._busy=false;this._render();}
  }

  _styles(){return`
    :host{display:block;min-height:100%;background:var(--primary-background-color);color:var(--primary-text-color);font-family:var(--ha-font-family-body,Roboto,sans-serif)}
    *{box-sizing:border-box} main{max-width:1500px;margin:0 auto;padding:24px 20px 52px}
    h1,h2,p{margin-top:0} h1{font-size:28px;margin-bottom:6px} h2{font-size:20px;margin-bottom:0}
    .page-header,.section-header{display:flex;justify-content:space-between;align-items:center;gap:16px}
    .page-header{margin-bottom:18px}.page-header p,.muted,.help{color:var(--secondary-text-color)}
    .card,.summary-card,.period-row{background:var(--ha-card-background,var(--card-background-color));border-radius:var(--ha-card-border-radius,12px);border:1px solid var(--divider-color);box-shadow:var(--ha-card-box-shadow,none)}
    .card{padding:20px;margin-bottom:16px}.picker-card label{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:14px}
    .summary-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:16px}
    .summary-card{padding:16px;border-top:3px solid var(--primary-color)}.summary-card>span,.metric>span,.analysis-grid span{display:block;color:var(--secondary-text-color);font-size:12px;margin-bottom:5px}.summary-card strong{font-size:20px}.summary-card small,.metric small{color:var(--secondary-text-color)}
    details{border-top:1px solid var(--divider-color);padding:12px 0}details:first-of-type{border-top:0}summary{font-weight:600;cursor:pointer;padding:4px 0 12px}
    .form-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.form-grid label,.tariff-grid label{display:flex;flex-direction:column;gap:6px;color:var(--secondary-text-color);font-size:12px}.wide{grid-column:1/-1}
    input,select,textarea{width:100%;min-height:42px;border:1px solid var(--divider-color);border-radius:8px;padding:9px 10px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}textarea{resize:vertical}
    .input-unit{display:flex;border:1px solid var(--divider-color);border-radius:8px;overflow:hidden;background:var(--secondary-background-color)}.input-unit input{border:0;background:transparent}.input-unit span{padding:11px;color:var(--secondary-text-color);white-space:nowrap}
    .check{flex-direction:row!important;align-items:center;font-size:14px!important}.check input{width:auto;min-height:auto}.help,.warning{padding:10px 12px;border-radius:8px;background:var(--secondary-background-color);font-size:12px}.warning{color:var(--warning-color,#ff9800)}
    .actions,.export-actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:14px}.button,.icon-button{border:0;border-radius:8px;padding:9px 13px;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;font:inherit}.button.primary{background:var(--primary-color);color:var(--text-primary-color,#fff)}.button.subtle{background:transparent}.button.danger{background:transparent;border:1px solid var(--error-color,#db4437);color:var(--error-color,#db4437)}.button.compact{padding:6px 9px;font-size:12px}.button:disabled{opacity:.45;cursor:not-allowed}.icon-button{font-size:20px}
    .message{padding:12px 14px;border-radius:8px;margin-bottom:14px}.message.success{background:color-mix(in srgb,var(--success-color,#43a047) 18%,var(--card-background-color));border:1px solid var(--success-color,#43a047)}.message.error{background:color-mix(in srgb,var(--error-color,#db4437) 16%,var(--card-background-color));border:1px solid var(--error-color,#db4437)}
    .analysis-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px}.analysis-grid>div{padding:12px;background:var(--secondary-background-color);border-radius:8px}
    .history-toolbar{display:flex;gap:10px;margin:16px 0}.history-toolbar select{width:auto;min-width:160px}
    .period-list{display:grid;gap:10px}.period-row{display:grid;grid-template-columns:minmax(210px,1.4fr) minmax(160px,.8fr) minmax(170px,.9fr) minmax(220px,1fr) auto;gap:16px;align-items:center;padding:15px}
    .period-main{display:flex;align-items:center;gap:11px}.period-main strong,.period-main span{display:block}.period-main span{color:var(--secondary-text-color);font-size:12px;margin-top:4px}.type-icon{font-size:22px;width:34px;height:34px;display:grid;place-items:center;background:var(--secondary-background-color);border-radius:9px}
    .metric strong{display:block;font-size:15px}.badges{display:flex;flex-wrap:wrap;gap:6px}.badge{font-size:11px;padding:5px 8px;border-radius:999px;background:var(--secondary-background-color);color:var(--secondary-text-color)}.badge.accent{color:var(--primary-color);border:1px solid color-mix(in srgb,var(--primary-color) 35%,transparent)}
    .period-actions{display:flex;gap:6px}.tariff-detail,.period-note{grid-column:1/-1;padding-top:10px;border-top:1px solid var(--divider-color);color:var(--secondary-text-color);font-size:12px}.tariff-detail{display:flex;gap:20px}.tariff-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.hidden{display:none!important}.empty{text-align:center;padding:28px;color:var(--secondary-text-color)}
    @media(max-width:1100px){.summary-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.analysis-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.period-row{grid-template-columns:1.4fr 1fr 1fr}.badges{grid-column:1/3}.period-actions{grid-column:3;grid-row:2}}
    @media(max-width:700px){main{padding:14px 10px 36px}.page-header,.section-header{align-items:flex-start;flex-direction:column}.summary-grid,.form-grid,.analysis-grid,.tariff-grid{grid-template-columns:1fr}.wide{grid-column:auto}.summary-grid{gap:8px}.picker-card label{grid-template-columns:1fr}.history-toolbar{flex-direction:column}.history-toolbar select{width:100%}.period-row{grid-template-columns:1fr;gap:12px;padding:14px}.badges,.period-actions,.tariff-detail,.period-note{grid-column:1}.period-actions{grid-row:auto;justify-content:flex-end}.tariff-detail{flex-direction:column;gap:6px}.actions,.export-actions{flex-wrap:wrap;justify-content:stretch}.actions .button,.export-actions .button{flex:1}}
  `;}
}
if(!customElements.get("rental-consumption-panel"))customElements.define("rental-consumption-panel",RentalConsumptionPanel);
