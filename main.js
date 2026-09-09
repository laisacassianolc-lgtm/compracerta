(function () {
  // main.js — CompraCerta. IIFE clássica (sem import/export), roda em
  // file://, FTP ou Hostinger. Lê window.__BRAND__ (lib/manifest.js) e
  // window.__DB__ (lib/db.js, gerado por tools/build_site.py).
  "use strict";

  var BRAND = window.__BRAND__ || {};
  var DB = window.__DB__ || { produtos: [], scoreAxes: [] };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function escHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }
  function formatBRL(v) {
    if (v == null || isNaN(v)) return "—";
    try { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
    catch (e) { return "R$ " + Number(v).toFixed(2).replace(".", ","); }
  }
  function byId(id) {
    for (var i = 0; i < DB.produtos.length; i++) if (DB.produtos[i].id === id) return DB.produtos[i];
    return null;
  }

  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 7h14M5 7 2 13a3 3 0 0 0 6 0L5 7Zm14 0-3 6a3 3 0 0 0 6 0l-3-6Z"></path></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8Z"></path></svg>'
  };

  /* ---------------- Nav ---------------- */
  function initNavToggle() {
    var btn = $("[data-nav-toggle]");
    var menu = $("[data-mobile-menu]");
    if (!btn || !menu) return;
    btn.innerHTML = ICON.menu;
    btn.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.innerHTML = open ? ICON.close : ICON.menu;
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        btn.innerHTML = ICON.menu;
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal() {
    var targets = $$("[data-reveal]");
    if (!targets.length) return;
    var started = false;
    function reveal(el) { el.classList.add("is-visible"); }
    function start() {
      if (started) return;
      started = true;
      if (reduced || !("IntersectionObserver" in window)) {
        targets.forEach(reveal);
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
      targets.forEach(function (el) { io.observe(el); });
      // Safety net: anything already in view or missed gets revealed anyway.
      setTimeout(function () {
        targets.forEach(function (el) {
          if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < innerHeight) {
            reveal(el);
          }
        });
      }, 6000);
    }
    setTimeout(start, 50);
  }

  /* ---------------- Gallery (ficha) ---------------- */
  function initGallery() {
    $$("[data-galeria]").forEach(function (wrap) {
      if (wrap.dataset.galeriaBound) return;
      wrap.dataset.galeriaBound = "1";
      var main = $(".ficha-img-main", wrap);
      var thumbBtns = $$("[data-thumbs] button", wrap);
      if (!main || !thumbBtns.length) return;
      thumbBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var img = $("img", btn);
          if (!img) return;
          main.src = img.src;
          main.alt = img.alt;
          thumbBtns.forEach(function (b) { b.classList.remove("is-active"); });
          btn.classList.add("is-active");
        });
      });
    });
  }

  /* ---------------- Radar chart (hand-drawn SVG, no lib) ---------------- */
  function radarPoint(cx, cy, r, angleDeg) {
    var rad = (angleDeg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  function buildRadarSVG(axisLabels, datasets, opts) {
    opts = opts || {};
    // The viewBox is drawn larger than the on-screen box (CSS fixes the
    // display size) so long axis labels have coordinate room and never get
    // clipped by the SVG's own viewport.
    var size = opts.size || 300, cx = size / 2, cy = size / 2, R = size * 0.3;
    var n = axisLabels.length;
    var step = 360 / n;
    var rings = [0.25, 0.5, 0.75, 1];
    var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" style="overflow:visible" role="img" aria-label="Gráfico de valoração do editor">';
    // grid rings
    rings.forEach(function (frac) {
      var pts = [];
      for (var i = 0; i < n; i++) { pts.push(radarPoint(cx, cy, R * frac, step * i).join(",")); }
      svg += '<polygon points="' + pts.join(" ") + '" fill="none" stroke="currentColor" stroke-opacity="' + (frac === 1 ? 0.28 : 0.14) + '" stroke-width="1"></polygon>';
    });
    // axis lines + labels
    for (var i = 0; i < n; i++) {
      var p = radarPoint(cx, cy, R, step * i);
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="currentColor" stroke-opacity="0.14" stroke-width="1"></line>';
      var lp = radarPoint(cx, cy, R + 14, step * i);
      var anchor = "middle";
      if (lp[0] < cx - 4) anchor = "end"; else if (lp[0] > cx + 4) anchor = "start";
      svg += '<text x="' + lp[0] + '" y="' + lp[1] + '" font-size="8.5" fill="currentColor" fill-opacity="0.65" text-anchor="' + anchor + '" dominant-baseline="middle">' + escHTML(axisLabels[i]) + '</text>';
    }
    // datasets
    datasets.forEach(function (ds) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var v = Math.max(0, Math.min(10, Number(ds.scores[i]) || 0));
        pts.push(radarPoint(cx, cy, R * (v / 10), step * i).join(","));
      }
      svg += '<polygon points="' + pts.join(" ") + '" fill="' + ds.color + '" fill-opacity="0.22" stroke="' + ds.color + '" stroke-width="2"></polygon>';
    });
    svg += "</svg>";
    return svg;
  }

  function scoreAxisLabels() {
    return (DB.scoreAxes || []).map(function (a) { return a.label; });
  }
  function scoresFor(produto) {
    return (DB.scoreAxes || []).map(function (a) { return produto[a.key]; });
  }

  function initRadarFicha() {
    $$("[data-radar-single]").forEach(function (el) {
      if (el.dataset.radarBound) return;
      el.dataset.radarBound = "1";
      var id = el.getAttribute("data-radar-single");
      var produto = byId(id);
      if (!produto) return;
      el.innerHTML = buildRadarSVG(scoreAxisLabels(), [{ scores: scoresFor(produto), color: "var(--accent, #1f7a5c)" }]);
      var svg = $("svg", el);
      if (svg) svg.style.color = "var(--accent)";
    });
  }

  /* ---------------- Comparator ---------------- */
  var CMP_KEY = "ec_comparador_ids";
  var COMPARE_FIELDS = [
    { key: "precoComDesconto", label: "Preço", better: "min", fmt: "price" },
    { key: "avaliacaoMedia", label: "Avaliação média", better: "max", fmt: "stars" },
    { key: "quantidadeVendida", label: "Vendas (aprox.)", better: "max", fmt: "vendidos" },
    { key: "categoria", label: "Categoria", better: null },
    { key: "tipoMotor", label: "Motor", better: null },
    { key: "potenciaW", label: "Potência", better: "max", unit: "W" },
    { key: "torqueNm", label: "Torque", better: "max", unit: "Nm" },
    { key: "autonomiaKm", label: "Autonomia", better: "max", unit: "km" },
    { key: "capacidadeBateriaWh", label: "Bateria", better: "max", unit: "Wh" },
    { key: "bateriaRemovivel", label: "Bateria removível", better: "bool" },
    { key: "velocidadeMaxKmh", label: "Velocidade máx.", better: "max", unit: "km/h" },
    { key: "tempoCargaH", label: "Tempo de carga", better: "min", unit: "h" },
    { key: "pesoBikeKg", label: "Peso", better: "min", unit: "kg" },
    { key: "numMarchas", label: "Marchas", better: "max" },
    { key: "aroPolegadas", label: "Aro", better: null, unit: '"' },
    { key: "freios", label: "Freios", better: null },
    { key: "suspensao", label: "Suspensão", better: null },
    { key: "garantiaAnos", label: "Garantia", better: "max", unit: " anos" }
  ];

  function readSelectedIds() {
    var hash = location.hash.replace(/^#/, "");
    var m = hash.match(/(?:^|&)ids=([^&]*)/);
    if (m && m[1]) return decodeURIComponent(m[1]).split(",").filter(Boolean);
    try {
      var stored = JSON.parse(localStorage.getItem(CMP_KEY) || "[]");
      if (Array.isArray(stored)) return stored;
    } catch (e) { /* ignore */ }
    return [];
  }
  function writeSelectedIds(ids) {
    try { localStorage.setItem(CMP_KEY, JSON.stringify(ids)); } catch (e) { /* ignore */ }
    var newHash = "ids=" + encodeURIComponent(ids.join(","));
    history.replaceState(null, "", "#" + newHash);
  }
  function addToComparador(id) {
    var ids = readSelectedIds();
    var max = BRAND.maxComparador || 4;
    if (ids.indexOf(id) === -1) {
      if (ids.length >= max) ids.shift();
      ids.push(id);
    }
    writeSelectedIds(ids);
    return ids;
  }

  function initAddToComparadorButtons() {
    $$("[data-add-comparador]").forEach(function (btn) {
      if (btn.dataset.cmpBound) return;
      btn.dataset.cmpBound = "1";
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-add-comparador");
        addToComparador(id);
        btn.textContent = "Adicionado ✓";
        setTimeout(function () {
          location.href = "comparador.html#ids=" + encodeURIComponent(readSelectedIds().join(","));
        }, 400);
      });
    });
  }

  function fmtCell(field, produto) {
    var v = produto[field.key];
    if (v == null || v === "") return "—";
    if (field.fmt === "price") return formatBRL(v);
    if (field.fmt === "stars") return "★ " + v.toFixed(1) + " (" + (produto.quantidadeAvaliacoes || 0) + ")";
    if (field.fmt === "vendidos") return "+" + v + " vendidos";
    if (field.better === "bool") return v ? "Sim" : "Não";
    if (field.unit) return v + field.unit;
    return String(v);
  }

  function renderComparador() {
    var root = $("[data-comparador]");
    if (!root) return;
    var ids = readSelectedIds().slice(0, BRAND.maxComparador || 4);
    var productos = ids.map(byId).filter(Boolean);

    renderComparadorSlots(root, ids, productos);

    var tableWrap = $("[data-comparador-table]", root);
    var emptyMsg = $("[data-comparador-empty]", root);
    var radarWrap = $("[data-comparador-radar]", root);

    if (productos.length < 2) {
      if (tableWrap) tableWrap.hidden = true;
      if (radarWrap) radarWrap.hidden = true;
      if (emptyMsg) emptyMsg.hidden = false;
      return;
    }
    if (emptyMsg) emptyMsg.hidden = true;
    if (tableWrap) {
      tableWrap.hidden = false;
      tableWrap.innerHTML = buildComparadorTableHTML(productos);
    }
    if (radarWrap) {
      radarWrap.hidden = false;
      var palette = ["#1f7a5c", "#b8860b", "#2d5fb0", "#a03a6b"];
      var datasets = productos.map(function (p, i) {
        return { scores: scoresFor(p), color: palette[i % palette.length], label: p.nome };
      });
      radarWrap.innerHTML = buildRadarSVG(scoreAxisLabels(), datasets) +
        '<ul class="radar-legend">' + productos.map(function (p, i) {
          return '<li><span class="dot" style="background:' + palette[i % palette.length] + '"></span>' + escHTML(p.nome) + "</li>";
        }).join("") + "</ul>";
      var svgEl = $("svg", radarWrap);
      if (svgEl) svgEl.style.color = "currentColor";
    }
  }

  function buildComparadorTableHTML(productos) {
    var head = '<table class="comparador-table spec-table"><thead><tr><th class="col-producto">Produto</th>' +
      productos.map(function (p) {
        return '<th><a href="' + escHTML(p.href || (p.id + ".html")) + '">' + escHTML(p.nome) + "</a></th>";
      }).join("") + "</tr></thead><tbody>";
    var buyRow = "<tr><th>Comprar</th>" + productos.map(function (p) {
      return '<td><a class="btn btn-primary btn-sm" href="' + escHTML(p.link_afiliado) + '" target="_blank" rel="sponsored nofollow noopener">Visualizar no Mercado Livre</a></td>';
    }).join("") + "</tr>";
    var rows = COMPARE_FIELDS.map(function (field) {
      var values = productos.map(function (p) { return p[field.key]; });
      var best = null;
      if (field.better === "max" || field.better === "min") {
        var nums = values.map(Number).filter(function (v) { return !isNaN(v); });
        if (nums.length) best = field.better === "max" ? Math.max.apply(null, nums) : Math.min.apply(null, nums);
      }
      var cells = productos.map(function (p) {
        var isBest = best !== null && Number(p[field.key]) === best;
        return '<td class="' + (isBest ? "is-best" : "") + '">' + escHTML(fmtCell(field, p)) + "</td>";
      }).join("");
      return "<tr><th>" + escHTML(field.label) + "</th>" + cells + "</tr>";
    }).join("");
    return head + buyRow + rows + "</tbody></table>";
  }

  function renderComparadorSlots(root, ids, productos) {
    var picker = $("[data-comparador-picker]", root);
    if (!picker) return;
    var max = BRAND.maxComparador || 4;
    var html = "";
    for (var i = 0; i < max; i++) {
      var p = productos[i];
      if (p) {
        html += '<div class="comparador-slot">' +
          '<button class="remove-badge" data-remove-slot="' + escHTML(p.id) + '" aria-label="Remover ' + escHTML(p.nome) + '">' + ICON.x + "</button>" +
          '<img src="' + escHTML((p.imagens && p.imagens[0]) || "") + '" alt="" loading="lazy">' +
          '<span class="slot-name">' + escHTML(p.nome) + "</span></div>";
      } else {
        html += '<div class="comparador-slot is-empty">Vazio</div>';
      }
    }
    picker.innerHTML = html;
    $$("[data-remove-slot]", picker).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-remove-slot");
        var newIds = readSelectedIds().filter(function (x) { return x !== id; });
        writeSelectedIds(newIds);
        renderComparador();
      });
    });
  }

  function initComparadorSearch() {
    var input = $("[data-comparador-search]");
    var results = $("[data-comparador-results]");
    if (!input || !results) return;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { results.innerHTML = ""; results.hidden = true; return; }
      var matches = DB.produtos.filter(function (p) { return p.nome.toLowerCase().indexOf(q) !== -1; }).slice(0, 6);
      if (!matches.length) { results.innerHTML = '<p class="small muted" style="padding:.6rem .8rem">Nenhum produto encontrado.</p>'; results.hidden = false; return; }
      results.innerHTML = matches.map(function (p) {
        return '<button type="button" data-pick="' + escHTML(p.id) + '"><img src="' + escHTML((p.imagens && p.imagens[0]) || "") + '" alt=""><span>' + escHTML(p.nome) + "</span></button>";
      }).join("");
      results.hidden = false;
      $$("[data-pick]", results).forEach(function (btn) {
        btn.addEventListener("click", function () {
          addToComparador(btn.getAttribute("data-pick"));
          input.value = "";
          results.hidden = true;
          renderComparador();
        });
      });
    });
    document.addEventListener("click", function (e) {
      if (!results.contains(e.target) && e.target !== input) results.hidden = true;
    });
  }

  /* ---------------- Sort on category / ofertas pages ---------------- */
  function initSort() {
    var select = $("[data-sort]");
    var grid = $("[data-grid]");
    if (!select || !grid) return;
    select.addEventListener("change", function () {
      var cards = $$(".product-card", grid).map(function (el) { return el.closest("[data-card]") || el; });
      var key = select.value;
      cards.sort(function (a, b) {
        var av = parseFloat(a.getAttribute("data-" + key)) || 0;
        var bv = parseFloat(b.getAttribute("data-" + key)) || 0;
        return key === "preco" || key === "peso" ? av - bv : bv - av;
      });
      cards.forEach(function (c) { grid.appendChild(c); });
    });
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    safe(initNavToggle, "initNavToggle");
    safe(initReveal, "initReveal");
    safe(initGallery, "initGallery");
    safe(initRadarFicha, "initRadarFicha");
    safe(initAddToComparadorButtons, "initAddToComparadorButtons");
    safe(renderComparador, "renderComparador");
    safe(initComparadorSearch, "initComparadorSearch");
    safe(initSort, "initSort");
    window.addEventListener("hashchange", function () { safe(renderComparador, "renderComparador"); });
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
