/* ===========================================================
   AUDITA AI · Auditorías + Checklist integrado

   REGLAS DE NEGOCIO:
   - Solo Admin CREA auditorías
   - Admin EDITA campos definitorios SOLO si progreso === 0
   - Admin EDITA objetivo/alcance cuando progreso > 0
   - Admin NO cambia estado (el no ejecuta la auditoría)
   - Auditor SOLO puede ejecutar checklist y cambiar estado
   - Auditado VE su información y el checklist en modo lectura
   - Progreso = % de ítems evaluados en el checklist (auto)
   =========================================================== */

function renderAudits(){
  const role    = State.user.role;
  const list    = getVisibleAudits();
  const canCreate = hasRole('admin');   /* Solo admin crea */

  const html = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Auditorías</h1>
          <div class="page-subtitle">${role==='admin'?'Todas las auditorías del sistema':role==='auditor'?'Mis auditorías asignadas':'Auditorías de mi empresa'}</div>
        </div>
        <div class="page-actions">
          ${hasRole('admin','auditor') ? '<button class="btn btn-secondary" onclick="exportAuditsCSV()">↓ CSV</button>' : ''}
          ${canCreate ? '<button class="btn btn-primary" onclick="openNewAuditModal()">+ Nueva auditoría</button>' : ''}
        </div>
      </div>

      <!-- Filtros -->
      <div class="card">
        <div class="form-grid">
          <div class="field"><label>Estado</label>
            <select id="f_aud_estado" onchange="renderAuditsTable()">
              <option value="">Todos</option>
              <option value="planificada">Planificada</option>
              <option value="ejecucion">En ejecución</option>
              <option value="en_revision">En revisión</option>
              <option value="cerrada">Cerrada</option>
            </select>
          </div>
          <div class="field"><label>Norma</label>
            <select id="f_aud_norma" onchange="renderAuditsTable()">
              <option value="">Todas</option>
              ${Object.values(STANDARDS).map(s=>`<option value="${s.id}">${s.code}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Buscar</label>
            <input id="f_aud_q" placeholder="Código, empresa..." oninput="renderAuditsTable()">
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card" id="auditsTableCard">
        <div class="card-header">
          <div class="card-title">Listado de auditorías</div>
          <span class="text-sm text-dim" id="auditsCount"></span>
        </div>
        <div id="auditsTable"></div>
      </div>
    </div>`;

  document.getElementById('pageContainer').innerHTML = html;
  renderAuditsTable();
}

function renderAuditsTable(){
  const estado = document.getElementById('f_aud_estado')?.value || '';
  const norma  = document.getElementById('f_aud_norma')?.value  || '';
  const q      = (document.getElementById('f_aud_q')?.value || '').toLowerCase();
  const role   = State.user.role;

  let list = getVisibleAudits();
  if (estado) list = list.filter(a => a.estado === estado);
  if (norma)  list = list.filter(a => a.norma  === norma);
  if (q)      list = list.filter(a => a.codigo.toLowerCase().includes(q) || (getCompany(a.empresa_id)?.razon_social||'').toLowerCase().includes(q));

  const countEl = document.getElementById('auditsCount');
  if (countEl) countEl.textContent = `${list.length} resultado(s)`;

  document.getElementById('auditsTable').innerHTML = `
    <div class="table-wrap">
      <table class="t">
        <thead><tr>
          <th>Código</th><th>Empresa / Auditor</th><th>Norma</th><th>Tipo</th><th>Estado</th><th>Progreso</th><th>Fechas</th><th>Acciones</th>
        </tr></thead>
        <tbody>
          ${list.length ? list.map(a => {
            const e   = getCompany(a.empresa_id);
            const aud = getUserById(a.auditor_id);
            const isClosed  = a.estado === 'cerrada';
            const isStarted = a.progreso > 0;   /* ya se evaluó algo */

            /* ---- Permisos por fila ---- */
            /* Admin: editar si no cerrada; solo obj/alc si progreso > 0 */
            const adminCanEdit   = hasRole('admin') && !isClosed;
            /* Auditor: checklist y estado, nada más */
            const auditorChecklist = hasRole('auditor') && !isClosed;
            const auditorState   = hasRole('auditor') && !isClosed;
            /* Auditado: ver checklist solo lectura si hay progreso */
            const auditadoView   = hasRole('auditado') && isStarted;
            /* Admin: ver checklist solo lectura */
            const adminViewChecklist = hasRole('admin') && isStarted;

            return `<tr>
              <td class="cell-mono">${a.codigo}</td>
              <td>
                <div class="cell-strong">${esc(e?.razon_social||'-')}</div>
                <small class="text-dim">${esc(aud?.name||'—')}</small>
              </td>
              <td><span class="badge badge-info">${getStandardName(a.norma)}</span></td>
              <td class="text-sm">${tipoAuditoriaLabel(a.tipo)}</td>
              <td>${estadoAuditoriaBadge(a.estado)}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="progress-bar" style="width:80px">
                    <div class="progress-fill" style="width:${a.progreso}%"></div>
                  </div>
                  <small class="text-dim mono">${a.progreso}%</small>
                </div>
              </td>
              <td class="text-sm text-dim">${a.fecha_inicio}<br>→ ${a.fecha_fin}</td>
              <td>
                <div class="audit-row-actions">
                  <button class="btn btn-ghost btn-sm" onclick="openAuditDetail('${a.id}')">👁 Ver</button>

                  ${/* Auditor ejecuta checklist */
                    auditorChecklist
                    ? `<button class="btn btn-primary btn-sm" onclick="openChecklistFor('${a.id}',false)">▶ Checklist</button>`
                    : ''}

                  ${/* Auditado ve checklist en solo lectura (si hay progreso) */
                    auditadoView
                    ? `<button class="btn btn-secondary btn-sm" onclick="openChecklistFor('${a.id}',true)">👁 Ver evaluación</button>`
                    : ''}

                  ${/* Admin edita */
                    adminCanEdit
                    ? `<button class="btn btn-ghost btn-sm" onclick="editAuditModal('${a.id}')">✏️ Editar</button>`
                    : ''}

                  ${/* Auditor cierra solo cuando ya está en revisión */
                    hasRole('auditor') && a.estado === 'en_revision'
                    ? `<button class="btn btn-warning btn-sm" onclick="changeAuditState('${a.id}')">✓ Cerrar</button>`
                    : ''}

                  ${isClosed || a.estado === 'cancelada'
                    ? `${estadoAuditoriaBadge(a.estado)}`
                    : ''}
                </div>
              </td>
            </tr>`;
          }).join('') : '<tr><td colspan="8"><div class="empty"><div class="empty-icon">📋</div>Sin auditorías con los filtros aplicados</div></td></tr>'}
        </tbody>
      </table>
    </div>`;
}

/* -------- Crear auditoría (solo Admin) -------- */
function openNewAuditModal(){
  if (!hasRole('admin')){ toast('Solo el administrador puede crear auditorías','error'); return; }
  const opts     = State.companies.filter(c=>c.activo!==false).map(c => `<option value="${c.id}">${esc(c.razon_social)}</option>`).join('');
  const stds     = Object.values(STANDARDS).filter(s=>s.activo!==false).map(s => `<option value="${s.id}">${s.code} — ${esc(s.name)}</option>`).join('');
  const auditors = USERS_DB.filter(u => u.role === 'auditor').map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('');

  openModal(`
    <div class="modal-head">
      <div class="modal-title">Nueva auditoría</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="info-banner mb-3" style="background:var(--teal-glow);border-left:3px solid var(--teal);padding:10px 14px;border-radius:6px;font-size:12px;color:var(--text-dim)">
        Todos los campos marcados con * son obligatorios. Una vez que el auditor inicie el checklist, solo podrás editar el objetivo y alcance.
      </div>
      <div class="form-grid-2">
        <div class="field"><label>Empresa auditada *</label><select id="nA_emp"><option value="">— Seleccionar —</option>${opts}</select></div>
        <div class="field"><label>Norma / estándar *</label><select id="nA_norma"><option value="">— Seleccionar —</option>${stds}</select></div>
        <div class="field"><label>Auditor responsable *</label><select id="nA_aud"><option value="">— Seleccionar —</option>${auditors}</select></div>
        <div class="field"><label>Tipo de auditoría *</label>
          <select id="nA_tipo">
            <option value="">— Seleccionar —</option>
            <option value="interna">Interna (1ª parte)</option>
            <option value="segunda_parte">Segunda parte</option>
            <option value="tercera_parte">Tercera parte (certificación)</option>
            <option value="seguimiento">Seguimiento</option>
          </select>
        </div>
        <div class="field"><label>Modalidad *</label>
          <select id="nA_mod">
            <option value="">— Seleccionar —</option>
            <option value="presencial">Presencial</option>
            <option value="remota">Remota</option>
            <option value="hibrida">Híbrida</option>
          </select>
        </div>
        <div class="field"><label>Prioridad *</label>
          <select id="nA_prio">
            <option value="">— Seleccionar —</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div class="field"><label>Fecha inicio *</label><input type="date" id="nA_ini" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Fecha fin *</label><input type="date" id="nA_fin"></div>
      </div>
      <div class="field"><label>Objetivo</label><textarea id="nA_obj" placeholder="Verificar conformidad con requisitos de..."></textarea></div>
      <div class="field"><label>Alcance</label><textarea id="nA_alc" placeholder="Procesos, sedes, exclusiones..."></textarea></div>
      <div class="field"><label>Criterios</label><textarea id="nA_cri" placeholder="Norma, requisitos legales, política interna..."></textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNewAudit()">Crear auditoría</button>
    </div>`, {size:'lg'});
}

function saveNewAudit(){
  if (!hasRole('admin')){ toast('Sin permiso','error'); return; }
  const empresa_id   = document.getElementById('nA_emp').value;
  const norma        = document.getElementById('nA_norma').value;
  const auditor_id   = document.getElementById('nA_aud').value;
  const tipo         = document.getElementById('nA_tipo').value;
  const modalidad    = document.getElementById('nA_mod').value;
  const prioridad    = document.getElementById('nA_prio').value;
  const fecha_inicio = document.getElementById('nA_ini').value;
  const fecha_fin    = document.getElementById('nA_fin').value;
  const objetivo     = document.getElementById('nA_obj').value.trim();
  const alcance      = document.getElementById('nA_alc').value.trim();
  const criterios    = document.getElementById('nA_cri').value.trim();

  /* Validación de campos obligatorios */
  const errores = [];
  if (!empresa_id)   errores.push('Empresa auditada');
  if (!norma)        errores.push('Norma / estándar');
  if (!auditor_id)   errores.push('Auditor responsable');
  if (!tipo)         errores.push('Tipo de auditoría');
  if (!modalidad)    errores.push('Modalidad');
  if (!prioridad)    errores.push('Prioridad');
  if (!fecha_inicio) errores.push('Fecha inicio');
  if (!fecha_fin)    errores.push('Fecha fin');
  if (errores.length){
    toast(`Campos obligatorios faltantes: ${errores.join(', ')}`, 'error'); return;
  }
  if (fecha_fin < fecha_inicio){
    toast('La fecha fin debe ser posterior a la fecha inicio','error'); return;
  }

  const codigo = `AUD-${new Date().getFullYear()}-${String(State.audits.length+1).padStart(3,'0')}`;
  const emp    = getCompany(empresa_id);
  State.audits.unshift({
    id: 'a' + (Date.now()),
    codigo, tipo, estado: 'planificada',
    empresa_id, sede_id: emp?.sedes?.[0]?.id || '',
    norma, objetivo, alcance, criterios,
    fecha_inicio, fecha_fin, modalidad, prioridad,
    auditor_id, equipo: [],
    empresa_auditado_id: empresa_id,
    procesos: emp?.sedes?.[0]?.procesos || [],
    progreso: 0, agenda: '', riesgos: ''
  });
  logAction(`Creó auditoría ${codigo} — ${getStandardName(norma)}`, 'Auditorías');

  /* Notificar al auditor asignado */
  if (auditor_id){
    const emp = getCompany(empresa_id);
    addNotification(auditor_id,
      `Se te asignó la auditoría ${codigo} (${getStandardName(norma)}) para ${emp?.razon_social||'—'}`,
      'info');
  }

  closeModal();
  toast(`Auditoría ${codigo} creada y asignada a ${getUserById(auditor_id)?.name}`, 'success');
  navigate('audits');
}

/* -------- Detalle de auditoría -------- */
function openAuditDetail(id){
  const a = State.audits.find(x => x.id === id);
  if (!a) return;
  const e = getCompany(a.empresa_id);
  const findings = State.findings.filter(f => f.auditoria_id === id);
  const isClosed = a.estado === 'cerrada';

  openModal(`
    <div class="modal-head">
      <div>
        <div class="modal-title">${a.codigo} — ${esc(e?.razon_social||'')}</div>
        <div class="text-sm text-dim mt-2">
          ${getStandardName(a.norma)} · ${tipoAuditoriaLabel(a.tipo)} · ${estadoAuditoriaBadge(a.estado)}
          ${a.prioridad ? `<span class="badge ${prioridadBadge(a.prioridad)} ml-1">Prioridad ${a.prioridad}</span>` : ''}
        </div>
      </div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2 mb-4">
        <div><strong class="text-xs text-dim">Modalidad</strong><div>${esc(a.modalidad||'-')}</div></div>
        <div><strong class="text-xs text-dim">Fechas</strong><div>${a.fecha_inicio} → ${a.fecha_fin}</div></div>
        <div><strong class="text-xs text-dim">Auditor</strong><div>${esc(getUserById(a.auditor_id)?.name||'-')}</div></div>
        <div><strong class="text-xs text-dim">Última modificación</strong><div class="text-dim text-sm">—</div></div>
      </div>
      <div class="mb-3"><strong class="text-xs text-dim">Objetivo</strong><div class="text-sm mt-1">${esc(a.objetivo||'—')}</div></div>
      <div class="mb-3"><strong class="text-xs text-dim">Alcance</strong><div class="text-sm mt-1">${esc(a.alcance||'—')}</div></div>
      <div class="mb-3"><strong class="text-xs text-dim">Criterios</strong><div class="text-sm mt-1">${esc(a.criterios||'—')}</div></div>

      <div class="cl-toolbar mb-3">
        <div class="cl-progress">
          <span class="text-xs text-dim">Progreso checklist</span>
          <div class="progress-bar"><div class="progress-fill" style="width:${a.progreso}%"></div></div>
          <div class="progress-text">${a.progreso}%</div>
        </div>
      </div>

      <strong class="text-xs text-dim">Hallazgos (${findings.length})</strong>
      <div class="mt-2">
        ${findings.length ? findings.slice(0,5).map(f => `
          <div class="kanban-card" onclick="closeModal();setTimeout(()=>openFindingDetail('${f.id}'),100)">
            <div class="kanban-card-title">${f.codigo} — ${esc(f.descripcion.slice(0,80))}${f.descripcion.length>80?'...':''}</div>
            <div class="kanban-card-meta">
              <span class="badge ${badgeForFinding(f.tipo)}">${tipoHallazgoLabel(f.tipo)}</span>
              ${estadoHallazgoBadge(f.estado)}
            </div>
          </div>`).join('') : '<div class="text-sm text-muted">Sin hallazgos registrados</div>'}
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>

      ${/* Admin: editar */
        hasRole('admin') && !isClosed
        ? `<button class="btn btn-secondary" onclick="closeModal();setTimeout(()=>editAuditModal('${a.id}'),100)">✏️ Editar</button>` : ''}

      ${/* Admin: ver checklist (solo lectura) — aquí dentro del detalle */
        hasRole('admin') && a.progreso > 0
        ? `<button class="btn btn-secondary" onclick="closeModal();openChecklistFor('${a.id}',true)">👁 Ver checklist</button>` : ''}

      ${/* Auditor: solo Reporte (disabled <100%) y Checklist */
        hasRole('auditor') ? `
          <button class="btn btn-secondary" onclick="closeModal();navigate('reports')"
            ${a.progreso < 100 ? 'disabled title="El reporte estará disponible cuando el checklist llegue al 100%"' : ''}>
            📄 Reporte${a.progreso < 100 ? ` (${a.progreso}%)` : ''}
          </button>
          ${!isClosed && a.estado !== 'cancelada'
            ? `<button class="btn btn-primary" onclick="closeModal();openChecklistFor('${a.id}',false)">▶ Checklist</button>`
            : ''}
        ` : ''}

      ${/* Admin: reporte (disabled si checklist < 100%) */
        hasRole('admin')
        ? `<button class="btn btn-secondary" onclick="closeModal();navigate('reports')"
            ${a.progreso < 100 ? 'disabled title="El reporte estará disponible cuando el checklist llegue al 100%"' : ''}>
            📄 Reporte${a.progreso < 100 ? ` (${a.progreso}%)` : ''}
           </button>` : ''}

      ${/* Auditado: ver checklist resultado */
        hasRole('auditado') && a.progreso > 0
        ? `<button class="btn btn-primary" onclick="closeModal();openChecklistFor('${a.id}',true)">👁 Ver evaluación</button>` : ''}
    </div>`, {size:'lg'});
}

/* -------- Editar auditoría (solo Admin, con restricciones según progreso) -------- */
function editAuditModal(id){
  if (!hasRole('admin')){ toast('Solo el administrador puede editar auditorías','error'); return; }
  const a = State.audits.find(x => x.id === id);
  if (!a) return;
  if (a.estado === 'cerrada'){ toast('No se puede editar una auditoría cerrada','error'); return; }

  const isStarted = a.progreso > 0;   /* checklist ya iniciado */

  const opts  = State.companies.map(c => `<option value="${c.id}"${c.id===a.empresa_id?' selected':''}>${esc(c.razon_social)}</option>`).join('');
  const stds  = Object.values(STANDARDS).map(s => `<option value="${s.id}"${s.id===a.norma?' selected':''}>${s.code} — ${esc(s.name)}</option>`).join('');
  const auds  = USERS_DB.filter(u=>u.role==='auditor').map(u => `<option value="${u.id}"${u.id===a.auditor_id?' selected':''}>${esc(u.name)}</option>`).join('');

  const readOnlyBlock = (label, value) =>
    `<div class="field"><label>${label} <span class="badge badge-muted" style="font-size:10px">bloqueado</span></label>
     <input readonly disabled value="${esc(value)}" style="background:var(--surface2);color:var(--text-dim)"></div>`;

  openModal(`
    <div class="modal-head">
      <div class="modal-title">Editar ${a.codigo}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      ${isStarted ? `
        <div style="background:#fff8e1;border-left:3px solid #fbbf24;padding:10px 14px;border-radius:6px;font-size:12px;color:#92400e;margin-bottom:14px">
          ⚠ El checklist ya fue iniciado (${a.progreso}% completado). Solo puedes editar el <strong>objetivo</strong> y el <strong>alcance</strong>.
        </div>
        <div class="form-grid-2">
          ${readOnlyBlock('Empresa', getCompany(a.empresa_id)?.razon_social||'-')}
          ${readOnlyBlock('Norma', getStandardName(a.norma))}
          ${readOnlyBlock('Auditor', getUserById(a.auditor_id)?.name||'-')}
          ${readOnlyBlock('Tipo', tipoAuditoriaLabel(a.tipo))}
          ${readOnlyBlock('Modalidad', a.modalidad||'-')}
          ${readOnlyBlock('Prioridad', a.prioridad||'-')}
          ${readOnlyBlock('Fecha inicio', a.fecha_inicio)}
          ${readOnlyBlock('Fecha fin', a.fecha_fin)}
        </div>
      ` : `
        <div class="form-grid-2">
          <div class="field"><label>Empresa *</label><select id="eA_emp">${opts}</select></div>
          <div class="field"><label>Norma *</label><select id="eA_norma">${stds}</select></div>
          <div class="field"><label>Auditor responsable *</label><select id="eA_aud">${auds}</select></div>
          <div class="field"><label>Tipo *</label>
            <select id="eA_tipo">
              <option value="interna"${a.tipo==='interna'?' selected':''}>Interna (1ª parte)</option>
              <option value="segunda_parte"${a.tipo==='segunda_parte'?' selected':''}>Segunda parte</option>
              <option value="tercera_parte"${a.tipo==='tercera_parte'?' selected':''}>Tercera parte</option>
              <option value="seguimiento"${a.tipo==='seguimiento'?' selected':''}>Seguimiento</option>
            </select>
          </div>
          <div class="field"><label>Modalidad *</label>
            <select id="eA_mod">
              <option value="presencial"${a.modalidad==='presencial'?' selected':''}>Presencial</option>
              <option value="remota"${a.modalidad==='remota'?' selected':''}>Remota</option>
              <option value="hibrida"${a.modalidad==='hibrida'?' selected':''}>Híbrida</option>
            </select>
          </div>
          <div class="field"><label>Prioridad *</label>
            <select id="eA_prio">
              <option value="alta"${a.prioridad==='alta'?' selected':''}>Alta</option>
              <option value="media"${a.prioridad==='media'?' selected':''}>Media</option>
              <option value="baja"${a.prioridad==='baja'?' selected':''}>Baja</option>
            </select>
          </div>
          <div class="field"><label>Fecha inicio *</label><input type="date" id="eA_ini" value="${a.fecha_inicio}"></div>
          <div class="field"><label>Fecha fin *</label><input type="date" id="eA_fin" value="${a.fecha_fin}"></div>
        </div>
        <div class="field"><label>Criterios</label><textarea id="eA_cri">${esc(a.criterios||'')}</textarea></div>
      `}
      <div class="field"><label>Objetivo</label><textarea id="eA_obj">${esc(a.objetivo||'')}</textarea></div>
      <div class="field"><label>Alcance</label><textarea id="eA_alc">${esc(a.alcance||'')}</textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveEditAudit('${id}',${isStarted})">Guardar cambios</button>
    </div>`, {size:'lg'});
}

function saveEditAudit(id, isStarted){
  if (!hasRole('admin')){ toast('Sin permiso','error'); return; }
  const a = State.audits.find(x => x.id === id);
  if (!a) return;

  /* Siempre editables */
  a.objetivo = document.getElementById('eA_obj').value;
  a.alcance  = document.getElementById('eA_alc').value;

  /* Solo si checklist NO ha iniciado */
  if (!isStarted){
    const fi            = document.getElementById('eA_ini').value;
    const ff            = document.getElementById('eA_fin').value;
    if (ff < fi){ toast('La fecha fin debe ser posterior al inicio','error'); return; }
    const prevAuditorId = a.auditor_id;
    a.empresa_id   = document.getElementById('eA_emp').value;
    a.norma        = document.getElementById('eA_norma').value;
    a.auditor_id   = document.getElementById('eA_aud').value;
    a.tipo         = document.getElementById('eA_tipo').value;
    a.modalidad    = document.getElementById('eA_mod').value;
    a.prioridad    = document.getElementById('eA_prio').value;
    a.fecha_inicio = fi;
    a.fecha_fin    = ff;
    a.criterios    = document.getElementById('eA_cri').value;

    /* Notificar al (nuevo) auditor si cambió */
    if (a.auditor_id && a.auditor_id !== prevAuditorId){
      const emp = getCompany(a.empresa_id);
      addNotification(a.auditor_id,
        `Se te asignó la auditoría ${a.codigo} (${getStandardName(a.norma)}) para ${emp?.razon_social||'—'}`,
        'info');
    }
  }
  logAction(`Editó auditoría ${a.codigo}${isStarted?' (objetivo/alcance)':''}`, 'Auditorías');
  closeModal();
  toast('Auditoría actualizada', 'success');
  navigate('audits');
}

/* -------- Cerrar auditoría desde "En revisión" (botón ✓ Cerrar en tabla) -------- */
function changeAuditState(id){
  if (!hasRole('auditor')){ toast('Solo el auditor puede cerrar auditorías','error'); return; }
  const a = State.audits.find(x => x.id === id);
  if (!a || a.estado !== 'en_revision'){
    toast('Solo se puede cerrar una auditoría que esté En revisión','error'); return;
  }
  const ncAbiertas   = State.findings.filter(f => f.auditoria_id===id && f.tipo.includes('no_conformidad') && f.estado!=='cerrado').length;
  const accionesPend = State.actions.filter(p => p.auditoria_id===id && !['cerrada','cerrado'].includes(p.estado)).length;

  openModal(`
    <div class="modal-head">
      <div class="modal-title">Cerrar auditoría · ${a.codigo}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <p class="text-sm mb-3">Estado actual: ${estadoAuditoriaBadge(a.estado)} · Checklist: <strong>${a.progreso}%</strong></p>
      ${(ncAbiertas>0 || accionesPend>0) ? `
        <div style="background:#fef3c7;border-left:3px solid #fbbf24;padding:10px 14px;border-radius:6px;font-size:12.5px;color:#92400e;margin-bottom:14px">
          ⚠ Aún hay <strong>${ncAbiertas} NC(s) sin cerrar</strong> y <strong>${accionesPend} plan(es) pendiente(s)</strong>.
          ¿Confirmas que ya no hay nada más que corregir o que el plazo venció?
        </div>` : `
        <div style="background:rgba(16,217,160,.1);border-left:3px solid var(--teal);padding:10px 14px;border-radius:6px;font-size:12.5px;color:#065f46;margin-bottom:14px">
          ✓ Sin NC abiertas ni planes pendientes. La auditoría puede cerrarse limpiamente.
        </div>`}
      <p class="text-sm text-dim">Una vez cerrada, ya no se podrá modificar nada.</p>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="applyAuditState('${id}')">✓ Confirmar cierre</button>
    </div>`);
}

function applyAuditState(id){
  const a = State.audits.find(x => x.id === id);
  a.estado = 'cerrada';
  logAction(`Cerró auditoría ${a.codigo}`, 'Auditorías');
  _notifyAuditadoDeAuditoria(a, `La auditoría ${a.codigo} ha sido cerrada oficialmente`);
  closeModal();
  toast(`Auditoría ${a.codigo} cerrada`, 'success');
  navigate('audits');
}

/* ========================
   CHECKLIST (integrado en Auditorías)
   readOnly=false → Auditor ejecuta
   readOnly=true  → Admin / Auditado visualiza resultados
   ======================== */
function openChecklistFor(auditId, readOnly){
  /* Si no se pasa readOnly, determinarlo por rol */
  if (readOnly === undefined) readOnly = !hasRole('auditor');
  State.currentAudit  = auditId;
  State.checklistReadOnly = !!readOnly;
  closeModal();
  renderChecklistPage();
}

function renderChecklistPage(){
  const auditId  = State.currentAudit;
  const readOnly = State.checklistReadOnly ?? !hasRole('auditor');
  if (!auditId){ navigate('audits'); return; }
  const a = State.audits.find(x => x.id === auditId);
  if (!a){ State.currentAudit = null; navigate('audits'); return; }
  const e = getCompany(a.empresa_id);
  const checklist = getChecklistByStandard(a.norma);
  if (!State.responses[auditId]) State.responses[auditId] = {};
  const responses = State.responses[auditId];
  const stats = computeChecklistStats(checklist, responses);

  /* Actualizar progreso real desde el checklist */
  a.progreso = stats.pct;

  const modeLabel = readOnly
    ? `<span class="badge badge-muted" style="margin-left:8px">Solo lectura</span>`
    : `<span class="badge badge-info" style="margin-left:8px">Modo edición</span>`;

  document.getElementById('pageContainer').innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Checklist · ${getStandardName(a.norma)}${modeLabel}</h1>
          <div class="page-subtitle">${a.codigo} · ${esc(e?.razon_social||'')} — <strong>${stats.pct}%</strong> completado (${stats.evaluated}/${stats.total} ítems)</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" onclick="State.currentAudit=null;State.checklistReadOnly=false;navigate('audits')">← Volver a Auditorías</button>
          ${!readOnly ? `<button class="btn btn-primary" onclick="saveChecklistProgress()">💾 Guardar avance</button>` : ''}
        </div>
      </div>

      <div class="cl-toolbar">
        <div class="cl-progress">
          <span class="text-xs text-dim">Cumplimiento global</span>
          <div class="progress-bar"><div class="progress-fill" style="width:${stats.pct}%"></div></div>
          <div class="progress-text">${stats.pct}%</div>
        </div>
        <span class="badge badge-success">✓ Conforme ${stats.conforme}</span>
        <span class="badge badge-danger">✗ NC ${stats.nc}</span>
        <span class="badge badge-muted">N/A ${stats.na}</span>
        ${readOnly ? `<span class="text-xs text-dim" style="margin-left:auto">Resultado de la evaluación del auditor</span>` : ''}
      </div>

      <div id="checklistContainer">
        ${checklist.map((ch, idx) => renderChapter(ch, responses, idx, auditId, readOnly)).join('')}
      </div>
    </div>`;
}

function renderChapter(ch, responses, idx, auditId, readOnly){
  const s = ch.items.reduce((acc,it)=>{ const r=responses[it.codigo]?.result; if(r==='C')acc.c++;else if(r==='NC')acc.nc++;else if(r==='NA')acc.na++; return acc; },{c:0,nc:0,na:0});
  const isOpen = idx === 0;
  return `
    <div class="chapter-block">
      <div class="chapter-head ${isOpen?'open':''}" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">
        <span class="chevron">▶</span>
        <div class="chapter-title">${esc(ch.num)}. ${esc(ch.title)} <span class="text-dim text-sm">(${ch.items.length} requisitos)</span></div>
        <div class="chapter-stats">
          <span style="background:rgba(74,222,128,.15);color:#4ade80">C ${s.c}</span>
          <span style="background:rgba(248,113,113,.15);color:#f87171">NC ${s.nc}</span>
          <span style="background:rgba(154,163,189,.15);color:#9aa3bd">NA ${s.na}</span>
        </div>
      </div>
      <div class="chapter-body ${isOpen?'open':''}">
        ${ch.items.map(it => renderRequisite(it, responses, auditId, readOnly)).join('')}
      </div>
    </div>`;
}

/* Etiqueta con color para cada resultado (sin "Parcial") */
function resultLabel(result){
  const map = {
    'C':  `<span class="badge badge-success" style="font-size:12px;padding:4px 10px">✓ Conforme</span>`,
    'NC': `<span class="badge badge-danger"  style="font-size:12px;padding:4px 10px">✗ No conforme</span>`,
    'NA': `<span class="badge badge-muted"   style="font-size:12px;padding:4px 10px">— N/A</span>`,
  };
  return map[result] || `<span class="badge badge-muted" style="font-size:12px;padding:4px 10px">Sin evaluar</span>`;
}

function renderRequisite(it, responses, auditId, readOnly){
  const r      = responses[it.codigo] || {};
  const result = r.result || '';
  const audit  = State.audits.find(x=>x.id===auditId);
  /* Modo solo lectura: auditoría cerrada, admin o auditado */
  const isReadOnly = readOnly || audit?.estado === 'cerrada';

  return `
    <div class="requisite" data-codigo="${esc(it.codigo)}">
      <div class="req-code">${esc(it.codigo)}</div>
      <div class="req-text">
        <strong>${esc(it.pregunta)}</strong>
        <small><strong>Criterio:</strong> ${esc(it.criterio)}</small>
        <small><strong>Evidencia esperada:</strong> ${esc(it.evidencia)}</small>
      </div>
      <div class="req-controls">
        ${isReadOnly ? `
          ${resultLabel(result)}
          ${r.obs ? `<div class="req-obs-readonly"><strong class="text-xs text-dim">Observación:</strong> ${esc(r.obs)}</div>` : ''}
          ${(r.evidencias?.length||0)>0 ? `<div class="text-xs text-dim mt-1">📎 ${r.evidencias.length} evidencia(s) adjunta(s)</div>` : ''}
        ` : `
        <div class="result-buttons">
          <button class="result-btn ${result==='C'?'active-c':''}" onclick="setChecklistResult('${auditId}','${esc(it.codigo)}','C')">✓ Conforme</button>
          <button class="result-btn ${result==='NC'?'active-nc':''}" onclick="setChecklistResult('${auditId}','${esc(it.codigo)}','NC')">✗ No conforme</button>
          <button class="result-btn ${result==='NA'?'active-na':''}" onclick="setChecklistResult('${auditId}','${esc(it.codigo)}','NA')">— N/A</button>
        </div>
        <textarea class="req-obs" placeholder="Observación, evidencia revisada..." oninput="setChecklistObs('${auditId}','${esc(it.codigo)}',this.value)">${esc(r.obs||'')}</textarea>
        <div class="req-attach">
          <button class="attach-btn" onclick="attachChecklistEvidence('${auditId}','${esc(it.codigo)}')">📎 Adjuntar evidencia</button>
          ${result==='NC'?`<button class="attach-btn" style="border-color:var(--danger);color:var(--danger)" onclick="findingFromChecklist('${auditId}','${esc(it.codigo)}')">🚩 Crear hallazgo</button>`:''}
          ${(r.evidencias?.length||0)>0?`<span class="text-xs text-dim">${r.evidencias.length} evidencia(s)</span>`:''}
        </div>`}
      </div>
    </div>`;
}

function setChecklistResult(auditId, codigo, result){
  if (!State.responses[auditId]) State.responses[auditId] = {};
  if (!State.responses[auditId][codigo]) State.responses[auditId][codigo] = {evidencias:[]};
  State.responses[auditId][codigo].result = result;

  const a = State.audits.find(x=>x.id===auditId);
  const stats = computeChecklistStats(getChecklistByStandard(a.norma), State.responses[auditId]);
  a.progreso = stats.pct;

  /* ── Auto-transición de estado ── */
  if (!['cerrada','cancelada'].includes(a.estado)){
    if (stats.pct === 0){
      a.estado = 'planificada';
    } else if (stats.pct > 0 && stats.pct < 100){
      a.estado = 'ejecucion';
    }
    /* 100%: NO se cambia automáticamente — se muestra confirmación */
  }

  renderChecklistPage();

  /* Si llegó al 100% y no está en revisión/cerrada, preguntar */
  if (stats.pct === 100 && !['en_revision','cerrada','cancelada'].includes(a.estado)){
    setTimeout(() => confirmChecklistComplete(auditId), 300);
  }
}

/* Confirmación cuando el checklist llega al 100% */
function confirmChecklistComplete(auditId){
  const a = State.audits.find(x=>x.id===auditId);
  if (!a) return;
  const ncCount  = Object.values(State.responses[auditId]||{}).filter(r=>r.result==='NC').length;
  const actions  = State.actions.filter(p=>p.auditoria_id===auditId);

  openModal(`
    <div class="modal-head">
      <div class="modal-title">✅ Checklist al 100%</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <p class="mb-3">Has completado todos los ítems del checklist de <strong>${a.codigo}</strong>.</p>
      <div class="form-grid-2 mb-3">
        <div class="stat-card" style="padding:14px 16px">
          <div class="stat-label">No conformidades</div>
          <div class="stat-value" style="font-size:28px;color:${ncCount>0?'var(--danger)':'var(--teal)'}">${ncCount}</div>
        </div>
        <div class="stat-card" style="padding:14px 16px">
          <div class="stat-label">Planes de acción</div>
          <div class="stat-value" style="font-size:28px">${actions.length}</div>
        </div>
      </div>
      <div style="background:var(--surface2);border-radius:8px;padding:14px;font-size:13px;color:var(--text-dim);margin-bottom:14px">
        <strong style="color:var(--text)">Elige el siguiente estado:</strong>
        <ul style="margin:8px 0 0 16px;line-height:1.9">
          <li><strong>En revisión</strong> — la empresa tiene plazo para corregir puntos y subir evidencias. Podrás cerrar después.</li>
          <li><strong>Cerrada</strong> — ya no hay nada que la empresa deba o pueda modificar. Cierre definitivo.</li>
        </ul>
      </div>
      ${ncCount > 0 ? `
        <div style="background:#fef3c7;border-left:3px solid #fbbf24;padding:10px 14px;border-radius:6px;font-size:12.5px;color:#92400e">
          ⚠ Hay <strong>${ncCount} no conformidad(es)</strong> registrada(s). Considera si la empresa necesita tiempo para corregirlas antes de cerrar.
        </div>` : ''}
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Volver al checklist</button>
      <button class="btn btn-secondary" onclick="moveToRevision('${auditId}')">📋 En revisión</button>
      <button class="btn btn-primary" onclick="closeAuditDirectly('${auditId}')">✓ Cerrar auditoría</button>
    </div>`);
}

function _notifyAuditadoDeAuditoria(a, msg){
  const empresa = State.companies.find(c => c.id === a.empresa_id);
  if (empresa?.responsable_id){
    addNotification(empresa.responsable_id, msg, 'success');
  }
}

function moveToRevision(auditId){
  const a = State.audits.find(x=>x.id===auditId);
  if (!a) return;
  a.estado = 'en_revision';
  logAction(`Checklist de ${a.codigo} al 100% → En revisión`, 'Auditorías');
  _notifyAuditadoDeAuditoria(a, `La auditoría ${a.codigo} ha alcanzado el 100% y está en revisión final`);
  closeModal();
  toast('Auditoría en revisión. La empresa puede corregir y subir evidencias.', 'success');
  renderChecklistPage();
}

function closeAuditDirectly(auditId){
  const a = State.audits.find(x=>x.id===auditId);
  if (!a) return;
  a.estado = 'cerrada';
  logAction(`Cerró auditoría ${a.codigo} directamente al completar checklist`, 'Auditorías');
  _notifyAuditadoDeAuditoria(a, `La auditoría ${a.codigo} ha sido cerrada oficialmente`);
  closeModal();
  toast(`Auditoría ${a.codigo} cerrada.`, 'success');
  State.currentAudit = null;
  State.checklistReadOnly = false;
  navigate('audits');
}
function setChecklistObs(auditId, codigo, value){
  if (!State.responses[auditId]) State.responses[auditId] = {};
  if (!State.responses[auditId][codigo]) State.responses[auditId][codigo] = {evidencias:[]};
  State.responses[auditId][codigo].obs = value;
}
function attachChecklistEvidence(auditId, codigo){
  if (!State.responses[auditId]) State.responses[auditId] = {};
  if (!State.responses[auditId][codigo]) State.responses[auditId][codigo] = {evidencias:[]};
  const fileName = prompt('Nombre del archivo/evidencia (demo):');
  if (fileName){
    State.responses[auditId][codigo].evidencias.push({name:fileName, ts:new Date().toISOString()});
    toast('Evidencia adjuntada', 'success');
    renderChecklistPage();
  }
}
function findingFromChecklist(auditId, codigo){
  const a = State.audits.find(x=>x.id===auditId);
  const checklist = getChecklistByStandard(a.norma);
  let req = null;
  checklist.forEach(ch => { const f = ch.items.find(i=>i.codigo===codigo); if(f) req=f; });
  const r = State.responses[auditId]?.[codigo];
  closeModal();
  State.currentAudit = null;
  navigate('findings');
  setTimeout(() => openFindingForm({
    auditId, requisito: codigo,
    descripcion: r?.obs || `No conformidad en requisito ${codigo}: ${req?.pregunta}`,
    tipo: 'no_conformidad_menor'
  }), 200);
}
function saveChecklistProgress(){
  const a = State.audits.find(x=>x.id===State.currentAudit);
  if (a){ logAction(`Guardó avance del checklist ${a.codigo}`, 'Auditorías'); }
  toast('Avance guardado', 'success');
}
function computeChecklistStats(checklist, responses){
  let total=0, evaluated=0, conforme=0, nc=0, na=0;
  checklist.forEach(ch => ch.items.forEach(it => {
    total++;
    const r = responses[it.codigo]?.result;
    /* Solo C, NC y NA cuentan como evaluados (no existe Parcial) */
    if(r==='C'||r==='NC'||r==='NA'){ evaluated++; if(r==='C')conforme++; else if(r==='NC')nc++; else na++; }
  }));
  const pct = total ? Math.round((evaluated/total)*100) : 0;
  return {total, evaluated, conforme, nc, na, pct};
}

/* -------- Export -------- */
function exportAuditsCSV(){
  const rows = [['Código','Empresa','Norma','Tipo','Estado','Inicio','Fin','Progreso']];
  getVisibleAudits().forEach(a => {
    const e = getCompany(a.empresa_id);
    rows.push([a.codigo, e?.razon_social||'', getStandardName(a.norma), a.tipo, a.estado, a.fecha_inicio, a.fecha_fin, a.progreso+'%']);
  });
  downloadCSV(rows, 'auditorias.csv');
}