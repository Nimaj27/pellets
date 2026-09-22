(function () {
  "use strict";

  var STORAGE_KEY = "pelletsConsoData_v1";

  var defaultState = {
    settings: { kgPerSack: 15, currency: "€", sacsParPalette: 66, stockAlertKg: 150, initialStockKg: 0, seasonStartMonth: 9 },
    purchases: [],
    consumptions: [],
    maintenances: []
  };

  var MAINTENANCE_LABELS = { annuel: "Annuel", regulier: "Régulier", vitre: "Vitre", annexes: "Annexes" };
  var WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  var MONTH_NAMES_FULL = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  var MONTH_NAMES_SHORT = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

  var CHANGELOG = [
    { version: "2.1.0", date: "22/09/2026", items: [
      "Stock initial configurable (report de la saison précédente) dans les Paramètres.",
      "Stock restant affiché aussi en nombre de sacs, pas seulement en kg.",
      "Dépenses : le coût des entretiens (ramonage, etc.) s'additionne à celui des achats.",
      "Ajout rapide d'un brûlage : quantité pré-remplie à 1 sac.",
      "Saison de chauffe : le mois de début est configurable dans les Paramètres.",
      "Changelog consultable directement dans l'application (le lien vers le fichier ne fonctionnait pas)."
    ] },
    { version: "2.0.0", date: "21/09/2026", items: [
      "Refonte visuelle façon appli mobile (thème sombre, navigation en bas, bouton +).",
      "Historique unifié (achats, brûlages, entretiens) filtrable et groupé par mois.",
      "Nouvel onglet Entretiens (maintenance : annuel, régulier, vitre, annexes).",
      "Calcul par saison de chauffe (sept. → août) sur le Dashboard et les Statistiques.",
      "Statistiques enrichies : évolution mensuelle et comparaison entre saisons."
    ] },
    { version: "1.1.0", date: "20/09/2026", items: [
      "Autonomie estimée, alerte stock bas, achats saisis par palette."
    ] },
    { version: "1.0.1", date: "20/09/2026", items: [
      "Correction de la saisie de la quantité consommée (flèches 0,1 en 0,1)."
    ] },
    { version: "1.0.0", date: "20/09/2026", items: [
      "Première version : achats, consommation, tableau de bord, export/import."
    ] }
  ];

  var state = loadState();
  var charts = {};

  // ---------- Stockage ----------
  function migratePurchase(p, defaultSacsParPalette) {
    if (p.unit && typeof p.qty === "number" && typeof p.priceInput === "number") return p;
    return {
      id: p.id, date: p.date, unit: "sacs", qty: p.sacks || 0,
      sacsParPalette: defaultSacsParPalette, kgPerSack: p.kgPerSack || 0,
      priceInput: p.pricePerSack || 0, note: p.note || ""
    };
  }

  function buildState(parsed) {
    var settings = Object.assign({}, defaultState.settings, (parsed && parsed.settings) || {});
    var purchases = Array.isArray(parsed && parsed.purchases) ? parsed.purchases : [];
    return {
      settings: settings,
      purchases: purchases.map(function (p) { return migratePurchase(p, settings.sacsParPalette); }),
      consumptions: Array.isArray(parsed && parsed.consumptions) ? parsed.consumptions : [],
      maintenances: Array.isArray(parsed && parsed.maintenances) ? parsed.maintenances : []
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(defaultState);
      return buildState(JSON.parse(raw));
    } catch (e) {
      console.error("Impossible de charger les données, réinitialisation.", e);
      return clone(defaultState);
    }
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ---------- Dates & saisons ----------
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function isoDateDaysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
  function monthKeyOf(dateStr) { return dateStr.slice(0, 7); }
  function monthLabelOf(dateStr) {
    var m = parseInt(dateStr.slice(5, 7), 10), y = dateStr.slice(0, 4);
    return MONTH_NAMES_FULL[m - 1] + " " + y;
  }
  function humanizeDate(dateStr) {
    if (dateStr === todayISO()) return "Aujourd'hui";
    if (dateStr === isoDateDaysAgo(1)) return "Hier";
    var d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function seasonStartMonth() { return state.settings.seasonStartMonth || 9; }
  function getSeasonMonths() {
    var start = seasonStartMonth(), months = [];
    for (var i = 0; i < 12; i++) months.push(((start - 1 + i) % 12) + 1);
    return months;
  }
  function getSeasonMonthLabels() { return getSeasonMonths().map(function (m) { return MONTH_NAMES_SHORT[m - 1]; }); }

  function seasonStartYear(dateStr) {
    var m = parseInt(dateStr.slice(5, 7), 10), y = parseInt(dateStr.slice(0, 4), 10);
    return m >= seasonStartMonth() ? y : y - 1;
  }
  function seasonLabel(startYear) { return startYear + "/" + (startYear + 1); }
  function currentSeasonStartYear() {
    var now = new Date(), m = now.getMonth() + 1, y = now.getFullYear();
    return m >= seasonStartMonth() ? y : y - 1;
  }
  function seasonMonthIndex(dateStr) { return getSeasonMonths().indexOf(parseInt(dateStr.slice(5, 7), 10)); }

  function allSeasonStartYears() {
    var years = {};
    years[currentSeasonStartYear()] = true;
    state.purchases.forEach(function (p) { if (p.date) years[seasonStartYear(p.date)] = true; });
    state.consumptions.forEach(function (c) { if (c.date) years[seasonStartYear(c.date)] = true; });
    state.maintenances.forEach(function (m) { if (m.date) years[seasonStartYear(m.date)] = true; });
    return Object.keys(years).map(Number).sort(function (a, b) { return a - b; });
  }

  function startOfIsoWeek(date) {
    var d = new Date(date);
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // ---------- Formatage ----------
  function fmtKg(v) { return (Math.round(v * 100) / 100).toLocaleString("fr-FR") + " kg"; }
  function fmtMoney(v) { return (Math.round(v * 100) / 100).toLocaleString("fr-FR") + " " + state.settings.currency; }
  function fmtSacs(kg) {
    var s = kg / (state.settings.kgPerSack || 1);
    return (Math.round(s * 10) / 10).toLocaleString("fr-FR");
  }

  // ---------- Achats ----------
  function purchaseSacks(p) { return p.unit === "palette" ? p.qty * p.sacsParPalette : p.qty; }
  function purchaseKg(p) { return purchaseSacks(p) * p.kgPerSack; }
  function purchaseTotal(p) { return p.qty * p.priceInput; }
  function purchaseUnitPricePerSack(p) { return p.unit === "palette" ? p.priceInput / p.sacsParPalette : p.priceInput; }

  function computeAvgPricePerKg(purchasesSubset) {
    var kg = purchasesSubset.reduce(function (s, p) { return s + purchaseKg(p); }, 0);
    var cost = purchasesSubset.reduce(function (s, p) { return s + purchaseTotal(p); }, 0);
    if (kg > 0) return cost / kg;
    var allKg = state.purchases.reduce(function (s, p) { return s + purchaseKg(p); }, 0);
    var allCost = state.purchases.reduce(function (s, p) { return s + purchaseTotal(p); }, 0);
    return allKg > 0 ? allCost / allKg : 0;
  }

  function computeStockKg() {
    var totalKgPurchased = state.purchases.reduce(function (s, p) { return s + purchaseKg(p); }, 0);
    var totalKgConsumed = state.consumptions.reduce(function (s, c) { return s + c.kg; }, 0);
    return (state.settings.initialStockKg || 0) + totalKgPurchased - totalKgConsumed;
  }

  function computeDailyAvgConsumption() {
    var windowStart = isoDateDaysAgo(29);
    var recentKg = state.consumptions.filter(function (c) { return c.date >= windowStart; })
      .reduce(function (s, c) { return s + c.kg; }, 0);
    return recentKg / 30;
  }

  // ---------- Navigation basse ----------
  document.getElementById("bottomNav").addEventListener("click", function (e) {
    var btn = e.target.closest(".nav-btn");
    if (!btn) return;
    document.querySelectorAll(".nav-btn").forEach(function (b) { b.classList.remove("is-active"); });
    document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("is-active"); });
    btn.classList.add("is-active");
    document.getElementById("page-" + btn.dataset.page).classList.add("is-active");
  });

  function currentPageName() {
    var active = document.querySelector(".nav-btn.is-active");
    return active ? active.dataset.page : "dashboard";
  }

  // ---------- Modale : Ajouter ----------
  var addModal = document.getElementById("addModalOverlay");
  var currentAddType = "brulage";

  function prefillBrulageDefaults() {
    document.getElementById("addBrulageQty").value = "1";
    document.getElementById("addBrulageUnit").value = "sacs";
  }

  function openAddModal() {
    currentAddType = currentPageName() === "entretiens" ? "entretien" : "brulage";
    document.querySelectorAll("#addTypeSegmented .segmented__btn").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.addType === currentAddType);
    });
    updateAddFieldsVisibility();
    document.getElementById("formAdd").reset();
    document.getElementById("addDate").value = todayISO();
    document.getElementById("addAchatKgPerSack").value = state.settings.kgPerSack;
    if (currentAddType === "brulage") prefillBrulageDefaults();
    updateAchatUnitLabels();
    addModal.hidden = false;
  }
  function closeAddModal() { addModal.hidden = true; }

  document.getElementById("fabAdd").addEventListener("click", openAddModal);
  document.getElementById("btnCloseAddModal").addEventListener("click", closeAddModal);
  addModal.addEventListener("click", function (e) { if (e.target === addModal) closeAddModal(); });

  function updateAddFieldsVisibility() {
    document.getElementById("fieldsBrulage").hidden = currentAddType !== "brulage";
    document.getElementById("fieldsAchat").hidden = currentAddType !== "achat";
    document.getElementById("fieldsEntretien").hidden = currentAddType !== "entretien";
  }

  document.getElementById("addTypeSegmented").addEventListener("click", function (e) {
    var btn = e.target.closest(".segmented__btn");
    if (!btn) return;
    currentAddType = btn.dataset.addType;
    document.querySelectorAll("#addTypeSegmented .segmented__btn").forEach(function (b) {
      b.classList.toggle("is-active", b === btn);
    });
    updateAddFieldsVisibility();
    if (currentAddType === "brulage") prefillBrulageDefaults();
  });

  function updateAchatUnitLabels() {
    var isPalette = document.getElementById("addAchatUnit").value === "palette";
    document.getElementById("addAchatQtyLabel").textContent = isPalette ? "Nombre de palettes" : "Nombre de sacs";
    document.getElementById("addAchatPriceLabel").textContent = isPalette ? "Prix par palette (€)" : "Prix par sac (€)";
  }
  document.getElementById("addAchatUnit").addEventListener("change", updateAchatUnitLabels);

  document.getElementById("formAdd").addEventListener("submit", function (e) {
    e.preventDefault();
    var date = document.getElementById("addDate").value;
    var note = document.getElementById("addNote").value.trim();

    if (currentAddType === "brulage") {
      var qty = parseFloat(document.getElementById("addBrulageQty").value) || 0;
      var unit = document.getElementById("addBrulageUnit").value;
      var kg = unit === "sacs" ? qty * state.settings.kgPerSack : qty;
      state.consumptions.push({ id: uid(), date: date, kg: kg, note: note });
    } else if (currentAddType === "achat") {
      state.purchases.push({
        id: uid(), date: date,
        unit: document.getElementById("addAchatUnit").value,
        qty: parseFloat(document.getElementById("addAchatQty").value) || 0,
        sacsParPalette: state.settings.sacsParPalette,
        kgPerSack: parseFloat(document.getElementById("addAchatKgPerSack").value) || 0,
        priceInput: parseFloat(document.getElementById("addAchatPrice").value) || 0,
        note: note
      });
    } else if (currentAddType === "entretien") {
      state.maintenances.push({
        id: uid(), date: date,
        type: document.getElementById("addEntretienType").value,
        cost: parseFloat(document.getElementById("addEntretienCost").value) || 0,
        note: note
      });
    }

    saveState();
    closeAddModal();
    renderAll();
  });

  // ---------- Modale : Paramètres ----------
  var settingsModal = document.getElementById("settingsModalOverlay");
  function openSettingsModal() {
    document.getElementById("settingKgPerSack").value = state.settings.kgPerSack;
    document.getElementById("settingSacsParPalette").value = state.settings.sacsParPalette;
    document.getElementById("settingInitialStock").value = state.settings.initialStockKg;
    document.getElementById("settingStockAlert").value = state.settings.stockAlertKg;
    document.getElementById("settingSeasonStartMonth").value = state.settings.seasonStartMonth;
    document.getElementById("settingCurrency").value = state.settings.currency;
    settingsModal.hidden = false;
  }
  document.getElementById("btnOpenSettingsDash").addEventListener("click", openSettingsModal);
  document.getElementById("btnCloseSettings").addEventListener("click", function () { settingsModal.hidden = true; });
  settingsModal.addEventListener("click", function (e) { if (e.target === settingsModal) settingsModal.hidden = true; });

  document.getElementById("formSettings").addEventListener("submit", function (e) {
    e.preventDefault();
    state.settings.kgPerSack = parseFloat(document.getElementById("settingKgPerSack").value) || 15;
    state.settings.sacsParPalette = parseFloat(document.getElementById("settingSacsParPalette").value) || 66;
    state.settings.initialStockKg = parseFloat(document.getElementById("settingInitialStock").value) || 0;
    state.settings.stockAlertKg = parseFloat(document.getElementById("settingStockAlert").value) || 0;
    state.settings.seasonStartMonth = parseInt(document.getElementById("settingSeasonStartMonth").value, 10) || 9;
    state.settings.currency = document.getElementById("settingCurrency").value.trim() || "€";
    saveState();
    settingsModal.hidden = true;
    renderAll();
  });

  // ---------- Modale : Changelog ----------
  var changelogModal = document.getElementById("changelogModalOverlay");
  document.getElementById("btnOpenChangelog").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("changelogContent").innerHTML = CHANGELOG.map(function (entry) {
      return "<div class=\"changelog-entry\"><h3>v" + entry.version + "</h3><time>" + entry.date + "</time>" +
        "<ul>" + entry.items.map(function (item) { return "<li>" + item + "</li>"; }).join("") + "</ul></div>";
    }).join("");
    changelogModal.hidden = false;
  });
  document.getElementById("btnCloseChangelog").addEventListener("click", function () { changelogModal.hidden = true; });
  changelogModal.addEventListener("click", function (e) { if (e.target === changelogModal) changelogModal.hidden = true; });

  document.getElementById("btnExport").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "pellets-conso-sauvegarde-" + todayISO() + ".json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importFile").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        state = buildState(JSON.parse(reader.result));
        saveState();
        renderAll();
        alert("Import réussi.");
      } catch (err) {
        alert("Fichier invalide : " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("btnReset").addEventListener("click", function () {
    if (!confirm("Supprimer définitivement toutes les données enregistrées ?")) return;
    state = clone(defaultState);
    saveState();
    settingsModal.hidden = true;
    renderAll();
  });

  // ---------- Historique / Entretiens : listes groupées ----------
  var historiqueTypeFilter = "all";
  var historiqueMType = "all";
  var entretienPageMType = "all";

  document.getElementById("historiqueTypeFilters").addEventListener("click", function (e) {
    var btn = e.target.closest(".filter-pill");
    if (!btn) return;
    historiqueTypeFilter = btn.dataset.type;
    document.querySelectorAll("#historiqueTypeFilters .filter-pill").forEach(function (b) {
      b.classList.toggle("is-active", b === btn);
    });
    document.getElementById("historiqueMaintenanceFilters").hidden = historiqueTypeFilter !== "entretien";
    renderHistorique();
  });

  document.getElementById("historiqueMaintenanceFilters").addEventListener("click", function (e) {
    var btn = e.target.closest(".chip-filter");
    if (!btn) return;
    historiqueMType = btn.dataset.mtype;
    document.querySelectorAll("#historiqueMaintenanceFilters .chip-filter").forEach(function (b) {
      b.classList.toggle("is-active", b === btn);
    });
    renderHistorique();
  });

  document.getElementById("entretienPageFilters").addEventListener("click", function (e) {
    var btn = e.target.closest(".chip-filter");
    if (!btn) return;
    entretienPageMType = btn.dataset.mtype;
    document.querySelectorAll("#entretienPageFilters .chip-filter").forEach(function (b) {
      b.classList.toggle("is-active", b === btn);
    });
    renderEntretiens();
  });

  function buildUnifiedEntries() {
    var entries = [];
    state.purchases.forEach(function (p) { entries.push(Object.assign({ type: "achat" }, p)); });
    state.consumptions.forEach(function (c) { entries.push(Object.assign({ type: "brulage" }, c)); });
    state.maintenances.forEach(function (m) { entries.push(Object.assign({ type: "entretien" }, m)); });
    entries.sort(function (a, b) { return b.date.localeCompare(a.date); });
    return entries;
  }

  function summarizeGroup(entries) {
    var kgSum = 0, achatCount = 0, achatTotal = 0, entretienCount = 0, entretienCost = 0;
    entries.forEach(function (e) {
      if (e.type === "brulage") kgSum += e.kg;
      else if (e.type === "achat") { achatCount++; achatTotal += purchaseTotal(e); }
      else if (e.type === "entretien") { entretienCount++; entretienCost += e.cost || 0; }
    });
    var parts = [];
    if (kgSum > 0) parts.push("🔥 " + fmtSacs(kgSum) + " sac(s) - " + fmtKg(kgSum));
    if (achatCount > 0) parts.push("🛒 " + fmtMoney(achatTotal));
    if (entretienCount > 0) parts.push("🧹 " + entretienCount + " entretien(s)" + (entretienCost > 0 ? " - " + fmtMoney(entretienCost) : ""));
    return parts.join(" · ");
  }

  function entryRowHtml(e) {
    var label, value, note = e.note || "";
    if (e.type === "brulage") {
      label = humanizeDate(e.date);
      value = fmtSacs(e.kg) + " sac(s) (" + fmtKg(e.kg) + ")";
    } else if (e.type === "achat") {
      label = humanizeDate(e.date) + " — " + (e.unit === "palette" ? e.qty + " palette(s)" : e.qty + " sac(s)");
      value = fmtMoney(purchaseTotal(e));
    } else {
      label = humanizeDate(e.date) + " — " + (MAINTENANCE_LABELS[e.type] || e.type);
      value = e.cost > 0 ? fmtMoney(e.cost) : "";
    }
    var icon = e.type === "brulage" ? "🔥" : e.type === "achat" ? "🛒" : "🧹";
    return "<div class=\"entry-row entry-row--" + e.type + "\">" +
      "<div class=\"entry-row__left\">" +
      "<span class=\"entry-row__icon\">" + icon + "</span>" +
      "<div class=\"entry-row__text\"><div class=\"entry-row__label\">" + label + "</div>" +
      (note ? "<div class=\"entry-row__note\">" + note + "</div>" : "") +
      "</div></div>" +
      "<div class=\"entry-row__right\">" +
      "<span class=\"entry-row__value\">" + value + "</span>" +
      "<button class=\"entry-row__delete\" data-delete-type=\"" + e.type + "\" data-delete-id=\"" + e.id + "\">✕</button>" +
      "</div></div>";
  }

  function groupByMonth(entries) {
    var groups = {};
    entries.forEach(function (e) {
      var key = monthKeyOf(e.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.keys(groups).sort().reverse().map(function (key) {
      return { key: key, label: monthLabelOf(groups[key][0].date), entries: groups[key] };
    });
  }

  function renderGroupedList(listEl, emptyWrapEl, entries) {
    var groups = groupByMonth(entries);
    if (!groups.length) {
      listEl.innerHTML = "";
      emptyWrapEl.hidden = false;
      return;
    }
    emptyWrapEl.hidden = true;
    listEl.innerHTML = groups.map(function (g) {
      return "<div class=\"month-group\" data-month-key=\"" + g.key + "\">" +
        "<div class=\"month-group__header\">" +
        "<div><p class=\"month-group__title\">" + g.label + "</p>" +
        "<p class=\"month-group__summary\">" + summarizeGroup(g.entries) + "</p></div>" +
        "<span class=\"month-group__chevron\">▾</span>" +
        "</div>" +
        "<div class=\"month-group__body\">" + g.entries.map(entryRowHtml).join("") + "</div>" +
        "</div>";
    }).join("");

    listEl.querySelectorAll(".month-group__header").forEach(function (header) {
      header.addEventListener("click", function () {
        header.closest(".month-group").classList.toggle("is-collapsed");
      });
    });
    listEl.querySelectorAll("[data-delete-type]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        deleteEntry(btn.dataset.deleteType, btn.dataset.deleteId);
      });
    });
  }

  function deleteEntry(type, id) {
    if (type === "achat") state.purchases = state.purchases.filter(function (p) { return p.id !== id; });
    else if (type === "brulage") state.consumptions = state.consumptions.filter(function (c) { return c.id !== id; });
    else if (type === "entretien") state.maintenances = state.maintenances.filter(function (m) { return m.id !== id; });
    saveState();
    renderAll();
  }

  function renderHistorique() {
    var all = buildUnifiedEntries();
    var filtered = historiqueTypeFilter === "all" ? all : all.filter(function (e) { return e.type === historiqueTypeFilter; });
    if (historiqueTypeFilter === "entretien" && historiqueMType !== "all") {
      filtered = filtered.filter(function (e) { return e.type === historiqueMType; });
    }
    renderGroupedList(document.getElementById("historiqueList"), document.getElementById("historiqueEmptyWrap"), filtered);
  }

  function renderEntretiens() {
    var entries = state.maintenances.map(function (m) { return Object.assign({ type: "entretien" }, m); });
    entries.sort(function (a, b) { return b.date.localeCompare(a.date); });
    if (entretienPageMType !== "all") entries = entries.filter(function (e) { return e.type === entretienPageMType; });
    renderGroupedList(document.getElementById("entretiensList"), document.getElementById("entretiensEmptyWrap"), entries);
  }

  // ---------- Dashboard ----------
  function renderDashScopeOptions() {
    var select = document.getElementById("dashScopeSelect");
    var current = select.value;
    var seasons = allSeasonStartYears();
    var options = "<option value=\"all\">Depuis toujours</option>" +
      seasons.slice().reverse().map(function (s) { return "<option value=\"" + s + "\">Saison " + seasonLabel(s) + "</option>"; }).join("");
    select.innerHTML = options;
    var wanted = current || String(currentSeasonStartYear());
    select.value = Array.prototype.some.call(select.options, function (o) { return o.value === wanted; }) ? wanted : "all";
  }

  document.getElementById("dashScopeSelect").addEventListener("change", renderDashboard);

  function getDashScope() {
    var val = document.getElementById("dashScopeSelect").value;
    return val === "all" ? { mode: "all" } : { mode: "season", startYear: parseInt(val, 10) };
  }

  function renderDashboard() {
    var scope = getDashScope();
    var purchasesInScope = scope.mode === "all" ? state.purchases : state.purchases.filter(function (p) { return seasonStartYear(p.date) === scope.startYear; });
    var maintenancesInScope = scope.mode === "all" ? state.maintenances : state.maintenances.filter(function (m) { return seasonStartYear(m.date) === scope.startYear; });

    var totalSpent = purchasesInScope.reduce(function (s, p) { return s + purchaseTotal(p); }, 0) +
      maintenancesInScope.reduce(function (s, m) { return s + (m.cost || 0); }, 0);
    document.getElementById("statSpent").textContent = fmtMoney(totalSpent);

    var stock = computeStockKg();
    document.getElementById("statStock").textContent = fmtKg(stock);
    document.getElementById("statStockHint").textContent = "≈ " + fmtSacs(stock) + " sac(s)";

    var dailyAvg = computeDailyAvgConsumption();
    var autonomyEl = document.getElementById("statAutonomy");
    var hintEl = document.getElementById("statAutonomyHint");
    if (dailyAvg > 0) {
      var days = Math.max(0, Math.floor(stock / dailyAvg));
      autonomyEl.textContent = days + " jour" + (days > 1 ? "s" : "");
      hintEl.textContent = "≈ " + (Math.round((days / 7) * 10) / 10) + " semaines";
    } else {
      autonomyEl.textContent = "—";
      hintEl.textContent = "Pas de conso récente";
    }

    var banner = document.getElementById("stockAlertBanner");
    var stockCard = document.getElementById("statStockCard");
    if (stock <= state.settings.stockAlertKg) {
      banner.hidden = false;
      document.getElementById("stockAlertText").textContent =
        "il reste environ " + fmtKg(stock) + " (seuil : " + fmtKg(state.settings.stockAlertKg) + ").";
      stockCard.classList.add("stat-card--warning");
    } else {
      banner.hidden = true;
      stockCard.classList.remove("stat-card--warning");
    }

    // Semaine en cours (lundi -> dimanche)
    var monday = startOfIsoWeek(new Date());
    var weekData = [0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday);
      d.setDate(d.getDate() + i);
      var iso = d.toISOString().slice(0, 10);
      weekData[i] = state.consumptions.filter(function (c) { return c.date === iso; }).reduce(function (s, c) { return s + c.kg; }, 0);
    }
    var weekTotalKg = weekData.reduce(function (a, b) { return a + b; }, 0);
    document.getElementById("statRate").textContent = (Math.round((weekTotalKg / 7) * 10) / 10).toLocaleString("fr-FR") + " kg/j";
    document.getElementById("weekTotalChip").textContent = fmtSacs(weekTotalKg) + " sac(s)";

    renderChart("chartWeek", "bar", WEEKDAY_LABELS, [{ label: "Kg brûlés", data: weekData, backgroundColor: "#ff8a3d" }]);

    // Consommation mensuelle de la saison affichée (ou saison courante si "depuis toujours")
    var seasonForChart = scope.mode === "season" ? scope.startYear : currentSeasonStartYear();
    var monthlyData = new Array(12).fill(0);
    state.consumptions.forEach(function (c) {
      if (seasonStartYear(c.date) === seasonForChart) monthlyData[seasonMonthIndex(c.date)] += c.kg;
    });
    renderChart("chartMonthly", "bar", getSeasonMonthLabels(), [{ label: "Kg brûlés (" + seasonLabel(seasonForChart) + ")", data: monthlyData, backgroundColor: "#ff8a3d" }]);
  }

  // ---------- Statistiques ----------
  var seasonMetric = "kg";
  var multiSeasonMetric = "burned";

  function renderStatsSeasonOptions() {
    var select = document.getElementById("statsSeasonSelect");
    var current = select.value;
    var seasons = allSeasonStartYears();
    select.innerHTML = seasons.slice().reverse().map(function (s) { return "<option value=\"" + s + "\">Saison " + seasonLabel(s) + "</option>"; }).join("");
    var wanted = current || String(currentSeasonStartYear());
    select.value = Array.prototype.some.call(select.options, function (o) { return o.value === wanted; }) ? wanted : select.options[0].value;
  }

  document.getElementById("statsSeasonSelect").addEventListener("change", renderStatistiques);

  document.getElementById("seasonMetricToggle").addEventListener("click", function (e) {
    var btn = e.target.closest(".segmented__btn");
    if (!btn) return;
    seasonMetric = btn.dataset.metric;
    document.querySelectorAll("#seasonMetricToggle .segmented__btn").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
    renderStatistiques();
  });

  document.getElementById("multiSeasonToggle").addEventListener("click", function (e) {
    var btn = e.target.closest(".segmented__btn");
    if (!btn) return;
    multiSeasonMetric = btn.dataset.metric;
    document.querySelectorAll("#multiSeasonToggle .segmented__btn").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
    renderStatistiques();
  });

  function renderStatistiques() {
    var startYear = parseInt(document.getElementById("statsSeasonSelect").value, 10);

    var monthlyData = new Array(12).fill(0);
    if (seasonMetric === "kg") {
      state.consumptions.forEach(function (c) {
        if (seasonStartYear(c.date) === startYear) monthlyData[seasonMonthIndex(c.date)] += c.kg / (state.settings.kgPerSack || 1);
      });
      monthlyData = monthlyData.map(function (v) { return Math.round(v * 10) / 10; });
      renderChart("chartSeasonMonthly", "bar", getSeasonMonthLabels(), [{ label: "Sacs brûlés", data: monthlyData, backgroundColor: "#ff8a3d" }]);
    } else {
      state.purchases.forEach(function (p) {
        if (seasonStartYear(p.date) === startYear) monthlyData[seasonMonthIndex(p.date)] += purchaseTotal(p);
      });
      renderChart("chartSeasonMonthly", "bar", getSeasonMonthLabels(), [{ label: "Dépenses (" + state.settings.currency + ")", data: monthlyData, backgroundColor: "#5b7cfa" }]);
    }

    var seasons = allSeasonStartYears();
    var labels = seasons.map(seasonLabel);
    var data;
    if (multiSeasonMetric === "burned") {
      data = seasons.map(function (s) {
        var kg = state.consumptions.filter(function (c) { return seasonStartYear(c.date) === s; }).reduce(function (sum, c) { return sum + c.kg; }, 0);
        return Math.round((kg / (state.settings.kgPerSack || 1)) * 10) / 10;
      });
      renderChart("chartMultiSeason", "bar", labels, [{ label: "Sacs brûlés", data: data, backgroundColor: "#ff8a3d" }]);
    } else {
      data = seasons.map(function (s) {
        return state.purchases.filter(function (p) { return seasonStartYear(p.date) === s; }).reduce(function (sum, p) { return sum + purchaseSacks(p); }, 0);
      });
      renderChart("chartMultiSeason", "bar", labels, [{ label: "Sacs achetés", data: data, backgroundColor: "#5b7cfa" }]);
    }
  }

  // ---------- Graphiques (Chart.js) ----------
  function renderChart(canvasId, type, labels, datasets) {
    if (typeof Chart === "undefined") return;
    var ctx = document.getElementById(canvasId).getContext("2d");
    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(ctx, {
      type: type,
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        plugins: { legend: { display: datasets.length > 1, labels: { color: "#9a95a6" } } },
        scales: {
          x: { ticks: { color: "#9a95a6" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { beginAtZero: true, ticks: { color: "#9a95a6" }, grid: { color: "rgba(255,255,255,0.05)" } }
        }
      }
    });
  }

  // ---------- Rendu global ----------
  function renderAll() {
    renderDashScopeOptions();
    renderStatsSeasonOptions();
    renderDashboard();
    renderHistorique();
    renderEntretiens();
    renderStatistiques();
  }

  document.getElementById("addDate").value = todayISO();
  updateAddFieldsVisibility();
  updateAchatUnitLabels();

  renderAll();
})();
