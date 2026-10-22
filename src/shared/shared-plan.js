/* Shared storage contract. Browser-only preferences and calendar source are excluded. */
const scoped = /^tydenni_plan_(manual_events_v167|responsible_overrides_v213|cell_overrides_v302|deleted_rows_v302|cell_styles_v307|rich_html_v308|signature_text_v316|signature_role_v312)__\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/;
export function isSharedKey(key) {
  return scoped.test(key) || /^tydenni_plan_created_(date_v336|author_v337)_\d{4}-\d{2}-\d{2}$/.test(key) || ['tydenni_plan_week_notes_v174','tydenni_plan_hide_weekend_v184','tydenni_plan_hide_created_v184'].includes(key);
}
const isManual = key => key.startsWith('tydenni_plan_manual_events_v167__');
const isMap = key => /_(overrides_v213|overrides_v302|rows_v302|styles_v307|html_v308)__/.test(key) || key === 'tydenni_plan_week_notes_v174';
const dangerous = key => ['__proto__','prototype','constructor'].includes(key);
export function validRecordId(id) {
  try {
    const parts = JSON.parse(id);
    return Array.isArray(parts) && parts.length > 0 && parts.length <= 8 && isSharedKey(parts[0]) && parts.every(part=>typeof part === 'string' && part.length <= 1200 && !dangerous(part));
  } catch { return false; }
}
export function toRecords(entries) {
  const records = Object.create(null);
  for (const [key, raw] of Object.entries(entries)) {
    if (!isSharedKey(key) || raw === null) continue;
    if (isManual(key)) {
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) throw new Error('Neplatný seznam vlastních akcí.');
      for (const event of list) {
        if (!event || typeof event.uid !== 'string' || !event.uid.startsWith('manual-')) throw new Error('Vlastní akce nemá platné ID.');
        records[JSON.stringify([key,event.uid])] = JSON.stringify(event);
      }
    } else if (isMap(key)) {
      const walk = (value, path) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          for (const [field, child] of Object.entries(value)) {
            if (dangerous(field)) throw new Error('Neplatný klíč.');
            walk(child,[...path,field]);
          }
        } else records[JSON.stringify(path)] = JSON.stringify(value);
      };
      walk(JSON.parse(raw),[key]);
    } else records[JSON.stringify([key])] = JSON.stringify(raw);
  }
  return records;
}
export function fromRecords(records, sanitizeRich = text => text) {
  const values = Object.create(null);
  for (const [id, raw] of Object.entries(records)) {
    if (!validRecordId(id)) throw new Error('Neplatný sdílený záznam.');
    const [key,...path] = JSON.parse(id);
    let value = JSON.parse(raw);
    if (key.startsWith('tydenni_plan_rich_html_v308__')) value = sanitizeRich(String(value || ''));
    if (isManual(key)) {
      if (path.length !== 1 || !value || value.uid !== path[0]) throw new Error('Neplatná vlastní akce.');
      (values[key] ||= []).push(value);
    } else if (isMap(key)) {
      if (!path.length) throw new Error('Neplatná mapa úprav.');
      let object = values[key] ||= Object.create(null);
      for (const part of path.slice(0,-1)) object = object[part] ||= Object.create(null);
      object[path.at(-1)] = value;
    } else {
      if (path.length || typeof value !== 'string') throw new Error('Neplatná hodnota.');
      values[key] = value;
    }
  }
  return Object.fromEntries(Object.entries(values).map(([key,value])=>[key,isMap(key)||isManual(key)?JSON.stringify(value):value]));
}
export function difference(before, after) {
  return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(id=>(before[id]??null)!==(after[id]??null)).map(id=>({id,before:before[id]??null,after:after[id]??null}));
}
export function applyChanges(records, changes) {
  const conflicts = changes.filter(change=>(records[change.id]??null)!==change.before && (records[change.id]??null)!==change.after).map(change=>change.id);
  if (conflicts.length) return {conflicts,records};
  const next = {...records};
  for (const change of changes) {
    if (change.after === null) delete next[change.id];
    else next[change.id] = change.after;
  }
  return {conflicts:[],records:next};
}
