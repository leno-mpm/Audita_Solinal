/* ===========================================================
   AUDITA AI · Data layer
   Roles: admin, auditor, auditado
   =========================================================== */

const STANDARDS = {
  iso22000: {
    id:'iso22000', code:'ISO 22000:2018',
    name:'Sistemas de gestión de la inocuidad de los alimentos',
    color:'#22d3ee', icon:'🍴',
    description:'Requisitos para cualquier organización en la cadena alimentaria.'
  },
  fssc22000: {
    id:'fssc22000', code:'FSSC 22000 v6',
    name:'Food Safety System Certification',
    color:'#4ade80', icon:'🛡️',
    description:'Esquema GFSI basado en ISO 22000 + ISO/TS 22002 + requisitos adicionales FSSC.'
  },
  iso14001: {
    id:'iso14001', code:'ISO 14001:2015',
    name:'Sistemas de gestión ambiental',
    color:'#a78bfa', icon:'🌱',
    description:'Requisitos con orientación para su uso en gestión ambiental.'
  },
  iso9001: {
    id:'iso9001', code:'ISO 9001:2015',
    name:'Sistemas de gestión de la calidad',
    color:'#5b8cff', icon:'⚙️',
    description:'Requisitos para sistemas de gestión de la calidad.'
  },
  iso45001: {
    id:'iso45001', code:'ISO 45001:2018',
    name:'Sistemas de gestión de seguridad y salud en el trabajo',
    color:'#ffb86b', icon:'🦺',
    description:'Requisitos para SST.'
  }
};

/* ============= CHECKLIST ISO 22000:2018 ============= */
const CHK_ISO22000 = [
  { num:'4', title:'Contexto de la organización', items:[
    {codigo:'4.1', pregunta:'La organización ha determinado las cuestiones externas e internas pertinentes a su propósito y SGIA?', criterio:'Análisis del contexto considerando aspectos legales, tecnológicos, competitivos, de mercado, culturales, sociales y económicos.', evidencia:'Matriz DOFA, análisis PESTEL, documento de contexto'},
    {codigo:'4.2', pregunta:'Se identifican las partes interesadas y sus necesidades y expectativas?', criterio:'Determinar partes interesadas pertinentes al SGIA, sus requisitos y los relevantes para la inocuidad.', evidencia:'Matriz de partes interesadas con necesidades y expectativas'},
    {codigo:'4.3', pregunta:'Está documentado el alcance del SGIA incluyendo productos, procesos y sitios?', criterio:'Alcance documentado con productos/servicios, procesos, sitios, exclusiones justificadas.', evidencia:'Documento de alcance, manual del SGIA'},
    {codigo:'4.4', pregunta:'Se ha establecido, implementado, mantenido y mejorado continuamente el SGIA?', criterio:'Procesos del SGIA identificados con entradas, salidas, secuencia, criterios y métodos.', evidencia:'Mapa de procesos, procedimientos documentados'}
  ]},
  { num:'5', title:'Liderazgo', items:[
    {codigo:'5.1', pregunta:'La alta dirección demuestra liderazgo y compromiso con el SGIA?', criterio:'Asume responsabilidad, asegura política y objetivos, integra requisitos en procesos de negocio, asigna recursos.', evidencia:'Acta de revisión por la dirección, presupuesto SGIA, comunicaciones'},
    {codigo:'5.2', pregunta:'La política de inocuidad de los alimentos es apropiada al propósito y contexto?', criterio:'Política coherente con el propósito, marco para objetivos, compromiso de cumplir requisitos legales y de cliente.', evidencia:'Política de inocuidad firmada y comunicada'},
    {codigo:'5.3', pregunta:'Las responsabilidades y autoridades están asignadas y comunicadas?', criterio:'Líder del equipo de inocuidad designado. Roles, responsabilidades y autoridades definidos.', evidencia:'Organigrama, perfiles de cargo, designación del líder'}
  ]},
  { num:'6', title:'Planificación', items:[
    {codigo:'6.1', pregunta:'Se han determinado riesgos y oportunidades para el SGIA?', criterio:'Acciones para abordar riesgos y oportunidades de forma proporcional al impacto sobre inocuidad.', evidencia:'Matriz de riesgos y oportunidades, planes de tratamiento'},
    {codigo:'6.2', pregunta:'Se han establecido objetivos de inocuidad medibles y planes para alcanzarlos?', criterio:'Objetivos coherentes con la política, medibles, considerando requisitos aplicables, con plazos y responsables.', evidencia:'Matriz de objetivos SGIA con indicadores y planes de acción'},
    {codigo:'6.3', pregunta:'Los cambios al SGIA se planifican de forma controlada?', criterio:'Considerar propósito de los cambios, consecuencias potenciales, integridad del SGIA, recursos y responsabilidades.', evidencia:'Procedimiento de gestión del cambio, registros de cambios'}
  ]},
  { num:'7', title:'Soporte', items:[
    {codigo:'7.1.2', pregunta:'Existen recursos humanos competentes para el SGIA?', criterio:'Personal con competencia adecuada. Equipo de inocuidad multidisciplinario.', evidencia:'Matriz de competencias, certificados de formación, equipo HACCP'},
    {codigo:'7.1.3', pregunta:'La infraestructura es adecuada para asegurar la inocuidad?', criterio:'Edificios, equipos, servicios, transporte apropiados.', evidencia:'Inventario de equipos, planos, certificados de equipos'},
    {codigo:'7.2', pregunta:'Está documentada la competencia del personal que afecta la inocuidad?', criterio:'Educación, formación, experiencia apropiadas.', evidencia:'Perfiles de cargo, evaluaciones de competencia, plan de capacitación'},
    {codigo:'7.3', pregunta:'Existe un programa de toma de conciencia sobre la política y SGIA?', criterio:'Personal consciente de la política de inocuidad, objetivos, contribución a la eficacia del SGIA.', evidencia:'Capacitaciones de inducción, charlas de seguridad alimentaria'},
    {codigo:'7.4', pregunta:'La comunicación interna y externa está definida e implementada?', criterio:'Comunicación con autoridades, clientes, proveedores, contratistas.', evidencia:'Matriz de comunicaciones, evidencias de comunicación, procedimiento'},
    {codigo:'7.5', pregunta:'La información documentada del SGIA está controlada?', criterio:'Identificación, formato, revisión, aprobación, distribución, acceso, recuperación, control de cambios, conservación.', evidencia:'Listado maestro de documentos, procedimiento de control documental'}
  ]},
  { num:'8', title:'Operación', items:[
    {codigo:'8.1', pregunta:'La planificación y control operacional cubre todos los procesos del SGIA?', criterio:'Criterios para procesos, controles, información documentada para confianza.', evidencia:'Procedimientos operacionales, registros de control'},
    {codigo:'8.2', pregunta:'Los Programas Prerrequisito (PPR) están establecidos, implementados y verificados?', criterio:'PPRs apropiados al tamaño, tipo de operación y productos.', evidencia:'Procedimientos de PPR, registros de cumplimiento, verificaciones'},
    {codigo:'8.3', pregunta:'Existe un sistema de trazabilidad eficaz?', criterio:'Identificación única de materiales entrantes y primera etapa de distribución.', evidencia:'Procedimiento de trazabilidad, ejercicios de trazabilidad'},
    {codigo:'8.5.1', pregunta:'Se han realizado las etapas preliminares del análisis de peligros (equipo HACCP, descripción, diagrama de flujo)?', criterio:'Equipo designado y competente. Materias primas, productos terminados y uso previsto caracterizados. Diagrama verificado in situ.', evidencia:'Acta del equipo HACCP, fichas técnicas, diagrama de flujo firmado'},
    {codigo:'8.5.2', pregunta:'Se ha realizado un análisis de peligros con evaluación y selección de medidas de control?', criterio:'Peligros biológicos, químicos y físicos identificados por etapa. Evaluación con criterios de severidad y probabilidad.', evidencia:'Matriz de análisis de peligros, evaluación de severidad y probabilidad'},
    {codigo:'8.5.4', pregunta:'Existe un plan de control de peligros (PCC/PPRO) con límites críticos, seguimiento y correcciones?', criterio:'PCC y PPRO determinados. Límites críticos medibles. Sistema de seguimiento.', evidencia:'Plan HACCP, registros de monitoreo de PCC/PPRO, registros de desviaciones'},
    {codigo:'8.7', pregunta:'Se controla el seguimiento y la medición (calibración de equipos)?', criterio:'Equipos calibrados o verificados a intervalos planificados.', evidencia:'Programa de calibración, certificados, etiquetas de calibración'},
    {codigo:'8.9', pregunta:'Se gestionan las no conformidades del producto y proceso?', criterio:'Procedimientos para correcciones, acciones correctivas, manejo de producto potencialmente no inocuo, retirada/recuperación.', evidencia:'Procedimiento de control de NC, registros de retiros, ejercicios de mock recall'}
  ]},
  { num:'9', title:'Evaluación del desempeño', items:[
    {codigo:'9.1.1', pregunta:'Se hace seguimiento, medición, análisis y evaluación del SGIA?', criterio:'Qué necesita seguimiento, métodos, cuándo, quién analiza y evalúa.', evidencia:'Plan de seguimiento y medición, indicadores SGIA'},
    {codigo:'9.2', pregunta:'Las auditorías internas se planifican, ejecutan y son eficaces?', criterio:'Programa de auditoría considerando importancia, cambios, resultados previos. Auditores objetivos e imparciales.', evidencia:'Programa anual de auditorías, plan, informe, NCs detectadas'},
    {codigo:'9.3', pregunta:'La revisión por la dirección se realiza a intervalos planificados con todas las entradas requeridas?', criterio:'Estado de acciones previas, cambios en cuestiones, desempeño, no conformidades, resultados de auditorías.', evidencia:'Acta de revisión por la dirección con todas las entradas y salidas requeridas'}
  ]},
  { num:'10', title:'Mejora', items:[
    {codigo:'10.1', pregunta:'Se gestionan las no conformidades con análisis de causa raíz y acciones correctivas?', criterio:'Reaccionar a la NC, evaluar necesidad de acciones, implementar, revisar eficacia.', evidencia:'Registros de NC con análisis de causa, plan de acción, verificación de eficacia'},
    {codigo:'10.2', pregunta:'La organización mejora continuamente la conveniencia, adecuación y eficacia del SGIA?', criterio:'Uso de resultados de análisis, evaluación, revisión por la dirección para identificar mejoras.', evidencia:'Acciones de mejora derivadas de la revisión por la dirección, indicadores de mejora'},
    {codigo:'10.3', pregunta:'El SGIA se actualiza continuamente?', criterio:'Equipo de inocuidad evalúa el SGIA con inputs de comunicación, verificación y revisión por la dirección.', evidencia:'Acta de actualización del SGIA, evidencias de inputs considerados'}
  ]}
];

