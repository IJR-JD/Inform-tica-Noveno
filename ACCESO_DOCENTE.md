# Acceso de consulta institucional — Informática 9.º

El correo `juandiego.perez@ijr.edu.co` está registrado en la lista privada de autorizaciones docentes de Supabase.

**No hay contraseña ni código OTP propio del Learning Hub.** Se escribe el correo en la portada y se selecciona la cuenta institucional en Google. El dominio y la identidad se verifican con Supabase Auth; el texto introducido por sí solo no da acceso.

- Learning Hub: https://ijr-jd.github.io/Inform-tica-Noveno/
- Toda la ruta CAD (26 unidades) y las 24 preguntas diagnósticas están visibles para esa cuenta sin realizar las actividades.
- La consulta de expedientes de estudiantes, cuando esté permitida, es solo lectura.
- La autorización docente no permite editar datos de otras cuentas ni administrar globalmente el proyecto.
- No existe todavía una identidad de correo creada manualmente; la cuenta se vincula cuando su propietario entra por primera vez a través del proveedor institucional.

**Requisito de activación:** configurar Google OAuth en Supabase con su Client ID y Client Secret de Google Cloud, así como las URL de redirección. Consultar `AUTH_INSTITUCIONAL_SETUP.md`. Las pruebas automáticas utilizan identidades ficticias; la recepción y el acceso con una cuenta real requieren una prueba institucional.

Los contenidos servidos desde GitHub Pages siguen siendo públicamente descargables como archivos estáticos; la privacidad de las respuestas y el progreso se garantiza mediante autenticación y RLS de Supabase.
