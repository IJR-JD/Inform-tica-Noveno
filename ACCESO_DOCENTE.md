# Acceso docente — Informática 9.º · Instituto Jorge Robledo

**Cuenta autorizada para esta plataforma:** `juandiego.perez@ijr.edu.co`.

## Qué se ha creado

Se ha registrado **una autorización de acceso docente en Supabase**, no un buzón institucional nuevo. El correo electrónico debe existir realmente y poder recibir mensajes; Supabase Auth creará la identidad de usuario cuando su propietario complete la verificación OTP por primera vez.

El alta autorizada está en `private.cad9_teacher_allowlist_v1`. La comprobación se realiza en el servidor mediante `public.cad9_teacher_authorized()` y exige simultáneamente: sesión Auth válida, correo del usuario y del JWT concordantes, correo verificado y entrada activa en la lista de docentes. El cliente no puede otorgarse permisos cambiando JavaScript.

## Ingreso

1. Abrir https://ijr-jd.github.io/Inform-tica-Noveno/docente.html .
2. Ingresar `juandiego.perez@ijr.edu.co`.
3. Recibir un código OTP en la cuenta institucional y verificarlo.
4. Consultar el panel docente: resultados de los diagnósticos de las seis competencias, las 24 respuestas, recomendaciones, indicadores globales y registros de las 26 unidades.
5. Utilizar `Volver al Learning Hub` para recorrer todas las unidades y sus evaluaciones sin restricción de avance. El acceso a la página de respuestas estudiantiles permanece limitado a cuentas docentes autorizadas.
6. Cerrar sesión antes de compartir el dispositivo.

## Configuración necesaria de correo

En el proyecto Supabase `rlfxnjbqxbozjdzkbwlz`, la plantilla **Auth → Email Templates → Magic Link** debe enviar un token numérico utilizando la variable `{{ .Token }}`. Si no, el proveedor enviará un enlace y la pantalla actual no podrá verificar un código inexistente. Confirmar también capacidad de envío SMTP y límites de correo.

## Permisos de datos

Las tablas `public.cad9_diagnostic_results_v1` y `public.cad9_course_progress_v1` tienen políticas RLS: cada estudiante conserva su acceso individual, y la identidad docente autorizada obtiene **solo SELECT** sobre los registros de Informática 9.º. El docente no puede editar respuestas de alumnos, alterar sus perfiles ni modificar las evidencias desde el panel.

La lista docente reside en el esquema privado, sin acceso directo desde los roles `anon` o `authenticated`. El punto de autorización es un booleano de lectura que no devuelve los contenidos de la lista. No publicar `service_role` ni secretos en GitHub Pages.

Los archivos de exportación descargados contienen información académica identificable: guardarlos únicamente en equipos y ubicaciones institucionales protegidas, conforme a la política de tratamiento de datos de estudiantes.

**Alcance:** el panel reúne datos de **Informática 9.º**, no de todos los sistemas y tablas del proyecto Supabase. El correo autorizado no implica poderes de administración global sobre la base de datos.

## QA

El flujo de interfaz y la separación de permisos se prueban en GitHub Actions con sesiones OTP simuladas, un estudiante sin permiso y un docente autorizado. Una prueba de correo real requiere controlar una dirección institucional que reciba códigos, lo que no se puede demostrar solo mediante un simulador.
