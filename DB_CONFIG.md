# Configuración de la Base de Datos para Coraza System

## Pasos para configurar la base de datos en Neon

1. Inicia sesión en tu cuenta de Neon (https://console.neon.tech/)

2. Crea un nuevo proyecto si aún no lo tienes

3. Ve al SQL Editor en el panel izquierdo

4. Copia y pega el contenido del archivo `create_users_table.sql` en el editor

5. Ejecuta el script para crear la tabla de usuarios

## Configuración de las variables de entorno en Render

Para que tu aplicación se conecte a la base de datos Neon, necesitas configurar las siguientes variables de entorno en Render:

1. Inicia sesión en tu cuenta de Render (https://dashboard.render.com/)

2. Selecciona tu Web Service

3. Ve a la pestaña "Environment"

4. Agrega las siguientes variables:

   - `DATABASE_URL`: La URL de conexión a tu base de datos Neon (obtén esta URL desde el panel de Neon)
   - `FRONTEND_URL`: La URL donde está desplegado tu frontend (por ejemplo, `https://coraza-system.onrender.com`)

5. Haz clic en "Save Changes"

6. Reinicia el servicio para aplicar los cambios

## Estructura de la tabla de usuarios

La tabla `usuarios` tiene la siguiente estructura:

| Columna        | Tipo                    | Descripción                                           |
|----------------|-------------------------|-------------------------------------------------------|
| id             | SERIAL PRIMARY KEY      | Identificador único autoincremental                   |
| nombre         | VARCHAR(100) NOT NULL   | Nombre del usuario                                    |
| apellido       | VARCHAR(100) NOT NULL   | Apellido del usuario                                  |
| cedula         | VARCHAR(20) NOT NULL    | Número de cédula (identificación) del usuario         |
| zona           | INTEGER NOT NULL        | Zona asignada al usuario                              |
| fecha_ingreso  | DATE NOT NULL           | Fecha en que el usuario ingresó al sistema            |
| created_at     | TIMESTAMP WITH TIME ZONE| Fecha y hora de creación del registro                 |
| updated_at     | TIMESTAMP WITH TIME ZONE| Fecha y hora de última actualización del registro     |

## Pruebas

Para verificar que la conexión entre tu aplicación y la base de datos está funcionando correctamente:

1. Añade un nuevo usuario desde la interfaz de usuario
2. Verifica en el SQL Editor de Neon que el usuario se haya guardado en la tabla ejecutando:

```sql
SELECT * FROM usuarios ORDER BY id DESC LIMIT 10;
```

## Solución de problemas

Si encuentras algún problema con la conexión a la base de datos:

1. Verifica que la URL de conexión en la variable `DATABASE_URL` sea correcta
2. Asegúrate de que tu proyecto Neon tenga habilitado el acceso desde Render
3. Comprueba los logs en Render para ver mensajes de error específicos
4. Si persisten los problemas, consulta la documentación de Neon y Render para más ayuda
