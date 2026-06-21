/* ===========================================================
   AUDITA AI · Trazabilidad (solo Admin)
   Log completo del sistema, filtros, exportación
   =========================================================== */

function renderTraceability(){
  if (!hasRole('admin')){
    document.getElementById('pageContainer').innerHTML = `
      <div class="page"><div class="empty"><div class="empty-icon">🔐</div>Sin acceso</div></div>`;
    return;
  }

  const html = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Trazabilidad del sistema</h1>
          <div class="page-subtitle">Registro completo de todas las acciones realizadas en la plataforma</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportTraceCSV()">↓ Exportar CSV</button>
          <button class="btn btn-ghost" onclick="clearTraceFilter()">✕ Limpiar filtros</button>
        </div>
      </div>

      <!-- Stats de actividad -->
      <div class="kpi-row">
        <div class="kpi-card"><div class="kpi-value">${State.auditLog.length}</div><div class="kpi-label">Acciones totales</div></div>
        <div class="kpi-card"><div class="kpi-value">${[...new Set(State.auditLog.map(l=>l.user))].length}</div><div class="kpi-label">Usuarios activos</div></div>
        <div class="kpi-card"><div class="kpi-value">${[...new Set(State.auditLog.map(l=>l.module))].length}</div><div class="kpi-label">Módulos usados</div></div>
        <div class="kpi-card"><div class="kpi-value">${State.auditLog.filter(l => l.ts.startsWith(new Date().toISOString().slice(0,10))).length}</div><div class="kpi-label">Acciones hoy</div></div>
      </div>

      <!-- Filtros -->
      <div class="card">
        <div class="form-grid">
          <div class="field"><label>Usuario</label>
            <select id="f_trc_user" onchange="renderTraceTable()">
              <option value="">Todos</option>
              ${[...new Set(State.auditLog.map(l=>l.user))].map(u => `<option value="${esc(u)}">${esc(u)}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Módulo</label>
            <select id="f_trc_mod" onchange="renderTraceTable()">
              <option value="">Todos</option>
              ${[...new Set(State.auditLog.map(l=>l.module))].map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Buscar acción</label>
            <input id="f_trc_q" placeholder="Texto de la acción..." oninput="renderTraceTable()">
          </div>
          <div class="field"><label>Desde</label>
            <input type="date" id="f_trc_from" onchange="renderTraceTable()">
          </div>
          <div class="field"><label>Hasta</label>
            <input type="date" id="f_trc_to" value="${new Date().toISOString().slice(0,10)}" onchange="renderTraceTable()">
          </div>
        </div>
      </div>

      <!-- Línea de tiempo -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Registro de actividad</div>
          <div id="traceCount" class="text-sm text-dim"></div>
        </div>
        <div id="traceContainer"></div>
      </div>
    </div>`;

  document.getElementById('pageContainer').innerHTML = html;
  renderTraceTable();
}

function renderTraceTable(){
  const user   = document.getElementById('f_trc_user')?.value  || '';
  const mod    = document.getElementById('f_trc_mod')?.value   || '';
  const q      = (document.getElementById('f_trc_q')?.value    || '').toLowerCase();
  const from   = document.getElementById('f_trc_from')?.value  || '';
  const to     = document.getElementById('f_trc_to')?.value    || '';

  let list = [...State.auditLog];
  if (user)  list = list.filter(l => l.user    === user);
  if (mod)   list = list.filter(l => l.module  === mod);
  if (q)     list = list.filter(l => l.action.toLowerCase().includes(q));
  if (from)  list = list.filter(l => l.ts >= from);
  if (to)    list = list.filter(l => l.ts.slice(0,10) <= to);

  const countEl = document.getElementById('traceCount');
  if (countEl) countEl.textContent = `${list.length} registros`;

  // Agrupar por fecha
  const grouped = {};
  list.forEach(l => {
    const day = l.ts.slice(0,10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(l);
  });

  const html = Object.entries(grouped).sort((a,b)=>b[0].localeCompare(a[0])).map(([day, entries]) => `
    <div class="trace-day">
      <div class="trace-day-header">
        <span class="trace-day-label">${formatDay(day)}</span>
        <span class="badge badge-muted">${entries.length} acciones</span>
      </div>
      <div class="timeline">
        ${entries.map(l => `
          <div class="tl-item">
            <div class="tl-dot ${getModuleColor(l.module)}"></div>
            <div class="tl-content">
              <div class="tl-time">${formatTs(l.ts)}</div>
              <div class="tl-text">${esc(l.action)}</div>
              <div class="tl-meta">
                <span class="badge badge-muted">${esc(l.module)}</span>
                <span class="text-dim text-xs">· ${esc(l.user)}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('') || '<div class="empty"><div class="empty-icon">🔐</div>Sin registros con los filtros aplicados</div>';

  document.getElementById('traceContainer').innerHTML = html;
}

function formatDay(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-EC', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
}

function formatTs(ts){
  try {
    return new Date(ts).toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  } catch { return ts; }
}

function getModuleColor(mod){
  const colors = {
    'Autenticación': 'tl-dot-info',
    'Auditorías'   : 'tl-dot-primary',
    'Hallazgos'    : 'tl-dot-danger',
    'Planes de acción': 'tl-dot-warn',
    'Empresas'     : 'tl-dot-success',
    'Estándares'   : 'tl-dot-info',
    'Usuarios'     : 'tl-dot-muted',
    'Reportes'     : 'tl-dot-muted',
  };
  return colors[mod] || 'tl-dot-muted';
}

function clearTraceFilter(){
  ['f_trc_user','f_trc_mod','f_trc_q','f_trc_from'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const toEl = document.getElementById('f_trc_to');
  if (toEl) toEl.value = new Date().toISOString().slice(0,10);
  renderTraceTable();
}

function exportTraceCSV(){
  const rows = [['Fecha/hora','Usuario','Módulo','Acción']];
  State.auditLog.forEach(l => {
    rows.push([l.ts, l.user, l.module, l.action]);
  });
  downloadCSV(rows, `trazabilidad_${new Date().toISOString().slice(0,10)}.csv`);
  logAction('Exportó log de trazabilidad', 'Trazabilidad');
}