/* ============= CHECKLIST ISO 14001:2015 ============= */
const CHK_ISO14001 = [
  { num:'4', title:'Contexto de la organización', items:[
    {codigo:'4.1', pregunta:'Se han determinado cuestiones externas e internas pertinentes al SGA?', criterio:'Cuestiones que afectan la capacidad de lograr resultados previstos. Condiciones ambientales como cuestión externa.', evidencia:'Análisis de contexto ambiental, matriz DOFA ambiental'},
    {codigo:'4.2', pregunta:'Se identifican partes interesadas y sus requisitos pertinentes para el SGA?', criterio:'Partes interesadas, sus necesidades y expectativas, cuáles se convierten en obligaciones de cumplimiento.', evidencia:'Matriz de partes interesadas ambientales'},
    {codigo:'4.3', pregunta:'El alcance del SGA está documentado y considera límites físicos, organizacionales y actividades?', criterio:'Alcance incluye unidades, funciones, límites físicos, actividades/productos/servicios.', evidencia:'Documento de alcance del SGA'},
    {codigo:'4.4', pregunta:'Se ha establecido, implementado y mantenido el SGA?', criterio:'Procesos necesarios y sus interacciones, mejora continua.', evidencia:'Manual del SGA, mapa de procesos ambientales'}
  ]},
  { num:'5', title:'Liderazgo', items:[
    {codigo:'5.1', pregunta:'La alta dirección demuestra liderazgo y compromiso con el SGA?', criterio:'Responsabilidad por eficacia, asegurar política y objetivos, integrar SGA al negocio, asignar recursos.', evidencia:'Compromiso documentado, presupuesto ambiental, comunicaciones'},
    {codigo:'5.2', pregunta:'La política ambiental es apropiada al propósito y contexto incluyendo naturaleza, magnitud e impactos?', criterio:'Compromiso con protección ambiental, prevención de la contaminación, cumplimiento de obligaciones, mejora continua.', evidencia:'Política ambiental firmada y comunicada'},
    {codigo:'5.3', pregunta:'Roles, responsabilidades y autoridades están asignados y comunicados?', criterio:'Asignación para asegurar conformidad del SGA y reportar desempeño a la alta dirección.', evidencia:'Organigrama, perfiles, asignaciones documentadas'}
  ]},
  { num:'6', title:'Planificación', items:[
    {codigo:'6.1.1', pregunta:'Se han determinado riesgos y oportunidades para el SGA?', criterio:'Aspectos ambientales, obligaciones de cumplimiento, otras cuestiones y requisitos identificados.', evidencia:'Matriz de riesgos ambientales'},
    {codigo:'6.1.2', pregunta:'Se identifican los aspectos ambientales con perspectiva de ciclo de vida y se determinan los significativos?', criterio:'Aspectos que la organización puede controlar e influir, considerando ciclo de vida, cambios, situaciones anormales y de emergencia.', evidencia:'Matriz de aspectos e impactos ambientales con criterios de significancia'},
    {codigo:'6.1.3', pregunta:'Se identifican y mantienen actualizadas las obligaciones de cumplimiento legal y otras?', criterio:'Requisitos legales aplicables y otros requisitos, cómo se aplican y cumplen.', evidencia:'Matriz legal ambiental actualizada, evaluación de cumplimiento'},
    {codigo:'6.2', pregunta:'Existen objetivos ambientales medibles, monitoreables, comunicados y actualizados?', criterio:'Objetivos coherentes con la política, considerando aspectos significativos y obligaciones de cumplimiento.', evidencia:'Matriz de objetivos ambientales con indicadores y plan'}
  ]},
  { num:'7', title:'Apoyo', items:[
    {codigo:'7.1', pregunta:'Se proporcionan los recursos necesarios para el SGA?', criterio:'Recursos para establecer, implementar, mantener y mejorar continuamente el SGA.', evidencia:'Presupuesto ambiental, dotación de personal, equipamiento'},
    {codigo:'7.2', pregunta:'Se determina y asegura la competencia del personal cuyo trabajo afecta el desempeño ambiental?', criterio:'Educación, formación, experiencia adecuadas.', evidencia:'Matriz de competencias, certificados de formación ambiental'},
    {codigo:'7.3', pregunta:'Existe toma de conciencia sobre la política ambiental, aspectos significativos, contribución al SGA?', criterio:'Personal consciente de la política, aspectos significativos, contribución, implicaciones de no conformidad.', evidencia:'Inducciones, campañas de sensibilización ambiental'},
    {codigo:'7.4', pregunta:'La comunicación interna y externa está definida e implementada?', criterio:'Qué, cuándo, a quién, cómo comunicar. Comunicación externa sobre obligaciones de cumplimiento.', evidencia:'Matriz de comunicaciones ambientales'},
    {codigo:'7.5', pregunta:'La información documentada está controlada?', criterio:'Control de la información documentada requerida por el SGA y la norma.', evidencia:'Listado maestro, procedimiento de control documental'}
  ]},
  { num:'8', title:'Operación', items:[
    {codigo:'8.1', pregunta:'Se planifica e implementa el control operacional considerando aspectos significativos y obligaciones de cumplimiento?', criterio:'Criterios operacionales para procesos. Controles para mantener consistencia.', evidencia:'Procedimientos operacionales ambientales, instructivos'},
    {codigo:'8.2', pregunta:'Existen procedimientos de preparación y respuesta ante emergencias ambientales?', criterio:'Acciones para prevenir o mitigar impactos ambientales adversos, pruebas periódicas, revisión.', evidencia:'Plan de emergencias ambientales, simulacros, brigadas'}
  ]},
  { num:'9', title:'Evaluación del desempeño', items:[
    {codigo:'9.1.1', pregunta:'Se hace seguimiento, medición, análisis y evaluación del desempeño ambiental?', criterio:'Qué se mide, métodos, criterios, cuándo, análisis. Equipos calibrados.', evidencia:'Plan de seguimiento y medición ambiental, registros'},
    {codigo:'9.1.2', pregunta:'Se evalúa el cumplimiento legal y otros requisitos a intervalos planificados?', criterio:'Frecuencia de evaluación, acciones, conocimiento del estado de cumplimiento.', evidencia:'Evaluación periódica de cumplimiento legal'},
    {codigo:'9.2', pregunta:'Las auditorías internas se planifican y ejecutan considerando la importancia ambiental?', criterio:'Programa de auditoría, criterios, objetividad, comunicación de resultados a la dirección.', evidencia:'Programa, planes e informes de auditoría interna'},
    {codigo:'9.3', pregunta:'La revisión por la dirección se realiza considerando todas las entradas del SGA?', criterio:'Estado de acciones, cambios en cuestiones, desempeño ambiental, suficiencia de recursos.', evidencia:'Acta de revisión por la dirección'}
  ]},
  { num:'10', title:'Mejora', items:[
    {codigo:'10.1', pregunta:'Se determinan oportunidades de mejora del SGA?', criterio:'Acciones para implementar mejoras, lograr resultados, abordar tendencias adversas.', evidencia:'Iniciativas de mejora, indicadores'},
    {codigo:'10.2', pregunta:'Las no conformidades se gestionan con análisis de causa raíz y acciones correctivas?', criterio:'Reaccionar a la NC, evaluar necesidad de acción, implementar, revisar eficacia.', evidencia:'Registros de NC con análisis de causa y acción correctiva'},
    {codigo:'10.3', pregunta:'Se mejora continuamente el SGA?', criterio:'Mejora continua de conveniencia, adecuación y eficacia para mejorar el desempeño ambiental.', evidencia:'Plan de mejora continua, indicadores de tendencia'}
  ]}
];

