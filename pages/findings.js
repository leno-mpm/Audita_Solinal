/* ===========================================================
   AUDITA AI · Hallazgos
   Admin: ve todos | Auditor: gestiona + propone plan | Auditado: ve + responde
   REGLAS:
   - Hallazgos solo se crean desde el checklist (no desde esta sección)
   - Todos los campos son obligatorios excepto evidencias
   - Auditado SOLO responde (no propone plan de acción)
   - Auditor puede proponer plan de acción desde el detalle del hallazgo
   =========================================================== */

function renderFindings(){
  const role  = State.user.role;
  const list  = getVisibleFindings();
  const total = list.length;
  const open  = list.filter(f => f.estado !== 'cerrado').length;

  /* Opciones de auditoría para el filtro */
  const audOpts = getVisibleAudits()
    .map(a => `<option value="${a.id}">${a.codigo} — ${getCompany(a.empresa_id)?.razon_social||''}</option>`)
    .join('');

  const html = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Hallazgos</h1>
          <div class="page-subtitle">${role==='admin'?'Todos los hallazgos del sistema':role==='auditor'?'Hallazgos de mis auditorías':'Hallazgos de mi empresa'}</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportFindingsCSV()">↓ CSV</button>
        </div>
      </div>

      <!-- Stats 5 tarjetas a ancho completo, números en negro -->
      <div class="stats-grid" data-cols="5">
        <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total hallazgos</div></div>
        <div class="stat-card"><div class="stat-value">${list.filter(f=>f.tipo==='no_conformidad_mayor').length}</div><div class="stat-label">NC Mayores</div></div>
        <div class="stat-card"><div class="stat-value">${list.filter(f=>f.tipo==='no_conformidad_menor').length}</div><div class="stat-label">NC Menores</div></div>
        <div class="stat-card"><div class="stat-value">${list.filter(f=>f.tipo==='oportunidad_mejora').length}</div><div class="stat-label">Oport. mejora</div></div>
        <div class="stat-card"><div class="stat-value">${open}</div><div class="stat-label">Abiertos</div></div>
      </div>

      <!-- Filtros -->
      <div class="card">
        <div class="form-grid">
          <div class="field"><label>Auditoría</label>
            <select id="f_fnd_aud" onchange="renderFindingsTable()">
              <option value="">Todas</option>
              ${audOpts}
            </select>
          </div>
          <div class="field"><label>Tipo</label>
            <select id="f_fnd_tipo" onchange="renderFindingsTable()">
              <option value="">Todos</option>
              <option value="no_conformidad_mayor">NC Mayor</option>
              <option value="no_conformidad_menor">NC Menor</option>
              <option value="oportunidad_mejora">Oportunidad de mejora</option>
              <option value="observacion">Observación</option>
              <option value="fortaleza">Fortaleza</option>
            </select>
          </div>
          <div class="field"><label>Estado</label>
            <select id="f_fnd_estado" onchange="renderFindingsTable()">
              <option value="">Todos</option>
              <option value="abierto">Abierto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          <div class="field"><label>Criticidad</label>
            <select id="f_fnd_crit" onchange="renderFindingsTable()">
              <option value="">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div class="field"><label>Buscar</label>
            <input id="f_fnd_q" placeholder="Código, descripción, requisito..." oninput="renderFindingsTable()">
          </div>
        </div>
      </div>

      <div class="card" id="findingsTableCard">
        <div class="card-header">
          <div class="card-title">Listado de hallazgos</div>
        </div>
        <div id="findingsTable"></div>
      </div>
    </div>`;

  document.getElementById('pageContainer').innerHTML = html;
  /* Auto-cierre por fecha vencida */
  autoCloseFindingsByDate();
  renderFindingsTable();
}

function autoCloseFindingsByDate(){
  const today = new Date().toISOString().slice(0,10);
  getVisibleFindings().forEach(f => {
    if (f.estado === 'abierto' && f.fecha_limite && f.fecha_limite < today){
      f.estado = 'cerrado';
    }
  });
}

function renderFindingsTable(){
  const audId  = document.getElementById('f_fnd_aud')?.value    || '';
  const tipo   = document.getElementById('f_fnd_tipo')?.value   || '';
  const estado = document.getElementById('f_fnd_estado')?.value || '';
  const crit   = document.getElementById('f_fnd_crit')?.value   || '';
  const q      = (document.getElementById('f_fnd_q')?.value     || '').toLowerCase();

  let list = getVisibleFindings();
  if (audId)  list = list.filter(f => f.auditoria_id === audId);
  if (tipo)   list = list.filter(f => f.tipo         === tipo);
  if (estado) list = list.filter(f => f.estado       === estado);
  if (crit)   list = list.filter(f => f.criticidad   === crit);
  if (q)      list = list.filter(f =>
    f.codigo.toLowerCase().includes(q) ||
    f.descripcion.toLowerCase().includes(q) ||
    (f.requisito||'').toLowerCase().includes(q));

  const canEdit   = hasRole('auditor');
  const canVerify = hasRole('auditor','admin');

  document.getElementById('findingsTable').innerHTML = `
    <div class="table-wrap">
      <table class="t">
        <thead><tr>
          <th>Código</th><th>Tipo</th><th>Descripción</th><th>Auditoría</th><th>Requisito</th><th>Criticidad</th><th>Estado</th><th>Responsable</th><th></th>
        </tr></thead>
        <tbody>
          ${list.length ? list.map(f => {
            const audit = State.audits.find(a => a.id === f.auditoria_id);
            const resp  = getUserById(f.responsable_id || f.auditor_id);
            return `<tr>
              <td class="cell-mono">${f.codigo}</td>
              <td><span class="badge ${badgeForFinding(f.tipo)}">${tipoHallazgoLabel(f.tipo)}</span></td>
              <td class="cell-wrap">${esc(f.descripcion.slice(0,100))}${f.descripcion.length>100?'...':''}</td>
              <td class="text-sm text-dim">${audit?.codigo||'—'}</td>
              <td class="text-xs">${esc(f.requisito||'—')}</td>
              <td>${criticidadBadge(f.criticidad)}</td>
              <td>${estadoHallazgoBadge(f.estado)}</td>
              <td class="text-sm">${esc(resp?.name||'—')}</td>
              <td class="row-action">
                <button onclick="openFindingDetail('${f.id}')" title="Ver detalle">👁</button>
                ${canEdit && f.estado === 'abierto' ? `<button onclick="editFindingModal('${f.id}')" title="Editar">✏️</button>` : ''}
                ${hasRole('auditor') && f.estado === 'abierto' ? `<button onclick="closeFinding('${f.id}')" title="Cerrar hallazgo">🔒</button>` : ''}
                ${hasRole('auditado') && f.estado === 'abierto' ? `<button onclick="respondFinding('${f.id}')" title="Responder">💬</button>` : ''}
              </td>
            </tr>`;
          }).join('') : '<tr><td colspan="9"><div class="empty"><div class="empty-icon">🚩</div>Sin hallazgos con los filtros aplicados</div></td></tr>'}
        </tbody>
      </table>
    </div>`;
}

/* -------- Nuevo hallazgo (solo desde checklist) -------- */
function openFindingForm(prefill = {}){
  /* Este formulario es llamado EXCLUSIVAMENTE desde el checklist.
     No hay botón en la sección de Hallazgos para crearlo aquí. */
  if (!hasRole('auditor')){ toast('Solo el auditor puede registrar hallazgos','error'); return; }

  const audits   = getVisibleAudits().filter(a => a.estado !== 'cerrada');
  const audOpts  = audits.map(a => `<option value="${a.id}"${a.id===prefill.auditId?' selected':''}>${a.codigo} — ${getCompany(a.empresa_id)?.razon_social||''}</option>`).join('');
  const respOpts = USERS_DB.filter(u => u.role === 'auditado').map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('');
  const today    = new Date().toISOString().slice(0,10);

  openModal(`
    <div class="modal-head">
      <div class="modal-title">Registrar hallazgo</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div style="background:#e0f2fe;border-left:3px solid var(--info);padding:10px 14px;border-radius:6px;font-size:12px;color:#0369a1;margin-bottom:14px">
        ℹ Todos los campos son obligatorios excepto Evidencia.
      </div>
      <div class="form-grid-2">
        <div class="field"><label>Auditoría *</label><select id="nF_aud">${audOpts||'<option>Sin auditorías activas</option>'}</select></div>
        <div class="field"><label>Tipo *</label>
          <select id="nF_tipo">
            <option value="no_conformidad_mayor">NC Mayor</option>
            <option value="no_conformidad_menor" ${prefill.tipo==='no_conformidad_menor'?'selected':''}>NC Menor</option>
            <option value="oportunidad_mejora">Oportunidad de mejora</option>
            <option value="observacion">Observación</option>
            <option value="fortaleza">Fortaleza</option>
          </select>
        </div>
        <div class="field"><label>Criticidad *</label>
          <select id="nF_crit">
            <option value="alta">Alta</option>
            <option value="media" selected>Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div class="field"><label>Requisito / cláusula *</label><input id="nF_req" placeholder="Ej: 8.1, ISO 9001:2015" value="${esc(prefill.requisito||'')}"></div>
        <div class="field"><label>Responsable *</label><select id="nF_resp">${respOpts}</select></div>
        <div class="field"><label>Fecha límite *</label><input type="date" id="nF_due" value="${today}"></div>
      </div>
      <div class="field"><label>Descripción *</label><textarea id="nF_desc" placeholder="Descripción detallada del hallazgo...">${esc(prefill.descripcion||'')}</textarea></div>
      <div class="field"><label>Evidencia <span class="text-muted text-xs">(opcional)</span></label><textarea id="nF_evid" placeholder="Documentos revisados, entrevistas, observaciones..."></textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNewFinding()">Crear hallazgo</button>
    </div>`, {size:'lg'});
}

function saveNewFinding(){
  const auditoria_id   = document.getElementById('nF_aud').value;
  const tipo           = document.getElementById('nF_tipo').value;
  const criticidad     = document.getElementById('nF_crit').value;
  const requisito      = document.getElementById('nF_req').value.trim();
  const responsable_id = document.getElementById('nF_resp').value;
  const fecha_limite   = document.getElementById('nF_due').value;
  const descripcion    = document.getElementById('nF_desc').value.trim();
  const evidencia      = document.getElementById('nF_evid').value.trim();

  /* Todos obligatorios excepto evidencia */
  const errores = [];
  if (!auditoria_id)   errores.push('Auditoría');
  if (!tipo)           errores.push('Tipo');
  if (!criticidad)     errores.push('Criticidad');
  if (!requisito)      errores.push('Requisito / cláusula');
  if (!responsable_id) errores.push('Responsable');
  if (!fecha_limite)   errores.push('Fecha límite');
  if (!descripcion)    errores.push('Descripción');
  if (errores.length){ toast(`Campos obligatorios: ${errores.join(', ')}`, 'error'); return; }

  const audit  = State.audits.find(a => a.id === auditoria_id);
  const prefix = tipo.includes('no_conformidad') ? 'NC' : tipo==='oportunidad_mejora' ? 'OM' : tipo==='fortaleza' ? 'FOR' : 'OB';
  const codigo = `${prefix}-${new Date().getFullYear()}-${String(State.findings.length+1).padStart(3,'0')}`;

  State.findings.unshift({
    id: 'f'+(State.findings.length+1), codigo, tipo, estado:'abierto',
    auditoria_id, empresa_id: audit?.empresa_id||'', auditor_id: State.user.id,
    responsable_id, descripcion, evidencia, requisito, criticidad,
    fecha_deteccion: new Date().toISOString().slice(0,10), fecha_limite,
    causa_raiz:'', acciones:[], respuesta_auditado:''
  });
  logAction(`Creó hallazgo ${codigo}`, 'Hallazgos');

  /* Notificar al auditado de la empresa si es NC (no conformidad) */
  if (tipo.includes('no_conformidad') && audit){
    const empresa = State.companies.find(c => c.id === audit.empresa_id);
    if (empresa?.responsable_id){
      addNotification(empresa.responsable_id,
        `Nueva no conformidad registrada en ${audit.codigo}: ${codigo} — ${descripcion.slice(0,80)}${descripcion.length>80?'…':''}`,
        'warning');
    }
  }

  closeModal();
  toast(`Hallazgo ${codigo} creado`, 'success');
  refreshBadges();
  navigate('findings');
}

/* -------- Detalle hallazgo -------- */
function openFindingDetail(id){
  const f = State.findings.find(x => x.id === id);
  if (!f) return;
  const audit   = State.audits.find(a => a.id === f.auditoria_id);
  const resp    = getUserById(f.responsable_id);
  const aud     = getUserById(f.auditor_id);
  const actions = State.actions.filter(p => p.hallazgo_id === id);
  const today   = new Date().toISOString().slice(0,10);

  openModal(`
    <div class="modal-head">
      <div>
        <div class="modal-title">${f.codigo}</div>
        <div class="mt-2">
          <span class="badge ${badgeForFinding(f.tipo)}">${tipoHallazgoLabel(f.tipo)}</span>
          ${estadoHallazgoBadge(f.estado)}
          ${criticidadBadge(f.criticidad)}
        </div>
      </div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2 mb-3">
        <div><strong class="text-xs text-dim">Auditoría</strong><div>${audit?.codigo||'—'}</div></div>
        <div><strong class="text-xs text-dim">Requisito</strong><div>${esc(f.requisito||'—')}</div></div>
        <div><strong class="text-xs text-dim">Auditor</strong><div>${esc(aud?.name||'—')}</div></div>
        <div><strong class="text-xs text-dim">Responsable</strong><div>${esc(resp?.name||'—')}</div></div>
        <div><strong class="text-xs text-dim">Detectado</strong><div>${f.fecha_deteccion||'—'}</div></div>
        <div><strong class="text-xs text-dim">Fecha límite</strong>
          <div class="${f.fecha_limite < today && f.estado !== 'cerrado' ? 'text-danger' : ''}">${f.fecha_limite||'—'}</div>
        </div>
      </div>
      <div class="mb-3"><strong class="text-xs text-dim">Descripción</strong><div class="text-sm mt-1">${esc(f.descripcion)}</div></div>
      ${f.evidencia ? `<div class="mb-3"><strong class="text-xs text-dim">Evidencia</strong><div class="text-sm mt-1">${esc(f.evidencia)}</div></div>` : ''}
      ${f.causa_raiz ? `<div class="mb-3"><strong class="text-xs text-dim">Causa raíz</strong><div class="text-sm mt-1">${esc(f.causa_raiz)}</div></div>` : ''}

      ${f.respuesta_auditado ? `
        <div class="mb-3" style="background:var(--surface2);border-left:3px solid var(--teal);padding:12px 14px;border-radius:8px">
          <strong class="text-xs text-dim">💬 Respuesta del auditado</strong>
          <div class="text-sm mt-1">${esc(f.respuesta_auditado)}</div>
        </div>` : ''}

      <strong class="text-xs text-dim">Planes de acción (${actions.length})</strong>
      <div class="mt-2">
        ${actions.length ? actions.map(p => `
          <div class="kanban-card" onclick="closeModal();setTimeout(()=>openActionDetail('${p.id}'),100)">
            <div class="kanban-card-title">${esc(p.titulo)}</div>
            <div class="kanban-card-meta">${estadoAccionBadge(p.estado)} <span class="text-xs text-dim">Vence: ${p.fecha_limite}</span></div>
          </div>`).join('') : '<div class="text-sm text-muted">Sin planes de acción</div>'}
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>

      ${/* Auditado: solo responde, NO propone plan */
        hasRole('auditado') && f.estado === 'abierto'
        ? `<button class="btn btn-secondary" onclick="closeModal();setTimeout(()=>respondFinding('${id}'),100)">💬 Responder</button>` : ''}

      ${/* Auditor: puede proponer plan de acción */
        hasRole('auditor') && f.estado !== 'cerrado'
        ? `<button class="btn btn-secondary" onclick="closeModal();navigate('actions');setTimeout(()=>openActionForm('${id}'),200)">+ Plan de acción</button>` : ''}

      ${hasRole('auditor') && f.estado === 'abierto'
        ? `<button class="btn btn-success" onclick="closeFinding('${id}')">🔒 Cerrar hallazgo</button>` : ''}
    </div>`, {size:'lg'});
}

/* -------- Editar hallazgo (auditor) -------- */
function editFindingModal(id){
  if (!hasRole('auditor')){ toast('Solo el auditor puede editar hallazgos','error'); return; }
  const f = State.findings.find(x => x.id === id);
  if (!f) return;
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Editar ${f.codigo}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="field"><label>Tipo</label>
          <select id="eF_tipo">
            <option value="no_conformidad_mayor"${f.tipo==='no_conformidad_mayor'?' selected':''}>NC Mayor</option>
            <option value="no_conformidad_menor"${f.tipo==='no_conformidad_menor'?' selected':''}>NC Menor</option>
            <option value="oportunidad_mejora"${f.tipo==='oportunidad_mejora'?' selected':''}>Oportunidad de mejora</option>
            <option value="observacion"${f.tipo==='observacion'?' selected':''}>Observación</option>
            <option value="fortaleza"${f.tipo==='fortaleza'?' selected':''}>Fortaleza</option>
          </select>
        </div>
        <div class="field"><label>Criticidad</label>
          <select id="eF_crit">
            <option value="alta"${f.criticidad==='alta'?' selected':''}>Alta</option>
            <option value="media"${f.criticidad==='media'?' selected':''}>Media</option>
            <option value="baja"${f.criticidad==='baja'?' selected':''}>Baja</option>
          </select>
        </div>
        <div class="field"><label>Requisito</label><input id="eF_req" value="${esc(f.requisito||'')}"></div>
        <div class="field"><label>Fecha límite</label><input type="date" id="eF_due" value="${f.fecha_limite}"></div>
      </div>
      <div class="field"><label>Descripción</label><textarea id="eF_desc">${esc(f.descripcion)}</textarea></div>
      <div class="field"><label>Evidencia</label><textarea id="eF_evid">${esc(f.evidencia||'')}</textarea></div>
      <div class="field"><label>Causa raíz</label><textarea id="eF_causa">${esc(f.causa_raiz||'')}</textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveEditFinding('${id}')">Guardar</button>
    </div>`, {size:'lg'});
}

