(function () {
  "use strict";

  var data = (typeof UMKM_DATA !== "undefined") ? UMKM_DATA : [];
  var profile = (typeof KELURAHAN_PROFILE !== "undefined") ? KELURAHAN_PROFILE : null;

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

  /* ---------------- Angka signboard hero: dihitung otomatis dari data.js ---------------- */
  function fillHeroStatCounts() {
    if (!data.length) return;
    var total = data.length;

    var kategoriSet = new Set();
    data.forEach(function (d) { if (d.kategori) kategoriSet.add(d.kategori); });

    var perempuanCount = data.filter(function (d) {
      return (d.gender || "").toLowerCase() === "perempuan";
    }).length;
    var perempuanPct = Math.round((perempuanCount / total) * 100);

    var legalCount = data.filter(function (d) {
      return d.legalitas_status && d.legalitas_status !== "belum";
    }).length;

    var mapping = {
      statUmkmCount: total,
      statKategoriCount: kategoriSet.size,
      statPerempuanPct: perempuanPct,
      statLegalCount: legalCount
    };
    Object.keys(mapping).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("data-count", mapping[id]);
    });
  }
  fillHeroStatCounts();

  /* ---------------- Animated counters ---------------- */
  function animateCounters() {
    document.querySelectorAll(".stat-num[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var current = 0;
      var step = Math.max(1, Math.ceil(target / 40));
      var timer = setInterval(function () {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = current.toLocaleString("id-ID");
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
    return String(str).toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function esc(str) {
    var d = document.createElement("div");
    d.textContent = str == null ? "" : String(str);
    return d.innerHTML;
  }
  function tagClass(kategori) {
    var j = (kategori || "").toUpperCase();
    if (j.indexOf("KULINER") > -1) return "tag-kuliner";
    if (j.indexOf("PERDAGANGAN") > -1) return "tag-perdagangan";
    if (j.indexOf("KERAJINAN") > -1) return "tag-kerajinan";
    return "tag-jasa";
  }

  /* ================================================================
     PROFIL KELURAHAN
     ================================================================ */
  if (profile) {
    // Batas wilayah
    var compassGrid = document.getElementById("compassGrid");
    if (compassGrid) {
      compassGrid.innerHTML = profile.batasWilayah.map(function (b) {
        return '<div class="compass-item"><div class="dir">' + esc(b.arah) + '</div><div class="place">' + esc(b.wilayah) + '</div></div>';
      }).join("");
    }

    // Kependudukan
    var popGrid = document.getElementById("popGrid");
    if (popGrid) {
      var pop = profile.kependudukan;
      var popItems = [
        [pop.totalJiwa, "Total Jiwa"],
        [pop.lakiLaki, "Laki-laki"],
        [pop.perempuan, "Perempuan"],
        [pop.jumlahKK, "Kepala Keluarga"]
      ];
      popGrid.innerHTML = popItems.map(function (p) {
        return '<div class="pop-item"><div class="n">' + p[0].toLocaleString("id-ID") + '</div><div class="l">' + p[1] + '</div></div>';
      }).join("");
    }

    // Sarana & prasarana
    var saranaGroups = document.getElementById("saranaGroups");
    if (saranaGroups) {
      var groupTitles = { pendidikan: "Pendidikan", kesehatan: "Kesehatan", keagamaan: "Keagamaan" };
      saranaGroups.innerHTML = Object.keys(profile.sarana).map(function (key) {
        var rows = profile.sarana[key].map(function (item) {
          return '<div class="sarana-row"><span>' + esc(item.label) + '</span><span class="n">' + item.jumlah + '</span></div>';
        }).join("");
        return '<div class="sarana-group"><h4>' + groupTitles[key] + '</h4>' + rows + '</div>';
      }).join("");
    }

    // Visi & misi
    var visiText = document.getElementById("visiText");
    if (visiText) visiText.textContent = "\u201C" + profile.visi + "\u201D";
    var misiList = document.getElementById("misiList");
    if (misiList) {
      misiList.innerHTML = profile.misi.map(function (m, i) {
        return '<li><span class="idx">' + String(i + 1).padStart(2, "0") + '</span><span>' + esc(m) + '</span></li>';
      }).join("");
    }

    // Struktur organisasi — mengikuti pola garis papan struktur asli:
    // Lurah di tengah atas; cabang kiri (garis putus-putus) ke Unsur Pendukung;
    // cabang kanan (garis penuh) ke Sekretaris + staff; garis bawah ke 3 Kasi;
    // Kepala Lingkungan I & II di bawah Kasi tengah (Pemberdayaan Masyarakat).
    var orgWrap = document.getElementById("orgWrap");
    if (orgWrap) {
      var s = profile.struktur;

      function orgCard(person, opts) {
        opts = opts || {};
        var cls = "org-card" + (opts.top ? " top" : "") + (opts.small ? " small" : "");
        var idBadge = person.nip ? '<div class="nip">NIP. ' + esc(person.nip) + '</div>' : (person.nrp ? '<div class="nip">NRP. ' + esc(person.nrp) + '</div>' : "");
        return '<div class="' + cls + '"><div class="jabatan">' + esc(person.jabatan || opts.jabatan || "") + '</div><div class="nama">' + esc(person.nama) + '</div>' + idBadge + '</div>';
      }

      var html = "";

      /* Baris 1: Unsur pendukung (kiri) —garis putus-putus— Lurah —garis penuh— Sekretariat (kanan) */
      html += '<div class="org-top">';

      html += '<div class="org-stack org-side">';
      s.unsurPendukung.forEach(function (u) {
        html += orgCard(u, { small: true });
      });
      html += '</div>';

      html += '<div class="org-line dashed"></div>';
      html += '<div class="org-lurah-box">' + orgCard(s.lurah, { top: true, jabatan: "Lurah" }) + '</div>';
      html += '<div class="org-line solid"></div>';

      html += '<div class="org-stack org-side">';
      html += orgCard(s.sekretaris, { jabatan: "Sekretaris Lurah" });
      s.sekretaris.staff.forEach(function (st) {
        html += orgCard(st, { jabatan: "Staff", small: true });
      });
      html += '</div>';

      html += '</div>'; // .org-top

      /* Garis turun dari Lurah ke jajaran Kasi */
      html += '<div class="org-drop"></div>';

      /* Baris 2: 3 Kasi + staff, garis horizontal penghubung */
      html += '<div class="org-branch">';
      s.kasi.forEach(function (k, i) {
        html += '<div class="org-col">' + orgCard(k);
        k.staff.forEach(function (st) {
          html += '<div class="org-staff">' + orgCard(st, { jabatan: "Staff", small: true }) + '</div>';
        });
        if (i === 1) {
          /* Kasi tengah (Pemberdayaan Masyarakat) diteruskan ke Kepala Lingkungan I & II */
          html += '<div class="org-connector-down"></div>';
          html += '<div class="ling-row">';
          s.kepalaLingkungan.forEach(function (l) {
            html += orgCard(l, { small: true });
          });
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';

      orgWrap.innerHTML = html;
    }
  }

  /* ================================================================
     DIREKTORI UMKM
     ================================================================ */
  var grid = document.getElementById("umkmGrid");
  var emptyState = document.getElementById("emptyState");
  var resultCount = document.getElementById("resultCount");
  var searchInput = document.getElementById("searchInput");
  var filterJenis = document.getElementById("filterJenis");
  var filterLingkungan = document.getElementById("filterLingkungan");
  var filterLegal = document.getElementById("filterLegal");

  function populateJenisFilter() {
    var set = new Set();
    data.forEach(function (d) { if (d.kategori) set.add(d.kategori); });
    Array.from(set).sort().forEach(function (j) {
      var opt = document.createElement("option");
      opt.value = j;
      opt.textContent = j;
      filterJenis.appendChild(opt);
    });
  }

  function populateLingkunganFilter() {
    var set = new Set();
    data.forEach(function (d) { if (d.lingkungan) set.add(d.lingkungan); });
    Array.from(set).sort().forEach(function (l) {
      var opt = document.createElement("option");
      opt.value = l;
      opt.textContent = l;
      filterLingkungan.appendChild(opt);
    });
  }

  function legalLabel(status) {
    if (status === "lengkap") return "Legalitas Lengkap";
    if (status === "sebagian") return "Legalitas Sebagian";
    return "Belum Berlegalitas";
  }
  function legalChipClass(status) {
    if (status === "lengkap") return "chip legal";
    if (status === "sebagian") return "chip legal";
    return "chip nolegal";
  }

  function renderCard(d, idx) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "umkm-card";
    card.setAttribute("data-idx", idx);

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
    tag.className = "tag " + tagClass(d.kategori);
    tag.textContent = d.kategori || "Lainnya";
    top.appendChild(titleWrap);
    top.appendChild(tag);
    card.appendChild(top);

    var addr = document.createElement("p");
    addr.className = "addr";
    addr.textContent = (d.produk ? d.produk : "Majjelling Wattang") + (d.lingkungan ? " · " + d.lingkungan : "");
    card.appendChild(addr);

    var metaRow = document.createElement("div");
    metaRow.className = "meta-row";
    if (d.tahun_berdiri_num) {
      var chipYear = document.createElement("span");
      chipYear.className = "chip";
      chipYear.textContent = "Berdiri " + d.tahun_berdiri_num;
      metaRow.appendChild(chipYear);
    }
    if (d.omzet_display) {
      var chipOm = document.createElement("span");
      chipOm.className = "chip";
      chipOm.textContent = d.omzet_display;
      metaRow.appendChild(chipOm);
    }
    var chipLegal = document.createElement("span");
    chipLegal.className = legalChipClass(d.legalitas_status);
    chipLegal.textContent = legalLabel(d.legalitas_status);
    metaRow.appendChild(chipLegal);
    card.appendChild(metaRow);

    var viewMore = document.createElement("span");
    viewMore.className = "view-more";
    viewMore.innerHTML = 'Lihat profil lengkap <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
    card.appendChild(viewMore);

    card.addEventListener("click", function () { openModal(d); });
    return card;
  }

  function applyFilters() {
    var q = (searchInput.value || "").toLowerCase().trim();
    var jenisVal = filterJenis.value;
    var lingkunganVal = filterLingkungan.value;
    var legalVal = filterLegal.value;

    var filtered = data.filter(function (d) {
      var matchesQ = !q ||
        d.nama_usaha.toLowerCase().indexOf(q) > -1 ||
        (d.pemilik || "").toLowerCase().indexOf(q) > -1 ||
        (d.produk || "").toLowerCase().indexOf(q) > -1;
      var matchesJenis = !jenisVal || d.kategori === jenisVal;
      var matchesLingkungan = !lingkunganVal || d.lingkungan === lingkunganVal;
      var matchesLegal = !legalVal || d.legalitas_status === legalVal;
      return matchesQ && matchesJenis && matchesLingkungan && matchesLegal;
    });

    grid.innerHTML = "";
    filtered.forEach(function (d) {
      var realIdx = data.indexOf(d);
      grid.appendChild(renderCard(d, realIdx));
    });
    resultCount.textContent = filtered.length + " usaha ditemukan";
    emptyState.hidden = filtered.length !== 0;
  }

  if (grid) {
    populateJenisFilter();
    populateLingkunganFilter();
    applyFilters();
    searchInput.addEventListener("input", applyFilters);
    filterJenis.addEventListener("change", applyFilters);
    filterLingkungan.addEventListener("change", applyFilters);
    filterLegal.addEventListener("change", applyFilters);
  }

  /* ---------------- Modal detail UMKM ---------------- */
  var modalOverlay = document.getElementById("modalOverlay");
  var modalHeaderEl = document.querySelector(".modal-header");
  var modalClose = document.getElementById("modalClose");
  var modalTag = document.getElementById("modalTag");
  var modalTitle = document.getElementById("modalTitle");
  var modalOwner = document.getElementById("modalOwner");

  var modalBody = document.getElementById("modalBody");
  var lastFocused = null;

  var ALL_LEGAL_KEYS = ["NIB", "NPWP", "PIRT", "Sertifikat Halal", "Merek Dagang"];

  function openModal(d) {
    lastFocused = document.activeElement;
    modalTag.className = "tag " + tagClass(d.kategori);
    modalTag.textContent = d.kategori || "Lainnya";
    modalTitle.textContent = d.nama_usaha;
    modalOwner.textContent = titleCase(d.pemilik) + (d.gender ? " · " + titleCase(d.gender) : "");
    if (d.foto) {
      modalHeaderEl.classList.add("has-photo");
      modalHeaderEl.style.setProperty("--modal-photo", "url('" + d.foto + "')");
    } else {
      modalHeaderEl.classList.remove("has-photo");
      modalHeaderEl.style.removeProperty("--modal-photo");
    }

    var have = d.legalitas_dimiliki || [];
    var badges = ALL_LEGAL_KEYS.map(function (key) {
      var owned = have.indexOf(key) > -1;
      return '<span class="legal-badge ' + (owned ? "yes" : "no") + '">' + (owned ? "✓" : "✕") + " " + key + "</span>";
    }).join("");

    var mapsBtn = d.maps_url
      ? '<a class="maps-link" href="' + esc(d.maps_url) + '" target="_blank" rel="noopener">📍 Lihat di Google Maps</a>'
      : '<p style="color:#7a8579;">Titik lokasi belum tercantum.</p>';

    modalBody.innerHTML =
      '<div class="modal-section">' +
        '<h4>Profil Usaha</h4>' +
        '<div class="modal-facts">' +
          '<div class="modal-fact"><div class="k">Jenis Usaha</div><div class="v">' + esc(d.jenis_usaha) + '</div></div>' +
          '<div class="modal-fact"><div class="k">Produk / Menu</div><div class="v">' + esc(d.produk) + '</div></div>' +
          '<div class="modal-fact"><div class="k">Tahun Berdiri</div><div class="v">' + esc(d.tahun_berdiri) + '</div></div>' +
          '<div class="modal-fact"><div class="k">Tenaga Kerja</div><div class="v">' + esc(titleCase(d.tenaga_kerja)) + '</div></div>' +
          '<div class="modal-fact"><div class="k">Omzet / Bulan</div><div class="v">' + esc(d.omzet_display) + '</div></div>' +
          '<div class="modal-fact"><div class="k">Lingkungan</div><div class="v">' + esc(d.lingkungan || "-") + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-section">' +
        '<h4>Alamat &amp; Lokasi</h4>' +
        '<p>' + esc(d.alamat) + '</p>' +
        '<div style="margin-top:10px;">' + mapsBtn + '</div>' +
      '</div>' +
      '<div class="modal-section">' +
        '<h4>Legalitas Usaha</h4>' +
        '<div class="legal-badges">' + badges + '</div>' +
      '</div>' +
      '<div class="modal-section">' +
        '<h4>Pemasaran</h4>' +
        '<p>' + esc(d.pemasaran_narasi) + '</p>' +
      '</div>' +
      '<div class="modal-section">' +
        '<h4>Kondisi &amp; Pengembangan Usaha</h4>' +
        '<p>' + esc(d.kondisi_narasi) + '</p>' +
      '</div>';

    modalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  if (modalOverlay) {
    modalClose.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalOverlay.classList.contains("open")) closeModal();
    });
  }

  /* ================================================================
     STATISTIK (grafik DOM/SVG, tanpa library eksternal)
     ================================================================ */
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

 /* ---------------- Tooltip chart (mengikuti kursor saat hover) ---------------- */
  var chartTooltip = document.createElement("div");
  chartTooltip.className = "chart-tooltip";
  document.body.appendChild(chartTooltip);

  function showTooltip(html, evt) {
    chartTooltip.innerHTML = html;
    chartTooltip.classList.add("show");
    positionTooltip(evt);
  }
  function positionTooltip(evt) {
    var pad = 14;
    var x = evt.clientX + pad;
    var y = evt.clientY + pad;
    var rect = chartTooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) x = evt.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = evt.clientY - rect.height - pad;
    chartTooltip.style.left = x + "px";
    chartTooltip.style.top = y + "px";
  }
  function hideTooltip() {
    chartTooltip.classList.remove("show");
  }

  function renderBarChart(container, map, total, orderKeys) {
    var entries = orderKeys
      ? orderKeys.filter(function (k) { return map[k]; }).map(function (k) { return [k, map[k]]; })
      : Object.keys(map).map(function (k) { return [k, map[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    container.innerHTML = "";
    entries.forEach(function (entry) {
      var label = entry[0], count = entry[1];
      var pctExact = Math.round((count / total) * 1000) / 10;
      var pct = Math.max(3, Math.round((count / total) * 100));
      var row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML =
        '<span class="label">' + esc(label) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="val">' + count + '</span>';
      var tipHtml = '<strong>' + esc(label) + '</strong><br>' + count + ' usaha &middot; ' + pctExact + '% dari total';
      row.addEventListener("mouseenter", function (e) {
        row.classList.add("bar-row-hover");
        showTooltip(tipHtml, e);
      });
      row.addEventListener("mousemove", positionTooltip);
      row.addEventListener("mouseleave", function () {
        row.classList.remove("bar-row-hover");
        hideTooltip();
      });
      container.appendChild(row);
    });
  }

  function renderDonut(container, map, total) {
    var entries = Object.keys(map).map(function (k) { return [k, map[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    var r = 60, cx = 70, cy = 70, circumference = 2 * Math.PI * r;
    var offset = 0;
    var svgParts = [];
    entries.forEach(function (entry, i) {
      var count = entry[1];
      var frac = count / total;
      var len = frac * circumference;
      svgParts.push(
        '<circle class="donut-seg" data-idx="' + i + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + PALETTE[i % PALETTE.length] +
        '" stroke-width="20" stroke-dasharray="' + len + ' ' + (circumference - len) +
        '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')" style="cursor:pointer; transition: stroke-width 0.15s;"></circle>'
      );
      offset += len;
    });
    var svg = '<div class="donut-svg-box"><svg width="140" height="140" viewBox="0 0 140 140" style="width:140px;height:140px;display:block;">' + svgParts.join("") +
      '<circle cx="70" cy="70" r="42" fill="var(--white)"></circle>' +
      '<text x="70" y="66" text-anchor="middle" font-family="IBM Plex Mono" font-size="20" font-weight="600" fill="#1E2A22">' + total + '</text>' +
      '<text x="70" y="84" text-anchor="middle" font-family="Plus Jakarta Sans" font-size="10" fill="#4b5a4f">usaha</text>' +
      '</svg></div>';

    var legend = '<ul class="donut-legend">' + entries.map(function (entry, i) {
      var pct = Math.round((entry[1] / total) * 100);
      return '<li data-idx="' + i + '"><span class="dot" style="background:' + PALETTE[i % PALETTE.length] + '"></span>' +
        esc(entry[0]) + ' — ' + entry[1] + ' (' + pct + '%)</li>';
    }).join("") + '</ul>';

    container.innerHTML = svg + legend;

    function bindHover(idx) {
      var seg = container.querySelector('.donut-seg[data-idx="' + idx + '"]');
      var legendItem = container.querySelector('.donut-legend li[data-idx="' + idx + '"]');
      var label = entries[idx][0], count = entries[idx][1];
      var pctExact = Math.round((count / total) * 1000) / 10;
      var tipHtml = '<strong>' + esc(label) + '</strong><br>' + count + ' usaha &middot; ' + pctExact + '% dari total';
      [seg, legendItem].forEach(function (el) {
        if (!el) return;
        el.addEventListener("mouseenter", function (e) {
          if (seg) seg.setAttribute("stroke-width", "24");
          if (legendItem) legendItem.classList.add("legend-hover");
          showTooltip(tipHtml, e);
        });
        el.addEventListener("mousemove", positionTooltip);
        el.addEventListener("mouseleave", function () {
          if (seg) seg.setAttribute("stroke-width", "20");
          if (legendItem) legendItem.classList.remove("legend-hover");
          hideTooltip();
        });
      });
    }
    entries.forEach(function (entry, i) { bindHover(i); });
  }

  if (data.length) {
    var total = data.length;

    var kategoriMap = countBy(data, function (d) { return d.kategori; });
    var chartJenisEl = document.getElementById("chartJenis");
    if (chartJenisEl) renderBarChart(chartJenisEl, kategoriMap, total);

    var genderMap = countBy(data, function (d) { return d.gender; });
    var chartGenderEl = document.getElementById("chartGender");
    if (chartGenderEl) renderDonut(chartGenderEl, genderMap, total);

    var omzetOrder = ["< Rp1.000.000", "Rp1.000.000 – Rp5.000.000", "Rp5.000.000 – Rp10.000.000", "> Rp10.000.000"];
    var omzetMap = countBy(data, function (d) { return d.omzet_kategori; });
    var chartOmzetEl = document.getElementById("chartOmzet");
    if (chartOmzetEl) renderBarChart(chartOmzetEl, omzetMap, total, omzetOrder);

    var legalMap = countBy(data, function (d) { return legalLabel(d.legalitas_status); });
    var chartLegalEl = document.getElementById("chartLegal");
    if (chartLegalEl) renderDonut(chartLegalEl, legalMap, total);
  }

/* ---------------- Galeri: carousel geser kiri/kanan ---------------- */
  var galTrack = document.getElementById("galTrack");
  var galPrev = document.getElementById("galPrev");
  var galNext = document.getElementById("galNext");
  if (galTrack && galPrev && galNext) {
    var galItems = Array.prototype.slice.call(galTrack.querySelectorAll(".carousel-item"));
    var galActiveIdx = 0;
    var galIsProgrammatic = false;
    var galProgrammaticTimer = null;

    /* Index aktif disimpan sebagai status tersendiri (bukan dihitung ulang dari
       posisi scroll setiap saat) -- supaya tombol panah selalu bergerak PERSIS
       1 foto per klik, termasuk saat berada di dekat foto pertama/terakhir. */
    function setGalActive(idx) {
      galActiveIdx = Math.max(0, Math.min(galItems.length - 1, idx));
      galItems.forEach(function (item, i) { item.classList.toggle("active", i === galActiveIdx); });
    }

    function goToGalIndex(idx) {
      idx = Math.max(0, Math.min(galItems.length - 1, idx));
      setGalActive(idx);
      galIsProgrammatic = true;
      galItems[idx].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      clearTimeout(galProgrammaticTimer);
      galProgrammaticTimer = setTimeout(function () { galIsProgrammatic = false; }, 600);
    }

    galNext.addEventListener("click", function () { goToGalIndex(galActiveIdx + 1); });
    galPrev.addEventListener("click", function () { goToGalIndex(galActiveIdx - 1); });

    /* Saat foto digeser manual (drag/trackpad/wheel, bukan lewat tombol),
       tandai foto yang paling banyak terlihat sebagai foto aktif. Diabaikan
       selama animasi tombol berlangsung supaya tidak saling menimpa. */
    galIsProgrammatic = true;
    if ("IntersectionObserver" in window) {
      var galObserver = new IntersectionObserver(function (entries) {
        if (galIsProgrammatic) return;
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            var idx = galItems.indexOf(entry.target);
            if (idx > -1) setGalActive(idx);
          }
        });
      }, { root: galTrack, threshold: [0.6] });
      galItems.forEach(function (item) { galObserver.observe(item); });
    }

    setGalActive(0);
    clearTimeout(galProgrammaticTimer);
    galProgrammaticTimer = setTimeout(function () { galIsProgrammatic = false; }, 400);
  }
})();
