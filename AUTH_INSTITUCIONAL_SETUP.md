# Acceso institucional sin códigos — Informática 9.º

**Sitio:** https://ijr-jd.github.io/Inform-tica-Noveno/  
**Proyecto Supabase:** `rlfxnjbqxbozjdzkbwlz`  
**Fecha de actualización:** 2026-11-20

## Modelo de identidad

- El estudiante escribe **solo su correo institucional** `@ijr.edu.co` en la portada.
- El sistema abre **Google institucional (OAuth)**. No se envían ni se piden códigos OTP, claves propias del Hub ni seudónimos.
- El alumno selecciona su cuenta del colegio en Google; Google realiza la autenticación y Supabase verifica la sesión y el correo real. **No se confía en la dirección escrita** para crear o abrir registros.
- El identificador permanente en la base de datos es `auth.users.id` (UUID); el correo verificado es una columna descriptiva y se comprueba también en políticas RLS.
- La cuenta autorizada `juandiego.perez@ijr.edu.co` recibe acceso de consulta completo a las 24 preguntas y las 26 unidades sin finalizar prácticas. Este privilegio es independiente de la escritura de resultados estudiantiles.

> Si la institución no utiliza Google Workspace, se debe conectar su proveedor de identidad real (Microsoft Entra u otro OIDC) antes de considerar listo el acceso. **No sustituirlo por un campo de correo sin autenticación**, pues permitiría suplantar a estudiantes y editar calificaciones.

## Configuración obligatoria para funcionamiento real — Supabase/Google

La integración del frontend está escrita, pero el **proveedor de Google y las URL de redirección deben configurarse en el panel de Supabase y Google Cloud**. No se han configurado credenciales privadas de Google desde este repositorio.

1. Google Cloud Console → Google Auth Platform → crear un cliente OAuth web; activar scopes `openid`, `email`, `profile` y limitar su uso al dominio institucional conforme a las políticas del colegio.
2. Como URI de retorno autorizado de Google registrar:  
   `https://rlfxnjbqxbozjdzkbwlz.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google → habilitar y agregar Client ID/Secret **directamente en Supabase, nunca en GitHub**.
4. Supabase → Authentication → URL Configuration:
   - Site URL: `https://ijr-jd.github.io/Inform-tica-Noveno/`
   - Redirect URLs: permitir esa ruta con los destinos locales de la portada (`?next=hub.html` y `?next=docente.html`). Revisar el patrón comodín que acepte el panel.
5. Probar **con una cuenta escolar real**: entrar, salir, cerrar navegador, volver, consultar el avance y comprobar que otro estudiante no puede recuperar los registros ajenos.
6. Si el proveedor institucional es Microsoft y no Google, cambiar la integración de forma coordinada; no habilitar cuentas privadas para identificarse como estudiantes.

## Registro, sincronización y protección de datos

| Recurso | Identidad y escritura | Observación |
|---|---|---|
| `auth.users` | OAuth institucional verificado, UUID por usuario | El correo introducido no autoriza el acceso |
| `cad9_diagnostic_results_v1` | RLS por `auth.uid()` y correo del JWT | Borradores automáticos, validación de 24 respuestas y protección de envíos finalizados |
| `cad9_merge_diagnostic_draft(jsonb)` | RPC `security invoker`, solo `authenticated` | Combina respuestas por pregunta; evita que un borrador desactualizado borre respuestas de otro equipo |
| `cad9_course_progress_v1` | RLS por `auth.uid()` y correo del JWT | Contenido acumulativo, revisión, quizzes, evidencias, intentos y revisión incremental |
| `cad9_merge_course_progress(jsonb)` | RPC `security invoker`, solo `authenticated` | Combina el progreso en una transacción para impedir borrados por estados antiguos |
| `private.cad9_teacher_allowlist_v1` | Acceso directo revocado a cuentas finales | Autoriza la consulta completa del material para el correo institucional establecido |

El Hub registra los cambios en el navegador como recuperación local temporal, pero la versión compartida del progreso se sincroniza con Supabase. Se muestra un indicador de sincronización; una entrega solo se considera centralizada cuando el servidor ha respondido correctamente. Si el navegador está desconectado, la copia local puede quedar pendiente de sincronización; **no es una confirmación de recepción institucional**.

### Concurrencia entre dispositivos

El servidor une los indicadores de teoría revisada, quizzes y evidencias por unidad; conserva los intentos máximos. Una sesión antigua no debe eliminar trabajos más recientes. Las identidades se separan por UUID, no por claves editables en el navegador.

### Restricciones y alcance

- La plataforma está alojada en **GitHub Pages**; el control de entrada oculta las páginas a los visitantes sin sesión, pero **no protege el código fuente público**. El control efectivo de acceso a **registros académicos** se realiza en Supabase con RLS.
- Las rutas del Hub conservan una sola pantalla de entrada de correo. Ninguna solicita códigos OTP.
- El rol docente no concede permisos globales sobre el proyecto Supabase.
- No se han creado cuentas escolares ni se han enviado invitaciones reales; eso corresponde al administrador de Google Workspace.
- Los resultados diagnósticos son orientativos y requieren interpretación pedagógica.

## QA

`node --test tests/cad-progress.test.cjs` valida lógica y contenido. `tests/cad-browser.cjs` y `tests/cad-teacher-browser.cjs` usan Chromium con identidades OAuth **simuladas**, no correos de menores ni accesos reales. La conexión OAuth externa debe validarse adicionalmente con Google y Supabase configurados.
