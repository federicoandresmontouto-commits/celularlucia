// Panel: leer y guardar todo el contenido del celular.
import { json, exigirAdmin, leerContenido, contenidoOriginal } from "../../../lib/comun.js";

export async function onRequestGet({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  return json(await leerContenido(env));
}

export async function onRequestPut({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  let c;
  try { c = await request.json(); } catch (e) { return json({ error: "Los datos no llegaron bien. Probá de nuevo." }, 400); }
  if (!c || typeof c !== "object" || !Array.isArray(c.chats) || !Array.isArray(c.galeria) || !Array.isArray(c.correos) || !c.centinela) {
    return json({ error: "Faltan partes del contenido. No se guardó nada." }, 400);
  }
  if (!/^\d{4}$/.test(String(c.pin || ""))) return json({ error: "El PIN tiene que tener 4 números." }, 400);
  c.actualizado = new Date().toISOString();
  await env.KV.put("contenido", JSON.stringify(c));
  return json({ ok: true, actualizado: c.actualizado });
}

// Volver al contenido original del Caso 001
export async function onRequestDelete({ request, env }) {
  const no = await exigirAdmin(request, env); if (no) return no;
  await env.KV.delete("contenido");
  return json(contenidoOriginal());
}