/* ============= CHECKLIST ISO 9001:2015 (simplificado) ============= */
const CHK_ISO9001 = [
  { num:'4', title:'Contexto de la organización', items:[
    {codigo:'4.1', pregunta:'Se determinaron las cuestiones externas e internas pertinentes al SGC?', criterio:'Cuestiones que afectan la capacidad de lograr los resultados previstos del sistema.', evidencia:'Análisis FODA, documento de contexto'},
    {codigo:'4.2', pregunta:'Se identifican las partes interesadas y sus requisitos?', criterio:'Partes interesadas pertinentes, sus requisitos, y cuáles se convierten en requisitos del SGC.', evidencia:'Matriz de partes interesadas'},
    {codigo:'4.3', pregunta:'El alcance del SGC está definido y documentado?', criterio:'Alcance con productos/servicios incluidos, exclusiones justificadas y límites de aplicación.', evidencia:'Documento de alcance del SGC'},
    {codigo:'4.4', pregunta:'Se establecieron, implementaron y mantienen los procesos necesarios del SGC?', criterio:'Entradas, salidas, secuencia, interacciones, criterios, responsables e indicadores de los procesos.', evidencia:'Mapa de procesos, fichas de proceso'}
  ]},
  { num:'5', title:'Liderazgo', items:[
    {codigo:'5.1', pregunta:'La alta dirección demuestra liderazgo y compromiso con el SGC?', criterio:'Rendición de cuentas, política y objetivos alineados, recursos disponibles, mejora continua promovida.', evidencia:'Revisiones por la dirección, comunicaciones, asignación de recursos'},
    {codigo:'5.2', pregunta:'La política de calidad es apropiada, comunicada y disponible?', criterio:'Proporciona marco para objetivos, compromiso de cumplir requisitos, mejora continua.', evidencia:'Política de calidad firmada y comunicada'},
    {codigo:'5.3', pregunta:'Roles, responsabilidades y autoridades están asignados y comunicados?', criterio:'Responsabilidades para la conformidad del SGC y reporte de desempeño a la dirección.', evidencia:'Organigrama, perfiles de cargo, asignaciones'}
  ]},
  { num:'6', title:'Planificación', items:[
    {codigo:'6.1', pregunta:'Se determinaron riesgos y oportunidades y se planificaron acciones para abordarlos?', criterio:'Acciones proporcionales al impacto potencial, integradas en procesos del SGC.', evidencia:'Matriz de riesgos y oportunidades, planes de tratamiento'},
    {codigo:'6.2', pregunta:'Se establecieron objetivos de calidad medibles con planes para lograrlos?', criterio:'Coherentes con la política, medibles, monitoreados, comunicados y actualizados.', evidencia:'Matriz de objetivos de calidad con indicadores y responsables'}
  ]},
  { num:'7', title:'Apoyo', items:[
    {codigo:'7.1', pregunta:'Se determinan y proporcionan los recursos necesarios para el SGC?', criterio:'Personas, infraestructura, ambiente, recursos de seguimiento y medición, conocimiento organizacional.', evidencia:'Plan de recursos, presupuesto, dotación'},
    {codigo:'7.2', pregunta:'Se determina y mantiene la competencia necesaria?', criterio:'Educación, formación, experiencia. Acciones cuando se detectan brechas de competencia.', evidencia:'Matriz de competencias, registros de formación'},
    {codigo:'7.3', pregunta:'Existe toma de conciencia sobre la política, objetivos y contribución al SGC?', criterio:'Personal conoce política, objetivos relevantes, contribución y consecuencias de incumplimiento.', evidencia:'Comunicaciones, evidencias de inducción y sensibilización'},
    {codigo:'7.5', pregunta:'La información documentada requerida está controlada adecuadamente?', criterio:'Identificación, formato, creación, actualización, distribución y control de cambios.', evidencia:'Listado maestro de documentos, procedimiento de control documental'}
  ]},
  { num:'8', title:'Operación', items:[
    {codigo:'8.1', pregunta:'Se planifican, implementan y controlan los procesos para cumplir requisitos de productos/servicios?', criterio:'Criterios de los procesos, controles, información documentada de confianza.', evidencia:'Procedimientos operacionales, planes de calidad, registros de control'},
    {codigo:'8.2', pregunta:'Se determinan, revisan y documentan los requisitos relativos a productos/servicios?', criterio:'Legales, reglamentarios, del cliente y los determinados por la organización.', evidencia:'Revisión de contratos, fichas técnicas, registros de requisitos'},
    {codigo:'8.4', pregunta:'Se controlan los procesos, productos y servicios suministrados externamente?', criterio:'Criterios de selección, evaluación y seguimiento de proveedores externos.', evidencia:'Evaluaciones de proveedores, listado de proveedores aprobados'},
    {codigo:'8.5', pregunta:'La producción y provisión del servicio se realizan bajo condiciones controladas?', criterio:'Instrucciones de trabajo, equipos apropiados, actividades de seguimiento, control de cambios.', evidencia:'Instrucciones de trabajo, registros de producción, calibración'},
    {codigo:'8.6', pregunta:'Se liberan los productos/servicios solo cuando cumplen los criterios de aceptación?', criterio:'Verificación en etapas planificadas. Evidencia de conformidad y persona que autoriza la liberación.', evidencia:'Registros de inspección y ensayo, criterios de aceptación'},
    {codigo:'8.7', pregunta:'Las salidas no conformes se identifican y controlan para evitar su uso no intencionado?', criterio:'Identificación, segregación, notificación, tratamiento. Registros de descripción y acciones tomadas.', evidencia:'Procedimiento de productos no conformes, registros'}
  ]},
  { num:'9', title:'Evaluación del desempeño', items:[
    {codigo:'9.1', pregunta:'Se hace seguimiento, medición, análisis y evaluación del desempeño del SGC?', criterio:'Qué, cómo, cuándo medir. Análisis de resultados para evaluar conformidad y eficacia.', evidencia:'Indicadores de proceso, informes de desempeño'},
    {codigo:'9.1.2', pregunta:'Se realiza seguimiento de la percepción del cliente?', criterio:'Métodos para obtener, seguir y revisar la información sobre satisfacción del cliente.', evidencia:'Encuestas de satisfacción, registros de quejas, índices de satisfacción'},
    {codigo:'9.2', pregunta:'Se realizan auditorías internas a intervalos planificados?', criterio:'Programa de auditoría con criterios, alcance, frecuencia, métodos. Auditores objetivos e imparciales.', evidencia:'Programa y plan de auditoría, informe, seguimiento de hallazgos'},
    {codigo:'9.3', pregunta:'La revisión por la dirección se lleva a cabo con todas las entradas requeridas?', criterio:'Estado de acciones previas, tendencias, conformidad, no conformidades, auditorías, partes interesadas.', evidencia:'Acta de revisión por la dirección con entradas y salidas documentadas'}
  ]},
  { num:'10', title:'Mejora', items:[
    {codigo:'10.1', pregunta:'Se determinan y seleccionan oportunidades de mejora?', criterio:'Mejorar productos/servicios, corregir/prevenir/reducir efectos no deseados, mejorar el desempeño del SGC.', evidencia:'Registro de oportunidades de mejora, proyectos de mejora'},
    {codigo:'10.2', pregunta:'Las no conformidades se gestionan con análisis de causa raíz y acciones correctivas eficaces?', criterio:'Reaccionar, contener, investigar causa, implementar acciones, verificar eficacia, actualizar riesgos.', evidencia:'Registros de no conformidad con análisis de causa, plan y verificación'},
    {codigo:'10.3', pregunta:'Se mejora continuamente la conveniencia, adecuación y eficacia del SGC?', criterio:'Uso de análisis, evaluación y revisión por la dirección para identificar mejoras.', evidencia:'Evidencias de mejora continua, comparación de indicadores en el tiempo'}
  ]}
];

