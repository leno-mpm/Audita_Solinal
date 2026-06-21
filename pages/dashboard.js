/* ===========================================================
   AUDITA AI · Dashboard / Inicio
   Vistas diferenciadas por rol: admin | auditor | auditado
   =========================================================== */

function renderDashboard(){
  const role = State.user.role;
  if (role === 'admin')    renderDashboardAdmin();
  else if (role === 'auditor') renderDashboardAuditor();
  else                     renderDashboardAuditado();
}

/* -------- ADMIN -------- */
function renderDashboardAdmin(){
  const total   = State.audits.length;
  const active  = State.audits.filter(a => ['ejecucion','en_revision'].includes(a.estado)).length;
  const planned = State.audits.filter(a => a.estado === 'planificada').length;
  const closed  = State.audits.filter(a => a.estado === 'cerrada').length;
  const findOpen= State.findings.filter(f => f.estado !== 'cerrado').length;
  const today   = new Date().toISOString().slice(0,10);
  const overdue = State.actions.filter(p => p.estado !== 'cerrada' && p.fecha_limite < today).length;

  document.getElementById('pageContainer').innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Inicio</h1>
          <div class="page-subtitle">Bienvenido/a, ${esc(State.user.name)} · ${new Date().toLocaleDateString('es-EC',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="navigate('audits');setTimeout(openNewAuditModal,100)">+ Nueva auditoría</button>
        </div>
      </div>

      <div class="stats-grid" data-cols="4">
        <div class="stat-card">
          <div class="stat-label">Total auditorías</div>
          <div class="stat-value">${total}</div>
          <div class="stat-delta up">↑ ${active} en ejecución / revisión</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Planificadas</div>
          <div class="stat-value">${planned}</div>
          <div class="stat-delta">Por iniciar</div>
        </div>
        <div class="stat-card warn">
          <div class="stat-label">Hallazgos abiertos</div>
          <div class="stat-value">${findOpen}</div>
          <div class="stat-delta">${State.findings.filter(f=>f.tipo==='no_conformidad_mayor'&&f.estado!=='cerrado').length} NCs mayores activas</div>
        </div>
        <div class="stat-card ${overdue > 0 ? 'warn' : 'ok'}">
          <div class="stat-label">Planes vencidos</div>
          <div class="stat-value">${overdue}</div>
          <div class="stat-delta">de ${State.actions.length} planes registrados</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h4>Hallazgos por tipo</h4>
          <div class="chart-wrap"><canvas id="chFindingsType"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Auditorías por estado</h4>
          <div class="chart-wrap"><canvas id="chAuditsState"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Cumplimiento por norma (%)</h4>
          <div class="chart-wrap"><canvas id="chCompliance"></canvas></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Auditorías recientes</div>
            <div class="card-sub">Todas las auditorías del sistema</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="navigate('audits')">Ver todas →</button>
        </div>
        <div class="table-wrap">
          <table class="t">
            <thead><tr><th>Código</th><th>Empresa</th><th>Norma</th><th>Estado</th><th>Progreso</th><th>Fechas</th></tr></thead>
            <tbody>
              ${State.audits.slice(0,5).map(a => {
                const e = getCompany(a.empresa_id);
                return `<tr>
                  <td class="cell-mono">${a.codigo}</td>
                  <td class="cell-strong">${esc(e?.razon_social||'-')}</td>
                  <td><span class="badge badge-info">${getStandardName(a.norma)}</span></td>
                  <td>${estadoAuditoriaBadge(a.estado)}</td>
                  <td>
                    <div class="progress-bar" style="width:80px;display:inline-block;vertical-align:middle">
                      <div class="progress-fill" style="width:${a.progreso}%"></div>
                    </div>
                    <small class="text-dim"> ${a.progreso}%</small>
                  </td>
                  <td class="text-sm text-dim">${a.fecha_inicio} → ${a.fecha_fin}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  setTimeout(drawDashboardCharts, 100);
}

/* -------- AUDITOR -------- */
function renderDashboardAuditor(){
  const myAudits   = State.audits.filter(a => a.auditor_id === State.user.id || (a.equipo||[]).includes(State.user.id));
  const planned    = myAudits.filter(a => a.estado === 'planificada').length;
  const inExec     = myAudits.filter(a => a.estado === 'ejecucion').length;
  const inReview   = myAudits.filter(a => a.estado === 'en_revision').length;
  const closed     = myAudits.filter(a => a.estado === 'cerrada').length;
  const today      = new Date().toISOString().slice(0,10);
  const myFindings = getVisibleFindings();
  const openFinds  = myFindings.filter(f => f.estado !== 'cerrado').length;
  const overdue    = getVisibleActions().filter(p => p.estado !== 'cerrada' && p.fecha_limite < today).length;

  document.getElementById('pageContainer').innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Inicio</h1>
          <div class="page-subtitle">Bienvenido/a, ${esc(State.user.name)} · ${new Date().toLocaleDateString('es-EC',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="navigate('audits');setTimeout(openNewAuditModal,100)">+ Nueva auditoría</button>
        </div>
      </div>

      <div class="stats-grid" data-cols="6">
        <div class="stat-card">
          <div class="stat-label">Planificadas</div>
          <div class="stat-value">${planned}</div>
          <div class="stat-delta">Mis auditorías por iniciar</div>
        </div>
        <div class="stat-card warn">
          <div class="stat-label">En ejecución</div>
          <div class="stat-value">${inExec}</div>
          <div class="stat-delta">Activas actualmente</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">En revisión</div>
          <div class="stat-value">${inReview}</div>
          <div class="stat-delta">Pendientes de cierre</div>
        </div>
        <div class="stat-card ok">
          <div class="stat-label">Cerradas</div>
          <div class="stat-value">${closed}</div>
          <div class="stat-delta">Completadas</div>
        </div>
        <div class="stat-card warn">
          <div class="stat-label">Hallazgos abiertos</div>
          <div class="stat-value">${openFinds}</div>
          <div class="stat-delta">${myFindings.filter(f=>f.tipo==='no_conformidad_mayor'&&f.estado!=='cerrado').length} NCs mayores</div>
        </div>
        <div class="stat-card ${overdue>0?'warn':'ok'}">
          <div class="stat-label">Planes vencidos</div>
          <div class="stat-value">${overdue}</div>
          <div class="stat-delta">Requieren atención</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h4>Mis hallazgos por tipo</h4>
          <div class="chart-wrap"><canvas id="chAudHallazgos"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Estado de mis auditorías</h4>
          <div class="chart-wrap"><canvas id="chAudEstados"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Planes de acción</h4>
          <div class="chart-wrap"><canvas id="chAudAcciones"></canvas></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Continúa donde te quedaste</div>
          <div class="card-sub">Mis auditorías activas</div>
          <button class="btn btn-secondary btn-sm" onclick="navigate('audits')">Ver todas →</button>
        </div>
        <div class="table-wrap">
          <table class="t">
            <thead><tr><th>Código</th><th>Empresa</th><th>Norma</th><th>Estado</th><th>Progreso</th><th></th></tr></thead>
            <tbody>
              ${myAudits.filter(a=>a.estado!=='cerrada').slice(0,5).map(a => {
                const e = getCompany(a.empresa_id);
                return `<tr>
                  <td class="cell-mono">${a.codigo}</td>
                  <td class="cell-strong">${esc(e?.razon_social||'-')}</td>
                  <td><span class="badge badge-info">${getStandardName(a.norma)}</span></td>
                  <td>${estadoAuditoriaBadge(a.estado)}</td>
                  <td>
                    <div class="progress-bar" style="width:80px;display:inline-block;vertical-align:middle">
                      <div class="progress-fill" style="width:${a.progreso}%"></div>
                    </div>
                    <small class="text-dim"> ${a.progreso}%</small>
                  </td>
                  <td><button class="btn btn-primary btn-sm" onclick="openChecklistFor('${a.id}')">▶ Checklist</button></td>
                </tr>`;
              }).join('') || '<tr><td colspan="6"><div class="empty"><div class="empty-icon">📋</div>No tienes auditorías activas.</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  setTimeout(drawAuditorCharts, 100);
}

/* -------- AUDITADO -------- */
function renderDashboardAuditado(){
  const myCompany  = getAuditadoCompany();
  const myAudits   = State.audits.filter(a => a.empresa_id === myCompany);
  const active     = myAudits.filter(a => a.estado === 'ejecucion').length;
  const pending    = myAudits.filter(a => a.estado === 'planificada').length;
  const done       = myAudits.filter(a => a.estado === 'cerrada').length;
  const myActions  = getVisibleActions();
  const today      = new Date().toISOString().slice(0,10);
  const pendAct    = myActions.filter(p => p.estado === 'pendiente').length;
  const inProg     = myActions.filter(p => p.estado === 'en_proceso').length;
  const expired    = myActions.filter(p => p.estado !== 'cerrada' && p.fecha_limite < today).length;

  document.getElementById('pageContainer').innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Inicio</h1>
          <div class="page-subtitle">Bienvenido/a, ${esc(State.user.name)} · ${new Date().toLocaleDateString('es-EC',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
      </div>

      <div class="stats-grid" data-cols="6">
        <div class="stat-card">
          <div class="stat-label">Por iniciar</div>
          <div class="stat-value">${pending}</div>
          <div class="stat-delta">Auditorías planificadas</div>
        </div>
        <div class="stat-card warn">
          <div class="stat-label">En ejecución</div>
          <div class="stat-value">${active}</div>
          <div class="stat-delta">Activas ahora</div>
        </div>
        <div class="stat-card ok">
          <div class="stat-label">Finalizadas</div>
          <div class="stat-value">${done}</div>
          <div class="stat-delta">Auditorías cerradas</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Planes pendientes</div>
          <div class="stat-value">${pendAct}</div>
          <div class="stat-delta">Sin iniciar</div>
        </div>
        <div class="stat-card warn">
          <div class="stat-label">En progreso</div>
          <div class="stat-value">${inProg}</div>
          <div class="stat-delta">Planes activos</div>
        </div>
        <div class="stat-card ${expired>0?'warn':'ok'}">
          <div class="stat-label">Vencidos</div>
          <div class="stat-value">${expired}</div>
          <div class="stat-delta">${expired>0?'Requieren atención urgente':'Sin vencidos'}</div>
        </div>
      </div>

      ${myAudits.length === 0 ? `
        <div class="card">
          <div class="empty"><div class="empty-icon">📋</div>No tienes auditorías registradas aún.</div>
        </div>` : `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Estado de mis auditorías</div>
        </div>
        <div class="table-wrap">
          <table class="t">
            <thead><tr><th>Código</th><th>Norma</th><th>Tipo</th><th>Estado</th><th>Progreso</th><th>Fechas</th><th></th></tr></thead>
            <tbody>
              ${myAudits.map(a => `<tr>
                <td class="cell-mono">${a.codigo}</td>
                <td><span class="badge badge-info">${getStandardName(a.norma)}</span></td>
                <td>${tipoAuditoriaLabel(a.tipo)}</td>
                <td>${estadoAuditoriaBadge(a.estado)}</td>
                <td>
                  <div class="progress-bar" style="width:80px;display:inline-block;vertical-align:middle">
                    <div class="progress-fill" style="width:${a.progreso}%"></div>
                  </div>
                  <small class="text-dim"> ${a.progreso}%</small>
                </td>
                <td class="text-sm text-dim">${a.fecha_inicio} → ${a.fecha_fin}</td>
                <td class="row-action"><button onclick="navigate('audits');setTimeout(()=>openAuditDetail('${a.id}'),100)">Ver</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`}
    </div>`;
}

/* -------- CHARTS (solo admin) — light theme -------- */
function drawDashboardCharts(){
  // Light theme palette for charts
  Chart.defaults.color         = '#5a6481';
  Chart.defaults.borderColor   = 'rgba(226,230,240,.8)';
  Chart.defaults.font.family   = "'Inter',sans-serif";
  Chart.defaults.font.size     = 12;

  const gridColor = 'rgba(226,230,240,.9)';
  const COLORS = ['#10d9a0','#fbbf24','#60a5fa','#a78bfa','#f87171'];

  const ctx1 = document.getElementById('chFindingsType');
  if (ctx1){
    const types = {};
    State.findings.forEach(f => types[f.tipo] = (types[f.tipo]||0)+1);
    new Chart(ctx1, {
      type:'doughnut',
      data:{
        labels: Object.keys(types).map(tipoHallazgoLabel),
        datasets:[{
          data: Object.values(types),
          backgroundColor: COLORS,
          borderColor: '#ffffff',
          borderWidth: 3
        }]
      },
      options:{
        plugins:{legend:{position:'bottom',labels:{padding:12,font:{size:11},color:'#5a6481'}}},
        responsive:true, maintainAspectRatio:false, cutout:'62%'
      }
    });
  }

  const ctx2 = document.getElementById('chAuditsState');
  if (ctx2){
    const st = {planificada:0,ejecucion:0,cerrada:0,en_revision:0};
    State.audits.forEach(a => { if(st[a.estado]!==undefined) st[a.estado]++; });
    new Chart(ctx2, {
      type:'bar',
      data:{
        labels:['Planificadas','En ejecución','Cerradas','En revisión'],
        datasets:[{
          data:[st.planificada,st.ejecucion,st.cerrada,st.en_revision],
          backgroundColor:['#60a5fa','#fbbf24','#10d9a0','#a78bfa'],
          borderRadius:8, borderSkipped:false
        }]
      },
      options:{
        plugins:{legend:{display:false}},
        scales:{
          y:{beginAtZero:true,ticks:{precision:0,stepSize:1,color:'#5a6481'},grid:{color:gridColor}},
          x:{grid:{display:false},ticks:{color:'#5a6481'}}
        },
        responsive:true, maintainAspectRatio:false
      }
    });
  }

  const ctx3 = document.getElementById('chCompliance');
  if (ctx3){
    const data = [];
    Object.values(STANDARDS).forEach(s => {
      const audits = State.audits.filter(a => a.norma === s.id);
      if (audits.length){
        const avg = audits.reduce((acc,a)=>acc+a.progreso,0)/audits.length;
        data.push({label:s.code, value:Math.round(avg), color:s.color});
      }
    });
    new Chart(ctx3, {
      type:'bar',
      data:{
        labels: data.map(d=>d.label),
        datasets:[{
          data: data.map(d=>d.value),
          backgroundColor: data.map(d=>d.color),
          borderRadius:8, borderSkipped:false
        }]
      },
      options:{
        indexAxis:'y',
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.x}%`}}},
        scales:{
          x:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%',color:'#5a6481'},grid:{color:gridColor}},
          y:{grid:{display:false},ticks:{color:'#5a6481'}}
        },
        responsive:true, maintainAspectRatio:false
      }
    });
  }
}

