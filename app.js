/* ===========================================================
   AUDITA AI · Core application
   Login · Navigation · Modal · Toast · Router
   =========================================================== */

/* ========= INIT ========= */
document.addEventListener('DOMContentLoaded', () => {
  // Chips de rol en login
  document.querySelectorAll('.role-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('loginUser').value = chip.dataset.email || '';
      document.getElementById('loginPass').value = chip.dataset.pass || '';
    });
  });

  // Enter en contraseña
  document.getElementById('loginPass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });

  // Ctrl+K búsqueda
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      document.getElementById('globalSearch')?.focus();
    }
    if (e.key === 'Escape') closeModal();
  });
});

/* ========= LOGIN / LOGOUT ========= */
function doLogin(){
  const email = document.getElementById('loginUser').value.trim();
  const pass  = document.getElementById('loginPass').value;
  if (!email || !pass){ toast('Ingresa correo y contraseña', 'error'); return; }

  let user = USERS_DB.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
  if (!user){
    // Para demo: aceptar cualquier pass si el email existe
    user = USERS_DB.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  if (!user){
    toast('Credenciales incorrectas', 'error');
    return;
  }

  State.user = user;
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  document.getElementById('userName').textContent  = user.name;
  document.getElementById('userRole').textContent  = ROLE_NAMES[user.role] || user.role;
  document.getElementById('userAvatar').textContent = user.initials;

  setupNav();
  /* Ocultar campana de notificaciones para admin */
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) notifBtn.style.display = user.role === 'admin' ? 'none' : '';
  refreshBadges();
  navigate('dashboard');
  logAction(`Inició sesión como ${ROLE_NAMES[user.role]}`, 'Autenticación');
  toast(`Bienvenido/a, ${user.name}`, 'success');
}

function logout(){
  closeModal();
  State.user = null;
  document.getElementById('app').classList.remove('visible');
  document.getElementById('loginScreen').style.display = 'flex';
  // Limpiar estado de sesión (mantener datos)
  State.currentPage  = 'dashboard';
  State.currentAudit = null;
}

/* ========= NAVEGACIÓN ========= */
function setupNav(){
  const role = State.user.role;

  // Mostrar/ocultar items según rol
  document.querySelectorAll('.nav-item[data-roles], .sidebar-section[data-roles]').forEach(el => {
    const allowed = (el.dataset.roles || '').split(',').map(r => r.trim());
    el.style.display = allowed.includes(role) ? '' : 'none';
  });

  // Click en items de nav
  document.querySelectorAll('.nav-item').forEach(n => {
    // Remover listeners previos clonando el nodo
    const clone = n.cloneNode(true);
    n.parentNode.replaceChild(clone, n);
    clone.addEventListener('click', () => navigate(clone.dataset.page));
  });
}

function navigate(page){
  // Verificar permiso de página según rol
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem){
    const allowed = (navItem.dataset.roles || '').split(',').map(r => r.trim());
    if (!allowed.includes(State.user.role)){
      toast('No tienes acceso a esta sección', 'error');
      return;
    }
  }

  State.currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));

  const renderers = {
    dashboard:   renderDashboard,
    audits:      renderAudits,
    findings:    renderFindings,
    actions:     renderActions,
    companies:   renderCompanies,
    standards:   renderStandards,
    users:       renderUsers,
    reports:     renderReports,
    traceability:renderTraceability
  };

  const fn = renderers[page];
  if (fn) fn();
  else renderDashboard();

  refreshBadges();
  window.scrollTo(0,0);
}

function refreshBadges(){
  const ac = document.getElementById('navAuditCount');
  const fc = document.getElementById('navFindingsCount');
  const role = State.user?.role;

  if (ac){
    if (role === 'admin'){
      ac.textContent = State.audits.filter(a => a.estado !== 'cerrada').length;
    } else if (role === 'auditor'){
      ac.textContent = State.audits.filter(a => a.auditor_id === State.user.id && a.estado !== 'cerrada').length;
    } else {
      ac.textContent = State.audits.filter(a => a.empresa_auditado_id === getAuditadoCompany() && a.estado !== 'cerrada').length;
    }
  }

  if (fc){
    const open = getVisibleFindings().filter(f => f.estado !== 'cerrado').length;
    fc.textContent = open;
    fc.className = 'nav-badge' + (open > 0 ? ' alert' : '');
  }

  refreshNotificationBell();
}