/* ============= CHECKLIST FSSC 22000 v6 (extracto) ============= */
const CHK_FSSC22000 = [
  { num:'4', title:'Contexto de la organización', items:[
    {codigo:'4.1', pregunta:'Se han determinado los problemas externos e internos relevantes para el SGSA?', criterio:'Identificación, revisión y actualización de información sobre contexto. Incluye condiciones ambientales.', evidencia:'Análisis de contexto, registros de revisión'},
    {codigo:'4.2', pregunta:'Se identifican partes interesadas relevantes para el SGSA y sus requisitos?', criterio:'Partes interesadas, sus requisitos relevantes para la seguridad alimentaria.', evidencia:'Matriz de partes interesadas'},
    {codigo:'4.3', pregunta:'El alcance del SGSA está definido especificando productos, procesos y sitios?', criterio:'Alcance con productos/servicios, procesos y sitios incluidos.', evidencia:'Documento de alcance'},
    {codigo:'4.4', pregunta:'Se ha establecido, implementado, mantenido y mejorado el SGSA?', criterio:'Procesos del SGSA y sus interacciones.', evidencia:'Manual SGSA, mapa de procesos'}
  ]},
  { num:'5', title:'Liderazgo', items:[
    {codigo:'5.1', pregunta:'La alta dirección demuestra liderazgo y compromiso con el SGSA?', criterio:'Asegurar política, integrar SGSA en procesos, asignar recursos, comunicar.', evidencia:'Revisiones gerenciales, presupuesto, comunicaciones'},
    {codigo:'5.2', pregunta:'La política de seguridad alimentaria está establecida, implementada y mantenida?', criterio:'Apropiada al propósito, con compromiso de cumplir requisitos y mejora continua.', evidencia:'Política firmada y comunicada'},
    {codigo:'5.3', pregunta:'Las responsabilidades y autoridades están asignadas y comunicadas?', criterio:'Lider del equipo de SA designado, roles definidos.', evidencia:'Organigrama, designaciones documentadas'}
  ]},
  { num:'6', title:'Planificación', items:[
    {codigo:'6.1', pregunta:'Se determinaron riesgos y oportunidades y se planificaron acciones?', criterio:'Acciones proporcionales al impacto en seguridad alimentaria.', evidencia:'Matriz de riesgos y oportunidades'},
    {codigo:'6.4', pregunta:'Los objetivos del SGSA son medibles, monitoreados y comunicados?', criterio:'Coherentes con la política, medibles, con seguimiento y actualización.', evidencia:'Matriz de objetivos con indicadores'}
  ]},
  { num:'7', title:'Soporte', items:[
    {codigo:'7.1', pregunta:'Se determinan y proporcionan los recursos necesarios para el SGSA?', criterio:'Recursos internos y externos para establecer e implementar el SGSA.', evidencia:'Presupuesto, dotación, equipamiento'},
    {codigo:'7.7', pregunta:'Se determina y asegura la competencia del personal que afecta la seguridad alimentaria?', criterio:'Competencia adecuada; equipo HACCP con formación documentada.', evidencia:'Matriz de competencias, registros de formación'},
    {codigo:'7.8', pregunta:'Existe toma de conciencia sobre política, objetivos y contribución al SGSA?', criterio:'Personal conoce política, objetivos, contribución e implicaciones del incumplimiento.', evidencia:'Inducciones, comunicaciones, registros de sensibilización'},
    {codigo:'7.14', pregunta:'La información documentada del SGSA está controlada adecuadamente?', criterio:'Disponible, protegida; distribución, almacenamiento, control de versiones y disposición controlados.', evidencia:'Listado maestro, procedimiento de control documental'}
  ]},
  { num:'8.2', title:'Programas Prerrequisito (PPR)', items:[
    {codigo:'8.2.4', pregunta:'Los PPR están establecidos, implementados, mantenidos y actualizados?', criterio:'PPR para prevenir/reducir la probabilidad de contaminación.', evidencia:'Procedimientos de PPR, registros de cumplimiento'},
    {codigo:'8.2.5', pregunta:'Los PPR son apropiados para la organización y tipo de operación?', criterio:'Apropiados al tamaño, tipo de operación y productos; implementados en todo el sistema.', evidencia:'PPR documentados y validados'},
    {codigo:'8.2.51', pregunta:'Los programas de limpieza y desinfección están establecidos y validados?', criterio:'Programas especificando áreas, métodos, frecuencias, agentes y verificación.', evidencia:'Programa de L&D, registros de verificación'}
  ]},
  { num:'8.5', title:'Plan de Control de Peligros (HACCP)', items:[
    {codigo:'8.5.1', pregunta:'Se completaron las etapas preliminares del análisis de peligros?', criterio:'Equipo de SA designado, descripción de productos, uso previsto, diagrama de flujo verificado.', evidencia:'Acta del equipo HACCP, fichas técnicas, diagrama de flujo confirmado in situ'},
    {codigo:'8.5.11', pregunta:'Se identificaron todos los peligros de seguridad alimentaria por etapa de proceso?', criterio:'Peligros biológicos, químicos y físicos identificados y documentados por etapa.', evidencia:'Matriz de análisis de peligros'},
    {codigo:'8.5.14', pregunta:'Se realizó evaluación de peligros determinando severidad y probabilidad?', criterio:'Evaluación de severidad y probabilidad para determinar peligros significativos.', evidencia:'Matriz de evaluación de peligros con criterios'},
    {codigo:'8.5.22', pregunta:'El plan de control de peligros está establecido, implementado y mantenido?', criterio:'PCC y PPRO con límites críticos, criterios de acción, monitoreo y correcciones documentados.', evidencia:'Plan HACCP, registros de monitoreo'},
    {codigo:'8.5.26', pregunta:'El plan de control de peligros está implementado con evidencia documentada?', criterio:'Implementación mantenida y evidenciada como información documentada.', evidencia:'Registros de monitoreo de PCC/PPRO'}
  ]},
  { num:'9', title:'Evaluación del desempeño', items:[
    {codigo:'9.2', pregunta:'Se determinan, planifican y ejecutan las medidas de seguimiento, medición y análisis?', criterio:'Qué medir, métodos, frecuencia, análisis de resultados.', evidencia:'Plan de monitoreo, indicadores'},
    {codigo:'9.5', pregunta:'Las auditorías internas se realizan a intervalos planificados?', criterio:'Programa con frecuencia, métodos, responsabilidades. Auditores independientes de áreas auditadas.', evidencia:'Programa de auditorías, planes, informes, seguimiento de hallazgos'},
    {codigo:'9.8', pregunta:'La alta dirección revisa el SGSA a intervalos planificados?', criterio:'Revisión para asegurar idoneidad, adecuación y eficacia continuas.', evidencia:'Acta de revisión gerencial'}
  ]},
  { num:'10', title:'Mejora', items:[
    {codigo:'10.2', pregunta:'Las no conformidades se gestionan con correcciones y acciones correctivas?', criterio:'Reaccionar, evaluar causa, implementar acciones, verificar eficacia, actualizar SGSA.', evidencia:'Registros de NC, análisis de causa, plan de acción, verificación'},
    {codigo:'10.5', pregunta:'La organización mejora continuamente el SGSA?', criterio:'Uso de comunicación, revisión gerencial, auditorías y verificaciones para la mejora continua.', evidencia:'Evidencias de mejora, comparación de indicadores'}
  ]}
];

