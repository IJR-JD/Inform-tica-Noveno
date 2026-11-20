# Informática 9.º — acceso inmediato y progreso protegido

Sitio: https://ijr-jd.github.io/Inform-tica-Noveno/  
Supabase: `rlfxnjbqxbozjdzkbwlz`

## Dos niveles de acceso, sin códigos numéricos

**1. Consulta inmediata:** el visitante introduce una dirección con formato `@ijr.edu.co`. El Hub abre las 26 lecciones CAD y el material del diagnóstico para exploración. Se identifica visualmente como **«Consulta sin verificar»**. Esta operación **no es inicio de sesión institucional autenticado**: no atribuye respuestas a una persona, no permite publicar notas ni evidencias, no muestra las soluciones docentes y no concede acceso a los datos privados. La dirección introducida se usa solo para la sesión de consulta en ese navegador.

**2. Progreso en Supabase:** para que el diagnóstico y las prácticas se asocien al estudiante, debe existir una **identidad Auth verificada** en Supabase. Desde la portada o el aviso del Hub se utiliza **«Verificar mi correo para guardar el progreso»**. Supabase envía un enlace mágico al buzón institucional (sin códigos numéricos). Al abrir el enlace, Supabase crea/revalida la sesión y las tablas guardan los registros bajo el UUID `auth.uid()`, no bajo un texto libre.

Es imposible atribuir datos académicos de forma segura a un estudiante exclusivamente por la dirección que otra persona puede escribir. Tampoco puede obtenerse el rol docente privilegiado de `juandiego.perez@ijr.edu.co` sin una sesión confirmada.

## Controles verificados

- `hub-gate.js` distingue `verified session` de `guest preview`; `docente.html` nunca admite invitado.
- `hub.html` habilita lectura de 26 unidades en consulta, pero deshabilita evaluaciones y guardado, muestra claramente el estado y permite pedir verificación.
- `module-zero-ui.js` presenta preguntas y opciones para consulta sin revelar soluciones ni registrar diagnóstico hasta que Supabase confirma la cuenta.
- `cad9_diagnostic_results_v1` y `cad9_course_progress_v1` tienen RLS por UUID y correo institucional verificado.
- Las funciones `cad9_merge_diagnostic_draft` y `cad9_merge_course_progress` requieren `authenticated` y no conceden acceso anónimo.

## Configuración del correo real

En Supabase, **Authentication → Providers → Email** debe estar habilitado. En **Email Templates → Magic Link** la plantilla debe incluir `{{ .ConfirmationURL }}`, no solo `{{ .Token }}`. En **URL Configuration**, permitir `https://ijr-jd.github.io/Inform-tica-Noveno/` y sus retornos.

El SMTP institucional debe admitir los correos reales y el volumen previsto de estudiantes. La prueba end-to-end de GitHub utiliza sesiones simuladas: verificar la recepción de un enlace y un guardado en Supabase con una cuenta real antes de exigir el registro escolar.

## Limitaciones

GitHub Pages sirve recursos estáticos públicos: no puede impedir la descarga de fuentes del sitio; la privacidad de resultados académicos depende de Auth y RLS. La consulta sin verificar no constituye evidencia de identidad, asistencia, cumplimiento, ni respaldo de progreso. Para entrar directamente *con identidad real y sin enlace*, debe habilitarse el SSO institucional gestionado por el colegio (Google Workspace o Microsoft Entra).
