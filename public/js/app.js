(function () {
  "use strict";

  var STORAGE_KEY = "pelletsConsoData_v1";

  var defaultState = {
    settings: { kgPerSack: 15, currency: "€" },
    purchases: [],
    consumptions: []
  };

  var state = loadState();
  var chartMonthly = null;
  var chartYearly = null;

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(defaultState);
      var parsed = JSON.parse(raw);
      return {
        settings: Object.assign({}, defaultState.settings, parsed.settings || {}),
        purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
        consumptions: Array.isArray(parsed.consumptions) ? parsed.consumptions : []
      };
    } catch (e) {
      console.error("Impossible de charger les données, réinitialisation.", e);
      return clone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function yearOf(dateStr) { return dateStr ? dateStr.slice(0, 4) : ""; }

  function monthIndexOf(dateStr) { return parseInt(dateStr.slice(5, 7), 10) - 1; }

  function fmtKg(v) { return (Math.round(v * 100) / 100).toLocaleString("fr-FR") + " kg"; }

  function fmtMoney(v) {
    return (Math.round(v * 100) / 100).toLocaleString("fr-FR") + " " + state.settings.currency;
  }

  // ---------- Navigation par onglets ----------
  document.getElementById("tabs").addEventListener("click", function (e) {
    var btn = e.target.closest(".tab-btn");
    if (!btn) return;
    document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("is-active"); });
    document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("is-active"); });
    btn.classList.add("is-active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("is-active");
  });

  // ---------- Achats ----------
  function purchaseKg(p) { return p.sacks * p.kgPerSack; }
  function purchaseTotal(p) { return p.sacks * p.pricePerSack; }

  document.getElementById("formPurchase").addEventListener("submit", function (e) {
    e.preventDefault();
    var purchase = {
      id: uid(),
      date: document.getElementById("purchaseDate").value,
      sacks: parseFloat(document.getElementById("purchaseSacks").value) || 0,
      kgPerSack: parseFloat(document.getElementById("purchaseKgPerSack").value) || 0,
      pricePerSack: parseFloat(document.getElementById("purchasePricePerSack").value) || 0,
      note: document.getElementById("purchaseNote").value.trim()
    };
    state.purchases.push(purchase);
    saveState();
    e.target.reset();
    document.getElementById("purchaseKgPerSack").value = state.settings.kgPerSack;
    renderAll();
  });

  document.getElementById("purchasesBody").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-delete-purchase]");
    if (!btn) return;
    state.purchases = state.purchases.filter(function (p) { return p.id !== btn.dataset.deletePurchase; });
    saveState();
    renderAll();
  });

  function renderPurchases() {
    var body = document.getElementById("purchasesBody");
    var sorted = state.purchases.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    body.innerHTML = sorted.map(function (p) {
      return "<tr>" +
        "<td>" + p.date + "</td>" +
        "<td>" + p.sacks + "</td>" +
        "<td>" + p.kgPerSack + "</td>" +
        "<td>" + fmtKg(purchaseKg(p)) + "</td>" +
        "<td>" + fmtMoney(p.pricePerSack) + "</td>" +
        "<td>" + fmtMoney(purchaseTotal(p)) + "</td>" +
        "<td>" + (p.note || "") + "</td>" +
        "<td><button class=\"row-delete\" data-delete-purchase=\"" + p.id + "\">Supprimer</button></td>" +
        "</tr>";
    }).join("");
    document.getElementById("purchasesEmpty").style.display = sorted.length ? "none" : "block";
  }

  // ---------- Consommation ----------
  document.getElementById("formConsumption").addEventListener("submit", function (e) {
    e.preventDefault();
    var qty = parseFloat(document.getElementById("consumptionQty").value) || 0;
    var unit = document.getElementById("consumptionUnit").value;
    var kg = unit === "sacs" ? qty * state.settings.kgPerSack : qty;
    var consumption = {
      id: uid(),
      date: document.getElementById("consumptionDate").value,
      kg: kg,
      note: document.getElementById("consumptionNote").value.trim()
    };
    state.consumptions.push(consumption);
    saveState();
    e.target.reset();
    document.getElementById("consumptionUnit").value = "kg";
    renderAll();
  });

  document.getElementById("consumptionsBody").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-delete-consumption]");
    if (!btn) return;
    state.consumptions = state.consumptions.filter(function (c) { return c.id !== btn.dataset.deleteConsumption; });
    saveState();
    renderAll();
  });

  function renderConsumptions() {
    var body = document.getElementById("consumptionsBody");
    var sorted = state.consumptions.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    body.innerHTML = sorted.map(function (c) {
      return "<tr>" +
        "<td>" + c.date + "</td>" +
        "<td>" + fmtKg(c.kg) + "</td>" +
        "<td>" + (c.note || "") + "</td>" +
        "<td><button class=\"row-delete\" data-delete-consumption=\"" + c.id + "\">Supprimer</button></td>" +
        "</tr>";
    }).join("");
    document.getElementById("consumptionsEmpty").style.display = sorted.length ? "none" : "block";
  }

  // ---------- Paramètres ----------
  document.getElementById("formSettings").addEventListener("submit", function (e) {
    e.preventDefault();
    state.settings.kgPerSack = parseFloat(document.getElementById("settingKgPerSack").value) || 15;
    state.settings.currency = document.getElementById("settingCurrency").value.trim() || "€";
    saveState();
    renderAll();
  });

  document.getElementById("btnExport").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "pellets-conso-sauvegarde-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importFile").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = JSON.parse(reader.result);
        state = {
          settings: Object.assign({}, defaultState.settings, imported.settings || {}),
          purchases: Array.isArray(imported.purchases) ? imported.purchases : [],
          consumptions: Array.isArray(imported.consumptions) ? imported.consumptions : []
        };
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
    renderAll();
  });

  // ---------- Tableau de bord ----------
  function allYears() {
    var years = {};
    state.purchases.forEach(function (p) { if (p.date) years[yearOf(p.date)] = true; });
    state.consumptions.forEach(function (c) { if (c.date) years[yearOf(c.date)] = true; });
    var list = Object.keys(years).sort();
    if (!list.length) list.push(String(new Date().getFullYear()));
    return list;
  }

  function renderYearFilter() {
    var select = document.getElementById("yearFilter");
    var current = select.value;
    var years = allYears();
    select.innerHTML = "<option value=\"all\">Toutes les années</option>" +
      years.map(function (y) { return "<option value=\"" + y + "\">" + y + "</option>"; }).join("");
    if (current && (current === "all" || years.indexOf(current) !== -1)) {
      select.value = current;
    } else {
      select.value = years[years.length - 1];
    }
  }

  function computeAvgPricePerKg(purchasesSubset) {
    var kg = purchasesSubset.reduce(function (sum, p) { return sum + purchaseKg(p); }, 0);
    var cost = purchasesSubset.reduce(function (sum, p) { return sum + purchaseTotal(p); }, 0);
    if (kg > 0) return cost / kg;
    var allKg = state.purchases.reduce(function (sum, p) { return sum + purchaseKg(p); }, 0);
    var allCost = state.purchases.reduce(function (sum, p) { return sum + purchaseTotal(p); }, 0);
    return allKg > 0 ? allCost / allKg : 0;
  }

  function renderStats() {
    var yearFilter = document.getElementById("yearFilter").value;
    var purchasesInScope = yearFilter === "all" ? state.purchases : state.purchases.filter(function (p) { return yearOf(p.date) === yearFilter; });
    var consumptionsInScope = yearFilter === "all" ? state.consumptions : state.consumptions.filter(function (c) { return yearOf(c.date) === yearFilter; });

    var totalKgConsumed = consumptionsInScope.reduce(function (s, c) { return s + c.kg; }, 0);
    var totalCostPurchases = purchasesInScope.reduce(function (s, p) { return s + purchaseTotal(p); }, 0);
    var avgPrice = computeAvgPricePerKg(purchasesInScope);
    var consumedValue = totalKgConsumed * avgPrice;

    var totalKgPurchasedAllTime = state.purchases.reduce(function (s, p) { return s + purchaseKg(p); }, 0);
    var totalKgConsumedAllTime = state.consumptions.reduce(function (s, c) { return s + c.kg; }, 0);
    var stock = totalKgPurchasedAllTime - totalKgConsumedAllTime;

    document.getElementById("statKgConsumed").textContent = fmtKg(totalKgConsumed);
    document.getElementById("statCostPurchases").textContent = fmtMoney(totalCostPurchases);
    document.getElementById("statAvgPrice").textContent = fmtMoney(avgPrice) + "/kg";
    document.getElementById("statConsumedValue").textContent = fmtMoney(consumedValue);
    document.getElementById("statStock").textContent = fmtKg(stock);
  }

  var MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

  function renderCharts() {
    if (typeof Chart === "undefined") return;
    var yearFilter = document.getElementById("yearFilter").value;
    var monthlyYear = yearFilter === "all" ? allYears()[allYears().length - 1] : yearFilter;

    var monthlyData = new Array(12).fill(0);
    state.consumptions.forEach(function (c) {
      if (yearOf(c.date) === monthlyYear) monthlyData[monthIndexOf(c.date)] += c.kg;
    });

    var monthlyCtx = document.getElementById("chartMonthly").getContext("2d");
    if (chartMonthly) chartMonthly.destroy();
    chartMonthly = new Chart(monthlyCtx, {
      type: "bar",
      data: {
        labels: MONTHS,
        datasets: [{ label: "Kg consommés (" + monthlyYear + ")", data: monthlyData, backgroundColor: "#c1571b" }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    var years = allYears();
    var kgByYear = years.map(function (y) {
      return state.consumptions.filter(function (c) { return yearOf(c.date) === y; }).reduce(function (s, c) { return s + c.kg; }, 0);
    });
    var costByYear = years.map(function (y) {
      return state.purchases.filter(function (p) { return yearOf(p.date) === y; }).reduce(function (s, p) { return s + purchaseTotal(p); }, 0);
    });

    var yearlyCtx = document.getElementById("chartYearly").getContext("2d");
    if (chartYearly) chartYearly.destroy();
    chartYearly = new Chart(yearlyCtx, {
      type: "bar",
      data: {
        labels: years,
        datasets: [
          { label: "Kg consommés", data: kgByYear, backgroundColor: "#c1571b", yAxisID: "y" },
          { label: "Coût des achats (" + state.settings.currency + ")", data: costByYear, backgroundColor: "#2f7a4f", yAxisID: "y1" }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
          y: { type: "linear", position: "left", beginAtZero: true, title: { display: true, text: "kg" } },
          y1: { type: "linear", position: "right", beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: state.settings.currency } }
        }
      }
    });
  }

  document.getElementById("yearFilter").addEventListener("change", function () {
    renderStats();
    renderCharts();
  });

  function renderSettingsForm() {
    document.getElementById("settingKgPerSack").value = state.settings.kgPerSack;
    document.getElementById("settingCurrency").value = state.settings.currency;
    document.getElementById("purchaseKgPerSack").value = state.settings.kgPerSack;
  }

  function renderAll() {
    renderYearFilter();
    renderPurchases();
    renderConsumptions();
    renderStats();
    renderCharts();
    renderSettingsForm();
  }

  var todayStr = new Date().toISOString().slice(0, 10);
  document.getElementById("purchaseDate").value = todayStr;
  document.getElementById("consumptionDate").value = todayStr;

  renderAll();
})();
