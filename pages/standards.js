/* ===========================================================
   AUDITA AI · Estándares / Normas
   Admin: CRUD completo | Auditor: ve normas, personaliza checklist | Auditado: sin acceso
   =========================================================== */

function renderStandards(){
  const role = State.user.role;

  const html = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Estándares y Normas</h1>
          <div class="page-subtitle">${role==='admin'?'Gestión de normas y checklists del sistema':'Normas disponibles y checklists'}</div>
        </div>
        <div class="page-actions">
          ${hasRole('admin') ? '<button class="btn btn-primary" onclick="openNewStandardModal()">+ Nueva norma</button>' : ''}
        </div>
      </div>

      <div class="standards-grid" id="standardsGrid">
        ${Object.values(STANDARDS).map(s => renderStandardCard(s)).join('')}
      </div>
    </div>`;

  document.getElementById('pageContainer').innerHTML = html;
}

function renderStandardCard(s){
  const checklist = getChecklistByStandard(s.id);
  const totalItems = checklist.reduce((acc, ch) => acc + ch.items.length, 0);
  const auditsUsing = State.audits.filter(a => a.norma === s.id).length;

  return `
    <div class="card standard-card">
      <div class="standard-head">
        <div class="standard-badge">${esc(s.code)}</div>
        <div class="standard-info">
          <div class="standard-name">${esc(s.name)}</div>
          <div class="standard-meta">${esc(s.version||'')} · ${esc(s.organization||'')} · ${s.year||''}</div>
        </div>
        <span class="badge ${s.active!==false?'badge-success':'badge-muted'}">${s.active!==false?'Activa':'Inactiva'}</span>
      </div>
      <div class="standard-desc text-sm text-dim mb-3">${esc(s.description||'')}</div>
      <div class="standard-stats">
        <div class="std-stat"><strong>${checklist.length}</strong><span>Capítulos</span></div>
        <div class="std-stat"><strong>${totalItems}</strong><span>Requisitos</span></div>
        <div class="std-stat"><strong>${auditsUsing}</strong><span>Auditorías</span></div>
      </div>
      <div class="standard-actions">
        <button class="btn btn-ghost btn-sm" onclick="previewStandardChecklist('${s.id}')">👁 Ver checklist</button>
        ${hasRole('auditor','admin') ? `<button class="btn btn-ghost btn-sm" onclick="customizeChecklist('${s.id}')">⚙ Personalizar</button>` : ''}
        ${hasRole('admin') ? `<button class="btn btn-ghost btn-sm" onclick="editStandardModal('${s.id}')">✏️ Editar</button>` : ''}
        ${hasRole('admin') ? `<button class="btn btn-ghost btn-sm" onclick="toggleStandardStatus('${s.id}')">${s.active!==false?'⏸ Desactivar':'▶ Activar'}</button>` : ''}
      </div>
    </div>`;
}

/* -------- Preview checklist -------- */
function previewStandardChecklist(standardId){
  const s = STANDARDS[standardId];
  const checklist = getChecklistByStandard(standardId);
  if (!checklist || !checklist.length){
    toast('Esta norma no tiene checklist configurado','error'); return;
  }

  const html = checklist.map(ch => `
    <div class="chapter-block">
      <div class="chapter-head" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">
        <span class="chevron">▶</span>
        <div class="chapter-title">${esc(ch.num)}. ${esc(ch.title)}</div>
        <span class="badge badge-muted">${ch.items.length} req.</span>
      </div>
      <div class="chapter-body">
        ${ch.items.map(it => `
          <div class="requisite" style="cursor:default">
            <div class="req-code">${esc(it.codigo)}</div>
            <div class="req-text">
              <strong>${esc(it.pregunta)}</strong>
              <small><strong>Criterio:</strong> ${esc(it.criterio)}</small>
              <small><strong>Evidencia esperada:</strong> ${esc(it.evidencia)}</small>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');

  openModal(`
    <div class="modal-head">
      <div>
        <div class="modal-title">Checklist · ${esc(s.code)}</div>
        <div class="text-sm text-dim">${esc(s.name)}</div>
      </div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">${html}</div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>
    </div>`, {size:'xl'});
}

/* -------- Personalizar checklist (auditor) -------- */
function customizeChecklist(standardId){
  const s = STANDARDS[standardId];
  const checklist = getChecklistByStandard(standardId);

  openModal(`
    <div class="modal-head">
      <div class="modal-title">Personalizar checklist · ${esc(s?.code||standardId)}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <p class="text-sm text-dim mb-3">Selecciona los capítulos y requisitos que aplicarán para tu próxima auditoría. La selección se guardará como plantilla.</p>
      ${checklist.map(ch => `
        <div class="mb-3">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600">
            <input type="checkbox" checked> ${esc(ch.num)}. ${esc(ch.title)} <span class="badge badge-muted">${ch.items.length}</span>
          </label>
          <div class="ml-4 mt-1">
            ${ch.items.map(it => `
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:4px;font-size:13px">
                <input type="checkbox" checked> ${esc(it.codigo)} — ${esc(it.pregunta.slice(0,80))}
              </label>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="toast('Plantilla personalizada guardada','success');closeModal()">Guardar plantilla</button>
    </div>`, {size:'xl'});
}

/* -------- Nueva norma (admin) -------- */
function openNewStandardModal(){
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Nueva norma</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="field"><label>Código *</label><input id="nS_code" placeholder="ISO 45001"></div>
        <div class="field"><label>Versión</label><input id="nS_ver" placeholder="2018"></div>
        <div class="field" style="grid-column:1/-1"><label>Nombre completo *</label><input id="nS_name" placeholder="Sistemas de gestión de la seguridad y salud..."></div>
        <div class="field"><label>Organismo</label><input id="nS_org" placeholder="ISO, IEC, IRAM..."></div>
        <div class="field"><label>Año</label><input type="number" id="nS_year" placeholder="2024"></div>
      </div>
      <div class="field"><label>Descripción</label><textarea id="nS_desc" placeholder="Breve descripción del alcance de la norma..."></textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNewStandard()">Crear norma</button>
    </div>`, {size:'lg'});
}

function saveNewStandard(){
  const code = document.getElementById('nS_code').value.trim();
  const name = document.getElementById('nS_name').value.trim();
  if (!code || !name){ toast('Código y nombre son obligatorios','error'); return; }
  const id = code.toLowerCase().replace(/\s+/g,'_').replace(/:/g,'');
  STANDARDS[id] = {
    id, code, name,
    version     : document.getElementById('nS_ver').value,
    organization: document.getElementById('nS_org').value,
    year        : parseInt(document.getElementById('nS_year').value)||new Date().getFullYear(),
    description : document.getElementById('nS_desc').value,
    active      : true
  };
  logAction(`Creó norma ${code}`, 'Estándares');
  closeModal();
  toast(`Norma ${code} creada`, 'success');
  navigate('standards');
}

/* -------- Editar norma -------- */
function editStandardModal(id){
  const s = STANDARDS[id];
  if (!s) return;
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Editar norma · ${esc(s.code)}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="field"><label>Código</label><input id="eS_code" value="${esc(s.code)}"></div>
        <div class="field"><label>Versión</label><input id="eS_ver" value="${esc(s.version||'')}"></div>
        <div class="field" style="grid-column:1/-1"><label>Nombre</label><input id="eS_name" value="${esc(s.name)}"></div>
        <div class="field"><label>Organismo</label><input id="eS_org" value="${esc(s.organization||'')}"></div>
        <div class="field"><label>Año</label><input type="number" id="eS_year" value="${s.year||''}"></div>
      </div>
      <div class="field"><label>Descripción</label><textarea id="eS_desc">${esc(s.description||'')}</textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveEditStandard('${id}')">Guardar</button>
    </div>`, {size:'lg'});
}

function saveEditStandard(id){
  const s = STANDARDS[id];
  s.code         = document.getElementById('eS_code').value;
  s.version      = document.getElementById('eS_ver').value;
  s.name         = document.getElementById('eS_name').value;
  s.organization = document.getElementById('eS_org').value;
  s.year         = parseInt(document.getElementById('eS_year').value)||s.year;
  s.description  = document.getElementById('eS_desc').value;
  logAction(`Editó norma ${s.code}`, 'Estándares');
  closeModal();
  toast('Norma actualizada', 'success');
  navigate('standards');
}

function toggleStandardStatus(id){
  const s = STANDARDS[id];
  s.active = s.active === false ? true : false;
  logAction(`Cambió estado de ${s.code} a ${s.active?'activa':'inactiva'}`, 'Estándares');
  toast(`Norma ${s.active?'activada':'desactivada'}`, 'success');
  navigate('standards');
}
