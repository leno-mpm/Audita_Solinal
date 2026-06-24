/* ===========================================================
   AUDITA AI · Planes de acción
   Estados: Abierto / Cerrado
   - Abierto al crearse
   - Auto-cierra si la fecha_limite del hallazgo relacionado ya pasó
   - Auditor puede cerrar manualmente en cualquier momento
   - Auditado sube evidencia (el plan sigue Abierto hasta que auditor cierre)
   =========================================================== */

function autoCloseActionsByFinding(){
  const today = new Date().toISOString().slice(0,10);
  getVisibleActions().forEach(p => {
    if (p.estado === 'cerrado') return;
    /* Usar la fecha límite propia del plan; si no tiene, la del hallazgo */
    const f         = State.findings.find(x => x.id === p.hallazgo_id);
    const fechaRef  = p.fecha_limite || f?.fecha_limite || '';
    if (fechaRef && fechaRef < today){
      p.estado       = 'cerrado';
      p.fecha_cierre = p.fecha_cierre || today;
    }
  });
}

function renderActions(){
  autoCloseActionsByFinding();
  const role = State.user.role;
  const list = getVisibleActions();

  const audOpts = getVisibleAudits()
    .map(a => `<option value="${a.id}">${a.codigo} — ${getCompany(a.empresa_id)?.razon_social||''}</option>`)
    .join('');

  const html = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Planes de acción</h1>
          <div class="page-subtitle">${role==='admin'?'Todos los planes del sistema':role==='auditor'?'Planes de mis hallazgos':'Planes de mi empresa'}</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportActionsCSV()">↓ CSV</button>
          ${hasRole('auditor') ? '<button class="btn btn-primary" onclick="openActionForm()">+ Nuevo plan</button>' : ''}
        </div>
      </div>

      <!-- Stats — números en negro -->
      <div class="stats-grid" data-cols="4">
        <div class="stat-card"><div class="stat-value">${list.length}</div><div class="stat-label">Total planes</div></div>
        <div class="stat-card"><div class="stat-value">${list.filter(p=>p.estado==='abierto').length}</div><div class="stat-label">Abiertos</div></div>
        <div class="stat-card"><div class="stat-value">${list.filter(p=>!!(p.evidencia_auditado)).length}</div><div class="stat-label">Con evidencia</div></div>
        <div class="stat-card"><div class="stat-value">${list.filter(p=>p.estado==='cerrado').length}</div><div class="stat-label">Cerrados</div></div>
      </div>

      <!-- Filtros -->
      <div class="card">
        <div class="form-grid">
          <div class="field"><label>Auditoría</label>
            <select id="f_act_aud" onchange="onActAudChange()">
              <option value="">Todas</option>
              ${audOpts}
            </select>
          </div>
          <div class="field"><label>Hallazgo</label>
            <select id="f_act_fnd" onchange="renderActionsTable()">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="field"><label>Estado</label>
            <select id="f_act_estado" onchange="renderActionsTable()">
              <option value="">Todos</option>
              <option value="abierto">Abierto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          <div class="field"><label>Buscar</label>
            <input id="f_act_q" placeholder="Título, descripción..." oninput="renderActionsTable()">
          </div>
        </div>
      </div>

      <div class="card" id="actionsTableCard">
        <div class="card-header"><div class="card-title">Listado de planes</div></div>
        <div id="actionsTable"></div>
      </div>
    </div>`;

  document.getElementById('pageContainer').innerHTML = html;
  renderActionsTable();
}

function onActAudChange(){
  const audId = document.getElementById('f_act_aud')?.value || '';
  const sel   = document.getElementById('f_act_fnd');
  if (!sel) return;
  let findings = getVisibleFindings();
  if (audId) findings = findings.filter(f => f.auditoria_id === audId);
  sel.innerHTML = '<option value="">Todos</option>' +
    findings.map(f => `<option value="${f.id}">${f.codigo} — ${esc(f.descripcion.slice(0,50))}</option>`).join('');
  renderActionsTable();
}

function renderActionsTable(){
  const audId  = document.getElementById('f_act_aud')?.value    || '';
  const fndId  = document.getElementById('f_act_fnd')?.value    || '';
  const estado = document.getElementById('f_act_estado')?.value || '';
  const q      = (document.getElementById('f_act_q')?.value     || '').toLowerCase();

  let list = getVisibleActions();
  if (audId)  list = list.filter(p => {
    const f = State.findings.find(x => x.id === p.hallazgo_id);
    return f?.auditoria_id === audId;
  });
  if (fndId)  list = list.filter(p => p.hallazgo_id === fndId);
  if (estado) list = list.filter(p => p.estado === estado);
  if (q)      list = list.filter(p =>
    (p.titulo||'').toLowerCase().includes(q) ||
    (p.descripcion||'').toLowerCase().includes(q));

  document.getElementById('actionsTable').innerHTML = `
    <div class="table-wrap">
      <table class="t">
        <thead><tr>
          <th>Código</th><th>Empresa</th><th>Auditoría</th><th>Hallazgo</th><th>Responsable</th><th>Fecha límite</th><th>Evidencia</th><th>Estado</th><th></th>
        </tr></thead>
        <tbody>
          ${list.length ? list.map(p => {
            const finding  = State.findings.find(f => f.id === p.hallazgo_id);
            const audit    = finding ? State.audits.find(a => a.id === finding.auditoria_id) : null;
            const empresa  = finding ? State.companies.find(c => c.id === finding.empresa_id) : null;
            const resp     = getUserById(p.responsable_id);
            const vencido  = p.fecha_limite && new Date().toISOString().slice(0,10) > p.fecha_limite && p.estado !== 'cerrado';
            const tieneEvidencia = !!(p.evidencia_auditado);
            return `<tr>
              <td class="cell-mono">${p.codigo}</td>
              <td class="text-sm cell-strong">${esc(empresa?.razon_social||'—')}</td>
              <td class="text-xs text-dim">${audit?.codigo||'—'}</td>
              <td class="text-sm text-dim">${finding?.codigo||'—'}</td>
              <td class="text-sm">${esc(resp?.name||'—')}</td>
              <td class="text-xs ${vencido ? 'text-danger' : 'text-dim'}">${p.fecha_limite||'—'}</td>
              <td>${tieneEvidencia
                ? '<span class="badge badge-success">✓ Subida</span>'
                : '<span class="badge badge-muted">Sin evidencia</span>'}</td>
              <td>${estadoAccionBadge(p.estado)}</td>
              <td class="row-action">
                <button onclick="openActionDetail('${p.id}')" title="Ver detalle">👁</button>
                ${hasRole('auditado') && p.estado === 'abierto'
                  ? `<button onclick="uploadEvidenceModal('${p.id}')" title="Subir evidencia">📎</button>` : ''}
                ${hasRole('auditor') && p.estado === 'abierto'
                  ? `<button onclick="closeActionConfirm('${p.id}')" title="Cerrar plan">🔒</button>` : ''}
              </td>
            </tr>`;
          }).join('') : '<tr><td colspan="9"><div class="empty"><div class="empty-icon">🎯</div>Sin planes con los filtros aplicados</div></td></tr>'}
        </tbody>
      </table>
    </div>`;
}

/* -------- Nuevo plan (solo auditor) -------- */
function openActionForm(hallazgoId = null){
  if (!hasRole('auditor')){ toast('Solo el auditor puede crear planes de acción','error'); return; }

  const findings = getVisibleFindings().filter(f => f.estado === 'abierto');
  const fndOpts  = findings.map(f =>
    `<option value="${f.id}"${f.id===hallazgoId?' selected':''}
      data-limite="${f.fecha_limite||''}">${f.codigo} — ${esc(f.descripcion.slice(0,60))}</option>`
  ).join('');
  const respOpts = USERS_DB.filter(u => u.role === 'auditado').map(u =>
    `<option value="${u.id}">${esc(u.name)}</option>`
  ).join('');

  /* Fecha límite inicial: tomada del hallazgo preseleccionado o vacía */
  const today      = new Date().toISOString().slice(0,10);
  const initFnd    = findings.find(f => f.id === hallazgoId) || findings[0];
  const initMax    = initFnd?.fecha_limite || '';
  const initLimite = initMax || today;

  openModal(`
    <div class="modal-head">
      <div class="modal-title">Nuevo plan de acción</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="field" style="grid-column:1/-1">
          <label>Hallazgo relacionado *</label>
          <select id="nAct_fnd" onchange="onActionFndChange()">${fndOpts||'<option value="">Sin hallazgos abiertos</option>'}</select>
        </div>
        <div class="field" style="grid-column:1/-1">
          <label>Título del plan *</label>
          <input id="nAct_titulo" placeholder="Ej: Actualización del procedimiento de control de documentos">
        </div>
        <div class="field"><label>Tipo de acción</label>
          <select id="nAct_tipo">
            <option value="correctiva">Correctiva</option>
            <option value="preventiva">Preventiva</option>
            <option value="mejora">Mejora</option>
          </select>
        </div>
        <div class="field"><label>Responsable (auditado) *</label>
          <select id="nAct_resp">${respOpts||'<option value="">Sin auditados</option>'}</select>
        </div>
        <div class="field"><label>Prioridad</label>
          <select id="nAct_prio">
            <option value="alta">Alta</option>
            <option value="media" selected>Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div class="field">
          <label>Fecha de inicio *</label>
          <input type="date" id="nAct_inicio" value="${today}" max="${initMax}">
        </div>
        <div class="field">
          <label>Fecha límite *</label>
          <input type="date" id="nAct_limite" value="${initLimite}" max="${initMax}">
          ${initMax ? `<div class="text-xs text-dim mt-1">Máx. permitido por el hallazgo: <strong>${initMax}</strong></div>` : ''}
        </div>
      </div>
      <div class="field"><label>Descripción detallada * <span class="text-xs text-dim">(qué debe hacer el auditado)</span></label>
        <textarea id="nAct_desc" placeholder="Describe las acciones que debe tomar el representante de la empresa..."></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNewAction()">Crear plan</button>
    </div>`, {size:'lg'});
}

function onActionFndChange(){
  const sel     = document.getElementById('nAct_fnd');
  const opt     = sel?.options[sel.selectedIndex];
  const maxDate = opt?.dataset.limite || '';
  const limField   = document.getElementById('nAct_limite');
  const inicioField = document.getElementById('nAct_inicio');
  if (limField){
    limField.max = maxDate;
    if (maxDate && limField.value > maxDate) limField.value = maxDate;
    /* Actualizar hint */
    const hint = limField.nextElementSibling;
    if (hint && hint.classList.contains('text-xs')){
      hint.innerHTML = maxDate ? `Máx. permitido por el hallazgo: <strong>${maxDate}</strong>` : '';
    }
  }
  if (inicioField && maxDate) inicioField.max = maxDate;
}

function saveNewAction(){
  const hallazgo_id    = document.getElementById('nAct_fnd').value;
  const titulo         = document.getElementById('nAct_titulo').value.trim();
  const tipo           = document.getElementById('nAct_tipo').value;
  const responsable_id = document.getElementById('nAct_resp').value;
  const prioridad      = document.getElementById('nAct_prio').value;
  const descripcion    = document.getElementById('nAct_desc').value.trim();
  const fecha_inicio   = document.getElementById('nAct_inicio').value;
  const fecha_limite   = document.getElementById('nAct_limite').value;

  if (!hallazgo_id || !titulo || !responsable_id || !descripcion || !fecha_inicio || !fecha_limite){
    toast('Completa todos los campos obligatorios (*)','error'); return;
  }

  const finding = State.findings.find(x => x.id === hallazgo_id);

  /* Validar fechas */
  if (fecha_inicio > fecha_limite){
    toast('La fecha de inicio no puede ser posterior a la fecha límite','error'); return;
  }
  if (finding?.fecha_limite && fecha_limite > finding.fecha_limite){
    toast(`La fecha límite no puede superar la del hallazgo (${finding.fecha_limite})`, 'error'); return;
  }

  const codigo  = `PA-${new Date().getFullYear()}-${String(State.actions.length+1).padStart(3,'0')}`;

  State.actions.unshift({
    id: 'p'+(State.actions.length+1), codigo, hallazgo_id, titulo, tipo,
    descripcion, responsable_id, prioridad,
    auditoria_id: finding?.auditoria_id || '',
    estado:'abierto',
    evidencia_auditado: '',
    fecha_creacion: new Date().toISOString().slice(0,10),
    fecha_inicio,
    fecha_limite,
    fecha_evidencia: '',
    comentarios:[]
  });

  logAction(`Creó plan de acción ${codigo} para ${finding?.codigo||hallazgo_id}`, 'Planes de acción');
  closeModal();
  toast(`Plan ${codigo} creado`, 'success');
  navigate('actions');
}

/* -------- Detalle del plan -------- */
function openActionDetail(id){
  const p       = State.actions.find(x => x.id === id);
  if (!p) return;
  const finding = State.findings.find(f => f.id === p.hallazgo_id);
  const audit   = finding ? State.audits.find(a => a.id === finding.auditoria_id) : null;
  const resp    = getUserById(p.responsable_id);

  openModal(`
    <div class="modal-head">
      <div>
        <div class="modal-title">${p.codigo} — ${esc(p.titulo)}</div>
        <div class="mt-2">
          ${estadoAccionBadge(p.estado)}
          <span class="badge badge-muted">${p.tipo||'correctiva'}</span>
          <span class="badge ${p.prioridad==='alta'?'badge-danger':p.prioridad==='media'?'badge-warn':'badge-info'}">${p.prioridad||'—'}</span>
        </div>
      </div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">

      <!-- Datos del plan -->
      <div class="form-grid-2 mb-3">
        <div><strong class="text-xs text-dim">Hallazgo</strong><div>${finding?.codigo||'—'}</div></div>
        <div><strong class="text-xs text-dim">Auditoría</strong><div>${audit?.codigo||'—'}</div></div>
        <div><strong class="text-xs text-dim">Responsable</strong><div>${esc(resp?.name||'—')}</div></div>
        <div><strong class="text-xs text-dim">Creado</strong><div>${p.fecha_creacion||'—'}</div></div>
        <div><strong class="text-xs text-dim">Fecha de inicio</strong><div>${p.fecha_inicio||'—'}</div></div>
        <div>
          <strong class="text-xs text-dim">Fecha límite</strong>
          <div class="${p.fecha_limite && new Date().toISOString().slice(0,10) > p.fecha_limite && p.estado !== 'cerrado' ? 'text-danger' : ''}">${p.fecha_limite||'—'}</div>
        </div>
      </div>
      <div class="mb-4">
        <strong class="text-xs text-dim">Descripción del plan (qué debe hacer el auditado)</strong>
        <div class="text-sm mt-1" style="background:var(--surface2);padding:12px;border-radius:8px">${esc(p.descripcion)}</div>
      </div>

      <!-- Evidencia del auditado -->
      <div style="border-top:1px solid var(--border);padding-top:14px">
        <strong class="text-xs text-dim">📎 Evidencia del auditado</strong>
        ${p.evidencia_auditado
          ? `<div style="background:rgba(16,217,160,.08);border-left:3px solid var(--teal);padding:12px 14px;border-radius:0 8px 8px 0;margin-top:8px">
               <div class="text-xs text-dim mb-1">Subida el ${p.fecha_evidencia||'—'}</div>
               <div class="text-sm">${esc(p.evidencia_auditado)}</div>
             </div>`
          : `<div class="text-sm text-dim mt-2" style="font-style:italic">El auditado aún no ha subido evidencia.</div>`}
      </div>

    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>

      ${/* Auditado: subir o actualizar evidencia */
        hasRole('auditado') && p.estado !== 'cerrado'
        ? `<button class="btn btn-secondary" onclick="closeModal();setTimeout(()=>uploadEvidenceModal('${id}'),100)">
             📎 ${p.evidencia_auditado ? 'Actualizar evidencia' : 'Subir evidencia'}
           </button>` : ''}

      ${/* Auditor: cerrar plan siempre que esté abierto */
        hasRole('auditor') && p.estado === 'abierto'
        ? `<button class="btn btn-primary"
             onclick="closeModal();setTimeout(()=>closeActionConfirm('${id}'),100)">
             🔒 Cerrar plan
           </button>` : ''}

    </div>`, {size:'lg'});
}

/* -------- Auditado: subir evidencia -------- */
function uploadEvidenceModal(id){
  const p = State.actions.find(x => x.id === id);
  if (!p) return;
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Subir evidencia · ${p.codigo}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="mb-3">
        <strong class="text-xs text-dim">Plan solicitado</strong>
        <div class="text-sm mt-1" style="background:var(--surface2);padding:10px 12px;border-radius:8px">${esc(p.descripcion)}</div>
      </div>
      <div class="field">
        <label>Evidencia de lo realizado *</label>
        <textarea id="evid_text" style="min-height:120px"
          placeholder="Describe qué acciones tomaste, adjunta referencias de documentos, fechas de implementación, resultados obtenidos..."
        >${esc(p.evidencia_auditado||'')}</textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveEvidence('${id}')">Enviar evidencia al auditor</button>
    </div>`);
}