/* ============= USUARIOS DEMO (3 roles) ============= */
/* Admin / Auditor → pertenecen a Solinal (empresa auditora)
   Auditados → cada uno es representante de una empresa cliente:
     u4 Solange Rivera  → c1 Indura Ecuador S.A.
     u5 Luis Latorre    → c3 Lácteos Andinos Cía. Ltda.
     u6 Carlos Mendoza  → c2 Alimentos del Pacífico S.A. */
const USERS_DB = [
  {id:'u1', email:'admin@auditaai.com',     password:'admin2026',    name:'Sandra Vélez',       role:'admin',    initials:'SV'},
  {id:'u2', email:'auditor@auditaai.com',   password:'auditor2026',  name:'Juan Carlos Cerón',  role:'auditor',  initials:'JC'},
  {id:'u3', email:'auditor2@auditaai.com',  password:'auditor2026',  name:'Paula Cerda',         role:'auditor',  initials:'PC'},
  {id:'u4', email:'srivera@indura.ec',      password:'auditado2026', name:'Solange Rivera',      role:'auditado', initials:'SR'},
  {id:'u5', email:'llatorre@lacteosandinos.ec', password:'auditado2026', name:'Luis Latorre',    role:'auditado', initials:'LL'},
  {id:'u6', email:'cmendoza@alimentospacifico.com', password:'auditado2026', name:'Carlos Mendoza', role:'auditado', initials:'CM'}
];

const ROLE_NAMES = {
  admin:    'Administrador',
  auditor:  'Auditor',
  auditado: 'Auditado'
};

