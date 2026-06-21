# Audita AI

Plataforma integral de gestión de auditorías ISO. SPA (Single Page Application) en HTML/CSS/JS puro, sin frameworks ni dependencias de build.

---

## Demo rápida

Abre `index.html` directamente en el navegador (no requiere servidor).

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | admin@auditaai.com | admin2026 |
| Auditor | auditor@auditaai.com | auditor2026 |
| Auditado | srivera@indura.ec | auditado2026 |

---

## Estructura del proyecto

```
├── index.html              # Shell principal (login + app)
├── data.js                 # Seed data, State global, helpers
├── app.js                  # Login, navegación, modal, toast, notificaciones
├── css/
│   ├── base.css            # Variables CSS, reset, utilidades, scrollbar
│   ├── layout.css          # Sidebar, topbar, nav, grid del app, responsive
│   ├── login.css           # Pantalla de acceso
│   ├── components.css      # Botones, badges, cards, modal, toast, progress
│   ├── tables.css          # Tablas de datos
│   ├── stats.css           # Stat cards, KPI row, charts
│   ├── dashboard.css       # Continue cards, kanban
│   ├── audits.css          # Acciones de fila de auditorías
│   ├── checklist.css       # Checklist de requisitos normativos
│   ├── companies.css       # Grid y tarjetas de empresas
│   ├── standards.css       # Tarjetas de estándares ISO
│   ├── reports.css         # Plantillas y preview de reportes
│   └── traceability.css    # Timeline de trazabilidad
└── pages/
    ├── dashboard.js        # Inicio — KPIs, gráficos, actividad reciente
    ├── audits.js           # Gestión de auditorías (CRUD, estados, checklist)
    ├── findings.js         # Hallazgos (NC, OBS, OPM) y respuestas
    ├── actions.js          # Planes de acción (Abierto / Cerrado)
    ├── companies.js        # Empresas auditadas
    ├── standards.js        # Estándares ISO disponibles
    ├── users.js            # Gestión de usuarios (solo admin)
    ├── reports.js          # Generación y exportación de reportes
    └── traceability.js     # Trazabilidad / audit log (solo admin)
```

---

## Roles y permisos

| Sección | Admin | Auditor | Auditado |
|---------|:-----:|:-------:|:--------:|
| Dashboard | ✓ | ✓ | ✓ |
| Auditorías | ✓ | ✓ | ✓ (solo las suyas) |
| Hallazgos | ✓ | ✓ | ✓ (solo los suyos) |
| Planes de acción | ✓ | ✓ | ✓ |
| Empresas | ✓ | ✓ | — |
| Estándares | ✓ | ✓ | — |
| Usuarios | ✓ | — | — |
| Reportes | ✓ | ✓ | ✓ |
| Trazabilidad | ✓ | — | — |
| Notificaciones | — | ✓ | ✓ |

---

## Módulos principales

### Auditorías
Estados: `planificada → en_curso → en_revision → cerrada`.  
El auditor avanza el estado, ejecuta el checklist por requisito (C / NC / PC / NA) y registra hallazgos directamente desde la vista de checklist.

### Hallazgos
Tipos: No Conformidad (`no_conformidad`), Observación (`observacion`), Oportunidad de Mejora (`opm`).  
Al registrar una NC, se notifica automáticamente al auditado de esa empresa.

### Planes de acción
Solo dos estados: **Abierto** (al crear) y **Cerrado** (manual por auditor o automático cuando vence `fecha_limite` del hallazgo).  
El auditado puede subir evidencia sin que el estado cambie; el auditor decide cuándo cerrar.

### Reportes
Solo disponibles para auditorías en estado `cerrada`. Permiten preview en pantalla y exportación a PDF (vía jsPDF) o CSV.

### Notificaciones
- **Auditor:** recibe notificación al ser asignado a una auditoría y cuando el auditado sube evidencia a un plan.
- **Auditado:** recibe notificación al registrarse una NC en su empresa y cuando su auditoría se completa o cierra.
- **Admin:** sin notificaciones (usa Trazabilidad para el historial).

---

## Tecnologías

- HTML5 / CSS3 / JavaScript ES6+ (vanilla, sin frameworks)
- [Chart.js 4.4](https://www.chartjs.org/) — gráficos de dashboard
- [jsPDF 2.5](https://github.com/parallax/jsPDF) — exportación de reportes a PDF
- Google Fonts: Fraunces, Inter, JetBrains Mono

---

## Datos de prueba incluidos

El archivo `data.js` incluye seed data precargada:

- 5 empresas auditadas (Ecuador)
- 2 estándares: ISO 14001:2015, ISO 22000:2018
- 5 auditorías en distintos estados
- Hallazgos y planes de acción asociados
- 9 notificaciones demo para auditor y auditados

Los datos persisten durante la sesión en memoria (`State`); no se guardan al recargar la página.
