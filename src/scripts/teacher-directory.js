import { expandTeacherList, resolveTeacherCode, normalizeTeacher } from '../shared/teachers.js?v=20261019-kre-diacritics-v22';
let directory = [];
window.expandPlanTeacherNamesV333 = text => expandTeacherList(text,directory);
window.getUnresolvedTeacherCodesV335 = values => ({available:directory.length>0,codes:[...new Set(values.flatMap(value=>String(value).split(/[,;\/\n]+/)).map(value=>value.trim()).filter(value=>value && !/^TU$/i.test(value) && resolveTeacherCode(value,directory)===value && !directory.some(p=>normalizeTeacher(p.surname)===normalizeTeacher(value)||normalizeTeacher(p.firstName+p.surname)===normalizeTeacher(value))))].sort((a,b)=>a.localeCompare(b,'cs'))});
try {
  const response = await fetch('/teachers.json?v=20261019-kre-diacritics-v22',{signal:AbortSignal.timeout(10000)});
  if(response.ok){
    const data = await response.json();
    if(Array.isArray(data.teachers)) directory = data.teachers.filter(p=>typeof p.firstName==='string' && typeof p.surname==='string');
    // Update only display HTML: original event values and saved edit keys stay intact.
    if(directory.length && typeof window.renderPreview==='function' && document.querySelector('#preview .planTable')) window.renderPreview();
  }
} catch { /* Calendar and manual editing remain usable with the original codes. */ }
