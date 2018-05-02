/**
 * basedatos.js:
 * ----------
 *    Inicio de base de datos SQLite. 
 * 
 * Andres J. Guzman M.
 * Universidad Simon Bolivar, 2017.
 */

var fs = require("fs");
var file = "comunal.db";
var exists = fs.existsSync(file); // Vemos si no existe para crearla
var sqlite3 = require('sqlite3').verbose();


// Funcion inicia la base de datos
function iniciar() {
    if (!exists) {
        console.log("Creating DB file."); // Se crea si no existe
        fs.openSync(file, "w");
    }
    var db = new sqlite3.Database(file);

    db.serialize(function() {
        if (!exists) {
            // Se crean tablas
            db.run("CREATE TABLE IF NOT EXISTS Usuarios " +
                "(_id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, " +
                "user TEXT UNIQUE NOT NULL, password TEXT NOT NULL)");
            db.run("CREATE TABLE Jefes (Nombres TEXT NOT NULL, Apellidos TEXT NOT NULL, Ci INTEGER UNIQUE " +
                "NOT NULL, Ci_Nac CHAR CHECK (Ci_nac = 'V' OR Ci_nac = 'E') NOT NULL, Sexo CHAR NOT NULL " +
                "CHECK (Sexo = 'M' OR Sexo = 'F'), Estado_civil TEXT CHECK (Estado_civil = 'soltero(a)' OR " +
                "Estado_civil = 'casado(a)' OR Estado_civil = 'divorciado(a)' OR Estado_civil = 'viudo(a)' OR " +
                "Estado_civil = 'concubino(a)'), Edad INTEGER, Fecha_nac TEXT, Telefono_Hab TEXT, Telefono_Cel " +
                "TEXT, Telefono_Ofic TEXT, Email TEXT, Direccion TEXT, Edificio TEXT, Tenencia_vivienda TEXT CHECK " +
                "(Tenencia_vivienda = 'Propia' OR Tenencia_vivienda = 'Alquilada' OR Tenencia_vivienda = 'Traspaso' " +
                "OR Tenencia_vivienda = 'Invadida' OR Tenencia_vivienda = 'Pagándose' OR Tenencia_vivienda = 'Otra'), " +
                "Tiempo_comunidad TEXT, " +
                "Instruccion TEXT CHECK (Instruccion = 'Basica' OR Instruccion = 'Bachiller' OR Instruccion = " +
                "'Tecnico Medio' OR Instruccion = 'Tecnico Superior' OR Instruccion = 'Universitario' OR " +
                "Instruccion = 'Post Grado' OR Instruccion = 'Sin Instrucción'), Profesion TEXT, Dedicacion " +
                "TEXT, Trabajando_actual BOOLEAN, Embarazo_temp BOOLEAN, CNE BOOLEAN, Pensionado BOOLEAN, " +
                "Pension_institucion TEXT, Discapacitado BOOLEAN, Tipo_discapacidad TEXT, Ingreso_mensual " +
                "INTEGER, Clasificacion_ingreso TEXT CHECK (Clasificacion_ingreso = 'Diario' OR " +
                "Clasificacion_ingreso = 'Semanal' OR Clasificacion_ingreso = 'Quincenal' OR " +
                "Clasificacion_ingreso = 'Mensual' OR Clasificacion_ingreso = 'Por trabajo realizado'), " +
                "PRIMARY KEY (Ci));");
            db.run("CREATE TABLE IF NOT EXISTS Familiares (Nombre TEXT NOT NULL, Sexo CHAR NOT NULL CHECK" +
                "(Sexo = 'M' OR Sexo = 'F'), Ci INTEGER, Fecha_nac TEXT, Edad INTEGER, " +
                "Discapacitado BOOLEAN, Discapacidad TEXT, Parentesco TEXT, Instruccion TEXT, " +
                "Embarazo_temp BOOLEAN, CNE BOOLEAN, Profesion TEXT, Pensionado BOOLEAN, " +
                "Ingreso_mensual INTEGER, Jefe_CI INTEGER, PRIMARY KEY (Nombre, Jefe_CI), " +
                "FOREIGN KEY (Jefe_CI) REFERENCES Jefes (Ci));");
            db.run("CREATE TABLE Edificios (nombre TEXT, direccion TEXT, PRIMARY KEY (nombre));");
            console.log("Las tablas han sido correctamente creada");
        }
        //Creamos vista si no existe
        db.run("CREATE VIEW IF NOT EXISTS personas AS "+
        "SELECT nombre,ci,jefe_ci,sexo,edad,instruccion,discapacitado,embarazo_temp,cne,profesion,pensionado,ingreso_mensual "+
        "FROM familiares "+
        "UNION SELECT apellidos,ci,ci,sexo,edad,instruccion,discapacitado,embarazo_temp,cne,profesion,pensionado,ingreso_mensual "+
        "FROM jefes;");
        // Vemos lista de usuarios en la base de datos        
        console.log("Lista de Compradores");
        db.each("SELECT nombre,user FROM usuarios", function(err, row) {
            console.log("Usuario: " + row.user + " Nombre: " + row.nombre);
        });
    });

    db.close();
}

/**
 
Vistas estadisticas 

function crearVistas() {
    var db = new sqlite3.Database(file);

    db.serialize(function() {
        // Se crean vistas
        db.run("CREATE VIEW IF NOT EXISTS Lactancia AS " +
            "SELECT Sexo,Edad FROM Jefes, "
            FROM COMPANY;

            CREATE[TEMP | TEMPORARY] VIEW view_name AS SELECT column1, column2.....FROM table_name WHERE[condition]; console.log("Las tablas han sido correctamente creada");
        }
        // Vemos lista de usuarios en la base de datos        
        console.log("Lista de Compradores");
        db.each("SELECT nombre,user FROM usuarios", function(err, row) {
            console.log("Usuario: " + row.user + " Nombre: " + row.nombre);
        });
    });

    db.close();
}

*/

// Exportamos funciones
exports.iniciar = iniciar;