/* ========= NOTIFICACIONES ========= */
function addNotification(forUserId, message, type='info'){
  State.notifications.unshift({
    id     : 'n' + Date.now() + Math.random(),
    forUserId,
    message,
    type,
    ts     : new Date().toISOString().slice(0,10),
    read   : false
  });
  refreshNotificationBell();
}

function refreshNotificationBell(){
  const userId = State.user?.id;
  const role   = State.user?.role;
  /* Admin no tiene notificaciones */
  if (!userId || role === 'admin') return;
  const count = State.notifications.filter(n => n.forUserId === userId && !n.read).length;
  const dot   = document.querySelector('.topbar-btn .dot');
  if (!dot) return;
  if (count > 0){
    dot.textContent = count > 9 ? '9+' : String(count);
    dot.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;background:var(--danger);color:#fff;font-size:10px;font-weight:700;border-radius:50%;min-width:16px;height:16px;padding:0 3px;margin-left:2px;vertical-align:middle';
  } else {
    dot.textContent = '';
    dot.style.cssText = '';
  }
}

function getAuditadoCompany(){
  /* Busca la empresa cuyo responsable_id coincide con el usuario auditado actual */
  const c = State.companies.find(c => c.responsable_id === State.user?.id);
  return c?.id || null;
}

function getVisibleFindings(){
  const role = State.user?.role;
  if (role === 'admin') return State.findings;
  if (role === 'auditor'){
    const myAudits = State.audits.filter(a => a.auditor_id === State.user.id || (a.equipo||[]).includes(State.user.id)).map(a => a.id);
    return State.findings.filter(f => myAudits.includes(f.auditoria_id));
  }
  // auditado
  const myCompany = getAuditadoCompany();
  return State.findings.filter(f => f.empresa_id === myCompany);
}

function getVisibleAudits(){
  const role = State.user?.role;
  if (role === 'admin') return State.audits;
  if (role === 'auditor'){
    return State.audits.filter(a => a.auditor_id === State.user.id || (a.equipo||[]).includes(State.user.id));
  }
  const myCompany = getAuditadoCompany();
  return State.audits.filter(a => a.empresa_id === myCompany);
}

function getVisibleActions(){
  const role = State.user?.role;
  if (role === 'admin') return State.actions;
  if (role === 'auditor'){
    const myFindings = getVisibleFindings().map(f => f.id);
    return State.actions.filter(p => myFindings.includes(p.hallazgo_id));
  }
  // auditado: todos los planes de los hallazgos de su empresa
  const myFindings = getVisibleFindings().map(f => f.id);
  return State.actions.filter(p => myFindings.includes(p.hallazgo_id));
}

/* ========= MODAL ========= */
function openModal(html, opts = {}){
  const root = document.getElementById('modalRoot');
  const size = opts.size === 'lg' ? 'modal-lg' : opts.size === 'xl' ? 'modal-xl' : '';
  root.innerHTML = `
    <div class="modal-backdrop open" onclick="if(event.target===this) closeModal()">
      <div class="modal ${size}">${html}</div>
    </div>`;
}
function closeModal(){ document.getElementById('modalRoot').innerHTML = ''; }