/* ============= EMPRESAS Y SEDES DEMO ============= */
const COMPANIES_SEED = [
  {
    id:'c1', razon_social:'Indura Ecuador S.A.', ruc:'0990340900001',
    sector:'Gases industriales', alcance:'Producción de gases criogénicos LIN, LOX y LAR mediante licuefacción de aire',
    responsable_id:'u4',
    contacto:{nombre:'Solange Rivera', cargo:'Gerente SHEQ', email:'riveras4@airproducts.com', telefono:'+593 994124053'},
    estado:'activa',
    sedes:[
      {id:'s1', nombre:'Planta Pascuales — Guayaquil', direccion:'Km 14.5 vía a Daule y av. El Cenáculo', ciudad:'Guayaquil', pais:'Ecuador',
       procesos:['Operaciones ASU','Mantenimiento','Laboratorio','RRHH','Compras','Cumplimiento legal']}
    ]
  },
  {
    id:'c2', razon_social:'Alimentos del Pacífico S.A.', ruc:'1791234567001',
    sector:'Procesamiento de pescado', alcance:'Procesamiento, congelación y exportación de atún en lomos, conservas y harina de pescado',
    responsable_id:'u6',
    contacto:{nombre:'Carlos Mendoza', cargo:'Director de Calidad', email:'cmendoza@alimentospacifico.com', telefono:'+593 4 2345678'},
    estado:'activa',
    sedes:[
      {id:'s2', nombre:'Planta Manta', direccion:'Vía al puerto, parque industrial Manta', ciudad:'Manta', pais:'Ecuador',
       procesos:['Recepción','Eviscerado','Cocción','Empaque','Congelación','Despacho']},
      {id:'s3', nombre:'Centro de distribución Guayaquil', direccion:'Av. Las Esclusas km 6', ciudad:'Guayaquil', pais:'Ecuador',
       procesos:['Almacenamiento','Logística','Despacho']}
    ]
  },
  {
    id:'c3', razon_social:'Lácteos Andinos Cía. Ltda.', ruc:'1890765432001',
    sector:'Productos lácteos', alcance:'Procesamiento de leche cruda, producción de yogurt, quesos y leche pasteurizada',
    responsable_id:'u5',
    contacto:{nombre:'María Espinoza', cargo:'Coordinadora de Inocuidad', email:'mespinoza@lacteosandinos.ec', telefono:'+593 3 2987654'},
    estado:'activa',
    sedes:[
      {id:'s4', nombre:'Planta Salcedo', direccion:'Vía a Latacunga km 3, sector Cumbijín', ciudad:'Salcedo', pais:'Ecuador',
       procesos:['Recepción de leche','Pasteurización','Yogurt','Quesería','Envasado','Cuarto frío']}
    ]
  }
];

/* ============= AUDITORÍAS SEED ============= */
const AUDITS_SEED = [
  {
    id:'a1', codigo:'AUD-2026-001', tipo:'interna', estado:'ejecucion',
    empresa_id:'c1', sede_id:'s1', norma:'iso14001',
    objetivo:'Auditoría interna anual de seguimiento al SGA. Verificar conformidad con ISO 14001:2015 y eficacia de acciones correctivas previas.',
    alcance:'Todos los procesos de la planta Pascuales incluyendo operaciones ASU, mantenimiento, RRHH, compras y cumplimiento legal ambiental.',
    criterios:'ISO 14001:2015, política ambiental, requisitos legales aplicables (Ministerio del Ambiente, ARCONEL, ARCH).',
    fecha_inicio:'2026-04-15', fecha_fin:'2026-04-17', modalidad:'presencial',
    auditor_id:'u2', equipo:['u3'], empresa_auditado_id:'c1',
    procesos:['Operaciones ASU','Mantenimiento','RRHH','Compras','Cumplimiento legal'],
    progreso:62, prioridad:'alta',
    agenda:'Apertura 08h30 — Liderazgo 09h00 — Planificación 11h00 — Operaciones 14h00 — Cierre 17h00',
    riesgos:'Disponibilidad de personal en mantenimiento, acceso a registros legales en formato digital.'
  },
  {
    id:'a2', codigo:'AUD-2026-002', tipo:'tercera_parte', estado:'planificada',
    empresa_id:'c2', sede_id:'s2', norma:'fssc22000',
    objetivo:'Auditoría de recertificación FSSC 22000 v6. Verificar cumplimiento integral del SGSA.',
    alcance:'Toda la planta Manta — categoría CI (Procesamiento de productos animales perecederos).',
    criterios:'FSSC 22000 v6, ISO 22000:2018, ISO/TS 22002-1, requisitos adicionales FSSC, requisitos legales sanitarios.',
    fecha_inicio:'2026-05-20', fecha_fin:'2026-05-23', modalidad:'presencial',
    auditor_id:'u2', equipo:['u3','u1'], empresa_auditado_id:'c2',
    procesos:['Recepción','Eviscerado','Cocción','Empaque','Congelación','Despacho'],
    progreso:5, prioridad:'media',
    agenda:'Por definir tras reunión de apertura.',
    riesgos:'Coincidencia con temporada alta de pesca; coordinar con operación.'
  },
  {
    id:'a3', codigo:'AUD-2025-012', tipo:'interna', estado:'cerrada',
    empresa_id:'c3', sede_id:'s4', norma:'iso22000',
    objetivo:'Auditoría interna anual al SGSA conforme ISO 22000:2018.',
    alcance:'Todos los procesos de la planta Salcedo.',
    criterios:'ISO 22000:2018, política de inocuidad, requisitos legales (ARCSA), plan HACCP vigente.',
    fecha_inicio:'2025-11-10', fecha_fin:'2025-11-12', modalidad:'presencial',
    auditor_id:'u2', equipo:['u3'], empresa_auditado_id:'c3',
    procesos:['Recepción de leche','Pasteurización','Yogurt','Quesería','Envasado'],
    progreso:100, prioridad:'baja', agenda:'', riesgos:''
  },
  {
    id:'a4', codigo:'AUD-2026-003', tipo:'segunda_parte', estado:'planificada',
    empresa_id:'c3', sede_id:'s4', norma:'iso22000',
    objetivo:'Auditoría de segunda parte (cliente) para evaluar la capacidad de proveedor.',
    alcance:'Procesos de producción de yogurt y queso destinados al cliente Supermaxi.',
    criterios:'ISO 22000:2018, acuerdo de calidad con el cliente, especificaciones de producto.',
    fecha_inicio:'2026-06-08', fecha_fin:'2026-06-09', modalidad:'hibrida',
    auditor_id:'u2', equipo:['u3'], empresa_auditado_id:'c3',
    procesos:['Yogurt','Quesería','Envasado'],
    progreso:0, prioridad:'media', agenda:'', riesgos:''
  }
];

