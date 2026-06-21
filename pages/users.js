/* ===========================================================
   AUDITA AI · Usuarios
   Admin: CRUD completo | Auditor: solo ve auditados | Auditado: sin acceso
   =========================================================== */

function renderUsers(){
  const role = State.user.role;

  let list = role === 'admin' ? USERS_DB : USERS_DB.filter(u => u.role === 'auditado');

  const html = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">${role==='admin'?'Usuarios':'Auditados'}</h1>
          <div class="page-subtitle">${role==='admin'?'Gestión de usuarios del sistema':'Listado de personas auditadas'}</div>
        </div>
        <div class="page-actions">
          ${hasRole('admin') ? '<button class="btn btn-primary" onclick="openNewUserModal()">+ Nuevo usuario</button>' : ''}
        </div>
      </div>

      <!-- Filtros -->
      <div class="card">
        <div class="form-grid">
          ${hasRole('admin') ? `<div class="field"><label>Rol</label>
            <select id="f_usr_rol" onchange="renderUsersTable()">
              <option value="">Todos</option>
              <option value="admin">Administrador</option>
              <option value="auditor">Auditor</option>
              <option value="auditado">Auditado</option>
            </select>
          </div>` : ''}
          <div class="field"><label>Estado</label>
            <select id="f_usr_estado" onchange="renderUsersTable()">
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div class="field"><label>Buscar</label>
            <input id="f_usr_q" placeholder="Nombre, email..." oninput="renderUsersTable()">
          </div>
        </div>
      </div>

      <div class="card" id="usersTableCard">
        <div id="usersTable"></div>
      </div>
    </div>`;

  document.getElementById('pageContainer').innerHTML = html;
  renderUsersTable();
}

function renderUsersTable(){
  const rol    = document.getElementById('f_usr_rol')?.value    || '';
  const estado = document.getElementById('f_usr_estado')?.value || '';
  const q      = (document.getElementById('f_usr_q')?.value     || '').toLowerCase();
  const role   = State.user.role;

  let list = role === 'admin' ? [...USERS_DB] : USERS_DB.filter(u => u.role === 'auditado');
  if (rol)    list = list.filter(u => u.role      === rol);
  if (estado) list = list.filter(u => (u.estado||'activo') === estado);
  if (q)      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

  document.getElementById('usersTable').innerHTML = `
    <div class="table-wrap">
      <table class="t">
        <thead><tr>
          <th>Usuario</th><th>Email</th><th>Rol</th>
          ${hasRole('admin') ? '<th>Empresa</th>' : ''}
          <th>Estado</th>
          ${hasRole('admin') ? '<th></th>' : ''}
        </tr></thead>
        <tbody>
          ${list.length ? list.map(u => {
            /* La empresa vinculada se resuelve desde empresa.responsable_id */
            const empVinculada = State.companies.find(c => c.responsable_id === u.id);
            const empresa = empVinculada ? empVinculada.razon_social : (u.role === 'auditado' ? '⚠ Sin empresa' : '—');
            const activo  = (u.estado||'activo') === 'activo';
            return `<tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="user-avatar" style="width:32px;height:32px;font-size:12px">${esc(u.initials)}</div>
                  <div>
                    <div class="cell-strong">${esc(u.name)}</div>
                    ${u.id === State.user.id ? '<small class="badge badge-info">Yo</small>' : ''}
                  </div>
                </div>
              </td>
              <td class="text-sm">${esc(u.email)}</td>
              <td><span class="badge ${u.role==='admin'?'badge-danger':u.role==='auditor'?'badge-info':'badge-muted'}">${esc(ROLE_NAMES[u.role]||u.role)}</span></td>
              ${hasRole('admin') ? `<td class="text-sm ${empVinculada?'text-dim':u.role==='auditado'?'text-danger':''}">${esc(empresa)}</td>` : ''}
              <td><span class="badge ${activo?'badge-success':'badge-muted'}">${activo?'Activo':'Inactivo'}</span></td>
              ${hasRole('admin') ? `<td class="row-action">
                <button onclick="openEditUserModal('${u.id}')" title="Editar">✏️</button>
                ${u.id !== State.user.id ? `<button onclick="toggleUserStatus('${u.id}')" title="${activo?'Desactivar':'Activar'}">${activo?'⏸':'▶'}</button>` : ''}
                ${u.id !== State.user.id ? `<button onclick="resetUserPass('${u.id}')" title="Resetear contraseña">🔑</button>` : ''}
              </td>` : ''}
            </tr>`;
          }).join('') : '<tr><td colspan="6"><div class="empty"><div class="empty-icon">👥</div>Sin usuarios con los filtros aplicados</div></td></tr>'}
        </tbody>
      </table>
    </div>`;
}

/* -------- Nuevo usuario -------- */
function openNewUserModal(){
  const compOpts = State.companies.map(c => `<option value="${c.id}">${esc(c.razon_social)}</option>`).join('');
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Nuevo usuario</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="field" style="grid-column:1/-1"><label>Nombre completo *</label><input id="nU_name" placeholder="Nombre Apellido"></div>
        <div class="field"><label>Email *</label><input type="email" id="nU_email" placeholder="usuario@empresa.com"></div>
        <div class="field"><label>Contraseña *</label><input type="password" id="nU_pass" placeholder="Mínimo 8 caracteres"></div>
        <div class="field"><label>Rol *</label>
          <select id="nU_rol" onchange="toggleEmpresaField()">
            <option value="auditor">Auditor</option>
            <option value="auditado">Auditado</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div class="field" id="nU_empField"><label>Empresa</label>
          <select id="nU_empresa"><option value="">Sin empresa</option>${compOpts}</select>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNewUser()">Crear usuario</button>
    </div>`, {size:'lg'});
}

