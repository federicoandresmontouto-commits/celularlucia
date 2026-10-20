/* Panel de administración · Celular de Lucía */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var C = null;            // contenido en edición
  var sucio = false;
  var seccion = "general";
  var abiertos = {};       // acordeones abiertos
  var clave = "";
  var codigos = [], archivos = [];
  var filtroCod = "";

  // ---------- utilidades ----------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function iniciales(n) { return String(n || "?").replace(/^(Dr\.|Dra\.)\s*/, "").split(/\s+/).slice(0, 2).map(function (p) { return p[0] || ""; }).join("").toUpperCase(); }
  function nuevoId(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function tam(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
  function fechaCorta(iso) { if (!iso) return ""; var d = new Date(iso); return d.toLocaleDateString("es-AR") + " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }); }
  function mmss(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function toast(t) { var e = $("#toast"); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { e.hidden = true; }, 2600); }
  function sesion(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }

  function obtener(ruta) { return ruta.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, C); }
  function poner(ruta, valor) {
    var p = ruta.split("."), o = C;
    for (var i = 0; i < p.length - 1; i++) o = o[p[i]];
    o[p[p.length - 1]] = valor;
  }

  function api(metodo, url, cuerpo, crudo) {
    var h = { "x-admin-clave": clave };
    var op = { method: metodo, headers: h };
    if (crudo) { op.body = crudo.body; h["content-type"] = crudo.tipo; h["x-nombre"] = encodeURIComponent(crudo.nombre || ""); }
    else if (cuerpo !== undefined) { op.body = JSON.stringify(cuerpo); h["content-type"] = "application/json"; }
    return fetch(url, op).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.error || "Error " + r.status); e.status = r.status; throw e; }
        return d;
      });
    });
  }

  function marcarSucio() {
    sucio = true;
    $("#barra-guardar").classList.add("sucio");
    $("#estado-guardado").textContent = "Hay cambios sin guardar";
    $("#btn-guardar").disabled = false;
  }
  function marcarLimpio(txt) {
    sucio = false;
    $("#barra-guardar").classList.remove("sucio");
    $("#estado-guardado").textContent = txt || "Todo guardado";
    $("#btn-guardar").disabled = true;
  }
  window.addEventListener("beforeunload", function (e) { if (sucio) { e.preventDefault(); e.returnValue = ""; } });

  // ---------- ingreso ----------
  $("#f-login").addEventListener("submit", function (e) {
    e.preventDefault();
    clave = $("#clave").value;
    entrar();
  });
  function entrar() {
    var err = $("#err-login"); err.hidden = true;
    $("#btn-login").disabled = true;
    api("GET", "/api/admin/contenido").then(function (d) {
      C = d; sesion("adm-clave", clave);
      $("#login").hidden = true; $("#panel").hidden = false;
      marcarLimpio(d.actualizado ? "Guardado el " + fechaCorta(d.actualizado) : "Contenido original del Caso 001");
      pintar();
    }).catch(function (e2) {
      sesion("adm-clave", null);
      err.textContent = e2.message || "No se pudo entrar."; err.hidden = false;
    }).then(function () { $("#btn-login").disabled = false; });
  }
  $("#btn-salir").addEventListener("click", function () {
    if (sucio && !$("#btn-salir").dataset.ok) { $("#btn-salir").dataset.ok = "1"; $("#btn-salir").textContent = "Hay cambios sin guardar. ¿Salir igual?"; return; }
    sesion("adm-clave", null); location.reload();
  });

  // ---------- guardar ----------
  $("#btn-guardar").addEventListener("click", function () {
    var b = $("#btn-guardar"); b.disabled = true; $("#estado-guardado").textContent = "Guardando…";
    api("PUT", "/api/admin/contenido", C).then(function (r) {
      C.actualizado = r.actualizado;
      marcarLimpio("Guardado el " + fechaCorta(r.actualizado) + " · Los jugadores lo ven en hasta 1 minuto");
      toast("Cambios guardados");
    }).catch(function (e) { b.disabled = false; $("#estado-guardado").textContent = e.message; });
  });

  // ---------- navegación ----------
  $("#tabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sec]"); if (!b) return;
    seccion = b.getAttribute("data-sec");
    document.querySelectorAll("#tabs button").forEach(function (x) { x.classList.toggle("on", x === b); });
    window.scrollTo(0, 0);
    pintar();
  });
  function pintar() {
    var y = window.scrollY;
    var f = { general: secGeneral, chats: secChats, fotos: secFotos, correos: secCorreos, alarma: secAlarma, codigos: secCodigos, archivos: secArchivos }[seccion];
    $("#main").innerHTML = f();
    window.scrollTo(0, y);
    if (seccion === "codigos" && !secCodigos.cargado) cargarCodigos();
    if (seccion === "archivos" && !secArchivos.cargado) cargarArchivos();
  }

  // ---------- piezas de formulario ----------
  function campo(etq, ruta, o) {
    o = o || {};
    var v = obtener(ruta), id = "c-" + ruta.replace(/\./g, "-");
    var ctl;
    if (o.filas) ctl = '<textarea id="' + id + '" data-ruta="' + ruta + '" rows="' + o.filas + '" placeholder="' + esc(o.ph || "") + '">' + esc(v) + "</textarea>";
    else if (o.opciones) ctl = '<select id="' + id + '" data-ruta="' + ruta + '"' + (o.repintar ? " data-repintar" : "") + ">" + o.opciones.map(function (op) {
      var val = Array.isArray(op) ? op[0] : op, txt = Array.isArray(op) ? op[1] : op;
      return '<option value="' + esc(val) + '"' + (String(v) === String(val) ? " selected" : "") + ">" + esc(txt) + "</option>";
    }).join("") + "</select>";
    else ctl = '<input id="' + id + '" data-ruta="' + ruta + '" type="' + (o.tipo || "text") + '" value="' + esc(v) + '" placeholder="' + esc(o.ph || "") + '"' + (o.extra || "") + ">";
    return '<div class="campo' + (o.clase ? " " + o.clase : "") + '"><label for="' + id + '">' + esc(etq) + "</label>" + ctl + (o.ayuda ? '<p class="ayuda">' + esc(o.ayuda) + "</p>" : "") + "</div>";
  }
  function check(etq, ruta) {
    return '<label class="chk"><input type="checkbox" data-ruta="' + ruta + '" data-repintar' + (obtener(ruta) ? " checked" : "") + "> " + esc(etq) + "</label>";
  }
  function acciones(arr, i, largo, conBorrar) {
    return '<span class="msj-acc">' +
      '<button class="icono" type="button" title="Subir" data-op="mover" data-arr="' + arr + '" data-i="' + i + '" data-dir="-1"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
      '<button class="icono" type="button" title="Bajar" data-op="mover" data-arr="' + arr + '" data-i="' + i + '" data-dir="1"' + (i === largo - 1 ? " disabled" : "") + ">↓</button>" +
      (conBorrar === false ? "" : '<button class="icono peligro" type="button" title="Borrar" data-op="borrar" data-arr="' + arr + '" data-i="' + i + '">✕</button>') +
      "</span>";
  }
  function botonSubir(ruta, campoDestino, acepta, texto) {
    return '<label class="subir"><input type="file" accept="' + acepta + '" data-subir="' + ruta + '" data-campo="' + campoDestino + '"><span>' + esc(texto) + '</span></label><span class="estado-subida" id="sub-' + ruta.replace(/\./g, "-") + '"></span>';
  }

  // edición directa de campos
  document.addEventListener("input", function (e) {
    var r = e.target.getAttribute && e.target.getAttribute("data-ruta");
    if (!r || e.target.type === "checkbox") return;
    var v = e.target.value;
    if (e.target.type === "number") v = v === "" ? "" : +v;
    poner(r, v); marcarSucio();
    if (e.target.hasAttribute("data-vivo")) actualizarResumen(e.target);
  });
  document.addEventListener("change", function (e) {
    var t = e.target, r = t.getAttribute && t.getAttribute("data-ruta");
    if (r && t.type === "checkbox") { poner(r, t.checked); marcarSucio(); if (t.hasAttribute("data-repintar")) pintar(); return; }
    if (r && t.tagName === "SELECT" && t.hasAttribute("data-repintar")) { pintar(); return; }
    if (t.hasAttribute("data-quien")) { cambiarQuien(t); return; }
    if (t.hasAttribute("data-adj")) { alternarAdjunto(t); return; }
    if (t.hasAttribute("data-subir")) { subirArchivo(t); return; }
  });
  function actualizarResumen(inp) {
    var d = inp.closest("details"); if (!d) return;
    var b = d.querySelector("summary .sum-txt b"); if (b && inp.hasAttribute("data-titulo")) b.textContent = inp.value || "(sin nombre)";
    var av = d.querySelector("summary .av"); if (av && inp.hasAttribute("data-titulo")) av.textContent = iniciales(inp.value);
  }
  document.addEventListener("toggle", function (e) {
    var d = e.target; if (d.tagName === "DETAILS" && d.dataset.clave) abiertos[d.dataset.clave] = d.open;
  }, true);

  // botones de estructura (agregar, mover, borrar)
  var pendienteBorrar = null;
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-op]"); if (!b) return;
    var op = b.getAttribute("data-op");
    if (op === "mover") {
      var arr = obtener(b.dataset.arr), i = +b.dataset.i, j = i + (+b.dataset.dir);
      if (j < 0 || j >= arr.length) return;
      var x = arr[i]; arr[i] = arr[j]; arr[j] = x; marcarSucio(); pintar();
    } else if (op === "borrar") {
      if (pendienteBorrar !== b) {
        if (pendienteBorrar) { pendienteBorrar.classList.remove("confirmar"); pendienteBorrar.textContent = pendienteBorrar.dataset.txt; }
        pendienteBorrar = b; b.dataset.txt = b.textContent; b.classList.add("confirmar"); b.textContent = "¿Borrar?";
        setTimeout(function () { if (pendienteBorrar === b) { b.classList.remove("confirmar"); b.textContent = b.dataset.txt; pendienteBorrar = null; } }, 3500);
        return;
      }
      pendienteBorrar = null;
      var lista = obtener(b.dataset.arr); var quitado = lista.splice(+b.dataset.i, 1)[0];
      if (b.dataset.arr === "galeria" && quitado) C.correos.forEach(function (m) { m.adjuntos = (m.adjuntos || []).filter(function (id) { return id !== quitado.id; }); });
      marcarSucio(); pintar();
    } else if (op === "agregar") {
      agregar(b.dataset.que, b.dataset.arr); marcarSucio(); pintar();
    } else if (op === "accion") {
      ACCIONES[b.dataset.accion](b);
    }
  });

  function agregar(que, arr) {
    if (que === "chat") { var id = nuevoId("c"); C.chats.push({ id: id, nombre: "Nuevo contacto", color: "#4b6584", grupo: false, mensajes: [] }); abiertos["chat-" + id] = true; }
    if (que === "mensaje") obtener(arr).push({ de: "el", hora: "12:00", tipo: "texto", texto: "" });
    if (que === "audio") obtener(arr).push({ de: "el", hora: "12:00", tipo: "audio", audio: "", dur: "0:00", texto: "" });
    if (que === "foto") C.galeria.push({ id: nuevoId("f"), src: "", fecha: "", lugar: "", nombre: "IMG_" + Math.floor(1000 + Math.random() * 8999) + ".jpg", desc: "" });
    if (que === "correo") { var mid = nuevoId("m"); C.correos.unshift({ id: mid, de: "", email: "", nuevo: true, enviado: false, asunto: "Nuevo correo", fecha: "", hora: "", adjuntos: [], cuerpo: "" }); abiertos["mail-" + mid] = true; }
    if (que === "evento") C.centinela.eventos.unshift({ fecha: "", hora: "", tipo: "ARMADO", usuario: "Usuario 01", lugar: "Teclado puerta trasera" });
    if (que === "zona") C.centinela.zonas.push({ n: "Z" + (C.centinela.zonas.length + 1), nombre: "", tipo: "Movimiento", estado: "Activa", nota: "" });
  }

  // ---------- subir archivos ----------
  var TIPOS_EXT = { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg", opus: "audio/ogg", oga: "audio/ogg", webm: "audio/webm",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", heic: "image/heic" };
  function tipoDe(f) { if (f.type) return f.type; var ext = (f.name.split(".").pop() || "").toLowerCase(); return TIPOS_EXT[ext] || ""; }

  function achicarImagen(file) {
    return new Promise(function (ok) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var max = 1600, k = Math.min(1, max / Math.max(im.width, im.height));
        var cv = document.createElement("canvas"); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
        cv.toBlob(function (b) { URL.revokeObjectURL(url); ok(b ? { body: b, tipo: "image/jpeg" } : null); }, "image/jpeg", 0.85);
      };
      im.onerror = function () { URL.revokeObjectURL(url); ok(null); };
      im.src = url;
    });
  }

  function subirArchivo(inp) {
    var f = inp.files && inp.files[0]; if (!f) return;
    var ruta = inp.dataset.subir, destino = inp.dataset.campo;
    var est = document.getElementById("sub-" + ruta.replace(/\./g, "-"));
    var tipo = tipoDe(f);
    function msj(t, cl) { if (est) { est.textContent = t; est.className = "estado-subida " + (cl || ""); } }
    if (!/^(audio|image)\//.test(tipo)) { msj("Ese archivo no es un audio ni una imagen.", "mal"); return; }
    msj("Preparando…");
    var prep = tipo.indexOf("image/") === 0 ? achicarImagen(f).then(function (r) {
      if (r) return r;
      if (/jpeg|png|webp|gif/.test(tipo)) return { body: f, tipo: tipo };
      throw new Error("Este formato de foto no se puede mostrar en todos los celulares. Guardala como JPG y probá de nuevo.");
    }) : Promise.resolve({ body: f, tipo: tipo });
    prep.then(function (p) {
      msj("Subiendo " + tam(p.body.size) + "…");
      return api("POST", "/api/admin/media", undefined, { body: p.body, tipo: p.tipo, nombre: f.name });
    }).then(function (r) {
      var obj = obtener(ruta);
      obj[destino] = r.url;
      if (destino === "audio") {
        var a = new Audio(); a.preload = "metadata";
        a.onloadedmetadata = function () { if (isFinite(a.duration)) { obj.dur = mmss(a.duration); pintar(); } };
        a.src = r.url;
        if (!/mpeg|mp4|aac|wav/.test(tipo)) toast("Subido. Ojo: este formato puede no sonar en iPhone. Lo más seguro es MP3 o M4A.");
      }
      secArchivos.cargado = false;
      marcarSucio(); pintar();
      if (destino !== "audio" || /mpeg|mp4|aac|wav/.test(tipo)) toast("Archivo subido. Acordate de guardar los cambios.");
    }).catch(function (e) { msj(e.message, "mal"); inp.value = ""; });
  }

  // ---------- General ----------
  function secGeneral() {
    return '<div class="intro"><h2>General</h2><p>Lo que se ve en la pantalla bloqueada y el PIN para desbloquear el celular. Los cambios valen para todos los códigos.</p></div>' +
      '<div class="caja"><h3>Pantalla bloqueada</h3><div class="grilla2">' +
      campo("PIN para desbloquear (4 números)", "pin", { extra: ' inputmode="numeric" maxlength="4" pattern="[0-9]{4}"', ayuda: "En el Caso 001 es 1907, el cumpleaños de la mamá." }) +
      campo("Nombre de la dueña del celular", "duena") +
      campo("Fecha que muestra", "fechaBloqueo", { ph: "Domingo 18 de octubre" }) +
      campo("Hora que muestra", "horaBloqueo", { ph: "09:41" }) +
      campo("Batería (%)", "bateria", { tipo: "number", extra: ' min="1" max="100"' }) +
      "</div></div>" +
      '<div class="caja"><h3>Volver al caso original</h3><p class="ayuda">Borra todos tus cambios de textos y vuelve al Caso 001 como venía. Los audios y fotos subidos siguen en "Archivos", pero dejan de estar asignados. Los códigos no se tocan.</p>' +
      '<div><button class="btn peligro" type="button" data-op="accion" data-accion="restaurar">Restaurar Caso 001 original</button></div></div>';
  }

  // ---------- Chats ----------
  function quienTxt(c, m) { return m.de === "yo" ? (C.duena || "Lucía").split(" ")[0] : (c.grupo ? (m.de || "?") : c.nombre); }
  function secChats() {
    var h = '<div class="intro"><h2>Chats y audios</h2><p>Cada chat de la app de mensajes. Podés subir audios reales: el jugador los escucha con el botón de play. Formato recomendado: MP3 o M4A (los audios de WhatsApp se exportan como .opus; convertilos a MP3).</p></div>';
    h += C.chats.map(function (c, ci) {
      var k = "chat-" + c.id, base = "chats." + ci;
      var audios = c.mensajes.filter(function (m) { return m.tipo === "audio"; });
      var faltan = audios.filter(function (m) { return !m.audio; }).length;
      return '<details class="bloque" data-clave="' + k + '"' + (abiertos[k] ? " open" : "") + ">" +
        '<summary><span class="av" style="background:' + esc(c.color) + '">' + esc(iniciales(c.nombre)) + '</span><span class="sum-txt"><b>' + esc(c.nombre) + "</b><span>" +
        c.mensajes.length + " mensajes · " + audios.length + " audios" + (faltan ? " · " + faltan + " sin archivo" : "") + "</span></span></summary>" +
        '<div class="cuerpo">' +
        '<div class="grilla2">' + campo("Nombre del contacto", base + ".nombre", { extra: " data-vivo data-titulo" }) +
        campo("Color", base + ".color", { tipo: "color" }) + "</div>" +
        '<div class="fila">' + check("Es un grupo (muestra el nombre de quien escribe)", base + ".grupo") + '<span class="espacio"></span>' + acciones("chats", ci, C.chats.length) + "</div>" +
        '<div class="msjs">' + c.mensajes.map(function (m, mi) { return mensajeHTML(c, base + ".mensajes", m, mi); }).join("") + "</div>" +
        '<div class="fila"><button class="btn chico" type="button" data-op="agregar" data-que="mensaje" data-arr="' + base + '.mensajes">+ Mensaje de texto</button>' +
        '<button class="btn chico" type="button" data-op="agregar" data-que="audio" data-arr="' + base + '.mensajes">+ Audio</button></div>' +
        "</div></details>";
    }).join("");
    h += '<div><button class="btn" type="button" data-op="agregar" data-que="chat">+ Nuevo chat</button></div>';
    return h;
  }
  function mensajeHTML(c, arr, m, i) {
    var r = arr + "." + i, sis = m.tipo === "sistema";
    var clase = sis ? "sis" : (m.de === "yo" ? "yo" : "el");
    var quien = "";
    if (!sis) {
      quien = '<div class="campo"><label>Quién lo manda</label><select data-quien="' + r + '" data-grupo="' + (c.grupo ? 1 : 0) + '">' +
        '<option value="yo"' + (m.de === "yo" ? " selected" : "") + ">" + esc((C.duena || "Lucía").split(" ")[0]) + " (enviado)</option>" +
        '<option value="otro"' + (m.de !== "yo" ? " selected" : "") + ">" + esc(c.grupo ? "Otra persona del grupo" : c.nombre) + " (recibido)</option></select></div>";
      if (c.grupo && m.de !== "yo") quien += campo("Nombre en el grupo", r + ".de");
    }
    var h = '<div class="msj ' + clase + '"><div class="msj-cab">' +
      campo("Tipo", r + ".tipo", { opciones: [["texto", "Texto"], ["audio", "Audio"], ["sistema", "Aviso del sistema"]], repintar: true }) +
      quien +
      (sis ? "" : campo("Hora", r + ".hora", { clase: "corto", ph: "21:20" })) +
      acciones(arr, i, obtener(arr).length) + "</div>" +
      campo("Separador de día antes de este mensaje (opcional)", r + ".dia", { ph: "Ej: Sábado 17/10" });
    if (m.tipo === "audio") {
      h += '<div class="audio-box">' +
        (m.audio ? '<audio controls preload="none" src="' + esc(m.audio) + '"></audio>' : '<span class="sin-audio">Todavía no tiene audio. El jugador va a ver solo la transcripción.</span>') +
        '<div class="fila">' + botonSubir(r, "audio", "audio/*,.mp3,.m4a,.opus,.ogg,.wav", m.audio ? "Cambiar audio" : "Subir audio") +
        '<span class="espacio"></span>' + campo("Duración", r + ".dur", { clase: "corto", ph: "0:21" }) + "</div></div>" +
        campo("Transcripción (se muestra si el jugador la pide)", r + ".texto", { filas: 3 });
    } else {
      h += campo(sis ? "Texto del aviso" : "Mensaje", r + ".texto", { filas: 2 });
    }
    return h + "</div>";
  }
  function cambiarQuien(sel) {
    var m = obtener(sel.dataset.quien);
    if (sel.value === "yo") m.de = "yo";
    else m.de = sel.dataset.grupo === "1" ? (m.de && m.de !== "yo" && m.de !== "el" ? m.de : "Nombre") : "el";
    marcarSucio(); pintar();
  }

  // ---------- Fotos ----------
  function secFotos() {
    var h = '<div class="intro"><h2>Fotos</h2><p>La galería del celular. Si una foto no tiene imagen, el jugador ve la descripción. Las fotos se achican solas antes de subir, para que carguen rápido.</p></div><div class="fotos">';
    h += C.galeria.map(function (f, i) {
      var r = "galeria." + i;
      return '<div class="foto"><div class="foto-img">' + (f.src ? '<img src="' + esc(f.src) + '" alt="">' : "Sin imagen") + "</div>" +
        '<div class="cuerpo"><div class="fila">' + botonSubir(r, "src", "image/*", f.src ? "Cambiar foto" : "Subir foto") + '<span class="espacio"></span>' + acciones("galeria", i, C.galeria.length) + "</div>" +
        campo("Fecha y hora", r + ".fecha", { ph: "Viernes 16/10 · 23:48" }) +
        campo("Lugar", r + ".lugar") +
        campo("Nombre de archivo (se ve cuando va adjunta a un mail)", r + ".nombre") +
        campo("Descripción (se ve si no hay imagen)", r + ".desc", { filas: 3 }) +
        "</div></div>";
    }).join("");
    return h + '</div><div><button class="btn" type="button" data-op="agregar" data-que="foto">+ Nueva foto</button></div>';
  }

  // ---------- Correos ----------
  function secCorreos() {
    var h = '<div class="intro"><h2>Correos</h2><p>La bandeja de entrada del celular, en el orden en que aparecen (el primero es el más nuevo).</p></div>';
    h += C.correos.map(function (m, i) {
      var k = "mail-" + m.id, r = "correos." + i;
      var fotos = C.galeria.map(function (f) {
        var on = (m.adjuntos || []).indexOf(f.id) > -1;
        return '<label class="chk"><input type="checkbox" data-adj="' + r + '" value="' + esc(f.id) + '"' + (on ? " checked" : "") + "> " + esc(f.nombre || f.desc.slice(0, 40)) + "</label>";
      }).join("");
      return '<details class="bloque" data-clave="' + k + '"' + (abiertos[k] ? " open" : "") + ">" +
        '<summary><span class="av" style="background:#2c5aa0">' + esc(iniciales(m.enviado ? (C.duena || "Yo") : m.de)) + '</span><span class="sum-txt"><b>' + esc(m.asunto || "(sin asunto)") + "</b><span>" +
        (m.enviado ? "Enviado · " : "") + esc(m.de) + " · " + esc(m.fecha) + (m.nuevo ? " · no leído" : "") + "</span></span></summary>" +
        '<div class="cuerpo"><div class="grilla2">' +
        campo("Remitente (nombre)", r + ".de") + campo("Mail", r + ".email") + campo("Asunto", r + ".asunto") +
        campo("Fecha", r + ".fecha", { ph: "Vie 16/10" }) + campo("Hora", r + ".hora", { ph: "17:20" }) + "</div>" +
        '<div class="fila">' + check("Aparece como no leído", r + ".nuevo") + check("Es un mail que mandó ella", r + ".enviado") + '<span class="espacio"></span>' + acciones("correos", i, C.correos.length) + "</div>" +
        campo("Texto del mail", r + ".cuerpo", { filas: 8 }) +
        '<div class="campo"><span class="etq">Fotos adjuntas</span><div class="fila">' + (fotos || '<span class="vacio">No hay fotos en la galería.</span>') + "</div></div>" +
        "</div></details>";
    }).join("");
    return h + '<div><button class="btn" type="button" data-op="agregar" data-que="correo">+ Nuevo correo</button></div>';
  }
  function alternarAdjunto(inp) {
    var m = obtener(inp.dataset.adj); m.adjuntos = m.adjuntos || [];
    var i = m.adjuntos.indexOf(inp.value);
    if (inp.checked && i < 0) m.adjuntos.push(inp.value);
    if (!inp.checked && i > -1) m.adjuntos.splice(i, 1);
    marcarSucio();
  }

  // ---------- Alarma ----------
  function secAlarma() {
    var cen = C.centinela;
    var ev = cen.eventos.map(function (e, i) {
      var r = "centinela.eventos." + i;
      return "<tr><td>" + inp(r + ".fecha", "18/10") + "</td><td>" + inp(r + ".hora", "00:41") + "</td><td>" +
        sel(r + ".tipo", ["ARMADO", "DESARMADO"]) + "</td><td>" + inp(r + ".usuario") + "</td><td>" + inp(r + ".lugar") + "</td><td>" + acciones("centinela.eventos", i, cen.eventos.length) + "</td></tr>";
    }).join("");
    var zo = cen.zonas.map(function (z, i) {
      var r = "centinela.zonas." + i;
      return "<tr><td>" + inp(r + ".n") + "</td><td>" + inp(r + ".nombre") + "</td><td>" + inp(r + ".tipo") + "</td><td>" +
        sel(r + ".estado", ["Activa", "Anulada"]) + "</td><td>" + inp(r + ".nota") + "</td><td>" + acciones("centinela.zonas", i, cen.zonas.length) + "</td></tr>";
    }).join("");
    return '<div class="intro"><h2>Alarma (app Centinela)</h2><p>La app pide usuario y clave. En el Caso 001 están en el sticker del manual de la alarma (sobre B).</p></div>' +
      '<div class="caja"><h3>Acceso</h3><div class="grilla2">' + campo("Usuario", "centinela.usuario") + campo("Clave", "centinela.clave") + campo("Nombre del cliente", "centinela.cliente") + "</div></div>" +
      '<div class="caja"><div class="fila"><h3>Registro de eventos</h3><span class="espacio"></span><button class="btn chico" type="button" data-op="agregar" data-que="evento">+ Evento</button></div>' +
      '<p class="ayuda">Se muestran en este orden. Poné arriba el más reciente.</p>' +
      '<div class="tw"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Usuario</th><th>Lugar</th><th></th></tr></thead><tbody>' + ev + "</tbody></table></div></div>" +
      '<div class="caja"><div class="fila"><h3>Zonas</h3><span class="espacio"></span><button class="btn chico" type="button" data-op="agregar" data-que="zona">+ Zona</button></div>' +
      '<div class="tw"><table><thead><tr><th>N°</th><th>Nombre</th><th>Sensor</th><th>Estado</th><th>Nota</th><th></th></tr></thead><tbody>' + zo + "</tbody></table></div></div>";
  }
  function inp(r, ph) { return '<input data-ruta="' + r + '" value="' + esc(obtener(r)) + '" placeholder="' + esc(ph || "") + '" aria-label="' + esc(r.split(".").pop()) + '">'; }
  function sel(r, ops) { var v = obtener(r); return '<select data-ruta="' + r + '" aria-label="' + esc(r.split(".").pop()) + '">' + ops.map(function (o) { return "<option" + (o === v ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>"; }

  // ---------- Códigos ----------
  function cargarCodigos() {
    secCodigos.cargado = true;
    api("GET", "/api/admin/codigos").then(function (d) { codigos = d; if (seccion === "codigos") pintar(); }).catch(function (e) { toast(e.message); });
  }
  function secCodigos() {
    var activos = codigos.filter(function (c) { return c.activo; }).length;
    var usados = codigos.filter(function (c) { return c.primerUso; }).length;
    var f = filtroCod.trim().toUpperCase();
    var vis = codigos.filter(function (c) { return !f || c.codigo.indexOf(f) > -1 || String(c.nota || "").toUpperCase().indexOf(f) > -1; });
    var filas = vis.slice(0, 500).map(function (c) {
      return '<tr><td class="cod">' + esc(c.codigo) + "</td>" +
        '<td><input data-nota="' + c.hash + '" value="' + esc(c.nota || "") + '" placeholder="Ej: Feria de mayo" aria-label="Nota"></td>' +
        "<td>" + (c.activo ? '<span class="pill ok">Activo</span>' : '<span class="pill off">Dado de baja</span>') + "</td>" +
        "<td>" + (c.primerUso ? '<span class="pill gris">' + esc(fechaCorta(c.primerUso)) + "</span>" : '<span class="vacio">Sin usar</span>') + "</td>" +
        '<td><span class="fila" style="flex-wrap:nowrap"><button class="btn chico" type="button" data-op="accion" data-accion="alternarCodigo" data-hash="' + c.hash + '">' + (c.activo ? "Dar de baja" : "Activar") + "</button>" +
        '<button class="icono peligro" type="button" title="Borrar código" data-op="accion" data-accion="borrarCodigo" data-hash="' + c.hash + '">✕</button></span></td></tr>';
    }).join("");
    return '<div class="intro"><h2>Códigos de caja</h2><p>Cada caja trae un código. Con él, el grupo entra a su propio celular. El contenido es el mismo para todos; lo que cambia es el avance de cada grupo.</p></div>' +
      '<div class="stats"><div class="stat"><b>' + codigos.length + '</b><span>Códigos</span></div><div class="stat"><b>' + activos + '</b><span>Activos</span></div><div class="stat"><b>' + usados + '</b><span>Ya usados</span></div></div>' +
      '<div class="grilla2"><div class="caja"><h3>Crear códigos nuevos</h3>' +
      '<div class="campo"><label for="gen-n">Cantidad</label><input id="gen-n" type="number" min="1" max="1000" value="50"></div>' +
      '<div class="campo"><label for="gen-nota">Nota (opcional)</label><input id="gen-nota" placeholder="Ej: Tirada 1 · noviembre"></div>' +
      '<div><button class="btn prim" type="button" data-op="accion" data-accion="generar">Crear códigos</button></div></div>' +
      '<div class="caja"><h3>Importar códigos que ya tenés</h3>' +
      '<div class="campo"><label for="imp-txt">Pegá los códigos (uno por línea)</label><textarea id="imp-txt" rows="4" placeholder="LC-W3R4-Z8XU"></textarea><p class="ayuda">Sirve para cargar los 200 códigos del archivo codigos-caso-001.csv.</p></div>' +
      '<div><button class="btn" type="button" data-op="accion" data-accion="importar">Importar</button></div></div></div>' +
      '<div class="caja"><div class="fila"><h3>Lista</h3><span class="espacio"></span>' +
      '<button class="btn chico" type="button" data-op="accion" data-accion="copiarCodigos">Copiar activos sin usar</button>' +
      '<button class="btn chico" type="button" data-op="accion" data-accion="descargarCodigos">Descargar planilla (CSV)</button></div>' +
      '<div class="campo"><label for="filtro-cod">Buscar</label><input id="filtro-cod" value="' + esc(filtroCod) + '" placeholder="Código o nota"></div>' +
      (codigos.length ? '<div class="tw"><table><thead><tr><th>Código</th><th>Nota</th><th>Estado</th><th>Primer uso</th><th></th></tr></thead><tbody>' + filas + "</tbody></table></div>" : '<p class="vacio">' + (secCodigos.cargado ? "No hay códigos." : "Cargando…") + "</p>") +
      (vis.length > 500 ? '<p class="ayuda">Se muestran los primeros 500. Usá el buscador para encontrar otros.</p>' : "") +
      "</div>";
  }
  document.addEventListener("input", function (e) {
    if (e.target.id === "filtro-cod") {
      filtroCod = e.target.value; var pos = e.target.selectionStart; pintar();
      var n = $("#filtro-cod"); n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {}
    }
  });
  document.addEventListener("change", function (e) {
    var h = e.target.getAttribute && e.target.getAttribute("data-nota"); if (!h) return;
    api("PATCH", "/api/admin/codigos", { hash: h, nota: e.target.value }).then(function (d) { codigos = d.codigos; toast("Nota guardada"); }).catch(function (x) { toast(x.message); });
  });

  // ---------- Archivos ----------
  function cargarArchivos() {
    secArchivos.cargado = true;
    api("GET", "/api/admin/media").then(function (d) { archivos = d; if (seccion === "archivos") pintar(); }).catch(function (e) { toast(e.message); });
  }
  function usosDe(url) {
    var u = [];
    C.chats.forEach(function (c) { c.mensajes.forEach(function (m) { if (m.audio === url) u.push("Audio en chat " + c.nombre); }); });
    C.galeria.forEach(function (f) { if (f.src === url) u.push("Foto " + (f.nombre || "")); });
    return u;
  }
  function secArchivos() {
    var h = '<div class="intro"><h2>Archivos subidos</h2><p>Todos los audios y fotos guardados. Si borrás uno que está en uso, deja de verse o escucharse en el celular.</p></div>';
    if (!secArchivos.cargado || !archivos.length) return h + '<p class="vacio">' + (secArchivos.cargado ? "Todavía no subiste archivos." : "Cargando…") + "</p>";
    h += '<div class="lista-arch">' + archivos.map(function (a) {
      var esAudio = String(a.tipo).indexOf("audio") === 0, usos = usosDe(a.url);
      return '<div class="arch">' + (esAudio ? '<span class="mini">♪</span>' : '<img class="mini" src="' + esc(a.url) + '" alt="">') +
        '<span class="info"><b>' + esc(a.nombre || a.id) + "</b><span>" + esc(tam(a.tam || 0)) + " · " + esc(fechaCorta(a.creado)) + "</span><span>" +
        (usos.length ? esc(usos.join(" · ")) : "Sin usar") + "</span></span>" +
        (esAudio ? '<audio controls preload="none" src="' + esc(a.url) + '"></audio>' : "") +
        '<button class="btn chico peligro" type="button" data-op="accion" data-accion="borrarArchivo" data-id="' + esc(a.id) + '">Borrar</button></div>';
    }).join("") + "</div>";
    return h;
  }

  // ---------- acciones ----------
  function confirmarDosVeces(b, fn) {
    if (b.dataset.armado) { fn(); return; }
    b.dataset.armado = "1"; b.dataset.txt = b.textContent; b.classList.add("confirmar"); b.textContent = "¿Seguro? Tocá de nuevo";
    setTimeout(function () { if (b.isConnected) { delete b.dataset.armado; b.classList.remove("confirmar"); b.textContent = b.dataset.txt; } }, 3500);
  }
  var ACCIONES = {
    restaurar: function (b) {
      confirmarDosVeces(b, function () {
        api("DELETE", "/api/admin/contenido").then(function (d) { C = d; marcarLimpio("Contenido original del Caso 001"); pintar(); toast("Volviste al Caso 001 original"); }).catch(function (e) { toast(e.message); });
      });
    },
    generar: function () {
      var n = +$("#gen-n").value || 0;
      if (n < 1 || n > 1000) { toast("Elegí entre 1 y 1000 códigos."); return; }
      api("POST", "/api/admin/codigos", { accion: "generar", cantidad: n, nota: $("#gen-nota").value }).then(function (d) { codigos = d.codigos; pintar(); toast(d.agregados + " códigos creados"); }).catch(function (e) { toast(e.message); });
    },
    importar: function () {
      api("POST", "/api/admin/codigos", { accion: "importar", texto: $("#imp-txt").value, nota: "Importado" }).then(function (d) {
        codigos = d.codigos; pintar(); toast(d.agregados + " importados" + (d.ignorados ? ", " + d.ignorados + " ya existían" : ""));
      }).catch(function (e) { toast(e.message); });
    },
    alternarCodigo: function (b) {
      var c = codigos.filter(function (x) { return x.hash === b.dataset.hash; })[0];
      api("PATCH", "/api/admin/codigos", { hash: c.hash, activo: !c.activo }).then(function (d) { codigos = d.codigos; pintar(); }).catch(function (e) { toast(e.message); });
    },
    borrarCodigo: function (b) {
      confirmarDosVeces(b, function () {
        api("DELETE", "/api/admin/codigos?hash=" + b.dataset.hash).then(function (d) { codigos = d.codigos; pintar(); toast("Código borrado"); }).catch(function (e) { toast(e.message); });
      });
    },
    copiarCodigos: function () {
      var t = codigos.filter(function (c) { return c.activo && !c.primerUso; }).map(function (c) { return c.codigo; }).join("\n");
      if (!t) { toast("No hay códigos activos sin usar."); return; }
      navigator.clipboard.writeText(t).then(function () { toast("Códigos copiados"); }, function () { toast("No se pudo copiar. Usá la planilla CSV."); });
    },
    descargarCodigos: function () {
      var csv = "codigo,nota,estado,primer_uso\n" + codigos.map(function (c) {
        return [c.codigo, '"' + String(c.nota || "").replace(/"/g, '""') + '"', c.activo ? "activo" : "baja", c.primerUso || ""].join(",");
      }).join("\n");
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
      a.download = "codigos-celular-lucia.csv"; document.body.appendChild(a); a.click(); a.remove();
    },
    borrarArchivo: function (b) {
      confirmarDosVeces(b, function () {
        api("DELETE", "/api/admin/media?id=" + b.dataset.id).then(function () {
          archivos = archivos.filter(function (a) { return a.id !== b.dataset.id; }); pintar(); toast("Archivo borrado");
        }).catch(function (e) { toast(e.message); });
      });
    }
  };

  // ---------- arranque ----------
  var guardada = sesion("adm-clave");
  if (guardada) { clave = guardada; entrar(); }
})();
