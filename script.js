(function () {
  "use strict";

  var data = (typeof UMKM_DATA !== "undefined") ? UMKM_DATA : [];

  /* ---------------- Nav toggle (mobile) ---------------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mainNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mainNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Active nav link on scroll ---------------- */
  var sections = Array.from(document.querySelectorAll("main section[id]"));
  var navLinks = Array.from(document.querySelectorAll("nav.main-nav a"));
  function updateActiveNav() {
    var scrollPos = window.scrollY + 120;
    var current = sections[0];
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) current = sec;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + current.id);
    });
  }
  window.addEventListener("scroll", updateActiveNav, { passive: true });

  /* ---------------- Animated counters ---------------- */
  function animateCounters() {
    document.querySelectorAll(".stat-num[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var current = 0;
      var step = Math.max(1, Math.ceil(target / 40));
      var suffix = el.textContent.includes("%") ? "" : "";
      var timer = setInterval(function () {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = current;
      }, 25);
    });
  }
  var signboard = document.querySelector(".signboard");
  if (signboard && "IntersectionObserver" in window) {
    var heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounters();
          heroObserver.disconnect();
        }
      });
    }, { threshold: 0.3 });
    heroObserver.observe(signboard);
  } else if (signboard) {
    animateCounters();
  }

  /* ---------------- Helpers ---------------- */
  function titleCase(str) {
    if (!str) return "";
    return str.toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function jenisList(jenisUsahaRaw) {
    return (jenisUsahaRaw || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function tagClass(jenis) {
    var j = jenis.toUpperCase();
    if (j.indexOf("KULINER") > -1) return "tag-kuliner";
    if (j.indexOf("PERDAGANGAN") > -1) return "tag-perdagangan";
    if (j.indexOf("KERAJINAN") > -1) return "tag-kerajinan";
    return "tag-jasa";
  }

  function lingkungan(alamat) {
    var m = (alamat || "").match(/Lingkungan\s*\d+/i);
    return m ? m[0] : "";
  }

  /* ---------------- Directory rendering ---------------- */
  var grid = document.getElementById("umkmGrid");
  var emptyState = document.getElementById("emptyState");
  var resultCount = document.getElementById("resultCount");
  var searchInput = document.getElementById("searchInput");
  var filterJenis = document.getElementById("filterJenis");
  var filterLegal = document.getElementById("filterLegal");

  function populateJenisFilter() {
    var set = new Set();
    data.forEach(function (d) { jenisList(d.jenis_usaha).forEach(function (j) { set.add(j); }); });
    Array.from(set).sort().forEach(function (j) {
      var opt = document.createElement("option");
      opt.value = j;
      opt.textContent = titleCase(j);
      filterJenis.appendChild(opt);
    });
  }

  function renderCard(d) {
    var card = document.createElement("article");
    card.className = "umkm-card";

    var jenisArr = jenisList(d.jenis_usaha);
    var primaryJenis = jenisArr[0] || "Lainnya";

    var top = document.createElement("div");
    top.className = "umkm-card-top";
    var titleWrap = document.createElement("div");
    var h3 = document.createElement("h3");
    h3.textContent = d.nama_usaha;
    var owner = document.createElement("div");
    owner.className = "owner";
    owner.textContent = titleCase(d.pemilik) + (d.gender ? " · " + titleCase(d.gender) : "");
    titleWrap.appendChild(h3);
    titleWrap.appendChild(owner);
    var tag = document.createElement("span");
    tag.className = "tag " + tagClass(primaryJenis);
    tag.textContent = titleCase(primaryJenis);
    top.appendChild(titleWrap);
    top.appendChild(tag);
    card.appendChild(top);

    var addr = document.createElement("p");
    addr.className = "addr";
    var ling = lingkungan(d.alamat);
    addr.textContent = ling ? ("Majjelling Wattang · " + ling) : "Majjelling Wattang";
    card.appendChild(addr);

    var metaRow = document.createElement("div");
    metaRow.className = "meta-row";

    if (d.tahun_berdiri && !isNaN(parseInt(d.tahun_berdiri, 10))) {
      var chipYear = document.createElement("span");
      chipYear.className = "chip";
      chipYear.textContent = "Berdiri " + d.tahun_berdiri;
      metaRow.appendChild(chipYear);
    }
    if (d.tenaga_kerja) {
      var chipTk = document.createElement("span");
      chipTk.className = "chip";
      chipTk.textContent = titleCase(d.tenaga_kerja);
      metaRow.appendChild(chipTk);
    }
    if (d.omzet) {
      var chipOm = document.createElement("span");
      chipOm.className = "chip";
      chipOm.textContent = d.omzet.replace(/Rp/g, "Rp ");
      metaRow.appendChild(chipOm);
    }
    var chipLegal = document.createElement("span");
    if (d.legalitas) {
      chipLegal.className = "chip legal";
      chipLegal.textContent = d.legalitas;
    } else {
      chipLegal.className = "chip nolegal";
      chipLegal.textContent = "Belum Berlegalitas";
    }
    metaRow.appendChild(chipLegal);

    card.appendChild(metaRow);
    return card;
  }

  function applyFilters() {
    var q = (searchInput.value || "").toLowerCase().trim();
    var jenisVal = filterJenis.value;
    var legalVal = filterLegal.value;

    var filtered = data.filter(function (d) {
      var matchesQ = !q ||
        d.nama_usaha.toLowerCase().indexOf(q) > -1 ||
        (d.pemilik || "").toLowerCase().indexOf(q) > -1;
      var matchesJenis = !jenisVal || jenisList(d.jenis_usaha).indexOf(jenisVal) > -1;
      var matchesLegal = !legalVal ||
        (legalVal === "ada" ? !!d.legalitas : !d.legalitas);
      return matchesQ && matchesJenis && matchesLegal;
    });

    grid.innerHTML = "";
    filtered.forEach(function (d) { grid.appendChild(renderCard(d)); });
    resultCount.textContent = filtered.length + " usaha ditemukan";
    emptyState.hidden = filtered.length !== 0;
  }

  if (grid) {
    populateJenisFilter();
    applyFilters();
    searchInput.addEventListener("input", applyFilters);
    filterJenis.addEventListener("change", applyFilters);
    filterLegal.addEventListener("change", applyFilters);
  }

  /* ---------------- Statistics charts (built with plain DOM, no libs) ---------------- */
  var PALETTE = ["#C9A227", "#A6472F", "#4F7C8C", "#2F4A37", "#8a6b12", "#6d8a76"];

  function countBy(list, keyFn) {
    var map = {};
    list.forEach(function (item) {
      var keys = keyFn(item);
      (Array.isArray(keys) ? keys : [keys]).forEach(function (k) {
        if (!k) return;
        map[k] = (map[k] || 0) + 1;
      });
    });
    return map;
  }

  function renderBarChart(container, map, total) {
    var entries = Object.entries(map).sort(function (a, b) { return b[1] - a[1]; });
    container.innerHTML = "";
    entries.forEach(function (entry, i) {
      var label = entry[0], count = entry[1];
      var pct = Math.round((count / total) * 100);
      var row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML =
        '<span class="label">' + titleCase(label) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:0%"></span></span>' +
        '<span class="val">' + count + '</span>';
      container.appendChild(row);
      setTimeout(function () {
        row.querySelector(".bar-fill").style.width = pct + "%";
      }, 60 + i * 60);
    });
  }

  function renderDonut(container, map, total) {
    var entries = Object.entries(map).sort(function (a, b) { return b[1] - a[1]; });
    var r = 52, cx = 60, cy = 60, circumference = 2 * Math.PI * r;
    var offset = 0;
    var svgParts = [];
    entries.forEach(function (entry, i) {
      var count = entry[1];
      var frac = count / total;
      var len = frac * circumference;
      svgParts.push(
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + PALETTE[i % PALETTE.length] +
        '" stroke-width="18" stroke-dasharray="' + len + ' ' + (circumference - len) +
        '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"></circle>'
      );
      offset += len;
    });
    var svg = '<svg width="140" height="140" viewBox="0 0 120 120">' + svgParts.join("") +
      '<circle cx="60" cy="60" r="34" fill="var(--white)"></circle>' +
      '<text x="60" y="56" text-anchor="middle" font-family="IBM Plex Mono" font-size="18" font-weight="600" fill="#1E2A22">' + total + '</text>' +
      '<text x="60" y="72" text-anchor="middle" font-family="Plus Jakarta Sans" font-size="9" fill="#4b5a4f">usaha</text>' +
      '</svg>';

    var legend = '<ul class="donut-legend">' + entries.map(function (entry, i) {
      var pct = Math.round((entry[1] / total) * 100);
      return '<li><span class="dot" style="background:' + PALETTE[i % PALETTE.length] + '"></span>' +
        titleCase(entry[0]) + ' — ' + entry[1] + ' (' + pct + '%)</li>';
    }).join("") + '</ul>';

    container.innerHTML = svg + legend;
  }

  if (data.length) {
    var total = data.length;

    var jenisMap = countBy(data, function (d) { return jenisList(d.jenis_usaha); });
    renderBarChart(document.getElementById("chartJenis"), jenisMap, total);

    var genderMap = countBy(data, function (d) { return d.gender; });
    renderDonut(document.getElementById("chartGender"), genderMap, total);

    var omzetOrder = ["<Rp1.000.000", "Rp1.000.000-5.000.000", "Rp5.000.000-Rp10.000.000", ">Rp10.000.000"];
    var omzetMap = countBy(data, function (d) { return d.omzet; });
    var orderedOmzet = {};
    omzetOrder.forEach(function (k) { if (omzetMap[k]) orderedOmzet[k] = omzetMap[k]; });
    Object.keys(omzetMap).forEach(function (k) { if (!(k in orderedOmzet)) orderedOmzet[k] = omzetMap[k]; });
    var omzetContainer = document.getElementById("chartOmzet");
    omzetContainer.innerHTML = "";
    Object.entries(orderedOmzet).forEach(function (entry, i) {
      var pct = Math.round((entry[1] / total) * 100);
      var row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML =
        '<span class="label">' + entry[0].replace("Rp", "Rp ") + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:0%"></span></span>' +
        '<span class="val">' + entry[1] + '</span>';
      omzetContainer.appendChild(row);
      setTimeout(function () {
        row.querySelector(".bar-fill").style.width = pct + "%";
      }, 60 + i * 60);
    });

    var mediaMap = countBy(data, function (d) {
      return (d.media_digital || "").split(",").map(function (s) { return s.trim(); });
    });
    renderBarChart(document.getElementById("chartMedia"), mediaMap, total);
  }

  /* ---------------- Reveal charts when scrolled into view ---------------- */
})();
