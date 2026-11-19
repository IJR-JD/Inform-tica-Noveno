# Informática 9.º — inicio de sesión institucional (Supabase)

## Flujo implementado

1. El estudiante abre el Módulo 0 y escribe su correo institucional `@ijr.edu.co`.
2. La aplicación solicita un OTP a Supabase Auth (`POST /auth/v1/otp`). No existe ingreso mediante un código de estudiante no verificado.
3. El estudiante recibe un código numérico en el correo, lo ingresa y Supabase valida `POST /auth/v1/verify`.
4. La plataforma comprueba la sesión con `GET /auth/v1/user`. A partir de la identidad `auth.users.id` se recuperan el diagnóstico y el avance CAD de ese usuario.
5. Las tablas `cad9_diagnostic_results_v1` y `cad9_course_progress_v1` tienen RLS, obligan a la coincidencia con `auth.uid()` y el correo institucional del JWT. No tienen acceso anónimo.
6. Al cerrar sesión, el siguiente alumno debe autenticarse por su propio correo.

## Configuración obligatoria en el Dashboard de Supabase

Proyecto: `rlfxnjbqxbozjdzkbwlz`.

**Auth → Providers → Email:** activar correo. Configurar un servicio SMTP apto para el volumen de estudiantes; el envío predeterminado de Supabase puede imponer restricciones.

**Auth → Email Templates → Magic Link:** para que se envíe un código OTP numérico (en vez del enlace predeterminado), usar una plantilla que contenga `{{ .Token }}`, por ejemplo:

```html
<p>Tu código de acceso a Informática 9.º es:</p>
<h2>{{ .Token }}</h2>
<p>Si no solicitaste este código, ignora este mensaje.</p>
```

El flujo de la interfaz está diseñado para ese código y no implementa la apertura por magic link. Sin configurar esta plantilla no se garantiza que el estudiante reciba el código que debe escribir.

**Verificar dominio institucional:** el código y las políticas RLS usan `ijr.edu.co`. Si los alumnos usan otro dominio o subdominio, corregir tanto `cad-email-auth.js` como las condiciones de dominio de las dos tablas, antes de distribuir la plataforma. No bastará con cambiar el placeholder.

**Prueba de aceptación real:** usar un correo de prueba institucional autorizado, solicitar un código, verificar sesión, completar una respuesta, cerrar sesión y comprobar que otra cuenta no puede leer esos registros. Las pruebas automatizadas de GitHub simulan Supabase para no enviar correos reales ni cargar datos de menores.

## Privacidad y alcance

- El identificador efectivo es el UUID de Supabase Auth, vinculado al correo institucional verificado.
- La API usa únicamente una clave pública publicable, nunca la `service_role`.
- El perfil es formativo, no una decisión académica automática de alto impacto.
- La sesión de autenticación se conserva en almacenamiento local hasta cerrar sesión o expirar. En equipos compartidos, exigir cierre de sesión y prácticas de higiene del navegador.
- La autenticación por correo prueba control del buzón, pero no verifica automáticamente el curso o matrícula. Para limitar el acceso exclusivamente a estudiantes matriculados se necesitará una lista institucional autorizada.
- La migración no importa automáticamente los avances antiguos identificados por códigos `9A-07`; evita atribuciones erróneas entre identidades.
