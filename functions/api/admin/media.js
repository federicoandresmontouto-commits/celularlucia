// Panel: subir, listar y borrar audios y fotos.
import { json, exigirAdmin, azar } from "../../../lib/comun.js";

const MAX = 20 * 1024 * 1024; // 20 MB
const PERMITIDOS = /^(audio|image)\//;

export async function onRequestPost({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  const tipo = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!PERMITIDOS.test(tipo)) return json({ error: "Solo se pueden subir audios o imágenes." }, 400);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ error: "El archivo llegó vacío." }, 400);
  if (buf.byteLength > MAX) return json({ error: "El archivo pesa más de 20 MB. Achicalo y probá de nuevo." }, 400);
  let nombre = "";
  try { nombre = decodeURIComponent(request.headers.get("x-nombre") || ""); } catch (e) {}
  const id = azar(16, "abcdefghijkmnpqrstuvwxyz23456789");
  await env.KV.put("media:" + id, buf, {
    metadata: { tipo, nombre: nombre.slice(0, 120), tam: buf.byteLength, creado: new Date().toISOString() },
  });
  return json({ ok: true, id, url: "/media/" + id });
}

export async function onRequestGet({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  const items = [];
  let cursor;
  do {
    const r = await env.KV.list({ prefix: "media:", cursor });
    r.keys.forEach((k) => items.push({ id: k.name.slice(6), url: "/media/" + k.name.slice(6), ...(k.metadata || {}) }));
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  items.sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
  return json(items);
}

export async function onRequestDelete({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  const id = (new URL(request.url).searchParams.get("id") || "").replace(/[^a-z0-9]/g, "");
  if (!id) return json({ error: "Falta el archivo a borrar." }, 400);
  await env.KV.delete("media:" + id);
  return json({ ok: true });
}