/* ============= HALLAZGOS SEED ============= */
const FINDINGS_SEED = [
  {
    id:'f1', codigo:'HAL-2026-001', auditoria_id:'a1', tipo:'no_conformidad_mayor',
    requisito:'9.1.2', proceso:'Cumplimiento legal',
    descripcion:'La sede no ha obtenido el permiso de uso de diesel para las instalaciones según Resolución 006-003 Directorio Extraordinario ARCH-2015.',
    evidencia:'Revisión documental: no se evidencia permiso. Compras de diésel facturadas a PETROGOSA (Factura 23716) sin respaldo regulatorio.',
    auditor_id:'u2', fecha:'2026-04-15', criticidad:'alta', estado:'abierto',
    riesgo:'Sanción de la autoridad de regulación y control hidrocarburífero (ARCH), suspensión de operaciones.',
    empresa_id:'c1'
  },
  {
    id:'f2', codigo:'HAL-2026-002', auditoria_id:'a1', tipo:'no_conformidad_mayor',
    requisito:'6.1.2', proceso:'Operaciones ASU',
    descripcion:'No se han considerado todos los usos de energía eléctrica del sitio en el análisis de aspectos ambientales significativos.',
    evidencia:'Matriz de aspectos DA-EC-REVENERGET solo considera ASU Plant. No se evidencia evaluación de otras áreas.',
    auditor_id:'u2', fecha:'2026-04-16', criticidad:'alta', estado:'abierto',
    riesgo:'Aspectos significativos no identificados pueden derivar en impactos no controlados.',
    empresa_id:'c1'
  },
  {
    id:'f3', codigo:'HAL-2026-003', auditoria_id:'a1', tipo:'no_conformidad_menor',
    requisito:'9.1.1', proceso:'Mantenimiento',
    descripcion:'Equipos de medición de variables clave (PowerLogic PM550, monitor de energía 1319101) no cuentan con verificación metrológica documentada.',
    evidencia:'Programa de calibración DA-EC-PROCALIGYE-09: equipos de energía y compresores marcados como "Not performed".',
    auditor_id:'u3', fecha:'2026-04-16', criticidad:'media', estado:'abierto',
    riesgo:'Datos de seguimiento ambiental no trazables ni confiables.',
    empresa_id:'c1'
  },
  {
    id:'f4', codigo:'HAL-2026-004', auditoria_id:'a1', tipo:'observacion',
    requisito:'7.3', proceso:'RRHH',
    descripcion:'Personal contratista (mantenimiento de transformadores BRITRANSFORMADORES) sin evidencia de inducción ambiental específica del sitio.',
    evidencia:'Registro de inducción del 21-02-2025 no incluye contenido ambiental.',
    auditor_id:'u3', fecha:'2026-04-16', criticidad:'baja', estado:'abierto',
    riesgo:'Posibles incidentes ambientales por desconocimiento de aspectos del sitio.',
    empresa_id:'c1'
  },
  {
    id:'f5', codigo:'HAL-2026-005', auditoria_id:'a1', tipo:'oportunidad_mejora',
    requisito:'10.3', proceso:'Liderazgo',
    descripcion:'Se identifica oportunidad de integrar el sistema de gestión ambiental con el sistema de gestión de energía (ISO 50001) ya implementado.',
    evidencia:'Existen dos comités separados; los temas ambientales y energéticos se gestionan por procesos paralelos.',
    auditor_id:'u2', fecha:'2026-04-17', criticidad:'baja', estado:'abierto',
    riesgo:'Duplicidad de esfuerzos.',
    empresa_id:'c1'
  },
  {
    id:'f6', codigo:'HAL-2025-012', auditoria_id:'a3', tipo:'no_conformidad_menor',
    requisito:'8.5.4', proceso:'Pasteurización',
    descripcion:'Registros de monitoreo del PCC de pasteurización (T° y tiempo) presentan dos turnos sin firma de verificación del supervisor en noviembre 2025.',
    evidencia:'Registros R-PAS-001 días 03, 07 y 18 de noviembre 2025, turno B.',
    auditor_id:'u2', fecha:'2025-11-11', criticidad:'media', estado:'cerrado',
    riesgo:'Pérdida de trazabilidad de la verificación del PCC.',
    empresa_id:'c3'
  }
];

/* ============= PLANES DE ACCIÓN SEED ============= */
const ACTIONS_SEED = [
  {
    id:'p1', codigo:'PA-2026-001', hallazgo_id:'f1', tipo:'accion_correctiva',
    descripcion:'Iniciar trámite ante la ARCH para obtener el permiso de uso/almacenamiento de diésel.',
    responsable_id:'u4', fecha_inicio:'2026-04-20',
    prioridad:'alta', estado:'abierto',
    recursos:'Asesoría legal externa (Sambito), $1,500',
    evidencia_auditado:'Oficio enviado el 30-06-2026 a la ARCH solicitando inicio del proceso de registro.',
    fecha_evidencia:'2026-06-30',
    causa_raiz:'No se realizó identificación legal exhaustiva.', comentarios:[]
  },
  {
    id:'p2', codigo:'PA-2026-002', hallazgo_id:'f2', tipo:'accion_correctiva',
    descripcion:'Actualizar matriz de aspectos e impactos ambientales incluyendo TODAS las áreas funcionales del sitio.',
    responsable_id:'u4', fecha_inicio:'2026-04-22',
    prioridad:'alta', estado:'abierto',
    recursos:'Equipo SHEQ, Coordinador ambiental',
    evidencia_auditado:'', fecha_evidencia:'',
    causa_raiz:'Análisis se realizó solo a nivel de equipos significativos sin enfoque por funciones del sitio.', comentarios:[]
  },
  {
    id:'p3', codigo:'PA-2026-003', hallazgo_id:'f3', tipo:'correccion',
    descripcion:'Verificación metrológica de medidores eléctricos clave y plan de calibración con frecuencia anual.',
    responsable_id:'u5', fecha_inicio:'2026-04-25',
    prioridad:'media', estado:'abierto',
    recursos:'Laboratorio acreditado, $3,200',
    evidencia_auditado:'', fecha_evidencia:'',
    causa_raiz:'Falta de capacitación en validación de equipos de medición.', comentarios:[]
  },
  {
    id:'p4', codigo:'PA-2026-004', hallazgo_id:'f4', tipo:'mejora',
    descripcion:'Actualizar el procedimiento de inducción para contratistas incluyendo módulo ambiental específico del sitio.',
    responsable_id:'u4', fecha_inicio:'2026-05-01',
    prioridad:'baja', estado:'abierto',
    recursos:'Equipo SHEQ',
    evidencia_auditado:'', fecha_evidencia:'',
    causa_raiz:'Procedimiento de inducción no diferencia entre personal propio y contratista.', comentarios:[]
  },
  {
    id:'p5', codigo:'PA-2025-018', hallazgo_id:'f6', tipo:'accion_correctiva',
    descripcion:'Reforzar instrucción al personal supervisor sobre frecuencia y modo de firma de verificación de registros del PCC.',
    responsable_id:'u5', fecha_inicio:'2025-11-15',
    prioridad:'media', estado:'cerrado', fecha_cierre:'2025-12-10',
    recursos:'Tiempo de capacitación interna',
    evidencia_auditado:'Registros de capacitación 25-11-2025. Verificación posterior: 100% de registros firmados en diciembre.',
    fecha_evidencia:'2025-11-25',
    causa_raiz:'Cambio reciente de supervisor de turno; instrucción de trabajo no fue reforzada.', comentarios:[]
  }
];

/* ============= AUDIT LOG SEED ============= */
const AUDIT_LOG_SEED = [
  {ts:'2026-05-12T09:15:00', user:'Juan Cerón',    action:'Creó auditoría AUD-2026-002',                       module:'Auditorías'},
  {ts:'2026-05-12T09:30:00', user:'Juan Cerón',    action:'Asignó equipo auditor a AUD-2026-002',              module:'Auditorías'},
  {ts:'2026-05-12T10:45:00', user:'Paula Cerda',   action:'Respondió 12 ítems del checklist AUD-2026-001',     module:'Auditorías'},
  {ts:'2026-05-12T11:02:00', user:'Paula Cerda',   action:'Generó hallazgo HAL-2026-003',                      module:'Hallazgos'},
  {ts:'2026-05-11T16:20:00', user:'Solange Rivera',action:'Cerró plan de acción PA-2025-018',                  module:'Planes de acción'},
  {ts:'2026-05-11T15:00:00', user:'Sandra Vélez',  action:'Creó empresa Lácteos Andinos',                      module:'Empresas'},
  {ts:'2026-05-10T17:55:00', user:'Juan Cerón',    action:'Generó reporte de auditoría AUD-2025-012 (PDF)',    module:'Reportes'}
];