function saveEditFinding(id){
  const f = State.findings.find(x => x.id === id);
  f.tipo         = document.getElementById('eF_tipo').value;
  f.criticidad   = document.getElementById('eF_crit').value;
  f.requisito    = document.getElementById('eF_req').value;
  f.fecha_limite = document.getElementById('eF_due').value;
  f.descripcion  = document.getElementById('eF_desc').value;
  f.evidencia    = document.getElementById('eF_evid').value;
  f.causa_raiz   = document.getElementById('eF_causa').value;
  logAction(`Editó hallazgo ${f.codigo}`, 'Hallazgos');
  closeModal();
  toast('Hallazgo actualizado', 'success');
  navigate('findings');
}

/* -------- Auditado: responder hallazgo -------- */
function respondFinding(id){
  const f = State.findings.find(x => x.id === id);
  if (!f) return;
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Responder hallazgo ${f.codigo}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="mb-3">
        <strong class="text-xs text-dim">Hallazgo</strong>
        <div class="text-sm mt-1">${esc(f.descripcion)}</div>
      </div>
      <div class="field">
        <label>Tu respuesta</label>
        <textarea id="resp_text" placeholder="Explica qué acciones tomará o ha tomado tu equipo ante este hallazgo...">${esc(f.respuesta_auditado||'')}</textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="submitFindingResponse('${id}')">Enviar respuesta</button>
    </div>`);
}

function submitFindingResponse(id){
  const text = document.getElementById('resp_text').value.trim();
  if (!text){ toast('Escribe una respuesta antes de enviar','error'); return; }
  const f = State.findings.find(x => x.id === id);
  f.respuesta_auditado = text;
  /* Estado se mantiene 'abierto' — solo el auditor lo cierra */
  logAction(`Respondió hallazgo ${f.codigo}`, 'Hallazgos');
  closeModal();
  toast('Respuesta enviada', 'success');
  refreshBadges();
  navigate('findings');
}

/* -------- Verificar / Cerrar (auditor/admin) -------- */
function verifyFinding(id){
  const f = State.findings.find(x => x.id === id);
  f.estado = 'verificado';
  logAction(`Verificó hallazgo ${f.codigo}`, 'Hallazgos');
  closeModal();
  toast(`${f.codigo} marcado como verificado`, 'success');
  refreshBadges();
  navigate('findings');
}

function closeFinding(id){
  const f = State.findings.find(x => x.id === id);
  f.estado = 'cerrado';
  logAction(`Cerró hallazgo ${f.codigo}`, 'Hallazgos');
  closeModal();
  toast(`${f.codigo} cerrado`, 'success');
  refreshBadges();
  navigate('findings');
}

/* -------- Export CSV -------- */
function exportFindingsCSV(){
  const rows = [['Código','Tipo','Estado','Criticidad','Auditoría','Requisito','Descripción','Responsable','Fecha límite']];
  getVisibleFindings().forEach(f => {
    const audit = State.audits.find(a => a.id === f.auditoria_id);
    const resp  = getUserById(f.responsable_id);
    rows.push([f.codigo, tipoHallazgoLabel(f.tipo), f.estado, f.criticidad||'', audit?.codigo||'', f.requisito||'', f.descripcion, resp?.name||'', f.fecha_limite||'']);
  });
  downloadCSV(rows, 'hallazgos.csv');
}
