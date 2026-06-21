/* ===========================================================
   AUDITA AI · Empresas
   Admin: CRUD completo | Auditor: solo ve sus auditadas | Auditado: sin acceso
   =========================================================== */

/* Orden actual: 'asc' (A→Z) o 'desc' (Z→A) */
let _compSortDir = 'asc';

function renderCompanies(){
  const role  = State.user.role;

  const html = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Empresas</h1>
          <div class="page-subtitle">${role==='admin'?'Gestión de empresas auditadas':'Empresas en mis auditorías'}</div>
        </div>
        <div class="page-actions">
          ${hasRole('admin') ? '<button class="btn btn-primary" onclick="openNewCompanyModal()">+ Nueva empresa</button>' : ''}
        </div>
      </div>

      <!-- Filtros -->
      <div class="card">
        <div class="form-grid">
          <div class="field"><label>Estado</label>
            <select id="f_comp_estado" onchange="renderCompaniesTable()">
              <option value="">Todos</option>
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>
          <div class="field"><label>Buscar</label>
            <input id="f_comp_q" placeholder="Razón social, RUC, sector..." oninput="renderCompaniesTable()">
          </div>
          <div class="field" style="display:flex;align-items:flex-end">
            <button id="sortCompBtn" class="btn btn-ghost btn-sm" onclick="toggleCompanySort()" style="height:38px;gap:6px">
              ↕ A→Z
            </button>
          </div>
        </div>
      </div>

      <!-- Tarjetas de empresas -->
      <div id="companiesGrid"></div>
    </div>`;

  document.getElementById('pageContainer').innerHTML = html;
  renderCompaniesTable();
}

function toggleCompanySort(){
  _compSortDir = _compSortDir === 'asc' ? 'desc' : 'asc';
  const btn = document.getElementById('sortCompBtn');
  if (btn) btn.textContent = _compSortDir === 'asc' ? '↕ A→Z' : '↕ Z→A';
  renderCompaniesTable();
}

function getAuditorCompanies(){
  const myAudits = getVisibleAudits();
  const ids = [...new Set(myAudits.map(a => a.empresa_id))];
  return State.companies.filter(c => ids.includes(c.id));
}

function renderCompaniesTable(){
  const estado = document.getElementById('f_comp_estado')?.value || '';
  const q      = (document.getElementById('f_comp_q')?.value || '').toLowerCase();
  const role   = State.user.role;

  let list = role === 'admin' ? State.companies : getAuditorCompanies();
  if (estado) list = list.filter(c => c.estado === estado);
  if (q)      list = list.filter(c => (c.razon_social||'').toLowerCase().includes(q) || (c.ruc||'').toLowerCase().includes(q) || (c.sector||'').toLowerCase().includes(q));

  /* Ordenar alfabéticamente */
  list = [...list].sort((a,b) => {
    const cmp = (a.razon_social||'').localeCompare(b.razon_social||'', 'es', {sensitivity:'base'});
    return _compSortDir === 'asc' ? cmp : -cmp;
  });

  document.getElementById('companiesGrid').innerHTML = list.length
    ? `<div class="companies-grid">${list.map(c => renderCompanyCard(c)).join('')}</div>`
    : `<div class="card"><div class="empty"><div class="empty-icon">🏢</div>Sin empresas con los filtros aplicados</div></div>`;
}

function renderCompanyCard(c){
  const audits      = State.audits.filter(a => a.empresa_id === c.id);
  const findings    = State.findings.filter(f => f.empresa_id === c.id);
  const openFnd     = findings.filter(f => f.estado !== 'cerrado').length;
  const responsable = getUserById(c.responsable_id);
  return `
    <div class="company-card" onclick="openCompanyDetail('${c.id}')">
      <div class="company-card-head">
        <div class="company-logo">${(c.razon_social||'?')[0].toUpperCase()}</div>
        <div class="company-info">
          <div class="company-name">${esc(c.razon_social)}</div>
          <div class="company-meta">${esc(c.ruc||'Sin RUC')} · ${esc(c.sector||'Sin sector')}</div>
          ${responsable
            ? `<div class="text-xs text-dim mt-1">👤 ${esc(responsable.name)}</div>`
            : `<div class="text-xs" style="color:var(--danger)">⚠ Sin responsable asignado</div>`}
        </div>
        <span class="badge ${c.estado==='activa'?'badge-success':'badge-muted'}">${c.estado||'activa'}</span>
      </div>
      <div class="company-stats">
        <div class="company-stat"><div class="company-stat-val">${audits.length}</div><div class="company-stat-label">Auditorías</div></div>
        <div class="company-stat"><div class="company-stat-val ${openFnd>0?'text-danger':''}">${openFnd}</div><div class="company-stat-label">Hallazgos abiertos</div></div>
        <div class="company-stat"><div class="company-stat-val">${(c.sedes||[]).length}</div><div class="company-stat-label">Sedes</div></div>
      </div>
      ${hasRole('admin') ? `
      <div class="company-actions" onclick="event.stopPropagation()">
        <button class="btn btn-ghost btn-sm" onclick="openEditCompanyModal('${c.id}')">✏️ Editar</button>
        <button class="btn btn-ghost btn-sm" onclick="toggleCompanyStatus('${c.id}')">${c.estado==='activa'?'⏸ Desactivar':'▶ Activar'}</button>
      </div>` : ''}
    </div>`;
}

/* -------- Detalle empresa -------- */
function openCompanyDetail(id){
  const c = State.companies.find(x => x.id === id);
  if (!c) return;
  const audits      = State.audits.filter(a => a.empresa_id === id);
  const findings    = State.findings.filter(f => f.empresa_id === id);
  const contacto    = c.contacto || {};
  const responsable = getUserById(c.responsable_id);

  openModal(`
    <div class="modal-head">
      <div class="modal-title">${esc(c.razon_social)}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2 mb-4">
        <div><strong class="text-xs text-dim">RUC</strong><div>${esc(c.ruc||'—')}</div></div>
        <div><strong class="text-xs text-dim">Sector</strong><div>${esc(c.sector||'—')}</div></div>
        <div><strong class="text-xs text-dim">País / Ciudad</strong><div>${esc(c.pais||'')} ${esc(c.ciudad||'')}</div></div>
        <div><strong class="text-xs text-dim">Estado</strong><div><span class="badge ${c.estado==='activa'?'badge-success':'badge-muted'}">${c.estado||'activa'}</span></div></div>
        <div><strong class="text-xs text-dim">Contacto</strong><div>${esc(contacto.nombre||'—')} ${contacto.cargo ? `<span class="text-xs text-dim">· ${esc(contacto.cargo)}</span>` : ''}</div></div>
        <div><strong class="text-xs text-dim">Email / Tel</strong><div class="text-sm">${esc(contacto.email||'—')} · ${esc(contacto.telefono||'')}</div></div>
        <div style="grid-column:1/-1;border-top:1px solid var(--border);padding-top:10px;margin-top:4px">
          <strong class="text-xs text-dim">Responsable auditado</strong>
          <div class="mt-1">
            ${responsable
              ? `<span class="badge badge-info" style="font-size:13px;padding:4px 10px">👤 ${esc(responsable.name)}</span> <span class="text-xs text-dim">${esc(responsable.email)}</span>`
              : `<span style="color:var(--danger);font-size:13px">⚠ Sin responsable asignado — asigna un auditado a esta empresa</span>`}
          </div>
        </div>
      </div>

      <strong class="text-xs text-dim">Sedes / Procesos</strong>
      <div class="mt-2 mb-4">
        ${(c.sedes||[]).map(s => `
          <div class="kanban-card">
            <div class="kanban-card-title">${esc(s.nombre)}</div>
            <div class="text-xs text-dim">${(s.procesos||[]).join(', ')||'Sin procesos'}</div>
          </div>`).join('') || '<div class="text-sm text-muted">Sin sedes registradas</div>'}
      </div>

      <strong class="text-xs text-dim">Auditorías (${audits.length})</strong>
      <div class="mt-2 mb-4">
        ${audits.slice(0,3).map(a => `
          <div class="kanban-card" onclick="closeModal();setTimeout(()=>openAuditDetail('${a.id}'),100)">
            <div class="kanban-card-title">${a.codigo}</div>
            <div class="kanban-card-meta">${estadoAuditoriaBadge(a.estado)} <span class="text-xs text-dim">${a.fecha_inicio}</span></div>
          </div>`).join('') || '<div class="text-sm text-muted">Sin auditorías</div>'}
        ${audits.length > 3 ? `<div class="text-xs text-dim mt-1">+${audits.length-3} más</div>` : ''}
      </div>

      <strong class="text-xs text-dim">Hallazgos abiertos (${findings.filter(f=>f.estado!=='cerrado').length})</strong>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>
      ${hasRole('admin') ? `<button class="btn btn-primary" onclick="closeModal();setTimeout(()=>openEditCompanyModal('${id}'),100)">✏️ Editar empresa</button>` : ''}
    </div>`, {size:'lg'});
}

/* -------- Nueva empresa -------- */
function openNewCompanyModal(){
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Nueva empresa</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">

      <!-- DATOS DE LA EMPRESA -->
      <div class="card-header" style="margin-bottom:12px">
        <div class="card-title text-sm">📋 Datos de la empresa</div>
      </div>
      <div class="form-grid-2">
        <div class="field" style="grid-column:1/-1"><label>Razón social *</label><input id="nC_rs" placeholder="Nombre legal completo"></div>
        <div class="field"><label>RUC / NIF *</label><input id="nC_ruc" placeholder="1234567890001"></div>
        <div class="field"><label>Sector *</label><input id="nC_sector" placeholder="Manufactura, Servicios, Alimentos..."></div>
        <div class="field"><label>País</label><input id="nC_pais" value="Ecuador"></div>
        <div class="field"><label>Ciudad *</label><input id="nC_ciudad" placeholder="Quito"></div>
      </div>

      <!-- RESPONSABLE / ENCARGADO -->
      <div class="card-header" style="margin:18px 0 12px">
        <div class="card-title text-sm">👤 Encargado de la empresa</div>
        <div class="text-xs text-dim">Esta persona tendrá acceso al sistema como <strong>Auditado</strong> para ver auditorías y hallazgos de su empresa</div>
      </div>
      <div style="background:#e0f2fe;border-left:3px solid var(--info);padding:10px 14px;border-radius:6px;font-size:12px;color:#0369a1;margin-bottom:14px">
        ℹ Se creará automáticamente un acceso al sistema para esta persona.
      </div>
      <div class="form-grid-2">
        <div class="field"><label>Nombre completo *</label><input id="nC_rn" placeholder="Nombre y apellido"></div>
        <div class="field"><label>Cargo *</label><input id="nC_rc" placeholder="Gerente de Calidad, Director..."></div>
        <div class="field"><label>Email (usuario de acceso) *</label><input type="email" id="nC_re" placeholder="correo@empresa.com"></div>
        <div class="field"><label>Contraseña de acceso *</label><input type="password" id="nC_rp" placeholder="Mínimo 6 caracteres"></div>
        <div class="field"><label>Teléfono</label><input id="nC_rt" placeholder="+593..."></div>
      </div>

    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNewCompany()">Crear empresa y encargado</button>
    </div>`, {size:'lg'});
}

