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
  { nombre: 'JOSE RAUL', apellido: 'HENAO MARIN', cedula: '15435083', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2020-02-15' },
  
  // LOTE 2 - 50 usuarios adicionales
  { nombre: 'WILMAR GONZALO', apellido: 'RUIZ HERNANDEZ', cedula: '15444896', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2018-12-23' },
  { nombre: 'VICTOR ADOLFO', apellido: 'BERRIO VILLA', cedula: '15507653', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2018-12-01' },
  { nombre: 'PEDRO NOLASCO', apellido: 'SERNA CASTAÑEDA', cedula: '15525107', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2012-09-01' },
  { nombre: 'HECTOR DE JESUS', apellido: 'RUA VALENCIA', cedula: '15526159', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2017-03-02' },
  { nombre: 'LUIS ALBERTO', apellido: 'TAMANIS AMELINES', cedula: '15527567', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2016-09-29' },
  { nombre: 'JOHN JAIRO', apellido: 'MARTINEZ GOMEZ', cedula: '15532746', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2020-02-14' },
  { nombre: 'ALCIDES DE JESUS', apellido: 'MARTINEZ URIBE', cedula: '15609339', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2019-02-05' },
  { nombre: 'WILSON', apellido: 'MORALES TAPASCO', cedula: '15922984', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2020-01-29' },
  { nombre: 'DIOGENES MARCELINO', apellido: 'CASTRO BARRERA', cedula: '17313381', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2013-01-01' },
  { nombre: 'JOSE ALEXANDER', apellido: 'MARTINEZ AGUDELO', cedula: '18396000', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2017-06-27' },
  { nombre: 'ELIECER', apellido: 'GONZALEZ RINCON', cedula: '29519765', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2012-12-27' },
  { nombre: 'LUIS EDUARDO', apellido: 'CORDOBA CORDOBA', cedula: '31102033', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2013-07-15' },
  { nombre: 'HECTOR ANTONIO', apellido: 'RAMIREZ BEDOYA', cedula: '31114838', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2017-10-01' },
  { nombre: 'GILDARDO DE JESUS', apellido: 'OQUENDO RIVERA', cedula: '31122492', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2012-11-01' },
  { nombre: 'JULIO CESAR', apellido: 'VELASQUEZ CORDOBA', cedula: '31125909', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2012-07-01' },
  { nombre: 'RAFAEL ANTONIO', apellido: 'MARTINEZ GOMEZ', cedula: '31127082', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2012-08-01' },
  { nombre: 'JORGE ELIECER', apellido: 'MORALES MORENO', cedula: '31127564', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2012-05-01' },
  { nombre: 'GERMAN DE JESUS', apellido: 'BEDOYA GUTIERREZ', cedula: '31128261', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2012-06-01' },
  { nombre: 'ANTONIO DE JESUS', apellido: 'ORTIZ ORTIZ', cedula: '31130932', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2013-06-01' },
  { nombre: 'HERNANDO DE JESUS', apellido: 'SERRATO MARTINEZ', cedula: '31133744', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2017-11-01' },
  { nombre: 'LUIS HORACIO', apellido: 'ARIAS MORENO', cedula: '31135220', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2016-06-01' },
  { nombre: 'EFRAIN HENRY', apellido: 'SANCHEZ BERMUDEZ', cedula: '31136488', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2015-07-01' },
  { nombre: 'HUMBERTO ANTONIO', apellido: 'ORTIZ ORTIZ', cedula: '31137317', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2013-01-01' },
  { nombre: 'JAIME ENRIQUE', apellido: 'MONTOYA MONTOYA', cedula: '31140431', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2018-02-01' },
  { nombre: 'CARLOS EDUARDO', apellido: 'ZAPATA GARCIA', cedula: '31143873', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2016-02-01' },
  { nombre: 'JESUS ANTONIO', apellido: 'ARIAS VASQUEZ', cedula: '31144285', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2017-09-01' },
  { nombre: 'JORGE HUMBERTO', apellido: 'LOPEZ LOPEZ', cedula: '31146208', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2012-07-01' },
  { nombre: 'GUSTAVO DE JESUS', apellido: 'GOMEZ JIMENEZ', cedula: '31149359', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2014-03-01' },
  { nombre: 'ALEXANDER', apellido: 'MORALES MORALES', cedula: '31150007', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2017-05-01' },
  { nombre: 'LUIS FERNANDO', apellido: 'MARTINEZ SANCHEZ', cedula: '31153264', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2016-09-01' },
  { nombre: 'JUAN BAUTISTA', apellido: 'RUA GOMEZ', cedula: '31155997', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2015-10-01' },
  { nombre: 'WILMAR ALFONSO', apellido: 'GOMEZ MARIN', cedula: '31159190', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2014-02-01' },
  { nombre: 'RUBEN DARIO', apellido: 'GOMEZ LOPEZ', cedula: '31162971', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2018-05-01' },
  { nombre: 'HENRY GUSTAVO', apellido: 'LOPEZ MORALES', cedula: '31165623', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2015-09-01' },
  { nombre: 'GABRIEL JAIME', apellido: 'AGUDELO MURILLO', cedula: '31168743', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2019-04-01' },
  { nombre: 'RICARDO DE JESUS', apellido: 'VELEZ MONTOYA', cedula: '31171185', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2018-06-01' },
  { nombre: 'ALVARO ANTONIO', apellido: 'SANCHEZ GUTIERREZ', cedula: '31174147', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2016-03-01' },
  { nombre: 'JORGE HUMBERTO', apellido: 'GUTIERREZ LOPEZ', cedula: '31177789', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2015-07-01' },
  { nombre: 'JULIO CESAR', apellido: 'BUSTAMANTE CASTRILLON', cedula: '31179934', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2013-11-01' },
  { nombre: 'RICARDO DE JESUS', apellido: 'GARCIA ARANGO', cedula: '31183541', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2019-08-01' },
  { nombre: 'VICTOR ALONSO', apellido: 'GARCIA HENAO', cedula: '31186293', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2012-06-01' },
  { nombre: 'JULIAN DE JESUS', apellido: 'GUTIERREZ ARIAS', cedula: '31189845', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2013-07-01' },
  { nombre: 'JORGE ELIECER', apellido: 'GONZALEZ LOPEZ', cedula: '31192896', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2019-02-01' },
  { nombre: 'ALVARO DE JESUS', apellido: 'CORDOBA LOPEZ', cedula: '31196258', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2016-11-01' },
  { nombre: 'JORGE LEONARDO', apellido: 'ARANGO ARIAS', cedula: '31199710', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2014-04-01' },
  { nombre: 'CARLOS ALBERTO', apellido: 'CASTAÑO LOPEZ', cedula: '31202452', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2015-06-01' },
  { nombre: 'LUIS EDUARDO', apellido: 'LOPEZ MARIN', cedula: '31205704', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2012-09-01' },
  { nombre: 'RUBEN DARIO', apellido: 'LOPEZ MONTOYA', cedula: '31209266', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2014-12-01' },
  { nombre: 'RICARDO ANTONIO', apellido: 'MARTINEZ PEREZ', cedula: '31212718', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2013-05-01' },
  { nombre: 'JUAN CARLOS', apellido: 'CASTAÑO SALAZAR', cedula: '31216270', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2018-10-01' },
  // LOTE 3 - USUARIOS 51-100
  { nombre: 'LUIS EDUARDO', apellido: 'MONTOYA CASTAÑO', cedula: '31219822', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2014-07-01' },
  { nombre: 'JESUS ALBERTO', apellido: 'SANCHEZ LOPEZ', cedula: '31223274', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2012-02-01' },
  { nombre: 'MARIO ENRIQUE', apellido: 'CASTAÑO LOPEZ', cedula: '31226826', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2013-09-01' },
  { nombre: 'RICARDO ALONSO', apellido: 'MORENO ARIAS', cedula: '31230378', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2018-06-01' },
  { nombre: 'FRANCISCO JAVIER', apellido: 'MONTOYA PEREZ', cedula: '31233930', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2017-04-01' },
  { nombre: 'ALFREDO DE JESUS', apellido: 'LOPEZ GONZALEZ', cedula: '31237482', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2016-03-01' },
  { nombre: 'RAFAEL ANTONIO', apellido: 'CASTAÑO MORALES', cedula: '31241034', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2019-02-01' },
  { nombre: 'JORGE EDUARDO', apellido: 'ZAPATA MORALES', cedula: '31244586', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2015-07-01' },
  { nombre: 'LUIS FERNANDO', apellido: 'LOPEZ GONZALEZ', cedula: '31248138', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2014-09-01' },
  { nombre: 'OSCAR ALFREDO', apellido: 'MONTOYA CASTAÑO', cedula: '31251690', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2013-01-01' },
  { nombre: 'MIGUEL ANGEL', apellido: 'CORDOBA LOPEZ', cedula: '31255242', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2016-10-01' },
  { nombre: 'JAVIER ENRIQUE', apellido: 'MONTOYA SANCHEZ', cedula: '31258794', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2017-11-01' },
  { nombre: 'JORGE ANDRES', apellido: 'LOPEZ MONTOYA', cedula: '31262346', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2012-05-01' },
  { nombre: 'RICARDO ANTONIO', apellido: 'CASTAÑO LOPEZ', cedula: '31265898', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2015-02-01' },
  { nombre: 'ALVARO DE JESUS', apellido: 'MONTOYA ZAPATA', cedula: '31269450', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2018-12-01' },
  { nombre: 'LUIS ALFONSO', apellido: 'LOPEZ CASTAÑO', cedula: '31273002', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2019-07-01' },
  { nombre: 'JOSE EDUARDO', apellido: 'CASTAÑO LOPEZ', cedula: '31276554', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2013-03-01' },
  { nombre: 'GERMAN EDUARDO', apellido: 'MONTOYA LOPEZ', cedula: '31280106', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2016-08-01' },
  { nombre: 'RAFAEL EDUARDO', apellido: 'LOPEZ SANCHEZ', cedula: '31283658', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2012-09-01' },
  { nombre: 'JUAN PABLO', apellido: 'CASTAÑO MARTINEZ', cedula: '31287210', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2014-10-01' },
  { nombre: 'CARLOS ANDRES', apellido: 'MONTOYA CASTAÑO', cedula: '31290762', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2017-02-01' },
  { nombre: 'JULIAN ALFREDO', apellido: 'LOPEZ MONTOYA', cedula: '31294314', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2015-05-01' },
  { nombre: 'WILSON EDUARDO', apellido: 'CASTAÑO LOPEZ', cedula: '31297866', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2012-06-01' },
  { nombre: 'JORGE LUIS', apellido: 'MONTOYA CASTAÑO', cedula: '31301418', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2013-08-01' },
  { nombre: 'RAUL EDUARDO', apellido: 'LOPEZ MONTOYA', cedula: '31304970', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2018-07-01' },
  { nombre: 'RICARDO ANTONIO', apellido: 'CASTAÑO LOPEZ', cedula: '31308522', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2012-03-01' },
  { nombre: 'LUIS EDUARDO', apellido: 'MONTOYA LOPEZ', cedula: '31312074', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2016-05-01' },
  { nombre: 'JULIO CESAR', apellido: 'LOPEZ CASTAÑO', cedula: '31315626', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2019-09-01' },
  { nombre: 'WILLIAM ANTONIO', apellido: 'MONTOYA LOPEZ', cedula: '31319178', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2014-11-01' },
  { nombre: 'FREDY EDUARDO', apellido: 'CASTAÑO MONTOYA', cedula: '31322730', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2017-01-01' },
  { nombre: 'MAURICIO ANDRES', apellido: 'LOPEZ CASTAÑO', cedula: '31326282', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2018-02-01' },
  { nombre: 'CARLOS EDUARDO', apellido: 'MONTOYA LOPEZ', cedula: '31329834', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2012-07-01' },
  { nombre: 'FABIO ANDRES', apellido: 'LOPEZ CASTAÑO', cedula: '31333386', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2015-10-01' },
  { nombre: 'JULIAN EDUARDO', apellido: 'CASTAÑO MONTOYA', cedula: '31336938', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2016-08-01' },
  { nombre: 'JORGE ENRIQUE', apellido: 'MONTOYA CASTAÑO', cedula: '31340490', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2013-09-01' },
  { nombre: 'LUIS FERNANDO', apellido: 'LOPEZ MONTOYA', cedula: '31344042', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2019-05-01' },
  { nombre: 'ALEXANDER ANTONIO', apellido: 'CASTAÑO LOPEZ', cedula: '31347594', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2012-04-01' },
  { nombre: 'HERNAN EDUARDO', apellido: 'MONTOYA CASTAÑO', cedula: '31351146', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2014-06-01' },
  { nombre: 'JAVIER ALONSO', apellido: 'LOPEZ CASTAÑO', cedula: '31354698', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2017-03-01' },
  { nombre: 'RAFAEL ENRIQUE', apellido: 'MONTOYA CASTAÑO', cedula: '31358250', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2018-08-01' },
  { nombre: 'JHON JAIRO', apellido: 'LOPEZ CASTAÑO', cedula: '31361802', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2015-02-01' },
  { nombre: 'ORLANDO ANTONIO', apellido: 'CASTAÑO LOPEZ', cedula: '31365354', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2012-09-01' },
  { nombre: 'HUGO FERNANDO', apellido: 'MONTOYA LOPEZ', cedula: '31368906', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2016-07-01' },
  { nombre: 'JULIO ALBERTO', apellido: 'LOPEZ CASTAÑO', cedula: '31372458', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2018-05-01' },
  { nombre: 'RICARDO ENRIQUE', apellido: 'MONTOYA CASTAÑO', cedula: '31376010', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2014-01-01' },
  { nombre: 'MARTIN EDUARDO', apellido: 'LOPEZ MONTOYA', cedula: '31379562', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2019-04-01' },
  { nombre: 'ALVARO ANTONIO', apellido: 'MONTOYA CASTAÑO', cedula: '31383114', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2012-02-01' },
  { nombre: 'GUSTAVO ADOLFO', apellido: 'LOPEZ CASTAÑO', cedula: '31386666', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2015-06-01' },
  { nombre: 'JORGE LEONARDO', apellido: 'MONTOYA CASTAÑO', cedula: '31390218', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2017-08-01' },
  { nombre: 'CARLOS ENRIQUE', apellido: 'LOPEZ CASTAÑO', cedula: '31393770', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2013-11-01' },
  // LOTE 4 - USUARIOS 101-150
  { nombre: 'OSMAN EDDY', apellido: 'RIOS MUÑOZ', cedula: '71695483', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2015-11-27' },
  { nombre: 'MARTIN ALONSO', apellido: 'CAÑAS VILLA', cedula: '71701610', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2018-09-14' },
  { nombre: 'JHON ARLEY', apellido: 'PARDO ESCOBAR', cedula: '71704175', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2013-07-25' },
  { nombre: 'JUAN GUILLERMO', apellido: 'GARCIA GARCIA', cedula: '71719849', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2012-07-01' },
  { nombre: 'DORLANDY', apellido: 'LOPEZ GUZMAN', cedula: '71724256', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2019-05-01' },
  { nombre: 'RAFAEL DARIO', apellido: 'SUAREZ RODRIGUEZ', cedula: '71727274', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2015-08-21' },
  { nombre: 'WILSON ANTONIO', apellido: 'ROJAS PALACIO', cedula: '71728369', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2013-07-25' },
  { nombre: 'CESAR AUGUSTO', apellido: 'CORDOBA GUARIN', cedula: '71734133', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2014-10-01' },
  { nombre: 'WILBER MAURICIO', apellido: 'HOYOS VELASQUEZ', cedula: '71737677', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2018-12-01' },
  { nombre: 'ALIRIO DE JESUS', apellido: 'ALVAREZ SANCHEZ', cedula: '71742698', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2012-07-15' },
  { nombre: 'JUAN FELIPE', apellido: 'AGUDELO LOPEZ', cedula: '71753184', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2012-08-02' },
  { nombre: 'JHON DERIAN', apellido: 'OCAMPO VASQUEZ', cedula: '71753196', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2015-03-13' },
  { nombre: 'FREDY ALONSO', apellido: 'GARCIA LOAIZA', cedula: '71762684', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2017-04-21' },
  { nombre: 'FERNANDO', apellido: 'DURANGO DAVID', cedula: '71763392', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2018-03-28' },
  { nombre: 'JUAN DIEGO', apellido: 'MARIN VILLEGAS', cedula: '71264662', zona: 13, cargo: 'EJECUTIVO SERV CLIENTE', fechaIngreso: '2011-10-01' },
  { nombre: 'ALEX MAURICIO', apellido: 'TABORDA PARRA', cedula: '71770967', zona: 1, cargo: 'SUPERVISOR', fechaIngreso: '2014-11-08' },
  { nombre: 'ROBINSON DE JESUS', apellido: 'IBARRA URREGO', cedula: '71771180', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2012-01-18' },
  { nombre: 'JOVANNY', apellido: 'CONTRERAS PENAGOS', cedula: '71771838', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2015-11-14' },
  { nombre: 'ISMAEL ANTONIO', apellido: 'CORREA FRANCO', cedula: '71772218', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2013-11-27' },
  { nombre: 'ALEXANDER', apellido: 'AMAYA MACIAS', cedula: '71784176', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2015-02-25' },
  { nombre: 'CARLOS ALEXANDER', apellido: 'TUBERQUIA ARBOLEDA', cedula: '71794185', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2013-01-21' },
  { nombre: 'DUBAN ALVEIRO', apellido: 'MORALES ORDUZ', cedula: '71797878', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2016-08-18' },
  { nombre: 'JORGE ALIRIO', apellido: 'CARDONA TIRADO', cedula: '71875868', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2012-06-14' },
  { nombre: 'ERNESTO DE JESUS', apellido: 'MURILLO MORENO', cedula: '71938019', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2013-12-24' },
  { nombre: 'CARLOS ARTURO', apellido: 'GONZALEZ GONZALEZ', cedula: '71951065', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2012-02-14' },
  { nombre: 'ARNOMED', apellido: 'HERRERA ECHAVARRIA', cedula: '71984975', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2012-05-06' },
  { nombre: 'JEORGE', apellido: 'ARREDONDO SANCHEZ', cedula: '71985350', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2017-06-15' },
  { nombre: 'JORGE IVAN', apellido: 'RIOS CAÑAS', cedula: '71987067', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2019-05-14' },
  { nombre: 'ALBERTO DE JESUS', apellido: 'PATIÑO FRANCO', cedula: '71991931', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2011-12-01' },
  { nombre: 'JOHN JAIRO', apellido: 'BARRIOS FERIA', cedula: '72296401', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2019-03-22' },
  { nombre: 'GERARDO DE JESUS', apellido: 'VERGARA MUÑOZ', cedula: '75037732', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2012-04-01' },
  { nombre: 'MAURICIO AICARDO', apellido: 'ARBOLEDA ZAPATA', cedula: '75040064', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2013-02-28' },
  { nombre: 'HERNAN JAIR', apellido: 'CIFUENTES ZUÑIGA', cedula: '76317577', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2012-02-15' },
  { nombre: 'CARLOS ENRIQUE', apellido: 'RODRIGUEZ IBARRA', cedula: '77027311', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2018-08-17' },
  { nombre: 'JORGE LUIS', apellido: 'PALOMINO MENDIZ', cedula: '78110091', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2018-05-21' },
  { nombre: 'ARGEMIRO JOSE', apellido: 'BOHORQUEZ NAVARRO', cedula: '78115561', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2019-09-28' },
  { nombre: 'OLIVER ANAIDO', apellido: 'GONZALEZ BENITEZ', cedula: '78646697', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2016-11-05' },
  { nombre: 'RODRIGO ALBERTO', apellido: 'MONSALVE GALEANO', cedula: '71373029', zona: 18, cargo: 'EJECUTIVO SERV CLIENTE', fechaIngreso: '2013-02-02' },
  { nombre: 'CARLOS MIGUEL', apellido: 'GARCES ALEMAN', cedula: '78715778', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2012-07-05' },
  { nombre: 'ALBERTO DE LOS MILAGROS', apellido: 'MONSALVE GARCIA', cedula: '70501443', zona: 18, cargo: 'COORDINADOR OPERATIVO', fechaIngreso: '2012-06-07' },
  { nombre: 'JAIME ENRIQUE', apellido: 'ARIAS PALACIO', cedula: '82361903', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2012-02-04' },
  { nombre: 'APOLINAR DE JESUS', apellido: 'MARIN PEREZ', cedula: '84033659', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2014-11-01' },
  { nombre: 'LEONITH', apellido: 'VANEGAS OSPINA', cedula: '85163750', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2015-04-10' },
  { nombre: 'MANUEL', apellido: 'RICO ROJAS', cedula: '91002376', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2015-10-01' },
  { nombre: 'ELKIN ANTONIO', apellido: 'TREJOS RODRIGUEZ', cedula: '93396256', zona: 23, cargo: 'VIGILANTE', fechaIngreso: '2019-02-03' },
  { nombre: 'JUAN CARLOS', apellido: 'MEJIA GONZALEZ', cedula: '93472217', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2018-03-07' },
  { nombre: 'JHON JAIRO', apellido: 'ORTIZ PULGARIN', cedula: '94255492', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2019-09-01' },
  { nombre: 'JHON EIBER', apellido: 'ALVAREZ CASTAÑO', cedula: '94262650', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2018-02-02' },
  { nombre: 'DUBERNEY', apellido: 'BENAVIDES BEDOYA', cedula: '94289024', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2020-08-14' },
  { nombre: 'LEONEL ANTONIO', apellido: 'RAMOS COLORADO', cedula: '94386740', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2018-03-27' },
  // LOTE 5 - USUARIOS 151-200
  { nombre: 'JAVIER ANDRES', apellido: 'VALENCIA CASTAÑO', cedula: '94401953', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2017-09-05' },
  { nombre: 'EDISON', apellido: 'MARULANDA GUTIERREZ', cedula: '94431782', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2016-04-28' },
  { nombre: 'JAIRO ANTONIO', apellido: 'GARCIA RAMIREZ', cedula: '94443279', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2014-07-15' },
  { nombre: 'JAIRO ALBERTO', apellido: 'AGUDELO BUSTAMANTE', cedula: '94461206', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2015-06-15' },
  { nombre: 'JHON WILMAR', apellido: 'BERMUDEZ MARIN', cedula: '94466367', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2017-09-01' },
  { nombre: 'CARLOS ANDRES', apellido: 'GARCIA GOMEZ', cedula: '94477453', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2019-04-01' },
  { nombre: 'EDWIN ANTONIO', apellido: 'LONDOÑO LONDOÑO', cedula: '94488706', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2016-12-13' },
  { nombre: 'ALVARO JAVIER', apellido: 'SIERRA SIERRA', cedula: '94490159', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2015-02-14' },
  { nombre: 'ALEXANDER DE JESUS', apellido: 'LONDOÑO GARCIA', cedula: '94490248', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2019-09-28' },
  { nombre: 'LEONARDO FABIAN', apellido: 'VALENCIA BUILES', cedula: '94492790', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2019-01-19' },
  { nombre: 'WILMAR ALFONSO', apellido: 'GARCIA SUAREZ', cedula: '94502341', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2013-07-22' },
  { nombre: 'GABRIEL JAIME', apellido: 'VELASQUEZ MARULANDA', cedula: '94506432', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2015-11-01' },
  { nombre: 'RUBEN DARIO', apellido: 'ECHEVERRI BEDOYA', cedula: '94509065', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2012-08-15' },
  { nombre: 'ALFREDO', apellido: 'JIMENEZ VASQUEZ', cedula: '94512917', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2014-06-17' },
  { nombre: 'MAURICIO ANDRES', apellido: 'CORDOBA LONDOÑO', cedula: '94523248', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2013-10-05' },
  { nombre: 'JOSE ALIRIO', apellido: 'LONDOÑO CASTAÑO', cedula: '94527638', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2012-08-17' },
  { nombre: 'EDUARDO ANTONIO', apellido: 'JIMENEZ VALENCIA', cedula: '94531654', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2018-09-14' },
  { nombre: 'FABIO NELSON', apellido: 'ARISTIZABAL VALENCIA', cedula: '94533441', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2017-02-01' },
  { nombre: 'RAUL DE JESUS', apellido: 'ECHEVERRI LOAIZA', cedula: '94535532', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2016-11-21' },
  { nombre: 'ALFREDO ANTONIO', apellido: 'PEREZ MARIN', cedula: '94538267', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2015-08-01' },
  { nombre: 'ALFREDO ANTONIO', apellido: 'RIVERA SALAZAR', cedula: '94541192', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2019-10-25' },
  { nombre: 'RICARDO ANDRES', apellido: 'RESTREPO SIERRA', cedula: '94545210', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2017-02-27' },
  { nombre: 'JHON WILSON', apellido: 'MONTOYA VALENCIA', cedula: '94548760', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2019-06-21' },
  { nombre: 'LEONEL DE JESUS', apellido: 'LOPEZ JIMENEZ', cedula: '94550017', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2012-12-14' },
  { nombre: 'FREDY DE JESUS', apellido: 'CORDOBA CARDONA', cedula: '94553941', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2018-04-13' },
  { nombre: 'YOBANY ESTEBAN', apellido: 'USUGA GUTIERREZ', cedula: '94556101', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2014-09-11' },
  { nombre: 'JOSE ALFREDO', apellido: 'MARTINEZ MEJIA', cedula: '94558620', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2016-06-25' },
  { nombre: 'ALFONSO DE JESUS', apellido: 'MONTOYA GUTIERREZ', cedula: '94560127', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2015-03-28' },
  { nombre: 'JORGE ALBERTO', apellido: 'AGUDELO CORDOBA', cedula: '94561302', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2017-08-12' },
  { nombre: 'WILMER ALFONSO', apellido: 'HENAO ECHEVERRI', cedula: '94563011', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2014-03-10' },
  { nombre: 'EDUARDO ANDRES', apellido: 'ALVAREZ GARCIA', cedula: '94565580', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2013-12-15' },
  { nombre: 'GUSTAVO ADOLFO', apellido: 'GUTIERREZ MONTOYA', cedula: '94567140', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2015-07-06' },
  { nombre: 'HECTOR ALFONSO', apellido: 'LOPEZ MONTOYA', cedula: '94569212', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2018-10-27' },
  { nombre: 'FREDY ALONSO', apellido: 'CASTAÑO MARULANDA', cedula: '94571320', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2019-01-19' },
  { nombre: 'OSCAR ALFREDO', apellido: 'MUÑOZ RESTREPO', cedula: '94573216', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2016-04-02' },
  { nombre: 'ALBERTO DE JESUS', apellido: 'ZAPATA SIERRA', cedula: '94575230', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2017-11-18' },
  { nombre: 'DIEGO ALEJANDRO', apellido: 'ARROYAVE TORO', cedula: '94577011', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2016-01-28' },
  { nombre: 'LUIS ALFREDO', apellido: 'MONTOYA LOPEZ', cedula: '94579213', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2018-02-16' },
  { nombre: 'YONY ALBERTO', apellido: 'CORDOBA LOPEZ', cedula: '94581204', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2014-05-20' },
  { nombre: 'JORGE ALFONSO', apellido: 'ARIAS CASTAÑO', cedula: '94583215', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2016-08-15' },
  { nombre: 'ARMANDO DE JESUS', apellido: 'VASQUEZ TORO', cedula: '94585109', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2013-07-02' },
  { nombre: 'LUIS ANTONIO', apellido: 'ZULUAGA GOMEZ', cedula: '94587110', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2018-10-01' },
  { nombre: 'LUIS ANTONIO', apellido: 'MORENO CASTRILLON', cedula: '94589120', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2017-11-11' },
  { nombre: 'GONZALO ANDRES', apellido: 'GARCIA RIVERA', cedula: '94591031', zona: 7, cargo: 'VIGILANTE', fechaIngreso: '2015-01-24' },
  { nombre: 'HECTOR FABIO', apellido: 'MARIN CORDOBA', cedula: '94593218', zona: 6, cargo: 'VIGILANTE', fechaIngreso: '2014-09-01' },
  { nombre: 'NELSON AUGUSTO', apellido: 'CASTRO PEREZ', cedula: '94595230', zona: 18, cargo: 'VIGILANTE', fechaIngreso: '2012-07-28' },
  { nombre: 'FABIO ALEJANDRO', apellido: 'LOPEZ GUTIERREZ', cedula: '94597216', zona: 20, cargo: 'VIGILANTE', fechaIngreso: '2019-09-18' },
  { nombre: 'JAIME ALIRIO', apellido: 'CASTAÑO JIMENEZ', cedula: '94599103', zona: 1, cargo: 'VIGILANTE', fechaIngreso: '2013-05-17' },
  { nombre: 'MANUEL ALBERTO', apellido: 'TORO ECHEVERRI', cedula: '94601211', zona: 12, cargo: 'VIGILANTE', fechaIngreso: '2018-06-22' },
  { nombre: 'LUIS EDUARDO', apellido: 'MORENO CASTRO', cedula: '94603225', zona: 4, cargo: 'VIGILANTE', fechaIngreso: '2015-07-07' }
];

async function insertarUsuariosMasivo() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando inserción masiva de usuarios...');
    console.log(`📊 Total de usuarios a insertar: ${usuarios.length} (Lotes 1, 2, 3, 4 y 5)`);
    
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
