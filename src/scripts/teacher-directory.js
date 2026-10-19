import { expandTeacherList } from '../shared/teachers.js?v=20261019-dan-alias-v16';
let directory = [];
window.expandPlanTeacherNamesV333 = text => expandTeacherList(text,directory);
try {
  const response = await fetch('/teachers.json',{signal:AbortSignal.timeout(10000)});
  if(response.ok){
    const data = await response.json();
    if(Array.isArray(data.teachers)) directory = data.teachers.filter(p=>typeof p.firstName==='string' && typeof p.surname==='string');
    // Update only display HTML: original event values and saved edit keys stay intact.
    if(directory.length && typeof window.renderPreview==='function' && document.querySelector('#preview .planTable')) window.renderPreview();
  }
} catch { /* Calendar and manual editing remain usable with the original codes. */ }
