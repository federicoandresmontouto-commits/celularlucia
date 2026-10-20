// Sirve audios y fotos guardados en KV. Soporta pedidos parciales (necesario para audio en iPhone).
export async function onRequestGet({ request, env, params }) {
  if (!env.KV) return new Response("Sin almacenamiento", { status: 500 });
  const id = String(params.id || "").replace(/[^a-zA-Z0-9]/g, "");
  const { value, metadata } = await env.KV.getWithMetadata("media:" + id, "arrayBuffer");
  if (!value) return new Response("No encontrado", { status: 404 });
  const tipo = (metadata && metadata.tipo) || "application/octet-stream";
  const total = value.byteLength;
  const base = {
    "content-type": tipo,
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=31536000, immutable",
  };
  const rango = request.headers.get("range");
  const m = rango && /bytes=(\d*)-(\d*)/.exec(rango);
  if (m && (m[1] !== "" || m[2] !== "")) {
    let ini, fin;
    if (m[1] === "") { ini = Math.max(0, total - parseInt(m[2], 10)); fin = total - 1; }
    else { ini = parseInt(m[1], 10); fin = m[2] === "" ? total - 1 : Math.min(parseInt(m[2], 10), total - 1); }
    if (ini >= total || ini > fin) return new Response(null, { status: 416, headers: { ...base, "content-range": "bytes */" + total } });
    return new Response(value.slice(ini, fin + 1), {
      status: 206,
      headers: { ...base, "content-range": `bytes ${ini}-${fin}/${total}`, "content-length": String(fin - ini + 1) },
    });
  }
  return new Response(value, { headers: { ...base, "content-length": String(total) } });
}