function toggleEmpresaField(){
  const rol = document.getElementById('nU_rol')?.value;
  const field = document.getElementById('nU_empField');
  if (field) field.style.display = rol === 'admin' ? 'none' : '';
}

function saveNewUser(){
  const name  = document.getElementById('nU_name').value.trim();
  const email = document.getElementById('nU_email').value.trim().toLowerCase();
  const pass  = document.getElementById('nU_pass').value;
  const rol   = document.getElementById('nU_rol').value;
  const emp   = document.getElementById('nU_empresa')?.value || '';

  if (!name || !email || !pass){ toast('Completa todos los campos obligatorios (*)','error'); return; }
  if (USERS_DB.find(u => u.email.toLowerCase() === email)){ toast('Ya existe un usuario con ese email','error'); return; }

  const initials = name.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2);
  const newUser  = { id:'u'+(USERS_DB.length+1), name, email, password:pass, role:rol, initials, estado:'activo' };
  USERS_DB.push(newUser);

  /* Si es auditado con empresa, actualizar empresa.responsable_id */
  if (rol === 'auditado' && emp){
    const company = State.companies.find(c => c.id === emp);
    if (company) company.responsable_id = newUser.id;
  }

  logAction(`Creó usuario ${name} (${ROLE_NAMES[rol]})`, 'Usuarios');
  closeModal();
  toast('Usuario creado', 'success');
  navigate('users');
}

/* -------- Editar usuario -------- */
function openEditUserModal(id){
  const u = USERS_DB.find(x => x.id === id);
  if (!u) return;
  const compOpts = State.companies.map(c => `<option value="${c.id}"${c.id===u.empresa_id?' selected':''}>${esc(c.razon_social)}</option>`).join('');
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Editar usuario · ${esc(u.name)}</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="field" style="grid-column:1/-1"><label>Nombre completo</label><input id="eU_name" value="${esc(u.name)}"></div>
        <div class="field"><label>Email</label><input type="email" id="eU_email" value="${esc(u.email)}"></div>
        <div class="field"><label>Rol</label>
          <select id="eU_rol">
            <option value="auditor"${u.role==='auditor'?' selected':''}>Auditor</option>
            <option value="auditado"${u.role==='auditado'?' selected':''}>Auditado</option>
            <option value="admin"${u.role==='admin'?' selected':''}>Administrador</option>
          </select>
        </div>
        <div class="field"><label>Empresa</label>
          <select id="eU_empresa"><option value="">Sin empresa</option>${compOpts}</select>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveEditUser('${id}')">Guardar</button>
    </div>`, {size:'lg'});
}

function saveEditUser(id){
  const u    = USERS_DB.find(x => x.id === id);
  const empId = document.getElementById('eU_empresa').value || null;

  u.name     = document.getElementById('eU_name').value;
  u.email    = document.getElementById('eU_email').value;
  u.role     = document.getElementById('eU_rol').value;
  u.initials = u.name.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2);

  /* Sincronizar empresa.responsable_id:
     - Si tenía empresa → quitar el vínculo de la empresa anterior
     - Si tiene empresa nueva → asignar en esa empresa */
  State.companies.forEach(c => { if (c.responsable_id === id) c.responsable_id = null; });
  if (u.role === 'auditado' && empId){
    const company = State.companies.find(c => c.id === empId);
    if (company) company.responsable_id = id;
  }

  logAction(`Editó usuario ${u.name}`, 'Usuarios');
  closeModal();
  toast('Usuario actualizado', 'success');
  navigate('users');
}

function toggleUserStatus(id){
  const u = USERS_DB.find(x => x.id === id);
  u.estado = (u.estado||'activo') === 'activo' ? 'inactivo' : 'activo';
  logAction(`Cambió estado de ${u.name} a ${u.estado}`, 'Usuarios');
  toast(`Usuario ${u.estado}`, 'success');
  navigate('users');
}

function resetUserPass(id){
  const u = USERS_DB.find(x => x.id === id);
  const newPass = prompt(`Nueva contraseña para ${u.name}:`);
  if (newPass){
    u.password = newPass;
    logAction(`Reseteó contraseña de ${u.name}`, 'Usuarios');
    toast('Contraseña actualizada', 'success');
  }
}
