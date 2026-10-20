/* Celular de Lucía · el contenido llega del servidor y se edita desde /admin */
(function () {
  "use strict";
  var C = null;
  var PREFIJO = "celu-lucia:";
  var $ = function (s) { return document.querySelector(s); };

  // ---------- almacenamiento por código ----------
  var token = null, estado = {};
  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function escribir(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function borrar(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function cargarEstado() {
    try { estado = JSON.parse(leer(PREFIJO + token) || "{}") || {}; } catch (e) { estado = {}; }
    estado.leidos = estado.leidos || {}; estado.correos = estado.correos || {};
  }
  function guardar() { if (token) escribir(PREFIJO + token, JSON.stringify(estado)); }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function iniciales(n) { return String(n || "?").replace(/^(Dr\.|Dra\.)\s*/, "").split(/\s+/).slice(0, 2).map(function (p) { return p[0] || ""; }).join("").toUpperCase(); }

  // ---------- pantallas ----------
  var origenVisor = "fotos";
  function ir(id) {
    document.querySelectorAll(".pantalla").forEach(function (p) { p.classList.toggle("activa", p.id === "p-" + id); });
    if (!C) return;
    if (id === "inicio") { $("#nota-off").hidden = true; pintarBadges(); }
    if (id === "chats") pintarChats();
    if (id === "correo") pintarCorreo();
    if (id === "centinela") pintarCentinela();
    if (id !== "chat") pararAudio();
  }
  document.addEventListener("click", function (e) {
    var h = e.target.closest("[data-home]"); if (h) { ir("inicio"); return; }
    var d = e.target.closest("[data-ir]"); if (d) { ir(d.getAttribute("data-ir")); return; }
    var a = e.target.closest(".app"); if (a) {
      if (a.classList.contains("off")) { $("#nota-off").hidden = false; return; }
      ir(a.getAttribute("data-app"));
    }
  });

  // ---------- 1. código de expediente ----------
  function mostrarError(t) { var e = $("#err-codigo"); e.textContent = t; e.hidden = !t; }
  function cargando(si) { $("#cargando").hidden = !si; $("#btn-codigo").disabled = si; }
  $("#f-codigo").addEventListener("submit", function (e) {
    e.preventDefault();
    mostrarError("");
    cargando(true);
    fetch("/api/entrar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ codigo: $("#in-codigo").value }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (r) {
        if (!r.ok) { cargando(false); mostrarError(r.d.error || "No se pudo validar el código."); return; }
        token = r.d.token; escribir(PREFIJO + "actual", token);
        $("#in-codigo").value = "";
        abrirExpediente();
      })
      .catch(function () { cargando(false); mostrarError("No hay conexión. Revisá internet y probá de nuevo."); });
  });

  function abrirExpediente() {
    cargando(true);
    fetch("/api/contenido?t=" + encodeURIComponent(token), { cache: "no-store" })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (r) {
        cargando(false);
        if (!r.ok) { borrar(PREFIJO + "actual"); token = null; ir("codigo"); mostrarError(r.d.error || "Este código ya no es válido."); return; }
        C = r.d; cargarEstado(); preparar(); entrarAlCelular();
      })
      .catch(function () { cargando(false); ir("codigo"); mostrarError("No hay conexión. Revisá internet y probá de nuevo."); });
  }

  function preparar() {
    $("#bl-hora").textContent = $("#b-hora").textContent = $("#w-hora").textContent = C.horaBloqueo || "";
    $("#bl-fecha").textContent = $("#w-fecha").textContent = C.fechaBloqueo || "";
    $("#b-bat").style.width = Math.max(3, Math.min(100, +C.bateria || 50)) + "%";
    $("#cen-nombre").textContent = (C.centinela && C.centinela.cliente) || "";
    pintarGaleria();
  }

  function entrarAlCelular() {
    if (estado.desbloqueado && estado.pin === C.pin) { ir("inicio"); return; }
    var t = totalNoLeidos();
    $("#aviso-charla").textContent = t ? t + " mensajes nuevos" : "Sin mensajes nuevos";
    var nc = C.correos.filter(correoNuevo)[0];
    $("#aviso-correo").textContent = nc ? nc.asunto : "Sin correos nuevos";
    reiniciarPin(); ir("bloqueo");
  }

  // ---------- 2. bloqueo ----------
  var pin = "", intentos = 0, bloqueadoHasta = 0;
  function pintarPuntos() { document.querySelectorAll("#puntos i").forEach(function (p, i) { p.classList.toggle("on", i < pin.length); }); }
  function reiniciarPin() { pin = ""; pintarPuntos(); $("#bl-txt").textContent = "Ingresá el código"; }
  $("#teclado").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-n]"); if (!b || !C) return;
    if (Date.now() < bloqueadoHasta || pin.length >= 4) return;
    pin += b.getAttribute("data-n"); pintarPuntos();
    if (pin.length === 4) setTimeout(probarPin, 150);
  });
  $("#btn-borrar").addEventListener("click", function () { pin = pin.slice(0, -1); pintarPuntos(); });
  $("#btn-salir").addEventListener("click", function () { borrar(PREFIJO + "actual"); token = null; C = null; mostrarError(""); ir("codigo"); });
  function probarPin() {
    if (pin === String(C.pin)) { estado.desbloqueado = true; estado.pin = C.pin; guardar(); ir("inicio"); return; }
    intentos++;
    var p = $("#puntos"); p.classList.remove("mal"); void p.offsetWidth; p.classList.add("mal");
    pin = ""; pintarPuntos();
    if (intentos % 5 === 0) {
      bloqueadoHasta = Date.now() + 30000;
      var teclas = document.querySelectorAll("#teclado button[data-n]");
      teclas.forEach(function (t) { t.disabled = true; });
      var tick = setInterval(function () {
        var s = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
        if (s <= 0) { clearInterval(tick); teclas.forEach(function (t) { t.disabled = false; }); $("#bl-txt").textContent = "Ingresá el código"; return; }
        $("#bl-txt").textContent = "Demasiados intentos. Esperá " + s + " s";
      }, 250);
    } else {
      $("#bl-txt").textContent = "Código incorrecto";
    }
  }

  // ---------- badges ----------
  function esSistema(m) { return m.tipo === "sistema" || m.sistema; }
  function noLeidosChat(c) {
    if ((estado.leidos[c.id] || 0) >= c.mensajes.length) return 0;
    var n = 0;
    for (var i = c.mensajes.length - 1; i >= 0; i--) { var m = c.mensajes[i]; if (esSistema(m)) continue; if (m.de === "yo") break; n++; }
    return n;
  }
  function totalNoLeidos() { return C.chats.reduce(function (s, c) { return s + noLeidosChat(c); }, 0); }
  function correoNuevo(m) { return m.nuevo && !estado.correos[m.id]; }
  function pintarBadges() {
    var t = totalNoLeidos();
    var b = $("#badge-chats"); b.hidden = !t; b.textContent = t;
    var tc = C.correos.filter(correoNuevo).length;
    var bc = $("#badge-correo"); bc.hidden = !tc; bc.textContent = tc;
  }

  // ---------- Charla ----------
  function ultimoMsj(c) { for (var i = c.mensajes.length - 1; i >= 0; i--) if (!esSistema(c.mensajes[i])) return c.mensajes[i]; return { texto: "" }; }
  function ultimoDia(c) { var d = ""; c.mensajes.forEach(function (m) { if (m.dia) d = m.dia; }); return d; }
  function pintarChats() {
    $("#lista-chats").innerHTML = C.chats.map(function (c) {
      var u = ultimoMsj(c), n = noLeidosChat(c);
      var prev = u.tipo === "audio" ? "Audio (" + (u.dur || "0:00") + ")" : (u.texto || "");
      if (u.de === "yo") prev = "Vos: " + prev; else if (c.grupo && u.de) prev = u.de + ": " + prev;
      var partes = ultimoDia(c).split(" "), dia = partes[partes.length - 1] || "";
      return '<li class="' + (n ? "noleido" : "") + '"><button data-chat="' + esc(c.id) + '">' +
        '<span class="av" style="background:' + esc(c.color || "#666") + '">' + esc(iniciales(c.nombre)) + "</span>" +
        '<span class="txt"><span class="fila"><b>' + esc(c.nombre) + '</b><span class="hora">' + esc(dia) + "</span></span>" +
        '<span class="fila"><span class="prev">' + esc(prev) + "</span>" + (n ? '<span class="num">' + n + "</span>" : "") + "</span></span></button></li>";
    }).join("");
  }
  $("#lista-chats").addEventListener("click", function (e) {
    var b = e.target.closest("[data-chat]"); if (b) abrirChat(b.getAttribute("data-chat"));
  });

  function onda(seed) {
    var h = "", x = seed * 9301 + 49297;
    for (var i = 0; i < 28; i++) { x = (x * 9301 + 49297) % 233280; h += '<i style="height:' + (20 + (x / 233280) * 80).toFixed(0) + '%"></i>'; }
    return h;
  }
  var chatAbierto = null;
  function abrirChat(id) {
    var c = C.chats.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    chatAbierto = c;
    $("#chat-nombre").textContent = c.nombre;
    var av = $("#chat-av"); av.textContent = iniciales(c.nombre); av.style.background = c.color || "#666";
    var html = "";
    c.mensajes.forEach(function (m, i) {
      if (m.dia) html += '<div class="dia">' + esc(m.dia) + "</div>";
      if (esSistema(m)) { html += '<div class="sistema">' + esc(m.texto || m.sistema) + "</div>"; return; }
      var lado = m.de === "yo" ? "yo" : "el";
      var autor = c.grupo && m.de !== "yo" ? '<span class="autor">' + esc(m.de) + "</span>" : "";
      if (m.tipo === "audio") {
        var sin = !m.audio;
        html += '<div class="msj ' + lado + '">' + autor +
          '<div class="audio"><button class="play" data-audio="' + i + '" aria-label="Reproducir audio"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></button>' +
          '<div class="onda" id="onda-' + i + '">' + onda(i + String(m.texto || "").length) + '</div><span class="dur" id="dur-' + i + '">' + esc(m.dur || "0:00") + "</span></div>" +
          (m.texto ? '<button class="transcribir" data-trans="' + i + '">' + (sin ? "Ocultar transcripción" : "Ver transcripción") + "</button>" +
          '<div class="transc" id="trans-' + i + '"' + (sin ? "" : " hidden") + ">" + esc(m.texto) + "</div>" : "") +
          '<div class="no-audio" id="noaud-' + i + '"' + (sin ? "" : " hidden") + ">Audio no disponible en esta copia.</div>" +
          '<span class="h">' + esc(m.hora) + "</span></div>";
      } else {
        html += '<div class="msj ' + lado + '">' + autor + esc(m.texto) + '<span class="h">' + esc(m.hora) + "</span></div>";
      }
    });
    var conv = $("#conversacion");
    conv.innerHTML = html;
    estado.leidos[id] = c.mensajes.length; guardar();
    ir("chat");
    conv.scrollTop = conv.scrollHeight;
  }

  var audio = null, audioBtn = null;
  var ICO_PLAY = '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>';
  var ICO_PAUSA = '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
  function pararAudio() { if (audio) { audio.pause(); audio = null; } if (audioBtn) audioBtn.innerHTML = ICO_PLAY; audioBtn = null; }
  function mmss(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  $("#conversacion").addEventListener("click", function (e) {
    var t = e.target.closest("[data-trans]");
    if (t) { var tr = $("#trans-" + t.getAttribute("data-trans")); tr.hidden = !tr.hidden; t.textContent = tr.hidden ? "Ver transcripción" : "Ocultar transcripción"; return; }
    var p = e.target.closest("[data-audio]"); if (!p) return;
    var i = p.getAttribute("data-audio");
    if (audioBtn === p) { pararAudio(); return; }
    pararAudio();
    var m = chatAbierto.mensajes[i];
    if (!m.audio) { $("#noaud-" + i).hidden = false; return; }
    var barras = document.querySelectorAll("#onda-" + i + " i");
    var dur = $("#dur-" + i), durTxt = dur.textContent;
    audio = new Audio(m.audio); audioBtn = p; p.innerHTML = ICO_PAUSA;
    audio.addEventListener("timeupdate", function () {
      if (!audio || !audio.duration || !isFinite(audio.duration)) return;
      var k = Math.round((audio.currentTime / audio.duration) * barras.length);
      barras.forEach(function (b, j) { b.classList.toggle("on", j < k); });
      dur.textContent = mmss(audio.currentTime);
    });
    audio.addEventListener("ended", function () { barras.forEach(function (b) { b.classList.remove("on"); }); dur.textContent = durTxt; pararAudio(); });
    audio.addEventListener("error", function () {
      $("#noaud-" + i).hidden = false;
      var tr = $("#trans-" + i); if (tr) tr.hidden = false;
      dur.textContent = durTxt; pararAudio();
    });
    audio.play().catch(function () {});
  });

  // ---------- Fotos ----------
  function fotoHTML(f) {
    if (!f.src) return '<div class="falta">[Foto] ' + esc(f.desc) + "</div>";
    return '<img src="' + esc(f.src) + '" alt="' + esc(f.desc) + '" loading="lazy" data-desc="' + esc(f.desc) + '">';
  }
  document.addEventListener("error", function (e) {
    var im = e.target;
    if (im.tagName !== "IMG" || !im.dataset.desc) return;
    var d = document.createElement("div"); d.className = "falta"; d.textContent = "[Foto] " + im.dataset.desc;
    im.replaceWith(d);
  }, true);
  function pintarGaleria() {
    $("#grilla").innerHTML = C.galeria.map(function (f) {
      return '<button class="miniatura" data-foto="' + esc(f.id) + '" aria-label="' + esc(f.fecha) + '">' + fotoHTML(f) + "</button>";
    }).join("");
  }
  $("#grilla").addEventListener("click", function (e) {
    var b = e.target.closest("[data-foto]"); if (b) abrirFoto(b.getAttribute("data-foto"), "fotos");
  });
  function fotoPorId(id) { return C.galeria.filter(function (f) { return f.id === id; })[0]; }
  function abrirFoto(id, origen) {
    var f = fotoPorId(id); if (!f) return;
    origenVisor = origen;
    $("#visor-fecha").textContent = f.fecha || "";
    $("#visor-img").innerHTML = fotoHTML(f);
    $("#visor-info").innerHTML = "<b>" + esc(f.fecha) + "</b><span>" + esc(f.lugar) + "</span>";
    ir("visor");
  }
  $("#visor-volver").addEventListener("click", function () { ir(origenVisor); });

  // ---------- Correo ----------
  function nombreCorreo(m) { return m.enviado ? (C.duena || "Yo") : m.de; }
  function pintarCorreo() {
    $("#lista-correo").innerHTML = C.correos.map(function (m, i) {
      var prev = String(m.cuerpo || "").replace(/\s+/g, " ").slice(0, 70);
      return '<li class="' + (correoNuevo(m) ? "noleido" : "") + '"><button data-mail="' + i + '">' +
        '<span class="av ini">' + esc(iniciales(nombreCorreo(m))) + "</span>" +
        '<span class="txt"><span class="fila"><b>' + (m.enviado ? '<span class="tag-env">ENVIADO</span>' : "") + esc(m.de) + '</b><span class="hora">' + esc(m.fecha) + "</span></span>" +
        '<span class="prev" style="color:var(--txt)">' + esc(m.asunto) + '</span><span class="prev">' + esc(prev) + "…</span></span></button></li>";
    }).join("");
  }
  $("#lista-correo").addEventListener("click", function (e) {
    var b = e.target.closest("[data-mail]"); if (!b) return;
    var m = C.correos[+b.getAttribute("data-mail")];
    estado.correos[m.id] = true; guardar();
    var adj = (m.adjuntos || []).map(function (id) {
      var f = fotoPorId(id); if (!f) return "";
      return '<button class="adj" data-adj="' + esc(id) + '">' + esc(f.nombre || "foto.jpg") + "</button>";
    }).join("");
    $("#mail").innerHTML = "<h3>" + esc(m.asunto) + "</h3>" +
      '<div class="de"><span class="av ini">' + esc(iniciales(nombreCorreo(m))) + "</span><div><b>" + esc(m.de) + "</b><span>" + esc(m.email) + "</span><span>" + esc((m.fecha || "") + " · " + (m.hora || "")) + "</span></div></div>" +
      '<p class="cuerpo">' + esc(m.cuerpo) + "</p>" + (adj ? '<div class="adjuntos">' + adj + "</div>" : "");
    ir("mail");
  });
  $("#mail").addEventListener("click", function (e) {
    var a = e.target.closest("[data-adj]"); if (a) abrirFoto(a.getAttribute("data-adj"), "mail");
  });

  // ---------- Centinela ----------
  function pintarCentinela() {
    var cen = C.centinela || { eventos: [], zonas: [] };
    var dentro = estado.centinela === cen.clave;
    $("#cen-login").hidden = dentro; $("#cen-panel").hidden = !dentro;
    if (!dentro) return;
    $("#cen-eventos").innerHTML = cen.eventos.map(function (ev) {
      var t = String(ev.tipo || "").toLowerCase();
      return '<li><span class="t">' + esc(ev.hora) + "<small>" + esc(ev.fecha) + '</small></span><span class="tipo ' + esc(t) + '">' + esc(ev.tipo) + "</span>" +
        '<span class="sub">' + esc(ev.usuario + " · " + ev.lugar) + "</span></li>";
    }).join("");
    $("#cen-zonas").innerHTML = cen.zonas.map(function (z) {
      return '<li><span class="t">' + esc(z.n) + "</span><span><b>" + esc(z.nombre) + "</b> · " + esc(z.tipo) + "</span>" +
        '<span class="estado ' + (z.estado === "Anulada" ? "anulada" : "") + '">' + esc(z.estado) + (z.nota ? " · " + esc(z.nota) : "") + "</span></li>";
    }).join("");
  }
  $("#f-cen").addEventListener("submit", function (e) {
    e.preventDefault();
    var cen = C.centinela;
    var u = $("#cen-u").value.trim().toLowerCase(), k = $("#cen-c").value;
    if (u === String(cen.usuario).toLowerCase() && k === cen.clave) {
      estado.centinela = cen.clave; guardar(); $("#err-cen").hidden = true; $("#cen-c").value = ""; pintarCentinela();
    } else {
      $("#err-cen").textContent = "Usuario o clave incorrectos. Los datos de acceso los da la empresa de alarmas al cliente.";
      $("#err-cen").hidden = false;
    }
  });
  $("#cen-salir").addEventListener("click", function () { estado.centinela = false; guardar(); pintarCentinela(); });
  document.querySelector(".tabs-cen").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]"); if (!b) return;
    document.querySelectorAll(".tabs-cen button").forEach(function (x) { x.classList.toggle("on", x === b); });
    $("#cen-eventos").hidden = b.getAttribute("data-tab") !== "eventos";
    $("#cen-zonas").hidden = b.getAttribute("data-tab") !== "zonas";
  });

  // ---------- arranque ----------
  var guardado = leer(PREFIJO + "actual");
  if (guardado) { token = guardado; abrirExpediente(); }
})();