/* ============= NOTIFICACIONES SEED ============= */
const NOTIFICATIONS_SEED = [
  /* --- Auditor u2 (Juan Carlos Cerón) --- */
  /* Auditorías asignadas */
  { id:'n001', forUserId:'u2', type:'info',    read:false, ts:'2026-04-10',
    message:'Se te asignó la auditoría AUD-2026-001 (ISO 14001:2015) para Indura Ecuador S.A.' },
  { id:'n002', forUserId:'u2', type:'info',    read:false, ts:'2026-04-18',
    message:'Se te asignó la auditoría AUD-2026-002 (ISO 14001:2015) para Alimentos del Pacífico S.A.' },
  { id:'n003', forUserId:'u2', type:'info',    read:true,  ts:'2025-10-05',
    message:'Se te asignó la auditoría AUD-2025-012 (ISO 22000:2018) para Lácteos Andinos Cía. Ltda.' },
  { id:'n004', forUserId:'u2', type:'info',    read:true,  ts:'2026-05-01',
    message:'Se te asignó la auditoría AUD-2026-003 (ISO 22000:2018) para Lácteos Andinos Cía. Ltda.' },
  /* Evidencia subida por auditado */
  { id:'n005', forUserId:'u2', type:'info',    read:false, ts:'2026-06-30',
    message:'Solange Rivera subió evidencia al plan PA-2026-001 — pendiente de revisión' },

  /* --- Auditado u4 (Solange Rivera — Indura Ecuador) --- */
  /* NCs registradas en su auditoría */
  { id:'n006', forUserId:'u4', type:'warning', read:false, ts:'2026-04-20',
    message:'Nueva no conformidad en AUD-2026-001: HAL-2026-001 — Falta permiso de uso/almacenamiento de diésel ante la ARCH' },
  { id:'n007', forUserId:'u4', type:'warning', read:false, ts:'2026-04-20',
    message:'Nueva no conformidad en AUD-2026-001: HAL-2026-002 — Matriz de aspectos e impactos ambientales desactualizada' },

  /* --- Auditado u5 (Luis Latorre — Lácteos Andinos) --- */
  /* NC en su auditoría */
  { id:'n008', forUserId:'u5', type:'warning', read:true,  ts:'2025-11-11',
    message:'Nueva no conformidad en AUD-2025-012: HAL-2025-012 — Incumplimiento en frecuencia de firma de verificación del PCC' },
  /* Auditoría cerrada */
  { id:'n009', forUserId:'u5', type:'success', read:true,  ts:'2025-12-20',
    message:'La auditoría AUD-2025-012 ha sido cerrada oficialmente' }
];

/* ============= ESTADO GLOBAL ============= */
const State = {
  user: null,
  currentPage: 'dashboard',
  currentAudit: null,
  companies:     JSON.parse(JSON.stringify(COMPANIES_SEED)),
  audits:        JSON.parse(JSON.stringify(AUDITS_SEED)),
  findings:      JSON.parse(JSON.stringify(FINDINGS_SEED)),
  actions:       JSON.parse(JSON.stringify(ACTIONS_SEED)),
  responses:     {},   // { auditId: { codigoRequisito: {result, obs, evidencias[]} } }
  auditLog:      JSON.parse(JSON.stringify(AUDIT_LOG_SEED)),
  notifications: JSON.parse(JSON.stringify(NOTIFICATIONS_SEED))
};

/* ============= HELPERS GLOBALES ============= */
function getChecklistByStandard(stdId){
  switch(stdId){
    case 'iso22000':  return CHK_ISO22000;
    case 'iso14001':  return CHK_ISO14001;
    case 'fssc22000': return CHK_FSSC22000;
    case 'iso9001':   return CHK_ISO9001;
    default:          return CHK_ISO22000;
  }
}
function getStandardName(id){ return STANDARDS[id]?.code || id; }
function getCompany(id){ return State.companies.find(c => c.id === id); }
function getSede(empId, sedeId){ return getCompany(empId)?.sedes.find(s => s.id === sedeId); }
function getUserById(id){ return USERS_DB.find(u => u.id === id); }
function logAction(action, module){
  State.auditLog.unshift({ ts: new Date().toISOString(), user: State.user?.name || 'Sistema', action, module });
  if (State.auditLog.length > 200) State.auditLog.length = 200;
}
function hasRole(...roles){ return roles.includes(State.user?.role); }

/* Label helpers */
function tipoAuditoriaLabel(t){
  return {interna:'Interna',segunda_parte:'2ª parte',tercera_parte:'3ª parte',seguimiento:'Seguimiento'}[t] || t;
}
function estadoAuditoriaBadge(e){
  const map = {
    planificada:['badge-info','Planificada'],
    ejecucion:  ['badge-warn','En ejecución'],
    en_revision:['badge-purple','En revisión'],
    cerrada:    ['badge-success','Cerrada'],
    cancelada:  ['badge-muted','Cancelada']
  };
  const [cls,lbl] = map[e] || ['badge-muted', e];
  return `<span class="badge ${cls}">${lbl}</span>`;
}
function tipoHallazgoLabel(t){
  return {no_conformidad_mayor:'NC Mayor',no_conformidad_menor:'NC Menor',observacion:'Observación',oportunidad_mejora:'Oport. mejora',fortaleza:'Fortaleza'}[t] || t;
}
function badgeForFinding(t){
  return {no_conformidad_mayor:'badge-danger',no_conformidad_menor:'badge-warn',observacion:'badge-info',oportunidad_mejora:'badge-purple'}[t] || 'badge-muted';
}
function estadoHallazgoBadge(e){
  /* Solo 2 estados: abierto / cerrado */
  const map = {
    abierto: ['badge-danger',  'Abierto'],
    cerrado: ['badge-success', 'Cerrado']
  };
  const [cls,lbl] = map[e] || ['badge-danger', 'Abierto'];
  return `<span class="badge ${cls}">${lbl}</span>`;
}
function criticidadBadge(c){
  const map = {alta:'badge-danger',media:'badge-warn',baja:'badge-info'};
  return `<span class="badge ${map[c]||'badge-muted'}">${c||'-'}</span>`;
}
function estadoAccionBadge(e){
  /* Solo 2 estados: abierto / cerrado */
  const map = {
    abierto:  ['badge-warn',    'Abierto'],
    cerrado:  ['badge-success', 'Cerrado'],
    cerrada:  ['badge-success', 'Cerrado']
  };
  const [cls,lbl] = map[e] || ['badge-warn', 'Abierto'];
  return `<span class="badge ${cls}">${lbl}</span>`;
}
function prioridadBadge(p){
  return {alta:'badge-danger',media:'badge-warn',baja:'badge-info'}[p] || 'badge-muted';
}
function esc(s){ return String(s ?? '').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