function saveNewCompany(){
  /* --- Empresa --- */
  const razon_social = document.getElementById('nC_rs').value.trim();
  const ruc          = document.getElementById('nC_ruc').value.trim();
  const sector       = document.getElementById('nC_sector').value.trim();
  const ciudad       = document.getElementById('nC_ciudad').value.trim();
  const pais         = document.getElementById('nC_pais').value.trim();

  /* --- Encargado --- */
  const respNombre   = document.getElementById('nC_rn').value.trim();
  const respCargo    = document.getElementById('nC_rc').value.trim();
  const respEmail    = document.getElementById('nC_re').value.trim().toLowerCase();
  const respPass     = document.getElementById('nC_rp').value;
  const respTel      = document.getElementById('nC_rt').value.trim();

  /* Validar */
  const errores = [];
  if (!razon_social) errores.push('Razón social');
  if (!ruc)          errores.push('RUC / NIF');
  if (!sector)       errores.push('Sector');
  if (!ciudad)       errores.push('Ciudad');
  if (!respNombre)   errores.push('Nombre del encargado');
  if (!respCargo)    errores.push('Cargo del encargado');
  if (!respEmail)    errores.push('Email del encargado');
  if (!respPass || respPass.length < 6) errores.push('Contraseña (mínimo 6 caracteres)');
  if (errores.length){ toast(`Campos obligatorios: ${errores.join(', ')}`, 'error'); return; }

  /* Email único */
  if (USERS_DB.find(u => u.email === respEmail)){
    toast(`El email "${respEmail}" ya está registrado en el sistema`, 'error'); return;
  }

  /* Crear usuario auditado */
  const initials = respNombre.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  const newUser  = {
    id       : 'u' + (USERS_DB.length + 1),
    email    : respEmail,
    password : respPass,
    name     : respNombre,
    role     : 'auditado',
    initials
  };
  USERS_DB.push(newUser);

  /* Crear empresa vinculada */
  const newCompany = {
    id           : 'c' + (State.companies.length + 1),
    razon_social, ruc, sector, ciudad, pais,
    responsable_id: newUser.id,
    estado       : 'activa',
    sedes        : [],
    contacto     : { nombre: respNombre, cargo: respCargo, email: respEmail, telefono: respTel }
  };
  State.companies.push(newCompany);

  logAction(`Creó empresa ${razon_social} con encargado ${respNombre}`, 'Empresas');
  closeModal();
  toast(`Empresa "${razon_social}" y acceso de ${respNombre} creados`, 'success');
  navigate('companies');
}