/* -------- CHARTS AUDITOR — datos filtrados por rol -------- */
function drawAuditorCharts(){
  if (typeof Chart === 'undefined') return;

  Chart.defaults.color         = '#5a6481';
  Chart.defaults.borderColor   = 'rgba(226,230,240,.9)';
  Chart.defaults.font.family   = "'Inter',sans-serif";
  Chart.defaults.font.size     = 12;

  const gridColor = 'rgba(226,230,240,.9)';
  const COLORS = ['#10d9a0','#fbbf24','#60a5fa','#a78bfa','#f87171','#fb923c'];

  /* Gráfica 1 — Hallazgos por tipo (datos del auditor) */
  const ctx1 = document.getElementById('chAudHallazgos');
  if (ctx1){
    const myFindings = getVisibleFindings();
    const types = {};
    myFindings.forEach(f => types[f.tipo] = (types[f.tipo]||0)+1);
    const labels = Object.keys(types);
    if (labels.length === 0) {
      ctx1.parentElement.innerHTML = '<div class="empty" style="padding:40px 0"><div class="empty-icon">📊</div>Sin hallazgos aún</div>';
    } else {
      new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: labels.map(tipoHallazgoLabel),
          datasets: [{ data: Object.values(types), backgroundColor: COLORS, borderColor:'#fff', borderWidth:3 }]
        },
        options: {
          plugins: { legend: { position:'bottom', labels: { padding:10, font:{size:11}, color:'#5a6481' } } },
          responsive: true, maintainAspectRatio: false, cutout: '62%'
        }
      });
    }
  }

  /* Gráfica 2 — Estado de mis auditorías */
  const ctx2 = document.getElementById('chAudEstados');
  if (ctx2){
    const myAudits = getVisibleAudits();
    const st = { planificada:0, ejecucion:0, en_revision:0, cerrada:0 };
    myAudits.forEach(a => { if (st[a.estado] !== undefined) st[a.estado]++; });
    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Planificadas','En ejecución','En revisión','Cerradas'],
        datasets: [{
          data: [st.planificada, st.ejecucion, st.en_revision, st.cerrada],
          backgroundColor: ['#60a5fa','#fbbf24','#a78bfa','#10d9a0'],
          borderRadius: 8, borderSkipped: false
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero:true, ticks:{ precision:0, stepSize:1, color:'#5a6481' }, grid:{ color:gridColor } },
          x: { grid:{ display:false }, ticks:{ color:'#5a6481' } }
        },
        responsive: true, maintainAspectRatio: false
      }
    });
  }

  /* Gráfica 3 — Planes de acción: solo Abierto / Cerrado */
  const ctx3 = document.getElementById('chAudAcciones');
  if (ctx3){
    const myActions = getVisibleActions();
    const abiertos  = myActions.filter(p => p.estado !== 'cerrado').length;
    const cerrados  = myActions.filter(p => p.estado === 'cerrado').length;
    new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: ['Abierto','Cerrado'],
        datasets: [{
          data: [abiertos, cerrados],
          backgroundColor: ['#fbbf24','#10d9a0'],
          borderColor: '#fff', borderWidth: 3
        }]
      },
      options: {
        plugins: { legend: { position:'bottom', labels:{ padding:10, font:{size:11}, color:'#5a6481' } } },
        responsive: true, maintainAspectRatio: false, cutout: '62%'
      }
    });
  }
}