/* ========= TOAST ========= */
function toast(msg, type = 'info'){
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ⓘ';
  t.innerHTML = `<span style="font-size:16px">${icon}</span><span>${esc(msg)}</span>`;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ========= NOTIFICACIONES / PERFIL ========= */
function showNotifications(){
  const userId = State.user?.id;
  const role   = State.user?.role;
  if (!userId) return;

  /* Admin no tiene notificaciones */
  if (role === 'admin'){
    openModal(`
      <div class="modal-head">
        <div class="modal-title">🔔 Notificaciones</div>
        <div class="close-x" onclick="closeModal()">×</div>
      </div>
      <div class="modal-body">
        <div class="empty" style="padding:40px 0">
          <div class="empty-icon">🔔</div>
          <div>El administrador no recibe notificaciones</div>
          <div class="text-xs text-dim mt-2">Usa Trazabilidad para ver el historial de acciones</div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>
        <button class="btn btn-primary" onclick="closeModal();navigate('traceability')">Ver trazabilidad →</button>
      </div>`);
    return;
  }

  const list  = State.notifications.filter(n => n.forUserId === userId);
  const icons = { info:'ℹ️', success:'✅', warning:'⚠️', error:'🚩' };
  const unread = list.filter(n => !n.read).length;

  openModal(`
    <div class="modal-head">
      <div>
        <div class="modal-title">🔔 Notificaciones</div>
        ${unread > 0 ? `<div class="text-xs text-dim mt-1">${unread} sin leer</div>` : ''}
      </div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body" style="max-height:420px;overflow-y:auto;padding:0">
      ${list.length
        ? list.map(n => `
            <div style="display:flex;gap:12px;align-items:flex-start;padding:14px 20px;border-bottom:1px solid var(--border);${!n.read?'background:rgba(91,140,255,.04)':''}">
              <span style="font-size:18px;line-height:1;flex-shrink:0">${icons[n.type]||'ℹ️'}</span>
              <div style="flex:1;min-width:0">
                <div class="text-sm${!n.read?' cell-strong':''}">${esc(n.message)}</div>
                <div class="text-xs text-dim mt-1">${n.ts}</div>
              </div>
              <button onclick="deleteOneNotif('${n.id}')" title="Eliminar"
                style="background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:16px;padding:0 4px;flex-shrink:0;line-height:1">✕</button>
            </div>`).join('')
        : `<div class="empty" style="padding:40px 0">
             <div class="empty-icon">🔔</div>
             <div>Sin notificaciones</div>
           </div>`}
    </div>
    <div class="modal-foot" style="gap:8px">
      ${list.length ? `
        <button class="btn btn-ghost btn-sm" onclick="markAllNotifsRead('${userId}')">✓ Marcar como leídas</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="clearAllNotifs('${userId}')">🗑 Borrar notificaciones</button>
      ` : ''}
      <button class="btn btn-primary" style="margin-left:auto" onclick="closeModal()">Cerrar</button>
    </div>`, {size:'lg'});

  /* Marcar como leídas al abrir */
  list.forEach(n => { n.read = true; });
  refreshNotificationBell();
}

function deleteOneNotif(id){
  State.notifications = State.notifications.filter(n => n.id !== id);
  showNotifications();
}

function markAllNotifsRead(userId){
  State.notifications.filter(n => n.forUserId === userId).forEach(n => { n.read = true; });
  refreshNotificationBell();
  showNotifications();
}

function clearAllNotifs(userId){
  State.notifications = State.notifications.filter(n => n.forUserId !== userId);
  refreshNotificationBell();
  closeModal();
  toast('Notificaciones eliminadas', 'success');
}

function showUserMenu(){
  openModal(`
    <div class="modal-head">
      <div class="modal-title">Mi perfil</div>
      <div class="close-x" onclick="closeModal()">×</div>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div class="user-avatar" style="width:54px;height:54px;font-size:18px">${esc(State.user.initials)}</div>
        <div>
          <div style="font-family:'Fraunces',serif;font-size:20px;font-weight:600">${esc(State.user.name)}</div>
          <div class="text-dim text-sm">${esc(State.user.email)}</div>
          <span class="badge badge-info mt-2">${esc(ROLE_NAMES[State.user.role])}</span>
        </div>
      </div>
      <div class="text-sm text-dim">
        Plataforma <strong>Audita.AI v2.0</strong> · Demo. Los datos se conservan durante la sesión.
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>
      <button class="btn btn-danger" onclick="logout()">Cerrar sesión</button>
    </div>`);
}

/* ========= CSV DOWNLOAD ========= */
function downloadCSV(rows, name){
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], {type:'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
  toast(`Exportado: ${name}`, 'success');
}
