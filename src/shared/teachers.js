export const normalizeTeacher = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

export function parseTeacherPage(html) {
  const start = html.indexOf('id="text19_SubpageContent_1"');
  if (start < 0) return [];
  const content = html.slice(start).split(/<script\b/i)[0];
  const decode = text => text.replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_,n)=>String.fromCodePoint(Number(n))).trim();
  const people = [];
  for (const match of content.matchAll(/<(?:div|h[2-4]|strong)\b[^>]*>([^<>]{3,160})<\/(?:div|h[2-4]|strong)>/gi)) {
    const name = decode(match[1]).replace(/\b(?:Mgr|MgA|Bc|Ing|PhDr|PaedDr|JUDr|RNDr|MUDr|DiS|PhD)\.\s*/g, '').replace(/\s+/g,' ').trim();
    if (!/^\p{Lu}\p{Ll}+(?:[- ]\p{Lu}\p{Ll}+){1,3}$/u.test(name)) continue;
    const parts = name.split(' ');
    people.push({ firstName:parts.slice(0,-1).join(' '), surname:parts.at(-1) });
  }
  return [...new Map(people.map(p=>[normalizeTeacher(p.firstName+p.surname),p])).values()];
}

export function resolveTeacherCode(code, people) {
  const raw = String(code || '');
  const value = raw.trim();
  if (!/^[\p{L}.\s-]+$/u.test(value) || /^(TU|AJ|CJ|M|TV)$/i.test(value)) return raw;
  const normalized = normalizeTeacher(value);
  if (normalized.length < 3) return raw;
  // A complete name is already explicit and must not be shortened.
  if (people.some(p=>normalizeTeacher(p.firstName+p.surname)===normalized)) return raw;
  const possibilities = [{prefix:normalized,initial:''}];
  const trailing = value.match(/^([\p{L}]{3,})[.\s]+([\p{L}])[.]?$/u) || value.match(/^([\p{L}]{3,}?)(\p{Lu})$/u);
  const leading = value.match(/^([\p{L}])[.\s]+([\p{L}]{3,})[.]?$/u) || value.match(/^(\p{Lu})(\p{Lu}[\p{L}]{2,})$/u);
  if(trailing) possibilities.push({prefix:normalizeTeacher(trailing[1]),initial:normalizeTeacher(trailing[2])});
  if(leading) possibilities.push({prefix:normalizeTeacher(leading[2]),initial:normalizeTeacher(leading[1])});
  const matches = new Map();
  for(const p of people){
    if(possibilities.some(x=>normalizeTeacher(p.surname).startsWith(x.prefix) && (!x.initial || normalizeTeacher(p.firstName).startsWith(x.initial)))) matches.set(normalizeTeacher(p.firstName+p.surname),p);
  }
  if(matches.size!==1) return raw;
  const person = [...matches.values()][0];
  return value===person.surname ? raw : raw.replace(value,person.surname);
}

export function expandTeacherList(text, people) {
  return String(text || '').split(/([,;\/\n]+)/).map(part=>/^[,;\/\n]+$/.test(part)?part:resolveTeacherCode(part,people)).join('');
}
