// Panel: crear, importar, activar/desactivar y borrar códigos de caja.
import { json, exigirAdmin, leerCodigos, guardarCodigos, registroCodigo, codigoNuevo, formatearCodigo } from "../../../lib/comun.js";

export async function onRequestGet({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  return json(await leerCodigos(env));
}

export async function onRequestPost({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  let b = {};
  try { b = await request.json(); } catch (e) {}
  const lista = await leerCodigos(env);
  const existentes = new Set(lista.map((x) => x.hash));
  const nota = String(b.nota || "").slice(0, 120);
  let candidatos = [];
  if (b.accion === "generar") {
    const n = Math.max(1, Math.min(1000, parseInt(b.cantidad, 10) || 0));
    const usados = new Set(lista.map((x) => x.codigo));
    while (candidatos.length < n) { const c = codigoNuevo(); if (!usados.has(c)) { usados.add(c); candidatos.push(c); } }
  } else if (b.accion === "importar") {
    candidatos = String(b.texto || "").split(/[\s,;]+/).map(formatearCodigo).filter((c) => /^LC-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c));
  } else {
    return json({ error: "Acción desconocida." }, 400);
  }
  const nuevos = [];
  for (const c of candidatos) {
    const r = await registroCodigo(c, nota);
    if (!existentes.has(r.hash)) { existentes.add(r.hash); nuevos.push(r); }
  }
  const total = lista.concat(nuevos);
  await guardarCodigos(env, total);
  return json({ ok: true, agregados: nuevos.length, ignorados: candidatos.length - nuevos.length, codigos: total });
}

export async function onRequestPatch({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  let b = {};
  try { b = await request.json(); } catch (e) {}
  const lista = await leerCodigos(env);
  const c = lista.find((x) => x.hash === b.hash);
  if (!c) return json({ error: "No encontré ese código." }, 404);
  if (typeof b.activo === "boolean") c.activo = b.activo;
  if (typeof b.nota === "string") c.nota = b.nota.slice(0, 120);
  if (b.reiniciarUso) c.primerUso = null;
  await guardarCodigos(env, lista);
  return json({ ok: true, codigos: lista });
}

export async function onRequestDelete({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  const h = new URL(request.url).searchParams.get("hash");
  const lista = (await leerCodigos(env)).filter((x) => x.hash !== h);
  await guardarCodigos(env, lista);
  return json({ ok: true, codigos: lista });
}
