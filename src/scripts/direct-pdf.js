/* Draw the measured print document as vectors; never rasterize the page. */
(() => {
  let libraries;
  const fontBytes = new Map();
  const loadScript = src => new Promise((resolve,reject) => {
    const script=document.createElement('script');script.src=src;script.onload=resolve;
    script.onerror=()=>{script.remove();reject(new Error('Nepodařilo se načíst knihovnu PDF. Zkus to znovu.'));};
    document.head.append(script);
  });
  async function dependencies() {
    if(!libraries) libraries=Promise.all([
      loadScript('src/vendor/pdf/pdf-lib.min.js'),loadScript('src/vendor/pdf/fontkit.min.js')
    ]).catch(error=>{libraries=null;throw error;});
    await libraries;
  }
  async function bytes(url) {
    const response=await fetch(url);if(!response.ok)throw new Error('Nepodařilo se načíst podklady PDF.');
    return response.arrayBuffer();
  }
  function rgba(value) {
    const parts=String(value).match(/[\d.]+/g)?.map(Number);
    if(!parts||parts.length<3)return null;
    return {color:PDFLib.rgb(parts[0]/255,parts[1]/255,parts[2]/255),opacity:parts[3]??1};
  }
  function visible(element) {
    const style=getComputedStyle(element);
    return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0;
  }
  function documentTitle() {
    const date = id => {
      const value = document.getElementById(id)?.value || '';
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      return match ? `${match[3]}.${match[2]}.${match[1]}` : '';
    };
    const from = date('weekFrom'), to = date('weekTo');
    const range = from && to && from !== to ? `${from}–${to}` : from || to;
    return range ? `Týdenní plán ${range}` : 'Týdenní plán';
  }
  async function generate() {
    document.activeElement?.blur();
    await dependencies();await document.fonts.ready;
    const snapshot=window.createSchoolPrintSnapshot();
    try {
      await Promise.all(snapshot.pages.flatMap(page=>[...page.querySelectorAll('img')].map(img=>img.decode())));
      const {PDFDocument,pushGraphicsState,popGraphicsState,concatTransformationMatrix}=PDFLib;
      const pdf=await PDFDocument.create();pdf.registerFontkit(window.fontkit);
      const title=documentTitle();
      pdf.setTitle(title);pdf.setCreator('Generátor týdenního plánu školy');pdf.setLanguage('cs-CZ');
      const fonts=new Map(),images=new Map();
      async function fontFor(style) {
        const weight=Number(style.fontWeight)||(style.fontWeight==='bold'?700:400);
        const bold=weight>=600,italic=style.fontStyle!=='normal';
        // Match CSS font selection, including the 800 face used by 900 headings.
        const openSans=/Open Sans/i.test(style.fontFamily);
        const faceWeight=weight<=500?400:weight<=600?600:weight<=700?700:800;
        const name=openSans?`OpenSans-${faceWeight}${italic?'-Italic':''}.ttf`:
          bold?(italic?'Roboto-MediumItalic.ttf':'Roboto-Medium.ttf'):(italic?'Roboto-Italic.ttf':'Roboto-Regular.ttf');
        if(!fonts.has(name)) {
          if(!fontBytes.has(name))fontBytes.set(name,bytes('src/assets/fonts/'+name).catch(error=>{fontBytes.delete(name);throw error;}));
          fonts.set(name,await pdf.embedFont(await fontBytes.get(name),{subset:true}));
        }
        return fonts.get(name);
      }
      const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
      for(const sheet of snapshot.pages) {
        const bounds=sheet.getBoundingClientRect();
        const scale=595.2756/bounds.width;
        const page=pdf.addPage([595.2756,841.8898]);
        const rectOf=rect=>({x:(rect.left-bounds.left)*scale,y:841.8898-(rect.bottom-bounds.top)*scale,width:rect.width*scale,height:rect.height*scale});
        // Parent backgrounds and borders precede text, retaining repeating-event colors.
        for(const element of [sheet,...sheet.querySelectorAll('*')]) {
          if(!visible(element)||element===sheet)continue;
          const style=getComputedStyle(element),rect=element.getBoundingClientRect(),box=rectOf(rect);
          const fill=rgba(style.backgroundColor);
          if(fill?.opacity&&rect.width&&rect.height)page.drawRectangle({...box,...fill,borderWidth:0});
          for(const side of ['Top','Right','Bottom','Left']) {
            const width=parseFloat(style['border'+side+'Width']),color=rgba(style['border'+side+'Color']);
            if(!width||!color?.opacity||style['border'+side+'Style']==='none')continue;
            const x=box.x,y=box.y,w=box.width,h=box.height,t=width*scale;
            const horizontal=side==='Top'||side==='Bottom';
            page.drawLine({start:{x:side==='Right'?x+w-t/2:x+(horizontal?0:t/2),y:side==='Top'?y+h-t/2:y+(horizontal?t/2:0)},
              end:{x:horizontal?x+w:(side==='Right'?x+w-t/2:x+t/2),y:horizontal?(side==='Top'?y+h-t/2:y+t/2):y+h},thickness:t,...color});
          }
          if(element.matches('.repeatedEventV50>.eventCell')) {
            const accent=getComputedStyle(element,'::before'),color=rgba(accent.backgroundColor);
            if(accent.content!=='none'&&color?.opacity)page.drawRectangle({x:box.x+2*scale,y:box.y+4*scale,width:3*scale,height:Math.max(0,box.height-8*scale),...color});
          }
          if(element.tagName==='IMG') {
            const url=element.currentSrc||element.src;
            if(!images.has(url)) {
              const data=await bytes(url);
              images.set(url,/\.jpe?g(?:\?|$)/i.test(url)?await pdf.embedJpg(data):await pdf.embedPng(data));
            }
            const image=images.get(url),ratio=Math.min(box.width/image.width,box.height/image.height);
            const width=image.width*ratio,height=image.height*ratio;
            page.drawImage(image,{x:box.x+(box.width-width)/2,y:box.y+(box.height-height)/2,width,height});
          }
        }
        const walker=document.createTreeWalker(sheet,NodeFilter.SHOW_TEXT);
        while(walker.nextNode()) {
          const node=walker.currentNode,parent=node.parentElement;
          if(!visible(parent)||!node.textContent.trim())continue;
          const style=getComputedStyle(parent),font=await fontFor(style),size=parseFloat(style.fontSize)*scale;
          const color=rgba(style.color);if(!color?.opacity)continue;
          context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const metrics=context.measureText('Mg');
          const ascent=metrics.fontBoundingBoxAscent||parseFloat(style.fontSize)*.8;
          const descent=metrics.fontBoundingBoxDescent||parseFloat(style.fontSize)*.2;
          // A DOM Range gives each visible word's real position, including rich text and wrapping.
          for(const match of node.textContent.matchAll(/\S+/gu)) {
            let piece='',pieceRect;
            const flush=()=>{
              if(!piece||!pieceRect?.width)return;
              const value=piece.replace(/\u00a0/g,' '),width=font.widthOfTextAtSize(value,size);
              if(!width)return;
              const box=rectOf(pieceRect),baseline=841.8898-(pieceRect.top-bounds.top+pieceRect.height*ascent/(ascent+descent))*scale;
              page.pushOperators(pushGraphicsState(),concatTransformationMatrix(box.width/width,0,0,1,box.x,0));
              page.drawText(value,{x:0,y:baseline,size,font,...color});page.pushOperators(popGraphicsState());
              if(style.textDecorationLine.includes('underline'))page.drawLine({start:{x:box.x,y:baseline-size*.1},end:{x:box.x+box.width,y:baseline-size*.1},thickness:Math.max(.4,size*.045),...color});
              if(style.textDecorationLine.includes('line-through'))page.drawLine({start:{x:box.x,y:baseline+size*.3},end:{x:box.x+box.width,y:baseline+size*.3},thickness:Math.max(.4,size*.045),...color});
            };
            for(let offset=match.index;offset<match.index+match[0].length;) {
              const character=String.fromCodePoint(node.textContent.codePointAt(offset));
              const range=document.createRange();range.setStart(node,offset);range.setEnd(node,offset+character.length);
              const rect=range.getBoundingClientRect();offset+=character.length;
              if(!rect.width||!rect.height)continue;
              if(pieceRect&&Math.abs(pieceRect.top-rect.top)>1){flush();piece='';pieceRect=null;}
              piece+=character;
              pieceRect=pieceRect?{left:Math.min(pieceRect.left,rect.left),right:Math.max(pieceRect.right,rect.right),top:Math.min(pieceRect.top,rect.top),bottom:Math.max(pieceRect.bottom,rect.bottom),width:Math.max(pieceRect.right,rect.right)-Math.min(pieceRect.left,rect.left),height:Math.max(pieceRect.bottom,rect.bottom)-Math.min(pieceRect.top,rect.top)}:rect;
            }
            flush();
          }
        }
      }
      return {bytes:await pdf.save(),filename:title.replace(/[\\/:*?"<>|]/g,'-')+'.pdf',pages:snapshot.pages.length};
    } finally { snapshot.remove(); }
  }
  let busy=false;
  async function open(button) {
    if(busy)return;busy=true;
    // Open synchronously so browsers keep this associated with the user's click.
    const tab=window.open('','_blank');
    if(tab){tab.document.title='Připravuji PDF…';tab.document.body.textContent='Připravuji PDF, chvíli prosím počkej…';tab.opener=null;}
    const label=button.textContent;button.disabled=true;button.textContent='Připravuji PDF…';
    try {
      const result=await generate(),url=URL.createObjectURL(new Blob([result.bytes],{type:'application/pdf'}));
      // A blob viewer alone loses the filename when saving. Download the named
      // file as part of this export, then keep opening the PDF for reading/printing.
      const link=document.createElement('a');link.href=url;link.download=result.filename;
      document.body.append(link);link.click();link.remove();
      if(tab&&!tab.closed)tab.location.replace(url);
      // Keep the PDF alive while its viewer is open; revoke after that tab closes.
      const timer=setInterval(()=>{if(!tab||tab.closed){URL.revokeObjectURL(url);clearInterval(timer);}},30000);
    } catch(error) {tab?.close();console.error(error);alert('PDF se nepodařilo vytvořit. '+error.message+' Stávající Tisk / export můžeš dál použít.');}
    finally {button.disabled=false;button.textContent=label;busy=false;}
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('.directPdfV344');if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();open(button);
  },true);
  window.generateSchoolPdf=generate;
})();
