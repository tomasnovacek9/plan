import { parseTeacherPage, normalizeTeacher } from '../src/shared/teachers.js';
const source = 'https://www.zsbabak.cz/a/zamestnanci-skoly';
export async function onRequestGet() {
  const headers = {'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=3600'};
  try {
    const fetchPage = async url => {
      const response = await fetch(url,{signal:AbortSignal.timeout(6000)});
      if(!response.ok) throw new Error('Staff page unavailable');
      return response.text();
    };
    const main = await fetchPage(source);
    const nav = main.match(/<ul\b[^>]*id="text19_SubpagesList_2"[\s\S]*?<\/ul>/)?.[0] || '';
    const links = [...nav.matchAll(/href="([^"]+)"/g)].map(m=>new URL(m[1].replace(/&amp;/g,'&'),source));
    const urls = [...new Set(links.filter(u=>u.origin===new URL(source).origin && u.pathname===new URL(source).pathname).map(String))].slice(0,6);
    const pages = await Promise.allSettled(urls.map(fetchPage));
    // Never infer a unique match from an incomplete directory.
    if(!urls.length || pages.some(p=>p.status!=='fulfilled')) throw new Error('Incomplete staff directory');
    const parsed = [main,...pages.map(p=>p.value)].map(parseTeacherPage);
    if(parsed.some(list=>!list.length)) throw new Error('Incomplete staff directory');
    const teachers = [...new Map(parsed.flat().map(p=>[normalizeTeacher(p.firstName+p.surname),p])).values()];
    if(teachers.length<10) throw new Error('Staff layout changed');
    return new Response(JSON.stringify({teachers,source,updatedAt:new Date().toISOString()}),{headers});
  } catch {
    return new Response(JSON.stringify({teachers:[],source}),{status:503,headers:{...headers,'cache-control':'no-store'}});
  }
}
