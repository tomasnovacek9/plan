import {validRecordId, fromRecords, applyChanges} from '../src/shared/shared-plan.js';
const headers = {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const response = (data,status=200) => new Response(JSON.stringify(data),{status,headers});
const snapshot = row => ({revision:row.revision,records:JSON.parse(row.payload),updatedAt:row.updated_at});
export async function onRequest(context) {
  const {request,env} = context;
  if (!env.PLAN_DB) return response({error:'Společné úložiště není připojeno.'},503);
  if (!['GET','PATCH'].includes(request.method)) return response({error:'Nepodporovaná metoda.'},405);
  const db = env.PLAN_DB.withSession ? env.PLAN_DB.withSession('first-primary') : env.PLAN_DB;
  try {
    const read = () => db.prepare('SELECT revision, payload, updated_at FROM shared_plan_state WHERE id = 1').first();
    if (request.method === 'GET') return response(snapshot(await read()));
    const origin = request.headers.get('origin');
    if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return response({error:'Neplatný původ požadavku.'},403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return response({error:'Požadován JSON.'},415);
    const text = await request.text();
    if (text.length > 1_000_000) return response({error:'Příliš velká změna.'},413);
    let changes;
    try { changes = JSON.parse(text).changes; } catch { return response({error:'Neplatný JSON.'},400); }
    if (!Array.isArray(changes) || !changes.length || changes.length > 1000 || new Set(changes.map(change=>change?.id)).size !== changes.length) return response({error:'Neplatný seznam změn.'},400);
    for (const change of changes) {
      if (!change || !validRecordId(change.id) || ![change.before,change.after].every(value=>value === null || (typeof value === 'string' && value.length <= 100_000))) return response({error:'Neplatná změna.'},400);
      try {
        if (change.before !== null) JSON.parse(change.before);
        if (change.after !== null) fromRecords({[change.id]:change.after});
      } catch { return response({error:'Neplatný obsah změny.'},400); }
    }
    for (let attempt=0;attempt<5;attempt++) {
      const row = await read();
      const {records,conflicts} = applyChanges(JSON.parse(row.payload),changes);
      if (conflicts.length) return response({...snapshot(row),conflicts},409);
      const payload = JSON.stringify(records);
      if (payload.length > 4_000_000) return response({error:'Úložiště plánu je plné.'},413);
      if (payload === row.payload) return response(snapshot(row));
      const updatedAt = new Date().toISOString(), writeId = crypto.randomUUID(), revision = row.revision+1;
      const result = await db.batch([
        db.prepare('UPDATE shared_plan_state SET payload = ?, revision = ?, updated_at = ?, write_id = ? WHERE id = 1 AND revision = ?').bind(payload,revision,updatedAt,writeId,row.revision),
        db.prepare('INSERT INTO shared_plan_history (revision,payload,updated_at,write_id) SELECT revision,payload,updated_at,write_id FROM shared_plan_state WHERE id = 1 AND write_id = ?').bind(writeId)
      ]);
      if (result[0].meta.changes) return response({revision,records,updatedAt});
    }
    return response({error:'Plán právě upravuje více lidí. Zkus uložení znovu.'},503);
  } catch (error) {
    console.error('Shared plan storage failed',error);
    return response({error:'Společné úložiště je dočasně nedostupné.'},503);
  }
}
