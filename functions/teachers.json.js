import { parseTeacherPage, normalizeTeacher } from '../src/shared/teachers.js';
const counseling = 'https://www.zsbabak.cz/a/skolni-poradenske-pracoviste';
const source = 'https://www.zsbabak.cz/a/zamestnanci-skoly';
export async function onRequestGet() {
  const headers = {'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=3600'};
  try {
    const fetchPage = async url => {
      const response = await fetch(url,{signal:AbortSignal.timeout(6000)});
      if(!response.ok) throw new Error('Staff page unavailable');
      return response.text();
    };
    const [main, counselingMain] = await Promise.all([fetchPage(source),fetchPage(counseling)]);
    const nav = main.match(/<ul\b[^>]*id="text19_SubpagesList_2"[\s\S]*?<\/ul>/)?.[0] || '';
    const links = [...nav.matchAll(/href="([^"]+)"/g)].map(m=>new URL(m[1].replace(/&amp;/g,'&'),source));
    const urls = [...new Set(links.filter(u=>u.origin===new URL(source).origin && u.pathname===new URL(source).pathname).map(String))].slice(0,6);
    const counselingLinks = [...counselingMain.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
      .filter(m=>/Školní psycholog|Speciální pedagog/i.test(m[2]))
      .map(m=>m[1].match(/href="([^"]+)"/)?.[1]).filter(Boolean)
      .map(href=>new URL(href.replace(/&amp;/g,'&'),counseling))
      .filter(url=>url.origin===new URL(counseling).origin && url.pathname===new URL(counseling).pathname);
    const counselingUrls = [...new Set(counselingLinks.map(String))];
    if(counselingUrls.length!==2) throw new Error('Counseling directory changed');
    const pages = await Promise.allSettled([...urls,...counselingUrls].map(fetchPage));
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
