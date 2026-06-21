/* ===========================================================
   AUDITA AI · Reportes
   Admin: ve todos | Auditor: genera/exporta | Auditado: ve/exporta los suyos
   REGLA: el reporte solo se puede generar si la auditoría está CERRADA
   =========================================================== */

function renderReports(){
  const role   = State.user.role;
  const audits = getVisibleAudits();

  const subtitles = {
    admin   : 'Vista de todos los reportes del sistema',
    auditor : 'Genera reportes de auditorías y exporta documentación',
    auditado: 'Reportes de auditorías de mi empresa'
  };

  const html = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Reportes</h1>
          <div class="page-subtitle">${subtitles[role]||''}</div>
        </div>
        <div class="page-actions">
          ${hasRole('auditor','admin') ? '<button class="btn btn-primary" onclick="openReportWizard()">+ Generar reporte</button>' : ''}
        </div>
      </div>

      <!-- Info: solo auditorías cerradas -->
      <div style="background:#e0f2fe;border-left:3px solid var(--info);padding:10px 16px;border-radius:6px;font-size:13px;color:#0369a1;margin-bottom:16px">
        ℹ Los reportes solo están disponibles para auditorías <strong>Cerradas</strong>. Las auditorías en otros estados no permiten generar ni descargar documentación.
      </div>

      <!-- Lista de auditorías -->
      <div class="card">
        <div class="card-header"><div class="card-title">Auditorías con reporte disponible</div></div>
        <div class="table-wrap">
          <table class="t">
            <thead><tr>
              <th>Auditoría</th><th>Empresa</th><th>Norma</th><th>Estado</th><th>Hallazgos</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${audits.length ? audits.map(a => {
                const e        = getCompany(a.empresa_id);
                const findings = State.findings.filter(f => f.auditoria_id === a.id);
                const nc       = findings.filter(f => f.tipo.includes('no_conformidad')).length;
                const cerrada  = a.estado === 'cerrada';
                return `<tr style="${!cerrada?'opacity:.55':''}">
                  <td>
                    <div class="cell-strong">${a.codigo}</div>
                    <small class="text-dim">${a.fecha_inicio} → ${a.fecha_fin}</small>
                  </td>
                  <td>${esc(e?.razon_social||'—')}</td>
                  <td><span class="badge badge-info">${getStandardName(a.norma)}</span></td>
                  <td>${estadoAuditoriaBadge(a.estado)}</td>
                  <td>
                    <span class="badge badge-muted">${findings.length} total</span>
                    ${nc > 0 ? `<span class="badge badge-danger" style="margin-left:4px">${nc} NC</span>` : ''}
                  </td>
                  <td class="row-action">
                    ${cerrada
                      ? `<button onclick="previewReport('${a.id}')" title="Vista previa">👁 Preview</button>
                         <button onclick="exportReportPDF('${a.id}')" title="Exportar PDF">📄 PDF</button>
                         <button onclick="exportReportCSV('${a.id}')" title="Exportar CSV">↓ CSV</button>`
                      : `<span class="text-xs text-dim" style="font-style:italic">Disponible al cerrar</span>`}
                  </td>
                </tr>`;
              }).join('') : '<tr><td colspan="6"><div class="empty"><div class="empty-icon">📄</div>Sin auditorías disponibles</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      ${hasRole('auditor','admin') ? `
      <!-- Plantillas de reporte -->
      <div class="card">
        <div class="card-header"><div class="card-title">Plantillas disponibles</div></div>
        <div class="report-templates">
          ${renderReportTemplates()}
        </div>
      </div>` : ''}
    </div>`;

  document.getElementById('pageContainer').innerHTML = html;
}

function renderReportTemplates(){
  const templates = [
    {id:'full', name:'Informe completo de auditoría', desc:'Incluye portada, resumen ejecutivo, hallazgos, planes de acción y conclusiones', icon:'📋'},
    {id:'executive', name:'Resumen ejecutivo', desc:'Visión de alto nivel con KPIs, estado y principales hallazgos', icon:'📊'},
    {id:'findings', name:'Reporte de hallazgos', desc:'Listado completo de hallazgos y no conformidades con estado y acciones', icon:'🚩'},
    {id:'action_plan', name:'Plan de acción', desc:'Estado de todos los planes de acción con avance y fechas límite', icon:'🎯'},
  ];
  return templates.map(t => `
    <div class="report-template-card" onclick="openReportWizard('${t.id}')">
      <div class="report-template-icon">${t.icon}</div>
      <div class="report-template-info">
        <div class="report-template-name">${t.name}</div>
        <div class="report-template-desc">${t.desc}</div>
      </div>
      <button class="btn btn-ghost btn-sm">Generar →</button>
    </div>`).join('');
}

/* -------- Wizard de generación -------- */
function openReportWizard(templateId = 'full'){
  /* Solo auditorías cerradas */
  const audits  = getVisibleAudits().filter(a => a.estado === 'cerrada');
  const audOpts = audits.map(a => {
    const e = getCompany(a.empresa_id);
    return `<option value="${a.id}">${a.codigo} — ${esc(e?.razon_social||'')}</option>`;
  }).join('');
  if (!audits.length){
    toast('No hay auditorías cerradas para generar reporte','error'); return;
  }

  openModal(`
    <div class="modal-head">
      <div class="modal-title">Configurar reporte</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="field" style="grid-column:1/-1"><label>Auditoría *</label>
          <select id="rp_audit">${audOpts||'<option>Sin auditorías</option>'}</select>
        </div>
        <div class="field" style="grid-column:1/-1"><label>Tipo de reporte</label>
          <select id="rp_tipo">
            <option value="full"${templateId==='full'?' selected':''}>Informe completo</option>
            <option value="executive"${templateId==='executive'?' selected':''}>Resumen ejecutivo</option>
            <option value="findings"${templateId==='findings'?' selected':''}>Solo hallazgos</option>
            <option value="action_plan"${templateId==='action_plan'?' selected':''}>Plan de acción</option>
          </select>
        </div>
      </div>
      <div class="field"><label>Incluir secciones</label>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="rp_portada" checked> Portada y datos de la auditoría</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="rp_resumen" checked> Resumen ejecutivo</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="rp_hallazgos" checked> Hallazgos y no conformidades</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="rp_planes" checked> Planes de acción</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="rp_checklist"> Detalle del checklist</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="rp_conclusion" checked> Conclusiones</label>
        </div>
      </div>
      <div class="field"><label>Comentarios adicionales</label>
        <textarea id="rp_comments" placeholder="Observaciones del auditor para incluir en el reporte..."></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-secondary" onclick="previewReportFromWizard()">👁 Vista previa</button>
      <button class="btn btn-primary" onclick="generateReportPDF()">📄 Generar PDF</button>
    </div>`, {size:'lg'});
}

function previewReportFromWizard(){
  const auditId = document.getElementById('rp_audit').value;
  closeModal();
  previewReport(auditId);
}

/* -------- Vista previa del reporte -------- */
function previewReport(auditId){
  const a = State.audits.find(x => x.id === auditId);
  if (!a) return;
  if (a.estado !== 'cerrada'){
    toast('El reporte solo está disponible cuando la auditoría está Cerrada','error'); return;
  }
  const e = getCompany(a.empresa_id);
  const findings = State.findings.filter(f => f.auditoria_id === auditId);
  const actions  = State.actions.filter(p => findings.some(f => f.id === p.hallazgo_id));
  const auditor  = getUserById(a.auditor_id);
  const nc_mayor = findings.filter(f => f.tipo === 'no_conformidad_mayor');
  const nc_menor = findings.filter(f => f.tipo === 'no_conformidad_menor');
  const om       = findings.filter(f => f.tipo === 'oportunidad_mejora');
  const today    = new Date().toLocaleDateString('es-EC', {year:'numeric',month:'long',day:'numeric'});

  openModal(`
    <div class="modal-head">
      <div class="modal-title">Vista previa del reporte · ${a.codigo}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body report-preview">
      <!-- Portada -->
      <div class="report-section report-cover">
        <div class="report-logo">A</div>
        <h1 class="report-title">Informe de Auditoría</h1>
        <h2 class="report-subtitle">${getStandardName(a.norma)}</h2>
        <div class="report-meta-grid">
          <div><strong>Empresa auditada:</strong> ${esc(e?.razon_social||'—')}</div>
          <div><strong>Código:</strong> ${a.codigo}</div>
          <div><strong>Tipo:</strong> ${tipoAuditoriaLabel(a.tipo)}</div>
          <div><strong>Período:</strong> ${a.fecha_inicio} — ${a.fecha_fin}</div>
          <div><strong>Auditor:</strong> ${esc(auditor?.name||'—')}</div>
          <div><strong>Generado:</strong> ${today}</div>
        </div>
      </div>

      <!-- Resumen ejecutivo -->
      <div class="report-section">
        <h3 class="report-section-title">1. Resumen Ejecutivo</h3>
        <p class="text-sm mb-3">${esc(a.objetivo||'Verificar el cumplimiento del sistema de gestión con los requisitos de la norma aplicable.')}</p>
        <div class="report-kpi-row">
          <div class="report-kpi"><div class="report-kpi-val">${findings.length}</div><div class="report-kpi-label">Hallazgos totales</div></div>
          <div class="report-kpi text-danger"><div class="report-kpi-val">${nc_mayor.length}</div><div class="report-kpi-label">NC Mayores</div></div>
          <div class="report-kpi text-warn"><div class="report-kpi-val">${nc_menor.length}</div><div class="report-kpi-label">NC Menores</div></div>
          <div class="report-kpi text-info"><div class="report-kpi-val">${om.length}</div><div class="report-kpi-label">Oport. mejora</div></div>
          <div class="report-kpi"><div class="report-kpi-val">${a.progreso}%</div><div class="report-kpi-label">Cumplimiento</div></div>
        </div>
      </div>

      <!-- Hallazgos -->
      <div class="report-section">
        <h3 class="report-section-title">2. Hallazgos y No Conformidades</h3>
        ${findings.length ? findings.map((f,i) => `
          <div class="report-finding">
            <div class="report-finding-head">
              <strong>${i+1}. ${f.codigo}</strong>
              <span class="badge ${badgeForFinding(f.tipo)}">${tipoHallazgoLabel(f.tipo)}</span>
              ${criticidadBadge(f.criticidad)}
            </div>
            <div class="text-sm mb-1"><strong>Requisito:</strong> ${esc(f.requisito||'—')}</div>
            <div class="text-sm mb-1">${esc(f.descripcion)}</div>
            ${f.evidencia ? `<div class="text-sm text-dim"><strong>Evidencia:</strong> ${esc(f.evidencia)}</div>` : ''}
            ${f.causa_raiz ? `<div class="text-sm text-dim"><strong>Causa raíz:</strong> ${esc(f.causa_raiz)}</div>` : ''}
          </div>`).join('') : '<div class="text-sm text-muted">Sin hallazgos registrados.</div>'}
      </div>

      <!-- Planes de acción -->
      <div class="report-section">
        <h3 class="report-section-title">3. Planes de Acción</h3>
        ${actions.length ? `
          <div class="table-wrap">
            <table class="t">
              <thead><tr><th>#</th><th>Hallazgo</th><th>Plan</th><th>Responsable</th><th>Evidencia</th><th>Estado</th></tr></thead>
              <tbody>${actions.map((p,i) => {
                const f = State.findings.find(x=>x.id===p.hallazgo_id);
                const r = getUserById(p.responsable_id);
                return `<tr>
                  <td>${i+1}</td>
                  <td class="text-sm">${f?.codigo||'—'}</td>
                  <td class="cell-wrap">${esc(p.titulo)}</td>
                  <td class="text-sm">${esc(r?.name||'—')}</td>
                  <td class="text-sm">${p.evidencia_auditado
                    ? `<span class="badge badge-success">✓ Subida</span>`
                    : `<span class="badge badge-muted">Sin evidencia</span>`}</td>
                  <td>${estadoAccionBadge(p.estado)}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : '<div class="text-sm text-muted">Sin planes de acción registrados.</div>'}
      </div>

      <!-- Conclusión -->
      <div class="report-section">
        <h3 class="report-section-title">4. Conclusiones</h3>
        <p class="text-sm">
          ${nc_mayor.length === 0 && nc_menor.length === 0
            ? 'No se detectaron no conformidades. El sistema de gestión demuestra un nivel de cumplimiento adecuado con los requisitos de la norma.'
            : `Se identificaron ${nc_mayor.length} no conformidad(es) mayor(es) y ${nc_menor.length} menor(es) que requieren acción correctiva. Se han establecido ${actions.length} plan(es) de acción para su tratamiento.`}
        </p>
        <p class="text-sm mt-2" style="border-top:1px solid var(--border);padding-top:12px">
          <strong>Auditor responsable:</strong> ${esc(auditor?.name||'—')}<br>
          <strong>Fecha del informe:</strong> ${today}
        </p>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>
      <button class="btn btn-secondary" onclick="exportReportCSV('${auditId}')">↓ CSV</button>
      <button class="btn btn-primary" onclick="exportReportPDF('${auditId}')">📄 Exportar PDF</button>
    </div>`, {size:'xl'});
}

/* -------- Generar PDF -------- */
function generateReportPDF(){
  const auditId = document.getElementById('rp_audit')?.value;
  if (!auditId){ toast('Selecciona una auditoría','error'); return; }
  closeModal();
  exportReportPDF(auditId);
}

function exportReportPDF(auditId){
  const a = State.audits.find(x => x.id === auditId);
  if (!a){ toast('Auditoría no encontrada','error'); return; }
  if (a.estado !== 'cerrada'){ toast('El reporte solo está disponible para auditorías Cerradas','error'); return; }
  const e = getCompany(a.empresa_id);
  const findings = State.findings.filter(f => f.auditoria_id === auditId);
  const actions  = State.actions.filter(p => findings.some(f => f.id === p.hallazgo_id));
  const auditor  = getUserById(a.auditor_id);
  const today    = new Date().toLocaleDateString('es-EC');

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const W = 210, margin = 18;
    let y = margin;

    // Helpers
    const addText = (text, x, size=11, style='normal', color=[30,30,40]) => {
      doc.setFontSize(size); doc.setFont('helvetica', style); doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, W - x - margin);
      doc.text(lines, x, y);
      y += lines.length * size * 0.4 + 2;
    };
    const addLine = () => { doc.setDrawColor(220,220,230); doc.line(margin, y, W-margin, y); y += 5; };
    const checkPage = (needed=30) => { if (y + needed > 280){ doc.addPage(); y = margin; } };

    // Portada
    doc.setFillColor(15, 15, 25); doc.rect(0, 0, W, 80, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(28); doc.setFont('helvetica','bold');
    doc.text('Audita.AI', margin, 35);
    doc.setFontSize(16); doc.setFont('helvetica','normal');
    doc.text('Informe de Auditoría · ' + getStandardName(a.norma), margin, 48);
    doc.setFontSize(11);
    doc.text(`${a.codigo} · ${esc(e?.razon_social||'')}`, margin, 60);
    doc.text(`Generado: ${today}`, margin, 70);
    y = 95;

    // Resumen
    addText('RESUMEN DE LA AUDITORÍA', margin, 13, 'bold', [60,100,200]);
    addLine();
    const info = [['Empresa', e?.razon_social||'—'],['Código', a.codigo],['Período', `${a.fecha_inicio} → ${a.fecha_fin}`],['Auditor', auditor?.name||'—'],['Estado', a.estado],['Progreso checklist', `${a.progreso}%`]];
    info.forEach(([k,v]) => { addText(`${k}: `, margin, 10,'bold'); doc.text(v, margin+40, y-4); });
    y += 4; addLine();
    addText(`Hallazgos: ${findings.length} total · NC Mayores: ${findings.filter(f=>f.tipo==='no_conformidad_mayor').length} · NC Menores: ${findings.filter(f=>f.tipo==='no_conformidad_menor').length}`, margin, 10);

    // Hallazgos
    checkPage(20);
    addText('HALLAZGOS Y NO CONFORMIDADES', margin, 13, 'bold', [60,100,200]);
    addLine();
    findings.forEach((f, i) => {
      checkPage(25);
      addText(`${i+1}. ${f.codigo} — ${tipoHallazgoLabel(f.tipo)} (${f.criticidad||'media'})`, margin, 11, 'bold');
      if (f.requisito) addText(`Requisito: ${f.requisito}`, margin+4, 9, 'normal', [80,80,100]);
      addText(f.descripcion, margin+4, 9);
      y += 2;
    });

    // Planes
    checkPage(20);
    addText('PLANES DE ACCIÓN', margin, 13, 'bold', [60,100,200]);
    addLine();
    actions.forEach((p, i) => {
      checkPage(20);
      const r = getUserById(p.responsable_id);
      addText(`${i+1}. ${p.titulo}`, margin, 11, 'bold');
      addText(`Responsable: ${r?.name||'—'} · Estado: ${p.estado} · Evidencia: ${p.evidencia_auditado?'Sí':'No'}`, margin+4, 9, 'normal', [80,80,100]);
    });

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++){
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(150,150,170);
      doc.text(`Audita.AI · ${a.codigo} · Página ${i}/${pages}`, margin, 290);
    }

    doc.save(`${a.codigo}_informe.pdf`);
    logAction(`Exportó PDF de ${a.codigo}`, 'Reportes');
    toast('PDF generado y descargado', 'success');
  } catch(err){
    console.error(err);
    toast('Error al generar PDF. Verifica que jsPDF esté cargado.', 'error');
  }
}

/* -------- Export CSV -------- */
function exportReportCSV(auditId){
  const a = State.audits.find(x => x.id === auditId);
  if (!a) return;
  const findings = State.findings.filter(f => f.auditoria_id === auditId);
  const rows = [['Código hallazgo','Tipo','Descripción','Requisito','Criticidad','Estado hallazgo','Plan de acción','Responsable plan','Estado plan','Evidencia']];
  findings.forEach(f => {
    const plans = State.actions.filter(p => p.hallazgo_id === f.id);
    if (plans.length){
      plans.forEach(p => {
        const r = getUserById(p.responsable_id);
        rows.push([f.codigo, tipoHallazgoLabel(f.tipo), f.descripcion, f.requisito||'', f.criticidad||'', f.estado,
                   p.titulo, r?.name||'', p.estado, p.evidencia_auditado?'Sí':'No']);
      });
    } else {
      rows.push([f.codigo, tipoHallazgoLabel(f.tipo), f.descripcion, f.requisito||'', f.criticidad||'', f.estado, '—', '—', '—', '—']);
    }
  });
  downloadCSV(rows, `${a.codigo}_reporte.csv`);
  logAction(`Exportó CSV de ${a.codigo}`, 'Reportes');
}
