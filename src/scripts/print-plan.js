/* Shared, measured A4 document for the preview, system printer and vector PDF. */
(() => {
  let root;
  let previousFocus;
  function clean(node) {
    const copy = node.cloneNode(true);
    // Preserve the actual on-screen appearance, including edited text and colors.
    const originals = [node, ...node.querySelectorAll('*')];
    const clones = [copy, ...copy.querySelectorAll('*')];
    const properties = ['font-family','font-size','font-weight','font-style','line-height',
      'letter-spacing','color','background-color','text-align','vertical-align',
      'padding-top','padding-right','padding-bottom','padding-left',
      'border-top-width','border-top-style','border-top-color',
      'border-right-width','border-right-style','border-right-color',
      'border-bottom-width','border-bottom-style','border-bottom-color',
      'border-left-width','border-left-style','border-left-color'];
    originals.forEach((element, index) => {
      const style = getComputedStyle(element);
      properties.forEach(property => clones[index].style.setProperty(property, style.getPropertyValue(property), 'important'));
      if (element.matches('.docHeader,.docHeader *,col')) {
        for (const property of ['display','grid-template-columns','gap','align-items','justify-content','flex-direction','min-height','width','height','margin-top','margin-bottom','transform']) {
          clones[index].style.setProperty(property, style.getPropertyValue(property), 'important');
        }
      }
      if (style.display === 'none') clones[index].style.setProperty('display', 'none', 'important');
    });
    copy.querySelectorAll('button,.pageBreakGuideV322,.signatureChangeToolsV310,.planRowChangeToolsV304,.manualRowControlsV316,.planFieldResetV304').forEach(el => el.remove());
    [copy, ...copy.querySelectorAll('[id],[contenteditable]')].forEach(el => {
      el.removeAttribute('id');
      el.removeAttribute('contenteditable');
    });
    return copy;
  }

  function build(source, target) {
    target.replaceChildren();
    const pages = [];
    const table = source.querySelector('.planTable');
    if (!table) throw new Error('Nejdřív načti nebo vytvoř plán.');
    const title = source.querySelector('.docDates')?.textContent || '';
    let page, flow, body;
    function newPage() {
      page = document.createElement('section');
      page.className = 'previewPage printSheet';
      flow = document.createElement('div');
      flow.className = 'printFlow';
      if (!pages.length) {
        const header = clean(source.querySelector('.docHeader'));
        header.style.setProperty('width','100%','important');
        header.style.setProperty('box-sizing','border-box','important');
        header.style.setProperty('grid-template-columns','minmax(0,1fr) 132px','important');
        header.style.setProperty('gap','12px','important');
        header.style.setProperty('padding-right','8px','important');
        header.querySelectorAll('.docHeaderTextV93,.docHeaderTextV93 > *').forEach(el=>{
          el.style.setProperty('width','auto','important');
          el.style.setProperty('min-width','0','important');
        });
        const logo = header.querySelector('.docLogo');
        if(logo){
          logo.style.setProperty('width','124px','important');
          logo.style.setProperty('height','104px','important');
          logo.style.setProperty('max-width','100%','important');
          logo.style.setProperty('object-fit','contain','important');
          logo.style.setProperty('transform','none','important');
        }
        flow.append(header);
      }
      if (!pages.length) {
        const note = source.querySelector('.planNoteSlotV318:has(.planNoteWrapV310),.planNoteWrapV310');
        if (note) flow.append(clean(note));
      }
      const nextTable = clean(table);
      nextTable.querySelector('tbody').replaceChildren();
      flow.append(nextTable);
      body = nextTable.querySelector('tbody');
      page.append(flow);
      target.append(page);
      pages.push(page);
    }
    const fits = () => flow.getBoundingClientRect().height <= parseFloat(getComputedStyle(page).height) - 30;
    const groups = [];
    for (const original of table.querySelectorAll('tbody > tr')) {
      if (original.classList.contains('weekendRowV184') && document.body.classList.contains('hideWeekendV184')) continue;
      if (original.querySelector('.dayCell') || !groups.length) groups.push([]);
      groups.at(-1).push(clean(original));
    }
    newPage();
    for (const group of groups) {
      const day = group[0].querySelector('.dayCell');
      const makeChunk = (rows, continued, continues = false) => {
        const section = document.createElement('tbody');
        section.className = 'printDayGroup';
        for (const row of rows) {
          const clone = row.cloneNode(true);
          clone.querySelector('.dayCell')?.remove();
          section.append(clone);
        }
        const label = day.cloneNode(true);
        label.rowSpan = rows.length;
        if (continued) {
          const hint = document.createElement('small');
          hint.textContent = 'pokračování';
          label.append(hint);
        }
        if(continues){
          const hint = document.createElement('small');
          hint.className = 'printDayContinuesV335';
          hint.textContent = 'pokračuje na další straně →';
          label.append(hint);
        }
        section.firstElementChild.prepend(label);
        return section;
      };
      let chunk = makeChunk(group, false);
      body.parentNode.append(chunk);
      if (fits()) continue;
      chunk.remove();
      // A day longer than one page is split only between complete event rows.
      let batch = [];
      let continued = false;
      for (const row of group) {
        batch.push(row);
        chunk.remove();
        chunk = makeChunk(batch, continued, true);
        body.parentNode.append(chunk);
        if (!fits() && batch.length === 1 && body.parentNode.querySelectorAll('.printDayGroup').length > 1) {
          chunk.remove();
          newPage();
          body.parentNode.append(chunk);
        }
        if (!fits() && batch.length > 1) {
          chunk.remove();
          batch.pop();
          body.parentNode.append(makeChunk(batch, continued, true));
          newPage();
          continued = true;
          batch = [row];
          chunk = makeChunk(batch, continued, true);
          body.parentNode.append(chunk);
        }
        if (!fits()) {
          // An exceptional single row cannot be kept whole on A4. Never clip it.
          page.classList.add('printOversize');
        }
      }
      chunk.querySelector('.printDayContinuesV335')?.remove();
    }
    // The final chunk of each split day has no forward continuation marker.
    const end = document.createElement('div');
    end.className = 'printEnding';
    const signature = source.querySelector('.podpisFinal41');
    if (signature) end.append(clean(signature));
    if (!document.body.classList.contains('hideCreatedDateV184')) {
      const date = source.querySelector('.createdDateV184');
      if (date) end.append(clean(date));
    }
    flow.append(end);
    if (!fits() && end.children.length) {
      end.remove();
      // Move the last event with the closing block, so a signature is not isolated.
      const lastGroup = flow.querySelector('.printDayGroup:last-child');
      const lastRow = lastGroup?.lastElementChild;
      let carry;
      if (lastRow) {
        const label = lastGroup.querySelector('.dayCell').cloneNode(true);
        label.rowSpan = 1;
        if (lastGroup.children.length > 1) {
          const previousLabel = lastGroup.querySelector('.dayCell');
          previousLabel.rowSpan--;
          if(!previousLabel.querySelector('.printDayContinuesV335')){
            const hint = document.createElement('small');
            hint.className = 'printDayContinuesV335';
            hint.textContent = 'pokračuje na další straně →';
            previousLabel.append(hint);
          }
          label.querySelector('.printDayContinuesV335')?.remove();
          if(![...label.querySelectorAll('small')].some(el=>el.textContent==='pokračování')){
            const hint = document.createElement('small');hint.textContent='pokračování';label.append(hint);
          }
          lastRow.prepend(label);
        }
        carry = document.createElement('tbody');
        carry.className = 'printDayGroup';
        carry.append(lastRow);
        if (!lastGroup.children.length) lastGroup.remove();
      }
      newPage();
      if (carry) body.parentNode.append(carry);
      flow.append(end);
      if (!fits()) page.classList.add('printOversize');
    }
    pages.forEach((sheet,index)=>{
      const label = `Strana ${index + 1} z ${pages.length}`;
      sheet.dataset.pageLabel = label;
      const footer = document.createElement("div");
      footer.className = "printPageNumberV328";
      footer.textContent = label;
      sheet.append(footer);
    });
    const counter = target.closest("#schoolPrintRoot")?.querySelector("[data-print-count-v328]");
    if(counter) counter.textContent = `Celkem stran: ${pages.length}`;
    return pages;
  }

  function createRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'schoolPrintRoot';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Náhled tisku a PDF');
    root.innerHTML = '<div class="printToolbar"><div><strong>Náhled tisku a PDF <b data-print-count-v328></b></strong><span>Stejný vzhled jako v plánu. Stránky jsou rozdělené mezi řádky akcí. PDF uložíš volbou „Uložit jako PDF“. Ponech A4 na výšku a měřítko 100 %. V tiskovém dialogu vypni „Záhlaví a zápatí“, aby se netiskl odkaz na web.</span></div><button type="button" data-print>Vytisknout / uložit PDF</button><button type="button" data-close>Zavřít</button></div><div class="printSheets"></div>';
    document.body.append(root);
    root.querySelector('[data-print]').onclick = () => window.print();
    root.querySelector('[data-close]').onclick = close;
    return root;
  }
  function close() {
    root?.remove();
    root = null;
    document.body.classList.remove('schoolPrintOpen');
    previousFocus?.focus();
  }
  function prepare() {
    const source = document.getElementById('preview');
    if (!source?.querySelector('.planTable')) return false;
    createRoot();
    document.body.classList.add('schoolPrintOpen');
    build(source, root.querySelector('.printSheets'));
    return true;
  }
  async function open() {
    previousFocus = document.activeElement;
    document.activeElement?.blur();
    await document.fonts.ready;
    if (!prepare()) { alert('Nejdřív načti nebo vytvoř plán.'); return; }
    await Promise.all([...root.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
    build(document.getElementById('preview'), root.querySelector('.printSheets'));
    root.querySelector('[data-print]').focus();
  }
  // Capture before the historical PDF listeners can start raster exports.
  document.addEventListener('click', event => {
    if (!event.target.closest('.outputPrintPdfV313,.printOnlyTopButtonV313')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  }, true);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      open();
    }
    if (event.key === 'Escape' && root) close();
    if (event.key === 'Tab' && root) {
      const buttons = [...root.querySelectorAll('.printToolbar button')];
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    }
  });
  window.addEventListener('beforeprint', () => { if (!root) prepare(); });
  window.buildSchoolPrintPages = build;
  window.openSchoolPrintPreview = open;
})();