function saveEvidence(id){
  const text = document.getElementById('evid_text').value.trim();
  if (!text){ toast('Escribe la evidencia antes de enviar','error'); return; }
  const p = State.actions.find(x => x.id === id);
  p.evidencia_auditado = text;
  p.fecha_evidencia    = new Date().toISOString().slice(0,10);
  /* El estado se mantiene "abierto" — solo el auditor cierra */
  logAction(`Subió evidencia al plan ${p.codigo}`, 'Planes de acción');

  /* Notificar al auditor de ese hallazgo */
  const f = State.findings.find(x => x.id === p.hallazgo_id);
  const a = f ? State.audits.find(x => x.id === f.auditoria_id) : null;
  if (a?.auditor_id){
    addNotification(a.auditor_id,
      `${State.user.name} subió evidencia al plan ${p.codigo} — pendiente de revisión`,
      'info');
  }

  closeModal();
  toast('Evidencia registrada. El plan permanece abierto hasta que el auditor lo cierre.', 'success');
  refreshBadges();
  navigate('actions');
}

/* -------- Auditor: cerrar plan -------- */
function closeActionConfirm(id){
  const p = State.actions.find(x => x.id === id);
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Cerrar plan ${p.codigo}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      ${p.evidencia_auditado
        ? `<div class="mb-3">
             <strong class="text-xs text-dim">Evidencia del auditado</strong>
             <div class="text-sm mt-1" style="background:rgba(16,217,160,.08);border-left:3px solid var(--teal);padding:12px;border-radius:0 8px 8px 0">
               <div class="text-xs text-dim mb-1">Subida el ${p.fecha_evidencia||'—'}</div>
               ${esc(p.evidencia_auditado)}
             </div>
           </div>`
        : `<div class="mb-3" style="background:#fef3c7;border-left:3px solid #fbbf24;padding:10px 14px;border-radius:6px;font-size:13px;color:#92400e">
             ⚠ El auditado aún no ha subido evidencia. Puedes cerrar de todas formas.
           </div>`}
      <div class="field">
        <label>Observaciones del auditor <span class="text-xs text-dim">(opcional)</span></label>
        <textarea id="cls_obs" placeholder="Comentarios sobre el cierre del plan..."></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmCloseAction('${id}')">Confirmar cierre</button>
    </div>`);
}

function confirmCloseAction(id){
  const p   = State.actions.find(x => x.id === id);
  const obs = document.getElementById('cls_obs').value.trim();
  p.estado  = 'cerrado';
  p.fecha_cierre = new Date().toISOString().slice(0,10);
  if (obs){
    if (!p.comentarios) p.comentarios = [];
    p.comentarios.push({ts: new Date().toISOString().slice(0,10), user: State.user.name, text: '[Auditor] '+obs});
  }
  logAction(`Cerró plan de acción ${p.codigo}`, 'Planes de acción');
  closeModal();
  toast(`Plan ${p.codigo} cerrado`, 'success');
  refreshBadges();
  navigate('actions');
}

/* -------- Export CSV -------- */
function exportActionsCSV(){
  const rows = [['Código','Título','Hallazgo','Auditoría','Responsable','Estado','Evidencia','Fecha creación']];
  getVisibleActions().forEach(p => {
    const f = State.findings.find(x => x.id === p.hallazgo_id);
    const a = f ? State.audits.find(x => x.id === f.auditoria_id) : null;
    const r = getUserById(p.responsable_id);
    rows.push([p.codigo, p.titulo, f?.codigo||'', a?.codigo||'', r?.name||'', p.estado,
               p.evidencia_auditado ? 'Sí' : 'No', p.fecha_creacion||'']);
  });
  downloadCSV(rows, 'planes_accion.csv');
}
