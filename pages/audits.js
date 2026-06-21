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