/* -------- Editar empresa -------- */
function openEditCompanyModal(id){
  const c  = State.companies.find(x => x.id === id);
  if (!c) return;
  const ct = c.contacto || {};

  /* Auditados disponibles: los sin empresa asignada + el actual de esta empresa */
  const auditados = USERS_DB.filter(u => u.role === 'auditado');
  const takenIds  = State.companies.filter(x => x.id !== id).map(x => x.responsable_id).filter(Boolean);
  const available = auditados.filter(u => !takenIds.includes(u.id));
  const respOpts  = [
    `<option value="">— Sin asignar —</option>`,
    ...available.map(u =>
      `<option value="${u.id}"${u.id===c.responsable_id?' selected':''}>${esc(u.name)} — ${esc(u.email)}</option>`)
  ].join('');

  openModal(`
    <div class="modal-head">
      <div class="modal-title">Editar empresa</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="field" style="grid-column:1/-1"><label>Razón social *</label><input id="eC_rs" value="${esc(c.razon_social)}"></div>
        <div class="field"><label>RUC / NIF</label><input id="eC_ruc" value="${esc(c.ruc||'')}"></div>
        <div class="field"><label>Sector</label><input id="eC_sector" value="${esc(c.sector||'')}"></div>
        <div class="field"><label>País</label><input id="eC_pais" value="${esc(c.pais||'Ecuador')}"></div>
        <div class="field"><label>Ciudad</label><input id="eC_ciudad" value="${esc(c.ciudad||'')}"></div>
        <div class="field" style="grid-column:1/-1">
          <label>Responsable auditado * <span class="text-xs text-dim">(persona con acceso al sistema)</span></label>
          <select id="eC_resp">
            <option value="">— Sin asignar —</option>
            ${respOpts}
          </select>
        </div>
      </div>
      <div class="card-header mt-3"><div class="card-title text-sm">Contacto principal</div></div>
      <div class="form-grid-2">
        <div class="field"><label>Nombre</label><input id="eC_cn" value="${esc(ct.nombre||'')}"></div>
        <div class="field"><label>Cargo</label><input id="eC_cc" value="${esc(ct.cargo||'')}"></div>
        <div class="field"><label>Email</label><input type="email" id="eC_ce" value="${esc(ct.email||'')}"></div>
        <div class="field"><label>Teléfono</label><input id="eC_ct" value="${esc(ct.telefono||'')}"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveEditCompany('${id}')">Guardar cambios</button>
    </div>`, {size:'lg'});
}

