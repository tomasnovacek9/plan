export const normalizeTeacher = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

export function parseTeacherPage(html) {
  const start = html.search(/id="text\d+_SubpageContent_1"/);
  if (start < 0) return [];
  const content = html.slice(start).split(/<script\b/i)[0];
  const decode = text => text.replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_,n)=>String.fromCodePoint(Number(n))).trim();
  const people = [];
  for (const match of content.matchAll(/<(?:div|h[2-4]|strong|span|p|li)\b[^>]*>([^<>]{3,160})<\/(?:div|h[2-4]|strong|span|p|li)>/gi)) {
    const name = decode(match[1]).replace(/\b(?:Mgr|MgA|Bc|Ing|PhDr|PaedDr|JUDr|RNDr|MUDr|DiS|PhD)\.\s*/g, '').replace(/\s+/g,' ').replace(/,\s*$/, '').trim();
    if (!/^\p{Lu}\p{Ll}+(?:[- ]\p{Lu}\p{Ll}+){1,3}$/u.test(name)) continue;
    const parts = name.split(' ');
    people.push({ firstName:parts[0], surname:parts.slice(1).join(' ') });
  }
  return [...new Map(people.map(p=>[normalizeTeacher(p.firstName+p.surname),p])).values()];
}

export function resolveTeacherCode(code, people) {
  const raw = String(code || '');
  const value = raw.trim();
  const assistant = value.match(/^(.*?)\s*\(AP\)$/i);
  if(assistant){
    const expanded = resolveTeacherCode(assistant[1],people);
    return expanded!==assistant[1] ? raw.replace(value,`${expanded} (AP)`) : raw;
  }
  if (!/^[\p{L}.\s-]+$/u.test(value) || /^(TU|AJ|CJ|M|TV)$/i.test(value)) return raw;
  const normalized = normalizeTeacher(value);
  if (normalized.length < 3) return raw;
  // School-confirmed corrections while the public website is being updated.
  const correction = {brl:{surname:'Brlicová'},ondr:{surname:'Ondráčková'},kon:{firstName:'Eva',surname:'Konečná'}}[normalized];
  if(correction){
    const matches = people.filter(p=>normalizeTeacher(p.surname)===normalizeTeacher(correction.surname) && (!correction.firstName || normalizeTeacher(p.firstName)===normalizeTeacher(correction.firstName)));
    return matches.length>1 ? raw : raw.replace(value,matches[0]?.surname || correction.surname);
  }
  // Explicitly confirmed by the school; resolve against the current directory.
  const confirmedSurname = {dan:'dankova',scholl:'scholler',schollm:'schollerova',burs:'burian'}[normalized];
  if(confirmedSurname){
    const confirmed = people.filter(p=>normalizeTeacher(p.surname)===confirmedSurname);
    return confirmed.length===1 ? raw.replace(value,confirmed[0].surname) : raw;
  }
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
