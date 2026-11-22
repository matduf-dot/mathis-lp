/* Ville de Clichy-la-Garenne · maquette d'intention · scripts sans dépendance */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var norm = function (s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " "); };
  var ICON = {
    arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>',
    ext: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9"/></svg>'
  };

  /* ---------- Toast ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-soon]");
    if (a) { e.preventDefault(); toast(a.getAttribute("data-soon") || "Cette page n'est pas incluse dans la maquette d'intention."); }
  });

  /* ---------- Habillages (CCTP 1.7) ---------- */
  var root = document.documentElement;
  function setSkin(s) {
    if (s && s !== "clichy") root.setAttribute("data-skin", s); else root.removeAttribute("data-skin");
    $$("[data-skin-btn]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-skin-btn") === (s || "clichy"))); });
    store.set("clichy-skin", s || "clichy");
  }
  $$("[data-skin-btn]").forEach(function (b) {
    b.addEventListener("click", function () {
      var s = b.getAttribute("data-skin-btn"); setSkin(s);
      var msg = { clichy: "Habillage Clichy", rose: "Habillage temporaire « Octobre rose » : couleurs seules, aucun développement", charte: "Simulation de la charte 2027 : couleurs, typographie et formes changent, le site reste le même", contraste: "Mode contraste renforcé : texte agrandi, liens soulignés, contrastes AAA" }[s];
      toast(msg);
    });
  });
  setSkin(store.get("clichy-skin") || "clichy");

  /* ---------- Infos flash ---------- */
  var fl = $(".flash__close");
  if (fl) fl.addEventListener("click", function () { var f = fl.closest(".flash"); f.style.display = "none"; });

  /* ---------- Méga-menu ---------- */
  var MENU = {
    demarches: { t: "Démarches", d: "Tout ce que vous pouvez faire en ligne ou sur rendez-vous, classé par situation de vie.", c: [
      ["Papiers et citoyenneté", [["Carte d'identité et passeport", "demarche.html"], ["Actes d'état civil", "#"], ["Mariage et PACS", "#"], ["Recensement citoyen", "#"], ["Listes électorales", "#"]]],
      ["Logement et urbanisme", [["Permis de construire", "#"], ["Déclaration préalable", "#"], ["Stationnement résident", "#"], ["Occupation du domaine public", "#"]]],
      ["Rendez-vous et contacts", [["Prendre rendez-vous", "#"], ["Écrire au maire", "#"], ["Signaler un problème", "#"], ["Réserver une salle municipale", "#"]]]
    ] },
    famille: { t: "Famille et école", d: "De la crèche au collège : inscriptions, restauration, activités et accompagnement.", c: [
      ["Petite enfance", [["Trouver une place en crèche", "#"], ["Relais petite enfance", "#"], ["Carte des crèches", "#"]]],
      ["École", [["Inscriptions scolaires 2027/2028", "#"], ["Carte scolaire", "index.html#pres-de-chez-moi"], ["Restauration et périscolaire", "#"], ["Portail Clichy Famille", "#"]]],
      ["Jeunesse et seniors", [["Activités pour les 11-17 ans", "#"], ["Vie étudiante", "#"], ["Pôle seniors", "#"], ["CCAS", "#"]]]
    ] },
    vivre: { t: "Vivre à Clichy", d: "Le quotidien près de chez vous : propreté, déplacements, travaux, santé, solidarité.", c: [
      ["Au quotidien", [["Déchets et collectes", "#"], ["Encombrants", "#"], ["Stationnement et circulation", "#"], ["Calendrier des travaux", "#"]]],
      ["Cadre de vie", [["Parcs et jardins", "#"], ["Vie des quartiers", "#"], ["Environnement", "#"], ["Risques majeurs", "#"]]],
      ["Santé et solidarité", [["Santé", "#"], ["Handicap et accessibilité", "#"], ["Pôle social", "#"], ["Logement", "#"]]]
    ] },
    sortir: { t: "Sortir", d: "Agenda, culture, sport et patrimoine : ce qui se passe à Clichy cette semaine.", c: [
      ["Agenda", [["Ce week-end", "#"], ["Saison culturelle 2026/2027", "#"], ["Expositions", "#"], ["Gratuit", "#"]]],
      ["Lieux", [["Piscine municipale", "#"], ["Médiathèque", "#"], ["Pavillon Vendôme", "#"], ["Cinéma", "#"]]],
      ["Sport et loisirs", [["Équipements sportifs", "#"], ["Associations", "#"], ["Tourisme à Clichy", "#"]]]
    ] },
    mairie: { t: "La mairie", d: "Vos élus, le conseil municipal, les décisions et les projets de la Ville.", c: [
      ["Institution", [["Le maire et les élus", "#"], ["Conseil municipal", "#"], ["Actes et délibérations", "#"], ["Budget", "#"]]],
      ["Projets", [["Grands projets", "#grands-projets"], ["Je participe", "#"], ["Clichy 3D", "#"]]],
      ["La Ville vous informe", [["Marchés publics", "#"], ["La mairie recrute", "#"], ["Clichy Actus", "#kiosque"], ["Horaires et accès", "#"]]]
    ] }
  };
  var mega = $(".mega"), openKey = null;
  function renderMega(k) {
    var m = MENU[k]; if (!m || !mega) return;
    var cols = m.c.map(function (c) {
      return '<div><h3 class="label">' + c[0] + '</h3><ul>' + c[1].map(function (l) {
        var soon = l[1] === "#" ? ' data-soon' : '';
        return '<li><a href="' + l[1] + '"' + soon + '>' + l[0] + '</a></li>';
      }).join("") + '</ul></div>';
    }).join("");
    mega.innerHTML = '<div class="wrap"><div class="mega__intro"><h2>' + m.t + '</h2><p>' + m.d + '</p></div><div class="mega__cols">' + cols + '</div></div>';
  }
  function renderMegaAll() {
    if (!mega) return;
    var chev = '<svg viewBox="0 0 10 10" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 3l4 4 4-4"/></svg>';
    var html = Object.keys(MENU).map(function (k, n) {
      var m = MENU[k];
      var links = m.c.map(function (c) { return c[1].map(function (l) { return '<li><a href="' + l[1] + '"' + (l[1] === "#" ? " data-soon" : "") + '>' + l[0] + '</a></li>'; }).join(""); }).join("");
      return '<div class="m-acc"><button type="button" class="m-acc__btn" aria-expanded="false" aria-controls="macc-' + n + '">' + m.t + chev + '</button><ul id="macc-' + n + '" hidden>' + links + '</ul></div>';
    }).join("");
    mega.innerHTML = '<div class="wrap m-panel">' + html +
      '<div class="m-extra"><a class="btn btn--solid" href="#" data-soon="Connexion à votre espace">Mon espace<i><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="5.5" r="3"/><path d="M2.5 14c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5"/></svg></i></a>' +
      '<div class="m-lang" role="group" aria-label="Langue"><button type="button" aria-pressed="true">Français</button><button type="button" aria-pressed="false" class="lang">English</button></div>' +
      '<p class="m-tel">Hôtel de ville · <b>01 47 15 30 00</b></p></div></div>';
    $$(".m-acc__btn", mega).forEach(function (b) {
      b.addEventListener("click", function () {
        var ul = document.getElementById(b.getAttribute("aria-controls")), open = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!open)); ul.hidden = open;
      });
    });
    $$(".lang", mega).forEach(function (b) { b.addEventListener("click", function () { toast("Version anglaise : traduction automatique de type DeepL, relue et ajustable page par page (CCTP 1.10)"); }); });
    var head = $(".head"); mega.style.maxHeight = Math.max(240, window.innerHeight - head.getBoundingClientRect().bottom) + "px";
  }
  function closeMega() { if (!mega) return; mega.classList.remove("open"); openKey = null; $$(".nav > button, .burger").forEach(function (b) { b.setAttribute("aria-expanded", "false"); }); }
  $$(".nav > button").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-menu");
      if (openKey === k) { closeMega(); return; }
      closeMega(); renderMega(k); mega.classList.add("open"); openKey = k; b.setAttribute("aria-expanded", "true");
    });
  });
  var burger = $(".burger");
  if (burger) burger.addEventListener("click", function () {
    if (openKey === "all") { closeMega(); return; }
    closeMega(); renderMegaAll(); mega.classList.add("open"); openKey = "all"; burger.setAttribute("aria-expanded", "true");
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeMega(); closeNote(); } });
  document.addEventListener("click", function (e) { if (openKey && !e.target.closest(".head")) closeMega(); });

  /* ---------- Langue (CCTP 1.10) ---------- */
  $$(".lang").forEach(function (b) { b.addEventListener("click", function () { toast("Version anglaise : traduction automatique de type DeepL, relue et ajustable page par page (CCTP 1.10)"); }); });

  /* ---------- Recherche (CCTP 4.1) ---------- */
  var INDEX = [
    ["Carte d'identité et passeport", "demarche", "demarche.html", "Sur rendez-vous · pré-demande ANTS", "cni papiers identite passeport titre"],
    ["Encombrants : prendre rendez-vous", "demarche", "#", "Collecte gratuite à domicile", "encombrant meuble dechet monstre collecte"],
    ["Inscription à l'école maternelle 2027/2028", "demarche", "#", "Inscriptions ouvertes", "inscription ecole scolaire maternelle enfant rentree"],
    ["Carte scolaire : mon école de secteur", "service", "index.html#pres-de-chez-moi", "Recherche par adresse", "carte scolaire secteur ecole college creche"],
    ["Piscine municipale", "lieu", "#", "Horaires, tarifs, bassins", "piscine nager natation bassin horaires"],
    ["Stationnement résident", "demarche", "#", "Carte résident et tarifs", "stationnement parking voiture residant carte"],
    ["Signaler un problème dans l'espace public", "demarche", "#", "Via l'application Thelma", "signaler probleme voirie proprete depot sauvage nid poule"],
    ["Acte de naissance", "demarche", "#", "Demande en ligne", "acte naissance etat civil extrait"],
    ["Mariage et PACS", "demarche", "#", "Dossier et rendez-vous", "mariage pacs union"],
    ["Inscription sur les listes électorales", "demarche", "#", "En ligne ou en mairie", "liste electorale vote voter election"],
    ["Recensement citoyen", "demarche", "#", "À 16 ans", "recensement jdc 16 ans"],
    ["Permis de construire et déclaration préalable", "demarche", "#", "Guichet urbanisme en ligne", "permis construire urbanisme travaux declaration prealable"],
    ["Réserver une salle municipale", "demarche", "#", "Associations et particuliers", "salle reservation location association"],
    ["Prendre rendez-vous en mairie", "demarche", "#", "État civil, Clichy Famille", "rdv rendez vous mairie"],
    ["Calendrier des collectes", "service", "#", "Ordures, tri, verre, encombrants", "dechet poubelle collecte tri verre ordures"],
    ["Calendrier des travaux", "service", "#", "Rues et chantiers en cours", "travaux chantier rue route ferme"],
    ["Hôtel de ville", "lieu", "#", "80 boulevard Jean-Jaurès", "mairie hotel de ville adresse horaires"],
    ["Médiathèque", "lieu", "#", "Horaires et catalogue", "mediatheque bibliotheque livre"],
    ["Pavillon Vendôme", "lieu", "#", "Expositions", "pavillon vendome musee exposition patrimoine"],
    ["Parc des Impressionnistes", "lieu", "#", "Horaires et accès", "parc jardin impressionnistes chien"],
    ["Écoles maternelles : les inscriptions 2027/2028 sont ouvertes", "actu", "#", "Enfance", "ecole inscription maternelle"],
    ["Le Parc des Impressionnistes bientôt accessible aux chiens tenus en laisse", "actu", "#", "Espaces verts", "chien parc impressionnistes"],
    ["Le jeu de piste du CCJ distingué à trois reprises", "actu", "#", "Jeunesse", "ccj jeunesse jeu de piste"],
    ["Concert de la Sainte-Cécile", "event", "#", "Dimanche 22 novembre · complet", "concert sainte cecile musique"],
    ["Aux frontières de l'imaginaire", "event", "#", "Pavillon Vendôme · jusqu'au 9 janvier", "exposition imaginaire pavillon vendome"],
    ["Personne chante", "event", "#", "Galerie Vendôme · jusqu'au 16 janvier", "exposition galerie vendome personne chante"],
    ["C.A.P.S Festival", "event", "#", "Jusqu'au 12 décembre", "caps festival"],
    ["Écrire au maire", "demarche", "#", "Formulaire en ligne", "maire ecrire courrier contact"],
    ["Trouver une place en crèche", "demarche", "#", "Commission d'attribution", "creche bebe petite enfance garde"],
    ["Clichy Famille : mon espace", "service", "#", "Cantine, périscolaire, factures", "cantine facture periscolaire famille portail"]
  ];
  var TYPE = { demarche: ["Démarche", "tag--demarche"], service: ["Service", ""], lieu: ["Lieu", ""], actu: ["Actualité", ""], event: ["Événement", "tag--event"] };
  function search(q) {
    var n = norm(q).trim(); if (n.length < 2) return [];
    var words = n.split(/\s+/);
    return INDEX.map(function (it) {
      var hay = norm(it[0] + " " + it[4]); var score = 0;
      words.forEach(function (w) { if (hay.indexOf(w) > -1) score += (norm(it[0]).indexOf(w) > -1 ? 3 : 1); else if (w.length > 3 && hay.indexOf(w.slice(0, -1)) > -1) score += 1; });
      if (score && it[1] === "demarche") score += .5;
      return [score, it];
    }).filter(function (x) { return x[0] > 0; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 6).map(function (x) { return x[1]; });
  }
  function hl(text, q) {
    var t = text, words = norm(q).trim().split(/\s+/).filter(function (w) { return w.length > 1; });
    var nt = norm(t); var marks = [];
    words.forEach(function (w) { var i = nt.indexOf(w); if (i > -1) marks.push([i, i + w.length]); });
    marks.sort(function (a, b) { return b[0] - a[0]; });
    marks.forEach(function (m) { t = t.slice(0, m[0]) + "<mark>" + t.slice(m[0], m[1]) + "</mark>" + t.slice(m[1]); });
    return t;
  }
  $$("[data-search]").forEach(function (box) {
    var input = $("input", box), list = $(".suggest", box), active = -1;
    function render() {
      var q = input.value, res = search(q);
      if (!q || q.trim().length < 2) { list.classList.remove("open"); input.setAttribute("aria-expanded", "false"); return; }
      active = -1;
      list.innerHTML = (res.length ? res.map(function (it, i) {
        var tp = TYPE[it[1]];
        return '<a href="' + it[2] + '"' + (it[2] === "#" ? " data-soon" : "") + ' role="option" id="sg-' + i + '"><span class="tag ' + tp[1] + '">' + tp[0] + '</span><span>' + hl(it[0], q) + '<br><small>' + it[3] + '</small></span><span class="arrow">' + ICON.arrow.replace('<svg', '<svg width="16" height="16"') + '</span></a>';
      }).join("") : '<p style="padding:12px 14px;margin:0">Aucun résultat pour « ' + q.replace(/</g, "") + ' ». Essayez « passeport », « piscine » ou « encombrants ».</p>') +
        '<div class="suggest__foot">' + res.length + ' résultat' + (res.length > 1 ? "s" : "") + ' · Entrée pour tout afficher</div>';
      list.classList.add("open"); input.setAttribute("aria-expanded", "true");
    }
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", function (e) {
      var items = $$("a", list); if (!items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items.forEach(function (a, i) { a.classList.toggle("is-active", i === active); });
        input.setAttribute("aria-activedescendant", items[active].id);
      } else if (e.key === "Enter") { e.preventDefault(); (items[active > -1 ? active : 0]).click(); }
    });
    var form = box.closest("form"); if (form) form.addEventListener("submit", function (e) { e.preventDefault(); var a = $("a", list); if (a) a.click(); else render(); });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) list.classList.remove("open"); });
  });
  $$("[data-fill]").forEach(function (c) {
    c.addEventListener("click", function () {
      var input = $("#q"); if (!input) return; input.value = c.getAttribute("data-fill"); input.focus(); input.dispatchEvent(new Event("input"));
    });
  });

  /* ---------- Je suis / Je veux (CCTP 4.2) ---------- */
  var PROFILES = {
    "habitant": [["refaire mes papiers", "demarche.html", "Fiche démarche · rendez-vous en ligne"], ["jeter un encombrant", "#", "Collecte gratuite sur rendez-vous"], ["signaler un problème", "#", "Signalement géolocalisé"], ["aller à la piscine", "#", "Horaires du jour"]],
    "parent": [["inscrire mon enfant à l'école", "#", "Inscriptions 2027/2028 · école de secteur"], ["trouver une crèche", "#", "Dossier et commission"], ["payer la cantine", "#", "Portail Clichy Famille"], ["occuper les vacances", "#", "Accueils de loisirs"]],
    "nouvel arrivant": [["connaître mes collectes", "index.html#pres-de-chez-moi", "Jours de collecte par adresse"], ["voter à Clichy", "#", "Inscription en ligne en 5 minutes"], ["garer ma voiture", "#", "Carte de stationnement résident"], ["découvrir mon quartier", "index.html#pres-de-chez-moi", "Équipements et conseil de quartier"]],
    "senior": [["être accompagné", "#", "Pôle seniors et CCAS"], ["trouver une activité", "#", "Clubs et ateliers près de chez vous"], ["être appelé en cas de canicule", "#", "Registre canicule et grand froid"]],
    "commerçant": [["installer une terrasse", "#", "Occupation du domaine public"], ["poser une enseigne", "#", "Autorisation préalable"], ["répondre à un marché", "#", "Plateforme Maximilien"]],
    "association": [["réserver une salle", "#", "Demande en ligne"], ["demander une subvention", "#", "Calendrier et dossier"], ["annoncer un événement", "#", "Proposer à l'agenda"]],
    "en situation de handicap": [["trouver les lieux accessibles", "#", "Carte des équipements"], ["parler au référent handicap", "#", "Rendez-vous ou téléphone"], ["me déplacer", "#", "Transport adapté"]],
    "visiteur": [["sortir ce week-end", "#agenda", "Agenda filtré"], ["voir une exposition", "#agenda", "Pavillon et Galerie Vendôme"], ["venir à Clichy", "#", "Métro, RER, tramway"]]
  };
  var who = $("#who"), want = $("#want"), goBtn = $("#go"), res = $("#go-result"), bform = $(".builder-form");
  var openSlot = null;
  function closeSlots() { $$(".slot__list.open").forEach(function (l) { l.classList.remove("open"); }); $$(".slot__btn").forEach(function (b) { b.setAttribute("aria-expanded", "false"); }); openSlot = null; }
  function enhance(sel) {
    sel.classList.add("enhanced"); sel.setAttribute("tabindex", "-1"); sel.setAttribute("aria-hidden", "true");
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "slot__btn"; btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", (sel.id === "who" ? "Je suis : " : "Je veux : ") + "choisir");
    sel.parentNode.appendChild(btn);
    var list = document.createElement("ul"); list.className = "slot__list"; list.setAttribute("role", "listbox"); list.id = sel.id + "-list"; bform.appendChild(list);
    btn.setAttribute("aria-controls", list.id);
    var idx = -1;
    function sync() { btn.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : ""; }
    function build() {
      list.innerHTML = Array.prototype.map.call(sel.options, function (o, i) { return '<li role="option" data-i="' + i + '" aria-selected="' + (i === sel.selectedIndex) + '">' + o.text + '</li>'; }).join("");
      $$("li", list).forEach(function (li) { li.addEventListener("click", function () { choose(+li.getAttribute("data-i")); }); });
    }
    function choose(i) { sel.selectedIndex = i; sync(); closeSlots(); btn.focus(); sel.dispatchEvent(new Event("change")); }
    function open() {
      closeSlots(); build(); list.classList.add("open"); btn.setAttribute("aria-expanded", "true"); openSlot = list; idx = sel.selectedIndex;
      var r = btn.getClientRects(), last = r[r.length - 1], fr = bform.getBoundingClientRect();
      list.style.top = (last.bottom - fr.top + 10) + "px";
      list.style.left = Math.max(0, Math.min(last.left - fr.left, fr.width - list.offsetWidth)) + "px";
      mark();
    }
    function mark() { $$("li", list).forEach(function (li, i) { li.classList.toggle("is-active", i === idx); }); }
    btn.addEventListener("click", function (e) { e.stopPropagation(); if (openSlot === list) closeSlots(); else open(); });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (openSlot !== list) { open(); return; } idx = (idx + (e.key === "ArrowDown" ? 1 : -1) + sel.options.length) % sel.options.length; mark(); }
      else if ((e.key === "Enter" || e.key === " ") && openSlot === list) { e.preventDefault(); choose(idx); }
      else if (e.key === "Escape") closeSlots();
    });
    sel.addEventListener("change", sync); sel._sync = sync; sync();
    return btn;
  }
  function fillWant() {
    if (!who || !want) return;
    var list = PROFILES[who.value] || [];
    want.innerHTML = list.map(function (x, i) { return '<option value="' + i + '">' + x[0] + '</option>'; }).join("");
    if (want._sync) want._sync();
    updateGo();
  }
  function updateGo() {
    if (!who || !want) return;
    var it = (PROFILES[who.value] || [])[+want.value]; if (!it) return;
    goBtn.setAttribute("href", it[1]);
    if (it[1] === "#") goBtn.setAttribute("data-soon", ""); else goBtn.removeAttribute("data-soon");
    res.innerHTML = "<b>" + it[2] + "</b> · en 1 clic";
  }
  if (who && want && bform) {
    fillWant(); enhance(who); enhance(want);
    who.addEventListener("change", fillWant); want.addEventListener("change", updateGo);
    document.addEventListener("click", function (e) { if (openSlot && !e.target.closest(".slot__list")) closeSlots(); });
  }

  /* ---------- Date et état du jour ---------- */
  var now = new Date();
  var jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var dstr = jours[now.getDay()] + " " + now.getDate() + " " + mois[now.getMonth()];
  $$("[data-today]").forEach(function (el) { el.textContent = dstr.charAt(0).toUpperCase() + dstr.slice(1); });
  var h = now.getHours() + now.getMinutes() / 60, d = now.getDay();
  var mairieOpen = (d >= 1 && d <= 5 && h >= 8.5 && h < 17.5) || (d === 6 && h >= 9 && h < 12);
  var m = $("#st-mairie");
  function mairieText() {
    if (!m) return;
    var court = window.innerWidth < 420;
    m.className = "state" + (mairieOpen ? "" : " state--off");
    if (mairieOpen) m.textContent = (court ? "Ouverte, " : "Ouverte jusqu'à ") + (d === 6 ? "12h" : "17h30");
    else if (d === 6 || d === 0 || (d === 5 && h >= 17.5)) m.textContent = court ? "Fermée · lundi 8h30" : "Fermée · rouvre lundi 8h30";
    else if (h < 8.5) m.textContent = "Ouvre à 8h30";
    else m.textContent = court ? "Fermée · demain 8h30" : "Fermée · rouvre demain 8h30";
  }
  mairieText(); window.addEventListener("resize", mairieText);
  var hello = $("#hello"); if (hello) hello.textContent = h < 18 && h >= 5 ? "Bonjour" : "Bonsoir";

  /* ---------- Près de chez moi (CCTP 4.17, 4.16, 4.10) ---------- */
  var STREETS = {
    "80 boulevard Jean-Jaurès": "centre", "Boulevard Jean-Jaurès": "centre", "Rue Martre": "centre", "Rue de Paris": "sud",
    "Boulevard Victor-Hugo": "nord", "Rue Henri-Barbusse": "nord", "Quai de Clichy": "berges", "Rue du Landy": "berges",
    "Rue de Villeneuve": "centre", "Boulevard du Général-Leclerc": "sud", "Rue Pierre-Bérégovoy": "berges"
  };
  var SECTORS = {
    centre: { mat: "Maternelle du Centre", elem: "Élémentaire du Centre", col: "Collège de secteur 1", creche: "Multi-accueil du Centre", om: "Lundi, mercredi, vendredi", tri: "Mardi", verre: "1er et 3e jeudis", enc: "Sur rendez-vous", trav: [["Réfection de chaussée", "jusqu'au 4 décembre", "à 120 m"], ["Raccordement fibre", "26 et 27 novembre", "à 300 m"]], q: "Centre-ville", cq: "Conseil de quartier le 3 décembre, 19h" },
    nord: { mat: "Maternelle Nord", elem: "Élémentaire Nord", col: "Collège de secteur 2", creche: "Multi-accueil Nord", om: "Lundi, jeudi, samedi", tri: "Mercredi", verre: "2e et 4e mardis", enc: "Sur rendez-vous", trav: [["Plantation d'arbres", "du 1er au 12 décembre", "à 80 m"]], q: "Nord", cq: "Conseil de quartier le 9 décembre, 19h" },
    sud: { mat: "Maternelle Sud", elem: "Élémentaire Sud", col: "Collège de secteur 1", creche: "Multi-accueil Sud", om: "Mardi, jeudi, samedi", tri: "Vendredi", verre: "1er et 3e lundis", enc: "Sur rendez-vous", trav: [["Mise aux normes d'un passage piéton", "jusqu'au 28 novembre", "à 200 m"], ["Élagage", "le 2 décembre", "à 450 m"]], q: "Sud, porte de Clichy", cq: "Conseil de quartier le 10 décembre, 19h" },
    berges: { mat: "Maternelle des Berges", elem: "Élémentaire des Berges", col: "Collège de secteur 3", creche: "Multi-accueil Berges de Seine", om: "Lundi, mercredi, vendredi", tri: "Jeudi", verre: "2e et 4e mercredis", enc: "Sur rendez-vous", trav: [["Aménagement de la promenade", "jusqu'en février 2027", "à 60 m"]], q: "Berges de Seine", cq: "Conseil de quartier le 2 décembre, 19h" }
  };
  var aIn = $("#addr"), aList = $("#addr-list"), out = $("#near-out"), aIdx = -1;
  function icon(n) {
    return {
      school: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M1 6l7-4 7 4-7 4-7-4zM4 8v4c2 1.5 6 1.5 8 0V8"/></svg>',
      bin: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 4h12M6 4V2h4v2M3.5 4l1 10h7l1-10"/></svg>',
      cone: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 2h4l3 11H3L6 2zM2 14h12M5 7h6"/></svg>',
      home: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 7l6-5 6 5v7H2V7zM6 14v-4h4v4"/></svg>'
    }[n];
  }
  function showNear(street) {
    var s = SECTORS[STREETS[street]]; if (!s || !out) return;
    out.innerHTML =
      '<article class="panel fade"><span class="label"><i>' + icon("school") + '</i>Carte scolaire</span><h3>' + s.mat + '<br>' + s.elem + '</h3><p>Collège : ' + s.col + '<br>Crèche la plus proche : ' + s.creche + '</p><a class="panel__link" href="#" data-soon>Inscrire mon enfant <span class="arrow"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span></a></article>' +
      '<article class="panel fade"><span class="label"><i>' + icon("bin") + '</i>Collectes</span><ul><li><span>Ordures ménagères</span><b>' + s.om + '</b></li><li><span>Emballages</span><b>' + s.tri + '</b></li><li><span>Verre</span><b>' + s.verre + '</b></li><li><span>Encombrants</span><b>' + s.enc + '</b></li></ul></article>' +
      '<article class="panel fade"><span class="label"><i>' + icon("cone") + '</i>Travaux à proximité</span><ul>' + s.trav.map(function (t) { return '<li><span>' + t[0] + '<br><small class="muted">' + t[1] + '</small></span><b>' + t[2] + '</b></li>'; }).join("") + '</ul><a class="panel__link" href="#" data-soon>Calendrier des travaux <span class="arrow"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span></a></article>' +
      '<article class="panel fade"><span class="label"><i>' + icon("home") + '</i>Mon quartier</span><h3>' + s.q + '</h3><p>' + s.cq + '</p><a class="panel__link" href="#" data-soon>Vie du quartier <span class="arrow"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span></a></article>';
    var t = $("#near-for"); if (t) t.textContent = street;
    out.scrollLeft = 0; out.dispatchEvent(new Event("scroll"));
  }
  function renderAddr() {
    var q = norm(aIn.value).trim(); aIdx = -1;
    var res = Object.keys(STREETS).filter(function (s) { return !q || norm(s).indexOf(q) > -1; }).slice(0, 6);
    aList.innerHTML = res.map(function (s) { return '<button type="button" role="option">' + s + ', 92110 Clichy</button>'; }).join("") || '<p style="padding:10px 14px;margin:0">Adresse inconnue de la démonstration. Essayez « rue Martre ».</p>';
    aList.classList.add("open");
    $$("button", aList).forEach(function (b, i) { b.addEventListener("click", function () { var st = res[i]; aIn.value = st + ", 92110 Clichy"; aList.classList.remove("open"); showNear(st); }); });
  }
  if (aIn) {
    aIn.addEventListener("input", renderAddr); aIn.addEventListener("focus", renderAddr);
    aIn.addEventListener("keydown", function (e) {
      var items = $$("button", aList); if (!items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); aIdx = (aIdx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach(function (b, i) { b.classList.toggle("is-active", i === aIdx); }); }
      else if (e.key === "Enter") { e.preventDefault(); items[aIdx > -1 ? aIdx : 0].click(); }
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".addr")) aList.classList.remove("open"); });
    showNear("80 boulevard Jean-Jaurès");
  }

  /* ---------- Filtres agenda ---------- */
  $$(".filters .chip").forEach(function (c) {
    c.addEventListener("click", function () {
      $$(".filters .chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); c.setAttribute("aria-pressed", "true");
      var f = c.getAttribute("data-f");
      $$(".event").forEach(function (ev) { var tags = ev.getAttribute("data-tags") || ""; ev.style.display = (f === "all" || tags.indexOf(f) > -1) ? "" : "none"; });
    });
  });

  /* ---------- Fiche démarche : pièces, créneaux, avis ---------- */
  var checks = $$(".check input");
  function upd() { var n = checks.filter(function (c) { return c.checked; }).length; var b = $(".progress .bar i"); if (b) b.style.width = (n / checks.length * 100) + "%"; var t = $("#check-count"); if (t) t.textContent = n + " / " + checks.length + " pièces prêtes"; }
  checks.forEach(function (c) { c.addEventListener("change", upd); }); if (checks.length) upd();
  $$(".slots button").forEach(function (b) { b.addEventListener("click", function () { $$(".slots button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); var l = $("#rdv-label"); if (l) l.textContent = "Réserver le " + b.getAttribute("data-slot"); }); });
  $$("[data-helpful]").forEach(function (b) { b.addEventListener("click", function () { var box = b.closest(".helpful"); box.innerHTML = b.getAttribute("data-helpful") === "oui" ? "<b>Merci. Votre avis est transmis au service État civil.</b>" : "<b>Merci. Qu'est-ce qui vous a manqué ? Votre réponse est transmise au service État civil, qui met la fiche à jour.</b>"; }); });

  /* ---------- Poids réel de la page (CCTP 2.6) ---------- */
  function weigh() {
    var el = $("#page-weight"); if (!el || !window.performance || !performance.getEntriesByType) return;
    var total = 0;
    performance.getEntriesByType("navigation").concat(performance.getEntriesByType("resource")).forEach(function (r) { total += r.transferSize || r.encodedBodySize || 0; });
    if (total > 0) el.textContent = (total / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " Ko";
  }
  window.addEventListener("load", function () { setTimeout(weigh, 300); });


  /* ---------- Mobile : carrousels (playbook §6) ---------- */
  $$(".m-nav").forEach(function (nav) {
    var st = $(nav.getAttribute("data-for")); if (!st) return;
    var dots = $$(".m-dots i", nav), btns = $$(".m-btn", nav);
    function cards() { return Array.prototype.filter.call(st.children, function (c) { return c.nodeType === 1; }); }
    function pas() { var c = cards(); return c.length > 1 ? c[1].offsetLeft - c[0].offsetLeft : st.clientWidth; }
    function idx() { return Math.round(st.scrollLeft / pas()); }
    function maj() {
      var n = cards().length, i = Math.min(n - 1, idx());
      dots.forEach(function (dd, k) { dd.classList.toggle("on", k === i); });
      btns[0].disabled = st.scrollLeft <= 4; btns[1].disabled = st.scrollLeft + st.clientWidth >= st.scrollWidth - 4;
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { var i = Math.max(0, Math.min(cards().length - 1, idx() + (+b.getAttribute("data-dir")))); st.scrollTo({ left: i * pas(), behavior: "smooth" }); }); });
    st.addEventListener("scroll", function () { requestAnimationFrame(maj); }, { passive: true });
    window.addEventListener("resize", maj); setTimeout(maj, 50);
  });

  /* ---------- Mobile : dépliants ---------- */
  $$(".fold-btn").forEach(function (b) {
    var box = $(b.getAttribute("data-fold")); if (!box) return;
    b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", function () {
      var open = box.classList.toggle("open"); b.classList.toggle("open", open); b.setAttribute("aria-expanded", String(open));
      $("span", b).textContent = open ? b.getAttribute("data-less") : b.getAttribute("data-more");
    });
  });

  /* ---------- Mobile : texte d'aide raccourci ---------- */
  var qi = $("#q");
  function ph() { if (qi) qi.placeholder = window.innerWidth < 380 ? "Passeport, piscine…" : window.innerWidth < 640 ? "Passeport, piscine, encombrants…" : "Ou cherchez : passeport, piscine, encombrants…"; }
  ph(); window.addEventListener("resize", ph);

  /* ---------- Lecture du cahier des charges ---------- */
  var NOTES = {
    skin: ["CCTP 1.7", "Habillages interchangeables", "Le graphisme est séparé du socle technique : la nouvelle charte prévue au premier semestre 2027 s'appliquera sans redéveloppement, comme un habillage temporaire du type « octobre rose ». Essayez les boutons de la barre noire.", ""],
    flash: ["CCTP 4.3", "Infos flash", "Bandeau prioritaire avec date de début et d'expiration : il disparaît tout seul, sans intervention du service communication.", ""],
    nav: ["CCTP 1.3.4 · 1.9", "Un menu par besoins, plus par services", "Cinq entrées partent des situations de vie des habitants, avec un méga-menu sur toute la largeur (pas de simple liste déroulante, CCTP 1.8).", "L'audit décrit une arborescence « construite par sédimentation et calquée sur l'organisation interne des services »."],
    builder: ["CCTP 4.2", "« Je suis / Je veux »", "Chaque profil propose ses intentions, chaque intention mène directement à la bonne page. Les profils sont ceux du CCTP : habitants, familles, nouveaux arrivants, seniors, commerçants, associations, personnes en situation de handicap, visiteurs.", "104 répondants à l'enquête de mars 2026 demandent une navigation par profil."],
    search: ["CCTP 4.1", "Une recherche qui trouve", "Suggestions dès la deuxième lettre, résultats typés (démarche, lieu, actualité, événement), synonymes et fautes tolérés. Tapez « cni » ou « poubelle ».", "166 répondants attendent un moteur plus performant ; 70 ont déjà abandonné une recherche sur le site actuel."],
    popular: ["Audit 2025", "Les plus consultés en premier", "Les raccourcis reprennent le top 5 de l'audit d'audience : événements et actualités, piscine, état civil, déchets, stationnement.", ""],
    today: ["CCTP 1.3.3", "Aujourd'hui à Clichy", "L'état de la mairie, de la piscine, des collectes et de l'agenda se calcule à partir des horaires saisis une fois dans le CMS : l'information est toujours juste.", "L'audit décrit des usages « utilitaires, courts et orientés actions »."],
    top: ["Enquête 2026", "Deux clics maximum", "Les démarches les plus demandées sont à un clic de l'accueil, toutes les autres à deux. Le mode (en ligne, sur rendez-vous) s'affiche avant de cliquer.", "163 répondants trouvent qu'il faut trop de clics pour trouver l'information."],
    near: ["CCTP 4.17 · 4.16 · 4.10", "Près de chez moi", "Une adresse suffit : école de secteur et crèche (même module, CCTP 4.17), collectes, travaux à proximité, conseil de quartier. La sectorisation est importée depuis le fichier des rues de la Ville et reste modifiable par les agents.", ""],
    news: ["CCTP 1.3.3 · 4.4 · 4.5", "Trois niveaux de visibilité", "À la une, secondaire, brève : le niveau se choisit dans le CMS et la page d'accueil se compose seule. Une actualité sans photo garde un visuel soigné.", "Le recueil des besoins relève que « tous les contenus sont traités avec le même niveau de visibilité »."],
    agenda: ["CCTP 4.6 · 2.2", "Agenda filtrable et exportable", "Filtres par période, public et gratuité. Chaque événement s'exporte (iCal) et alimente l'application Clichy Ma Ville par flux JSON, XML, CSV et RSS.", ""],
    projects: ["CCTP 4.7", "Grands projets suivis", "Chaque projet affiche sa phase réelle, mise à jour depuis le CMS, avec ses documents et ses rendez-vous de concertation.", ""],
    discover: ["CCTP 1.3.3", "Les visiteurs aussi", "Une entrée « découverte » pour le patrimoine et la culture, distincte des services du quotidien, avec un lien vers l'Office de tourisme.", "Le site doit parler « aux habitants dans une logique de services et aux visiteurs dans une logique de découverte »."],
    kiosk: ["CCTP 4.11 · RGAA", "Kiosque", "Format et poids affichés avant chaque téléchargement, liseuse accessible, archives filtrables.", ""],
    eco: ["CCTP 1.3.4", "Un seul parcours, plusieurs espaces", "Chaque espace connexe annonce où l'on va et avec quel compte avant de quitter le site.", "Le CCTP rappelle que les ruptures de navigation entre ces environnements pénalisent l'expérience des usagers."],
    weight: ["CCTP 2.6 · RGESN", "Poids réel de la page", "Une seule police variable auto-hébergée, images WebP aux tailles utiles, aucun script tiers au chargement. Le chiffre est mesuré en direct par le navigateur.", ""],
    crumbs: ["CCTP 1.8", "Fil d'Ariane", "Chaque niveau est cliquable pour se repérer et remonter.", ""],
    verified: ["Enquête 2026 · CCTP 1.3.4", "Date de vérification visible", "Chaque fiche affiche sa date de vérification et son service responsable. Le CMS relance le service quand une fiche n'a pas été revue depuis six mois.", "116 répondants ont rencontré des informations obsolètes."],
    brief: ["CCTP 3.3.2", "L'essentiel avant le détail", "Où, combien, quel délai, pour qui : la réponse tient en quatre cases avant toute lecture.", "La Ville note que les usagers comprennent les contenus une fois qu'ils les ont trouvés."],
    steps: ["CCTP 3.3.5", "Des étapes, pas un pavé", "Le parcours est découpé en étapes datées, avec le bon lien à chaque étape (ANTS, rendez-vous).", ""],
    checklist: ["CCTP 3.3.5", "Arriver au guichet complet", "La liste des pièces se coche : moins de rendez-vous perdus pour un document manquant.", ""],
    rdv: ["CCTP 5.1", "Rendez-vous Synbird dans la page", "Les prochains créneaux s'affichent dans la fiche ; la réservation se termine dans Synbird. Sur mobile, une barre fixe garde le bouton à portée de pouce.", ""],
    faq: ["CCTP 4.15 · 6.9.3", "FAQ balisée pour Google et les IA", "Le balisage FAQPage (JSON-LD) est généré automatiquement depuis le CMS : réponses éligibles aux extraits enrichis et reprises par les moteurs génératifs (AEO, GEO).", ""],
    helpful: ["CCTP 1.3.5", "Mesurer la réussite des parcours", "Les réponses « non » arrivent au service avec le motif : la fiche s'améliore à partir de vrais retours.", ""],
    side: ["CCTP 4.14", "Colonne contextuelle", "Contact du service, documents avec format et poids, contenus liés par tags : saisis une fois, affichés partout où ils servent.", ""],
    author: ["CCTP 2.1 · E-E-A-T", "Auteur et entité éditoriale", "Chaque contenu est rattaché à un service et à la Ville (balisage Organization) : un gage de fiabilité pour les lecteurs et pour les moteurs.", ""]
  };
  var noteEl = document.createElement("div"); noteEl.className = "note"; noteEl.setAttribute("role", "dialog"); noteEl.setAttribute("aria-modal", "false"); document.body.appendChild(noteEl);
  function closeNote() { noteEl.classList.remove("open"); }
  var pins = $$("[data-cctp]");
  pins.forEach(function (el, i) {
    var k = el.getAttribute("data-cctp"), n = NOTES[k]; if (!n) return;
    var p = document.createElement("button"); p.type = "button"; p.className = "pin"; p.textContent = i + 1;
    p.setAttribute("aria-label", "Réponse au cahier des charges " + (i + 1) + " : " + n[1]);
    var pos = (el.getAttribute("data-pin") || "-10,-10").split(",");
    p.style.top = pos[0] + "px"; p.style.left = pos[1] + "px";
    el.appendChild(p);
    p.addEventListener("click", function (e) {
      e.stopPropagation();
      noteEl.innerHTML = '<button class="note__close" type="button" aria-label="Fermer">✕</button><span class="ref">' + n[0] + '</span><h4>' + (i + 1) + ". " + n[1] + '</h4><p>' + n[2] + '</p>' + (n[3] ? '<p class="fact">' + n[3] + '</p>' : "");
      $(".note__close", noteEl).addEventListener("click", closeNote);
      noteEl.classList.add("open");
      var r = p.getBoundingClientRect(), w = noteEl.offsetWidth, hgt = noteEl.offsetHeight;
      var left = Math.min(Math.max(16, r.left), window.innerWidth - w - 16), top = r.bottom + 10;
      if (top + hgt > window.innerHeight - 16) top = Math.max(16, r.top - hgt - 10);
      noteEl.style.left = left + "px"; noteEl.style.top = top + "px";
    });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".note") && !e.target.closest(".pin")) closeNote(); });
  window.addEventListener("scroll", closeNote, { passive: true });
  var tg = $(".toggle-cctp");
  if (tg) {
    $(".count", tg).textContent = pins.length;
    function setC(on) { document.body.classList.toggle("cctp-on", on); tg.setAttribute("aria-pressed", String(on)); if (!on) closeNote(); }
    tg.addEventListener("click", function () { var on = tg.getAttribute("aria-pressed") !== "true"; setC(on); if (on) toast(pins.length + " réponses au cahier des charges : cliquez sur les pastilles"); });
    if (/[?&]cctp=1/.test(location.search) || location.hash === "#cctp") setC(true);
  }
})();
