/* Shared, measured A4 document for the preview, system printer and vector PDF. */
(() => {
  let root;
  let previousFocus;
  const clean = node => {
    const clone = node.cloneNode(true);
    clone.querySelectorAll('button,.pageBreakGuideV322,.signatureChangeToolsV310,.planRowChangeToolsV304,.manualRowControlsV316,.planFieldResetV304').forEach(el => el.remove());
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    return clone;
  };

  function build(source, target) {
    target.replaceChildren();
    const pages = [];
    const table = source.querySelector('.planTable');
    if (!table) throw new Error('Nejdřív načti nebo vytvoř plán.');
    const title = source.querySelector('.docDates')?.textContent || '';
    let page, flow, body;
    function newPage() {
      page = document.createElement('section');
      page.className = 'printSheet';
      flow = document.createElement('div');
      flow.className = 'printFlow';
      const header = clean(source.querySelector('.docHeader'));
      if (pages.length) header.classList.add('printCompactHeader');
      flow.append(header);
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
      const makeChunk = (rows, continued) => {
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
        section.firstElementChild.prepend(label);
        return section;
      };
      let chunk = makeChunk(group, false);
      body.parentNode.append(chunk);
      if (fits()) continue;
      chunk.remove();
      if (body.parentNode.querySelector('.printDayGroup')) {
        newPage();
        body.parentNode.append(chunk);
        if (fits()) continue;
        chunk.remove();
      }
      // A day longer than one page is split only between complete event rows.
      let batch = [];
      let continued = false;
      for (const row of group) {
        batch.push(row);
        chunk.remove();
        chunk = makeChunk(batch, continued);
        body.parentNode.append(chunk);
        if (!fits() && batch.length > 1) {
          chunk.remove();
          batch.pop();
          body.parentNode.append(makeChunk(batch, continued));
          newPage();
          continued = true;
          batch = [row];
          chunk = makeChunk(batch, continued);
          body.parentNode.append(chunk);
        }
        if (!fits()) {
          // An exceptional single row cannot be kept whole on A4. Never clip it.
          page.classList.add('printOversize');
        }
      }
    }
    const end = document.createElement('div');
    end.className = 'printEnding';
    const note = source.querySelector('.planNoteWrapV310');
    if (note?.textContent.trim()) end.append(clean(note));
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
          lastGroup.querySelector('.dayCell').rowSpan--;
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
    pages.forEach((sheet, index) => {
      const footer = document.createElement('footer');
      footer.textContent = `${title} · ${index + 1} / ${pages.length}`;
      sheet.append(footer);
    });
    return pages;
  }

  function createRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'schoolPrintRoot';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Náhled tisku a PDF');
    root.innerHTML = '<div class="printToolbar"><div><strong>Náhled tisku a PDF</strong><span>A4 na výšku · PDF uložíš v tiskovém dialogu. Pro přesný výstup ponech měřítko 100 % a vypni záhlaví a zápatí prohlížeče.</span></div><button type="button" data-print>Vytisknout / uložit PDF</button><button type="button" data-close>Zavřít</button></div><div class="printSheets"></div>';
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
  window.addEventListener('beforeprint', prepare);
  window.buildSchoolPrintPages = build;
  window.openSchoolPrintPreview = open;
})();
