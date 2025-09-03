const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { require: true }
});

const usuarios = [
  { nombre: 'ALVARO DE JESUS', apellido: 'MUNERA QUINTERO', cedula: '3367406', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2018-06-20' },
  { nombre: 'MEDARDO DE JESUS', apellido: 'PEREZ CANO', cedula: '3434409', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2019-09-01' },
  { nombre: 'HECTOR HUMBERTO', apellido: 'HOLGUIN ARENAS', cedula: '3482728', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2012-02-01' },
  { nombre: 'ARIEL DE JESUS', apellido: 'PARRA RIOS', cedula: '3569016', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2019-05-05' },
  { nombre: 'LUIS CARLOS', apellido: 'QUINTERO', cedula: '3570700', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2012-06-01' },
  { nombre: 'GUSTAVO DE JESUS', apellido: 'PINO CASTAÑO', cedula: '3669363', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2012-01-01' },
  { nombre: 'JOSE HERNANDO', apellido: 'TOLOZA MOGOLLON', cedula: '5632471', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2015-09-24' },
  { nombre: 'RAFAEL ANTONIO', apellido: 'ALVAREZ BERMUDEZ', cedula: '6275085', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2019-04-10' },
  { nombre: 'LEVIS ADAN', apellido: 'DURANGO AGUILAR', cedula: '7379420', zona: 13, cargo: 'VIGILANTE', fechaIngreso: '2013-10-01' },
  { nombre: 'ELBERTO', apellido: 'LOPEZ DIAZ', cedula: '7385248', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2016-01-07' },
  { nombre: 'JESUS', apellido: 'HINCAPIE HIDALGO', cedula: '7537251', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2014-05-03' },
  { nombre: 'ROGELIO ENRIQUE', apellido: 'CAMACHO', cedula: '7958346', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2018-06-29' },
  { nombre: 'FRANCISCO JAVIER', apellido: 'ARANGO CARMONA', cedula: '71748663', zona: 20, cargo: 'GERENTE', fechaIngreso: '2012-03-09' },
  { nombre: 'CARLOS MARIO', apellido: 'USUGA ARIAS', cedula: '8339837', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2012-04-26' },
  { nombre: 'EDINSON', apellido: 'RIVERA MATIAS', cedula: '8373954', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2018-02-02' },
  { nombre: 'ESAU DE JESUS', apellido: 'LOPEZ LORENZANA', cedula: '8405674', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2013-11-29' },
  { nombre: 'HORACIO DE JESUS', apellido: 'VALENCIA MONTOYA', cedula: '8408459', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2017-11-16' },
  { nombre: 'HERNAN', apellido: 'ARIAS TAMAYO', cedula: '71723623', zona: 12, cargo: 'EJECUTIVO SERV CLIENTE', fechaIngreso: '2013-02-06' },
  { nombre: 'ABEL TOBIAS', apellido: 'USUGA LEAL', cedula: '8414593', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2016-05-14' },
  { nombre: 'GABRIEL ELIAS', apellido: 'HOLGUIN QUIROZ', cedula: '8414876', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2016-01-23' },
  { nombre: 'LUIS GUSTAVO', apellido: 'PUERTA VASCO', cedula: '8435129', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2019-12-29' },
  { nombre: 'JORGE ELIECER', apellido: 'TORRES', cedula: '8462739', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2018-09-08' },
  { nombre: 'HILDERS YORLEY', apellido: 'GAVIRIA PEREZ', cedula: '8463537', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2011-12-01' },
  { nombre: 'ALIRIO DE JESUS', apellido: 'AGUDELO GONZALEZ', cedula: '8472629', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2019-09-21' },
  { nombre: 'JUAN GABRIEL', apellido: 'PACHECO SANCHEZ', cedula: '8527099', zona: 9, cargo: 'VIGILANTE', fechaIngreso: '2017-02-24' },
  { nombre: 'EVER HUMBERTO', apellido: 'RIOS CASTAÑEDA', cedula: '9922983', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2020-06-17' },
  { nombre: 'GENIER', apellido: 'VARGAS HERNANDEZ', cedula: '9991166', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2016-04-15' },
  { nombre: 'EDGAR FERNANDO', apellido: 'RAMOS URIBE', cedula: '10169639', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2019-05-22' },
  { nombre: 'JOAQUIN EMILIO', apellido: 'MONTOYA RIOS', cedula: '10201537', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2016-11-23' },
  { nombre: 'JUAN CARLOS', apellido: 'DELGADO MERCADO', cedula: '10884990', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2016-02-02' },
  { nombre: 'OSCAR ANTONIO', apellido: 'GOEZ BENAVIDES', cedula: '10886618', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2017-11-24' },
  { nombre: 'GUSTAVO ALONSO', apellido: 'VELASQUEZ HERNANDEZ', cedula: '10900408', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2012-10-25' },
  { nombre: 'TEODORO', apellido: 'PALACIOS PALACIOS', cedula: '11793045', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2013-04-01' },
  { nombre: 'ELPIDIO', apellido: 'HINESTROZA PALACIOS', cedula: '11794362', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2012-09-08' },
  { nombre: 'POLICARPO', apellido: 'ROMAÑA ALGUMEDO', cedula: '11801545', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2018-10-24' },
  { nombre: 'ROBINSON', apellido: 'GAMBOA ROMAÑA', cedula: '11804878', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2014-08-05' },
  { nombre: 'LEIXER MARTIN', apellido: 'RIVAS MOSQUERA', cedula: '11807740', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2016-08-17' },
  { nombre: 'JUAN PABLO', apellido: 'GARCIA CARMONA', cedula: '11936325', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2017-06-29' },
  { nombre: 'DIDINSON MARIANO', apellido: 'MORENO MORENO', cedula: '11937772', zona: 13, cargo: 'VIGILANTE', fechaIngreso: '2019-03-22' },
  { nombre: 'JULIO HERNAN', apellido: 'VELEZ BUSTAMANTE', cedula: '11955339', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2014-04-26' },
  { nombre: 'MARLIO', apellido: 'AVILES PATIÑO', cedula: '12124967', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2016-09-15' },
  { nombre: 'LINO ALBERTO', apellido: 'LAZALA PATERNINA', cedula: '12625299', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2017-12-30' },
  { nombre: 'MILTON', apellido: 'SANCHEZ GIRALDO', cedula: '12970483', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2018-04-06' },
  { nombre: 'GUILLERMO', apellido: 'ROMERO LOPEZ', cedula: '12973985', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2012-10-03' },
  { nombre: 'CRISTOBAL ANTONIO', apellido: 'RAMOS MORA', cedula: '14572160', zona: 18, cargo: 'SUPERVISOR', fechaIngreso: '2012-02-25' },
  { nombre: 'JHON JAIRO', apellido: 'MARIN MARIN', cedula: '15259158', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2014-09-06' },
  { nombre: 'JUAN GUILLERMO', apellido: 'ZAPATA CASTILLO', cedula: '15295271', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2017-06-22' },
  { nombre: 'GILDARDO DE JESUS', apellido: 'MAZZO VILLERO', cedula: '15305525', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2014-06-10' },
  { nombre: 'NICOLAS EMIRO', apellido: 'GALVIS CASTRO', cedula: '15309929', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2017-08-25' },
  { nombre: 'FREDY LEONARDO', apellido: 'GOMEZ RAMIREZ', cedula: '15337800', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2014-05-06' },
  { nombre: 'MARCO TULIO', apellido: 'GALLEGO RIOS', cedula: '15346722', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2012-05-01' },
  { nombre: 'SERGIO ANDRES', apellido: 'CARO CANO', cedula: '15370207', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2018-07-30' },
  { nombre: 'LUIS GUILLERMO', apellido: 'MURILLO ECHEVERRY', cedula: '15378989', zona: 13, cargo: 'VIGILANTE', fechaIngreso: '2021-01-04' },
  { nombre: 'RAUL', apellido: 'OROZCO DUQUE', cedula: '15403728', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2012-09-18' },
  { nombre: 'MANUEL ORLANDO', apellido: 'MORENO GALLEGO', cedula: '15433339', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2014-04-21' },
  { nombre: 'JOSE RAUL', apellido: 'HENAO MARIN', cedula: '15435083', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2020-02-15' }
];

async function insertarUsuariosMasivo() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando inserción masiva de usuarios...');
    console.log(`📊 Total de usuarios a insertar: ${usuarios.length}`);
    
    // Iniciar transacción
    await client.query('BEGIN');
    
    let insertados = 0;
    let errores = 0;
    
    for (const usuario of usuarios) {
      try {
        // Verificar si el usuario ya existe
        const existeUsuario = await client.query(
          'SELECT id FROM users WHERE cedula = $1',
          [usuario.cedula]
        );
        
        if (existeUsuario.rows.length > 0) {
          console.log(`⚠️  Usuario con cédula ${usuario.cedula} ya existe, saltando...`);
          continue;
        }
        
        // Insertar usuario
        const result = await client.query(
          'INSERT INTO users (nombre, apellido, cedula, zona, fecha_ingreso, cargo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [usuario.nombre, usuario.apellido, usuario.cedula, usuario.zona, usuario.fechaIngreso, usuario.cargo]
        );
        
        console.log(`✅ Usuario insertado: ${usuario.nombre} ${usuario.apellido} (ID: ${result.rows[0].id})`);
        insertados++;
        
      } catch (error) {
        console.error(`❌ Error insertando ${usuario.nombre} ${usuario.apellido}:`, error.message);
        errores++;
      }
    }
    
    // Confirmar transacción
    await client.query('COMMIT');
    
    console.log('\n📋 RESUMEN:');
    console.log(`✅ Usuarios insertados exitosamente: ${insertados}`);
    console.log(`❌ Errores durante inserción: ${errores}`);
    console.log(`📊 Total procesados: ${insertados + errores}`);
    
    // Mostrar conteo actual de usuarios
    const totalUsuarios = await client.query('SELECT COUNT(*) FROM users');
    console.log(`📈 Total de usuarios en la base de datos: ${totalUsuarios.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('💥 Error durante la inserción masiva:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

insertarUsuariosMasivo();
