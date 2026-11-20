# Instituto Jorge Robledo — acceso institucional sin códigos numéricos

## Corrección aplicada

El proveedor Google OAuth estaba **desactivado** en el proyecto Supabase y el botón anterior provocaba:

```text
Unsupported provider: provider is not enabled
```

La página **ya no intenta conectarse al proveedor Google**. En lugar de ello, solicita exclusivamente el correo `@ijr.edu.co` y pide a Supabase Auth que envíe un **enlace mágico** al buzón. El propietario hace clic en el enlace: no se solicita ni se escribe ningún código de acceso.

La base de datos continúa vinculando cada alumno a su `auth.users.id` comprobado, no a la dirección escrita en un formulario sin verificación.

### Requisitos de configuración para funcionamiento real

En el proyecto `rlfxnjbqxbozjdzkbwlz`:

1. **Authentication → Providers → Email**: debe estar habilitado el proveedor Email. No se necesita habilitar Google para este acceso.
2. **Authentication → Email Templates → Magic Link**: utilizar el formato que incluya `{{ .ConfirmationURL }}`. Si la plantilla contiene solamente `{{ .Token }}`, llegará un código numérico y **no** el enlace que espera la interfaz.
3. **Authentication → URL Configuration**: configurar **Site URL** como `https://ijr-jd.github.io/Inform-tica-Noveno/` y admitir entre las Redirect URLs la portada y las variantes con `?next=hub.html` y `?next=docente.html`.
4. **Authentication → SMTP**: verificar que se puedan enviar mensajes a **todos** los correos estudiantiles del colegio. El SMTP predeterminado puede tener límites y restricciones de destinatarios; configurar SMTP institucional antes del despliegue masivo.
5. Realizar prueba de aceptación con una cuenta institucional: enviar enlace, abrirlo, verificar sesión y guardar una práctica. Confirmar la presencia de los datos bajo su UUID en Supabase.

Las herramientas de gestión disponibles en esta sesión **no permiten modificar las opciones del proveedor de correo ni su plantilla SMTP**. Esos parámetros requieren habilitación en el Dashboard de Supabase por un administrador de la institución. No confundir una prueba de navegador simulada con una entrega de correo real.

## Rutas y esquema

- Entrada pública: https://ijr-jd.github.io/Inform-tica-Noveno/
- Learning Hub protegido: `hub.html` (se redirige a la portada sin sesión válida).
- `cad9_diagnostic_results_v1`: diagnóstico, respuestas y perfil, protegido por RLS.
- `cad9_course_progress_v1`: 26 unidades CAD, avance y evidencias, protegido por RLS.
- `cad9_merge_diagnostic_draft(jsonb)`: fusión transaccional de borradores.
- `cad9_merge_course_progress(jsonb)`: combinación transaccional de avances que conserva registros anteriores.

La cuenta especial `juandiego.perez@ijr.edu.co` conserva acceso a todo el contenido en el Hub, tras autenticarse mediante su buzón institucional.

## Seguridad y privacidad

La aplicación comprueba que el correo **verificado por Supabase** corresponde a `@ijr.edu.co`. Que una persona sepa una dirección ajena no la autoriza a consultar su progreso: debe poder abrir el enlace recibido en ese buzón. Las sesiones quedan vinculadas a UUID y las políticas RLS protegen cada registro.

Los HTML y scripts de GitHub Pages siguen siendo públicamente descargables; los **datos académicos** están protegidos por Supabase, no por ocultar el código del sitio.

## QA

Las pruebas locales/CI deben simular la solicitud del enlace y el regreso con sesión Supabase, además de verificar perfiles separados, resultados, 26 lecciones, recarga, vista móvil y cierre de sesión. La activación real de correo requiere una prueba fuera de las simulaciones.