function saveEditCompany(id){
  const c = State.companies.find(x => x.id === id);
  if (!document.getElementById('eC_rs').value.trim()){ toast('La razón social es obligatoria','error'); return; }
  c.razon_social  = document.getElementById('eC_rs').value;
  c.ruc           = document.getElementById('eC_ruc').value;
  c.sector        = document.getElementById('eC_sector').value;
  c.pais          = document.getElementById('eC_pais').value;
  c.ciudad        = document.getElementById('eC_ciudad').value;
  c.responsable_id= document.getElementById('eC_resp').value || null;
  c.contacto      = {
    nombre   : document.getElementById('eC_cn').value,
    cargo    : document.getElementById('eC_cc').value,
    email    : document.getElementById('eC_ce').value,
    telefono : document.getElementById('eC_ct').value,
  };
  logAction(`Editó empresa ${c.razon_social}`, 'Empresas');
  closeModal();
  toast('Empresa actualizada', 'success');
  navigate('companies');
}

function toggleCompanyStatus(id){
  const c = State.companies.find(x => x.id === id);
  c.estado = c.estado === 'activa' ? 'inactiva' : 'activa';
  logAction(`Cambió estado de ${c.razon_social} a ${c.estado}`, 'Empresas');
  toast(`Empresa ${c.estado}`, 'success');
  navigate('companies');
}
