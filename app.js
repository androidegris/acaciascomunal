/**
 * app.js:
 * ----------
 *    Servidor express para consejo comunal
 *  
 * Andres J. Guzman M. 
 * Universidad Simon Bolivar, 2018.
 */


//Heroku

var port = process.env.PORT || 5000;
// var port = 8080 // Cloud9
var file = "comunal.db";
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var session = require('express-session'); // sesion
var hbs = require('hbs'); // Render vistas
var baseDatos = require("./basedatos");
var svgCaptcha = require('svg-captcha'); // Captchas
var bcrypt = require('bcrypt-nodejs'); // Libreria login encriptado

baseDatos.iniciar(); // Inicializamos base de datos

var favicon = require('serve-favicon'); //icono
app.use(favicon(__dirname + '/public/logo.png'));



// Inicializamos sesion
app.use(session({
    secret: 'acacias_sesion',
    name: 'acacias_cookie',
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
var sess;

// Direccionamos recursos publicos
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));



// Operador para comparar en vistas
hbs.registerHelper('equal', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    if (lvalue != rvalue) {
        return options.inverse(this);
    }
    else {
        return options.fn(this);
    }
});


// Parser peticiones post
var urlencodedParser = bodyParser.urlencoded({ extended: false });

/*
 * PAGINA PRINCIPAL
 * ---------------
 */
app.get('/', function(req, res) {
    sess = req.session;
    if (sess.usuario) {
        res.render('index', {
            title: 'Consejo Comunal Carlos Raúl Villanueva',
            usuario: sess.usuario
        });
    }
    else {
        res.render('index', { title: 'Consejo Comunal Carlos Raúl Villanueva' });
    }
});


/*
 * LOGIN
 * ---------------
 */
app.get('/login', function(req, res) {
    sess = req.session;
    if (sess.usuario) {
        res.redirect("/");
    }
    else {
        //var captchaLogin = svgCaptcha.create();
        //req.session.captchaLogin = captchaLogin.text;
        //console.log(req.session.captchaLogin);
        //res.render('login', { title: 'Tienda USB',
        //productos: listaProductos, captcha: '' + captchaLogin.data});
        res.render('login', { title: 'Consejo Comunal Carlos Raúl Villanueva' });
    }
});

/*
 * LOGIN
 * ---------------
 */
app.post('/login', urlencodedParser, function(req, respuesta) {
    sess = req.session;
    var usuario = req.body.user;
    var clave = req.body.clave;
    console.log(req.body);
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database(file);

    if (usuario.includes("|") || usuario.includes("\n") || usuario.includes(" ")) {
        return respuesta.render('error', {
            titulo: 'Login',
            error: 'Error Login'
        });
    }
    if (usuario == undefined || usuario == "" || usuario.length < 1) {
        return respuesta.render('error', {
            titulo: 'Login',
            error: 'Error Login'
        })
    }
    if (clave == undefined || clave == "") {
        return respuesta.render('error', {
            titulo: 'Login',
            error: 'Clave vacía'
        });
    }
    try {
        db.get("SELECT user,password FROM usuarios WHERE user=?", [usuario],
            function(error, row) {
                if (error || row == undefined) { // Vemos si usuario existe
                    console.log(error);
                    console.log("Error en Login");
                    respuesta.render("error", {
                        titulo: 'Login',
                        error: "Error en Login"
                    });
                    db.close();
                }
                else { // Si existe revisamos que su clave este correcta
                    if (row.user == usuario) {
                        // Comprobamos con la clave encriptada
                        bcrypt.compare(clave, row.password, function(err, res) {
                            if (res == true) { // clave correcta 
                                sess.usuario = usuario;
                                sess.password = clave;
                                respuesta.redirect("/");
                                db.close();
                            }
                            else { //Clave incorrecta
                                console.log("Error en Login");
                                respuesta.render("error", {
                                    titulo: 'Login',
                                    error: "Error en Login"
                                });
                                db.close();
                            }
                        });
                    }
                    else { //Error Login
                        console.log("Error en Login");
                        respuesta.render("error", {
                            titulo: 'Login',
                            error: "Error en Login"
                        });
                        db.close();
                    }
                }
            });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        respuesta.render("error", {
            titulo: 'Login',
            error: "Error en Login"
        });
        db.close();
    }
});

/*
 * REGISTRO
 * ---------------
 */
app.get('/registro', function(req, res) {
    sess = req.session;
    if (sess.usuario) { // Error ya esta logueado
        res.render("error", {
            titulo: 'Registro',
            error: "ERROR: Ya esta registrado, debe salir si quiere registrarse de nuevo"
        });
    }
    else {
        var captchaRegistro = svgCaptcha.create();
        req.session.captchaRegistro = captchaRegistro.text;
        console.log(req.session.captchaRegistro);
        res.render("registro", { captcha: '' + captchaRegistro.data });
    }
});

/*
 * DESPUES REGISTRO
 * ---------------
 */
app.post('/subirRegistro', urlencodedParser, function(req, res) {
    sess = req.session;
    var nombre = req.body.nombre;
    var usuario = req.body.user;
    var clave = req.body.password;
    var captchaInput = req.body.captcha;
    console.log(req.body);

    if (nombre.includes("|") || nombre.includes("\n")) {
        return res.render('error', {
            titulo: 'Registro',
            error: 'Nombre no puede tener (|) o saltos de línea'
        });
    }
    if (usuario.includes("|") || usuario.includes("\n") || usuario.includes(" ")) {
        return res.render('error', {
            titulo: 'Registro',
            error: 'Usuario no puede tener pipe (|), espacios en blanco o saltos de línea'
        });
    }
    if (usuario == undefined || usuario == "" || usuario.length < 1) {
        return res.render('error', {
            titulo: 'Registro',
            error: 'Usuario vacío'
        });
    }
    if (nombre == undefined || nombre == "" || nombre.length < 1) {
        return res.render('error', {
            titulo: 'Registro',
            error: 'Usuario vacío'
        });
    }
    if (clave == undefined || clave == "") {
        return res.render('error', {
            titulo: 'Registro',
            error: 'Clave vacía'
        });
    }
    if (captchaInput == undefined || captchaInput != sess.captchaRegistro) {
        return res.render('error', {
            titulo: 'Registro',
            error: 'Captcha errada'
        });
    }

    var sqlite3 = require('sqlite3').verbose(); // Base de datos
    var db = new sqlite3.Database(file);
    var insertar = "INSERT INTO Usuarios VALUES (?,?,?,?)";
    try {
        //Insertamos nuevo usuario
        //Encriptamos clave
        bcrypt.hash(clave, null, null, function(err, hash) {
            db.run(insertar, [null, nombre, usuario, hash],
                function(error) {
                    if (error) {
                        console.log(error);
                        console.log("Error en Registro");
                        var msjError = "SQLITE_CONSTRAINT: UNIQUE constraint failed: Usuarios.user";
                        if (error.message == msjError) {
                            msjError = "Error: El Usuario ingresado ya existe" + "\n";
                        }
                        else {
                            msjError = "Error en Registro" + "\n";
                        }
                        res.render("error", {
                            titulo: 'Registro',
                            error: msjError
                        });
                    }
                    else {
                        console.log("Registro Exitoso");
                        console.log("Insertado nuevo usuario " + usuario);
                        db.each("SELECT nombre,user FROM usuarios",
                            function(err, row) {
                                if (err) {
                                    console.log(err);
                                    throw err;
                                }
                                console.log("Usuario: " + row.user +
                                    " Nombre: " + row.nombre);
                            });
                        sess.usuario = usuario;
                        sess.password = clave;
                        res.redirect("/");
                    }
                });

        });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        res.render("error", {
            titulo: 'Registro',
            error: 'Error en registro'
        });
    }
});

/*
 * SALIR
 * ---------------
 */
app.get('/salir', function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

/*
 * CREAR Edificio
 * ---------------
 */
app.post('/agregarEdificio', urlencodedParser, function(req, res) {
    sess = req.session;
    var edificioEditar = req.body.jefeEditar;
    console.log(req.body);

    if (sess.usuario) {
        if (edificioEditar == undefined || edificioEditar == "") { // Vemo si no hay edificio
            return res.render('editedificio', {
                title: 'Agregar Edificio',
                usuario: sess.usuario,
                tarea: 'Agregar',
                crear: 'Si'
            });
        }
        else {
            return res.render('editedificio', { // Si hay (editar)
                title: 'Editar Edificio',
                usuario: sess.usuario,
                tarea: 'Editar',
                crear: 'Si'
            });
        }


    }
    else {
        res.render('error', {
            titulo: 'Agregar/editar Edificio',
            error: 'usuario no logueado'
        });
    }
});


/*
 * CREAR Edificio GET
 * ---------------
 */
app.get('/agregarEdificio', function(req, res) {
    sess = req.session;
    var edificioEditar = "";
    if (req.body) {
        edificioEditar = req.body.jefeEditar;
    }

    if (sess.usuario) {
        if (edificioEditar == undefined || edificioEditar == "") { // Vemo si no hay edificio
            return res.render('editedificio', {
                title: 'Agregar Edificio',
                usuario: sess.usuario,
                tarea: 'Agregar',
                crear: 'Si'
            });
        }
        else {
            return res.render('editedificio', { // Si hay (editar)
                title: 'Editar Edificio',
                usuario: sess.usuario,
                tarea: 'Editar',
                crear: 'Si'
            });
        }


    }
    else {
        res.render('error', {
            titulo: 'Agregar/editar Edificio',
            error: 'usuario no logueado'
        });
    }
});


/*
 * Despues de haber creado edificio
 * ---------------
 */
app.post('/edificioCreado', urlencodedParser, function(req, res) {
    sess = req.session;
    console.log(req.body);
    //var cliente = req.body.cliente;
    //var asesor = req.body.asesor;
    if (sess.password) {
        var clave = sess.password;
    }
    else {
        return res.render('error', {
            titulo: 'Crear Edificio',
            error: 'Usuario no logueado'
        });
    }
    //Parametros entrada
    var nombre = req.body.nombre;
    var direccion = req.body.direccion;
    var sqlite3 = require('sqlite3').verbose(); // Base de datos
    var db = new sqlite3.Database(file);
    var insertar = "INSERT INTO Edificios VALUES (?,?)";
    try {
        //Insertamos nuevo edificio
        db.run(insertar, [nombre, direccion],
            function(error) {
                if (error) {
                    console.log(error);
                    console.log("Error en Registro");
                    var msjError = "SQLITE_CONSTRAINT: UNIQUE constraint failed: Edificios.nombre";
                    if (error.message == msjError) {
                        msjError = "Error: Ya existe edifcio con ese nombre " + nombre + "\n";
                    }
                    else {
                        msjError = "Error en Registro" + "\n";
                    }
                    res.render("error", {
                        titulo: 'Registro',
                        error: msjError
                    });
                }
                else {
                    console.log("Registro Exitoso");
                    console.log("Insertado nuevo Edificio " + nombre + " por " + sess.usuario);
                    res.redirect("/");
                }
            });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        res.render("error", {
            titulo: 'Registro',
            error: 'Error en registro'
        });
    }
});


/*
 * CREAR Jefe
 * ---------------
 */
app.post('/agregarJefe', urlencodedParser, function(req, res) {
    sess = req.session;
    var jefeEditar = req.body.jefeEditar;
    //console.log(req.body);
    if (sess.usuario) {
        var sqlite3 = require('sqlite3').verbose();
        var db = new sqlite3.Database(file);
        var lista = [];
        try {
            db.each("SELECT nombre FROM Edificios", //Obtenemos edificios
                function(err, row) {
                    if (err) {
                        console.log(err);
                        return res.render('error', {
                            titulo: 'Crear Edificio',
                            error: "Error obteniendo edficios"
                        });
                    }
                    else {
                        lista.push({
                            nombre_edificio: row.nombre
                        });
                    }
                },
                function(err, num) {
                    if (err) {
                        console.log(err);
                        return res.render('error', {
                            titulo: 'Crear Edificio',
                            error: "Error obteniendo edficios"
                        });
                    }
                    //console.log(lista);
                    if (jefeEditar == undefined || jefeEditar == "") { // Vemo si no hay hay jefe
                        return res.render('editjefe', {
                            title: 'Agregar jefe',
                            usuario: sess.usuario,
                            tarea: 'Agregar',
                            edificios: lista,
                            crear: 'Si'

                        });
                    }
                    else {
                        return res.render('editjefe', { // Si hay (editar)
                            title: 'Editar Jefe',
                            usuario: sess.usuario,
                            tarea: 'Editar',
                            edificios: lista,
                            crear: 'Si'
                        });
                    }
                });
        }
        catch (err) {
            // manejamos error
            console.log(err);
        }



    }
    else {
        res.render('error', {
            titulo: 'Agregar/editar Jefe',
            error: 'usuario no logueado'
        });
    }
});


/*
 * Despues de haber creado jefe
 * ---------------
 */
app.post('/jefeCreado', urlencodedParser, function(req, res) {
    sess = req.session;
    console.log(req.body);
    //var cliente = req.body.cliente;
    //var asesor = req.body.asesor;
    if (sess.password) {
        var clave = sess.password;
    }
    else {
        return res.render('error', {
            titulo: 'Crear Jefe',
            error: 'Usuario no logueado'
        });
    }
    //Parametros entrada
    var nombres = req.body.nombres;
    var apellidos = req.body.apellidos;
    var ci = req.body.ci;
    var ci_nac = req.body.ci_nac;
    var sexo = req.body.sexo;
    var estado_civil = req.body.estado_civil;
    var edad = req.body.edad;
    var fecha = req.body.fecha;
    var telefono_hab = req.body.Telefono_Hab;
    var telefono_cel = req.body.Telefono_Cel;
    var telefono_ofic = req.body.Telefono_Ofic;
    var email = req.body.Email;
    var direccion = req.body.Direccion;
    var tenencia_vivienda = req.body.Tenencia_vivienda;
    var tiempo_comunidad = req.body.Tiempo_comunidad;
    var instruccion = req.body.Instruccion;
    var profesion = req.body.Profesion;
    var dedicacion = req.body.Dedicacion;
    var trabajando_actual = (req.body.Trabajando_actual == 'on');
    if (trabajando_actual) {
        trabajando_actual = 1;
    }
    else {
        trabajando_actual = 0;
    }
    var embarazo_temp = (req.body.Embarazo_temp == 'on');
    if (embarazo_temp) {
        embarazo_temp = 1;
    }
    else {
        embarazo_temp = 0;
    }
    var cne = (req.body.CNE == 'on');
    if (cne) {
        cne = 1;
    }
    else {
        cne = 0;
    }
    var pensionado = (req.body.Pensionado == 'on');
    if (pensionado) {
        pensionado = 1;
    }
    else {
        pensionado = 0;
    }
    var pension_institucion = req.body.Pension_institucion;
    var discapacitado = (req.body.Discapacitado == 'on');
    if (discapacitado) {
        discapacitado = 1;
    }
    else {
        discapacitado = 0;
    }
    var tipo_discapacidad = req.body.Tipo_discapacidad;
    var ingreso_mensual = req.body.Ingreso_mensual;
    var clasificacion_ingreso = req.body.Clasificacion_ingreso;
    var edificio = '';
    if (req.body.Edificio) {
        edificio = req.body.Edificio;
    }


    var sqlite3 = require('sqlite3').verbose(); // Base de datos
    var db = new sqlite3.Database(file);
    var datosIngresados = [
        nombres,
        apellidos,
        ci,
        ci_nac,
        sexo,
        estado_civil,
        edad,
        fecha,
        telefono_hab,
        telefono_cel,
        telefono_ofic,
        email,
        direccion,
        edificio,
        tenencia_vivienda,
        tiempo_comunidad,
        instruccion,
        profesion,
        dedicacion,
        trabajando_actual,
        embarazo_temp,
        cne,
        pensionado,
        pension_institucion,
        discapacitado,
        tipo_discapacidad,
        ingreso_mensual,
        clasificacion_ingreso
    ];
    //console.log(datosIngresados);
    // var i = 0;
    // while (i < datosIngresados.length) {
    //     //console.log(i); 
    //     //console.log(datosIngresados[i]); 
    //     i = i + 1;
    // }  
    console.log(datosIngresados);
    var insertar = "INSERT INTO Jefes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    try {
        //Insertamos nuevo jefe
        db.run(insertar, datosIngresados,
            function(error) {
                if (error) {
                    console.log(error);
                    console.log("Error en Registro");
                    var msjError = "SQLITE_CONSTRAINT: UNIQUE constraint failed: Jefes.Ci";
                    if (error.message == msjError) {
                        msjError = "Error: Ya existe alguien con la CI " + ci + "\n";
                    }
                    else {
                        msjError = "Error en Registro" + "\n";
                    }
                    res.render("error", {
                        titulo: 'Registro',
                        error: msjError
                    });
                }
                else {
                    console.log("Registro Exitoso");
                    console.log("Insertado nuevo Jefe " + nombres + ci + " por " + sess.usuario);
                    res.redirect("/");
                }
            });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        res.render("error", {
            titulo: 'Registro',
            error: 'Error en registro'
        });
    }
});



/*
 * Eliminar jefe
 * ---------------
 */
app.post('/jefeEliminar', urlencodedParser, function(req, res) {
    sess = req.session;
    console.log(req.body);
    var jefeCI = req.body.jefeCI;
    if (sess.password) {
        var clave = sess.password;
    }
    else {
        return res.render('error', {
            titulo: 'Eliminar jefe',
            error: 'Asesor no logueado'
        });
    }
    var eliminar = "DELETE FROM Familiares WHERE Jefe_CI = ?";
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database(file);
    db.serialize;
    try {
        db.run(eliminar, [jefeCI],
            function(error) {
                if (error) {
                    console.log(error);
                    return res.render('error', {
                        titulo: 'Eliminar jefe',
                        error: error
                    });
                }
                else {
                    console.log("Familiares Eliminado");
                    var eliminar2 = "DELETE FROM Jefes WHERE Ci = ?";;
                    db.run(eliminar2, [jefeCI],
                        function(error) {
                            if (error) {
                                console.log(error);
                                return res.render('error', {
                                    titulo: 'Eliminar jefe',
                                    error: error
                                });
                            }
                            else {
                                // Si es exitoso regresamos
                                console.log("Eliminado JefeCI", jefeCI, "por usuario ", sess.usuario);
                                res.redirect(307, 'listaJefes');
                            }
                        });
                }
            });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        res.render("error", {
            titulo: 'Registro',
            error: 'Error en registro'
        });
    }
});


/*
 * EDITAR Jefe
 * ---------------
 */
app.post('/editarJefe', urlencodedParser, function(req, res) {
    sess = req.session;
    var jefeCI = req.body.jefeCI;
    //console.log(req.body);
    if (sess.usuario) {
        var sqlite3 = require('sqlite3').verbose();
        var db = new sqlite3.Database(file);
        var buscar = "SELECT * FROM Jefes" +
            " WHERE ci =?";
        try {
            db.get(buscar, [jefeCI], (err, row) => {
                if (err) {
                    console.log(err);
                    return res.render('error', {
                        titulo: 'Modificar Jefe',
                        error: "Error obteniendo jefe"
                    });
                }
                var datosJefe = {
                    Nombres: row.Nombres,
                    Apellidos: row.Apellidos,
                    Ci: row.Ci,
                    Ci_Nac: row.Ci_Nac,
                    Sexo: row.Sexo,
                    Estado_civil: row.Estado_civil,
                    Edad: row.Edad,
                    Fecha_nac: row.Fecha_nac,
                    Telefono_Hab: row.Telefono_Hab,
                    Telefono_Cel: row.Telefono_Cel,
                    Telefono_Ofic: row.Telefono_Ofic,
                    Email: row.Email,
                    Direccion: row.Direccion,
                    Edificio: row.Edificio,
                    Tenencia_vivienda: row.Tenencia_vivienda,
                    Tiempo_comunidad: row.Tiempo_comunidad,
                    Instruccion: row.Instruccion,
                    Profesion: row.Profesion,
                    Dedicacion: row.Dedicacion,
                    Trabajando_actual: row.Trabajando_actual,
                    Embarazo_temp: row.Embarazo_temp,
                    Cne: row.CNE,
                    Pensionado: row.Pensionado,
                    Pension_institucion: row.Pension_institucion,
                    Discapacitado: row.Discapacitado,
                    Tipo_discapacidad: row.Tipo_discapacidad,
                    Ingreso_mensual: row.Ingreso_mensual,
                    clasificacion_ingreso: row.Clasificacion_ingreso
                };
                console.log(datosJefe);
                //Vemos checkbox
                var datosCheck = {};
                if (datosJefe.Trabajando_actual == 1) {
                    datosCheck.trabajando = 1;
                }
                if (datosJefe.Embarazo_temp == 1) {
                    datosCheck.embarazo = 1;
                }
                if (datosJefe.Pensionado == 1) {
                    datosCheck.pensionado = 1;
                }
                if (datosJefe.Discapacitado == 1) {
                    datosCheck.discapacitado = 1;
                }
                if (datosJefe.Cne == 1) {
                    datosCheck.cne = 1;
                }
                //Buscamos edificios
                var lista = [];
                db.each("SELECT nombre FROM Edificios", //Obtenemos edificios
                    function(err, row) {
                        if (err) {
                            console.log(err);
                            return res.render('error', {
                                titulo: 'Crear Edificio',
                                error: "Error obteniendo edficios"
                            });
                        }
                        else {
                            lista.push({
                                nombre_edificio: row.nombre
                            });
                        }
                    },
                    function(err, num) {
                        if (err) {
                            console.log(err);
                            return res.render('error', {
                                titulo: 'Lista Edificio',
                                error: "Error obteniendo edficios"
                            });
                        }
                        return res.render('editjefe2', {
                            title: 'Editar Jefe',
                            usuario: sess.usuario,
                            tarea: 'Editar',
                            edificios: lista,
                            crear: 'Si',
                            jefe: datosJefe,
                            datosCheck: datosCheck
                        });
                    });

            });
        }
        catch (err) {
            // manejamos error
            console.log(err);
        }
    }
    else {
        res.render('error', {
            titulo: 'Agregar/editar Jefe',
            error: 'usuario no logueado'
        });
    }
});


/*
 * Despues Editar Jefe
 * ---------------
 */
app.post('/jefeEditado', urlencodedParser, function(req, res) {
    sess = req.session;
    console.log(req.body);
    //var cliente = req.body.cliente;
    //var asesor = req.body.asesor;
    if (sess.password) {
        var clave = sess.password;
    }
    else {
        return res.render('error', {
            titulo: 'Crear Jefe',
            error: 'Usuario no logueado'
        });
    }
    //Parametros entrada
    var nombres = req.body.nombres;
    var apellidos = req.body.apellidos;
    var ci = req.body.ci;
    var ci_nac = req.body.ci_nac;
    var sexo = req.body.sexo;
    var estado_civil = req.body.estado_civil;
    var edad = req.body.edad;
    var fecha = req.body.fecha;
    var telefono_hab = req.body.Telefono_Hab;
    var telefono_cel = req.body.Telefono_Cel;
    var telefono_ofic = req.body.Telefono_Ofic;
    var email = req.body.Email;
    var direccion = req.body.Direccion;
    var tenencia_vivienda = req.body.Tenencia_vivienda;
    var tiempo_comunidad = req.body.Tiempo_comunidad;
    var instruccion = req.body.Instruccion;
    var profesion = req.body.Profesion;
    var dedicacion = req.body.Dedicacion;
    var trabajando_actual = (req.body.Trabajando_actual == 'on');
    if (trabajando_actual) {
        trabajando_actual = 1;
    }
    else {
        trabajando_actual = 0;
    }
    var embarazo_temp = (req.body.Embarazo_temp == 'on');
    if (embarazo_temp) {
        embarazo_temp = 1;
    }
    else {
        embarazo_temp = 0;
    }
    var cne = (req.body.CNE == 'on');
    if (cne) {
        cne = 1;
    }
    else {
        cne = 0;
    }
    var pensionado = (req.body.Pensionado == 'on');
    if (pensionado) {
        pensionado = 1;
    }
    else {
        pensionado = 0;
    }
    var pension_institucion = req.body.Pension_institucion;
    var discapacitado = (req.body.Discapacitado == 'on');
    if (discapacitado) {
        discapacitado = 1;
    }
    else {
        discapacitado = 0;
    }
    var tipo_discapacidad = req.body.Tipo_discapacidad;
    var ingreso_mensual = req.body.Ingreso_mensual;
    var clasificacion_ingreso = req.body.Clasificacion_ingreso;
    var edificio = '';
    if (req.body.Edificio) {
        edificio = req.body.Edificio;
    }

    var sqlite3 = require('sqlite3').verbose(); // Base de datos
    var db = new sqlite3.Database(file);
    var datosIngresados = [
        nombres,
        apellidos,
        sexo,
        estado_civil,
        edad,
        fecha,
        telefono_hab,
        telefono_cel,
        telefono_ofic,
        email,
        direccion,
        edificio,
        tenencia_vivienda,
        tiempo_comunidad,
        instruccion,
        profesion,
        dedicacion,
        trabajando_actual,
        embarazo_temp,
        cne,
        pensionado,
        pension_institucion,
        discapacitado,
        tipo_discapacidad,
        ingreso_mensual,
        clasificacion_ingreso,
        ci
    ];
    //console.log(datosIngresados);
    // var i = 0;
    // while (i < datosIngresados.length) {
    //     //console.log(i); 
    //     //console.log(datosIngresados[i]); 
    //     i = i + 1;
    // }  
    console.log(datosIngresados);
    var actualizar = "UPDATE Jefes SET Nombres = ?, Apellidos=?, Sexo=?" +
        " , Estado_civil = ?, Edad=?, Fecha_nac=? , Telefono_Hab=?" +
        " , Telefono_Cel = ? , Telefono_Ofic=? , Email=? , Direccion=?" +
        " , Edificio = ? , Tenencia_vivienda=? , Tiempo_comunidad=? , Instruccion=?" +
        " , Profesion = ? , Dedicacion=? , Trabajando_actual=? , Embarazo_temp=?" +
        " , CNE = ? , Pensionado=? , Pension_institucion=? , Discapacitado=?" +
        " , Tipo_discapacidad = ? , Ingreso_mensual=? , Clasificacion_ingreso=?" +
        " WHERE Ci = ?";
    //console.log(actualizar);


    try {
        //Insertamos nuevo jefe
        db.run(actualizar, datosIngresados,
            function(error) {
                if (error) {
                    console.log(error);
                    console.log("Error en Registro");
                    var msjError = "SQLITE_CONSTRAINT: UNIQUE constraint failed: Jefes.Ci";
                    if (error.message == msjError) {
                        msjError = "Error: Ya existe alguien con la CI " + ci + "\n";
                    }
                    else {
                        msjError = "Error en Registro" + "\n";
                    }
                    res.render("error", {
                        titulo: 'Registro',
                        error: msjError
                    });
                }
                else {
                    console.log("Registro Exitoso");
                    console.log("Editado Jefe " + nombres + ci + " por " + sess.usuario);
                    res.redirect(307, 'listaJefes');
                }
            });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        res.render("error", {
            titulo: 'Registro',
            error: 'Error en registro'
        });
    }
});


/*
 * LISTAR JEFES
 * ---------------
 */
app.post('/listaJefes', urlencodedParser, function(req, res) {
    sess = req.session;
    var jefeEditar = req.body.jefeEditar;
    //console.log(req.body);

    if (sess.usuario) {
        var sqlite3 = require('sqlite3').verbose();
        var db = new sqlite3.Database(file);
        var lista = [];
        try {
            db.each("SELECT * FROM Jefes", //Obtenemos jefes
                function(err, row) {
                    if (err) {
                        console.log(err);
                        return res.render('error', {
                            titulo: 'Lista jefes',
                            error: "Error obteniendo jefes"
                        });
                    }
                    else {
                        lista.push(row);
                    }
                },
                function(err, num) {
                    console.log(lista);
                    if (err) {
                        console.log(err);
                        return res.render('error', {
                            titulo: 'Crear Edificio',
                            error: "Error obteniendo edificios"
                        });
                    }
                    //console.log(lista);
                    return res.render('jefes', {
                        title: 'Lista Jefes de Familia',
                        usuario: sess.usuario,
                        jefes: lista
                    });
                });
        }
        catch (err) {
            // manejamos error
            console.log(err);
        }
    }
    else {
        res.render('error', {
            titulo: 'Agregar/editar Jefe',
            error: 'usuario no logueado'
        });
    }
});


/*
 * LISTAR Familiares
 * ---------------
 */
app.post('/listaGrupos', urlencodedParser, function(req, res) {
    sess = req.session;
    var jefeCI = req.body.jefeCI;
    console.log(jefeCI);
    if (sess.usuario && jefeCI) {
        var sqlite3 = require('sqlite3').verbose();
        var db = new sqlite3.Database(file);
        var lista = [];
        var buscar = "SELECT * FROM Jefes" +
            " WHERE ci =?";
        try {

            db.get(buscar, [jefeCI], (err, row) => {
                if (err) {
                    console.log(err);
                    return res.render('error', {
                        titulo: 'Lista Grupo Familiar',
                        error: "Error obteniendo grupos familiares"
                    });
                }
                var datosJefe = {
                    nombres: row.Nombres,
                    apellidos: row.Apellidos,
                    ci: row.Ci,
                    ci_nac: row.Ci_Nac,
                    sexo: row.Sexo,
                    estado_civil: row.Estado_civil,
                    edad: row.Edad,
                    fecha: row.Fecha_nac,
                    telefono_hab: row.Telefono_Hab,
                    telefono_cel: row.Telefono_Cel,
                    telefono_ofic: row.Telefono_Ofic,
                    email: row.Email,
                    direccion: row.Direccion,
                    edificio: row.Edificio,
                    tenencia_vivienda: row.Tenencia_vivienda,
                    tiempo_comunidad: row.Tiempo_comunidad,
                    instruccion: row.Instruccion,
                    profesion: row.Profesion,
                    dedicacion: row.Dedicacion,
                    trabajando_actual: row.Trabajando_actual,
                    embarazo_temp: row.Embarazo_temp,
                    cne: row.CNE,
                    pensionado: row.Pensionado,
                    pension_institucion: row.Pension_institucion,
                    discapacitado: row.Discapacitado,
                    tipo_discapacidad: row.Tipo_discapacidad,
                    ingreso_mensual: row.Ingreso_mensual,
                    clasificacion_ingreso: row.Clasificacion_ingreso
                };
                console.log(datosJefe);
                var verGrupo = "Select * From Familiares WHERE Jefe_CI=" + jefeCI;
                db.each(verGrupo, //Obtenemos Familiares
                    function(err, familiar) {
                        if (err) {
                            console.log(err);
                            return res.render('error', {
                                titulo: 'Lista familiares',
                                error: "Error obteniendo familiares"
                            });
                        }
                        else {
                            lista.push(familiar);
                        }
                    },
                    function(err, num) {
                        if (err) {
                            console.log(err);
                            return res.render('error', {
                                titulo: 'Lista familiares',
                                error: "Error obteniendo familiares"
                            });
                        }
                        //console.log(lista);
                        return res.render('listaGrupos', {
                            title: 'Lista Familiares',
                            usuario: sess.usuario,
                            familiares: lista,
                            datosJefe: datosJefe
                        });
                    });
            });
        }
        catch (err) {
            // manejamos error
            console.log(err);
        }
    }
    else {
        res.render('error', {
            titulo: 'Listado familiares',
            error: 'usuario no logueado'
        });
    }
});


/*
 * CREAR Familiar
 * ---------------
 */
app.post('/agregarFamiliar', urlencodedParser, function(req, res) {
    sess = req.session;
    var familiarEditar = req.body.familiarEditar;
    var jefeCI = req.body.jefeCI;
    var jefeNombres = req.body.jefeNombres;
    var jefeEdificio = req.body.jefeEdificio;
    console.log(req.body);

    if (sess.usuario && jefeCI) {
        if (familiarEditar == undefined || familiarEditar == "") { // Vemo si no hay hay jefe
            return res.render('editgrupos', {
                title: 'Agregar familiar',
                usuario: sess.usuario,
                tarea: 'Agregar',
                jefeCI: jefeCI,
                jefeNombres: jefeNombres,
                jefeEdificio: jefeEdificio,
                crear: 'Si'

            });
        }
        else {
            return res.render('editgrupos', { // Si hay (editar)
                title: 'Editar Familiar',
                usuario: sess.usuario,
                tarea: 'Editar',
                jefeCI: jefeCI,
                jefeNombres: jefeNombres,
                jefeEdificio: jefeEdificio,
                crear: 'Si'
            });
        }
    }
    else {
        res.render('error', {
            titulo: 'Listado familiares',
            error: 'usuario no logueado'
        });
    }
});

/*
 * Despues de haber creado jefe
 * ---------------
 */
app.post('/familiarCreado', urlencodedParser, function(req, res) {
    sess = req.session;
    console.log(req.body);
    //var cliente = req.body.cliente;
    //var asesor = req.body.asesor;
    if (sess.password) {
        var clave = sess.password;
    }
    else {
        return res.render('error', {
            titulo: 'Crear Familiar',
            error: 'Usuario no logueado'
        });
    }
    //Parametros entrada
    var jefeCI = req.body.jefeCI;
    var nombre = req.body.nombres;
    var sexo = req.body.sexo;
    var ci = req.body.ci;
    var edad = req.body.edad;
    var fecha = req.body.fecha;
    var instruccion = req.body.Instruccion;
    var profesion = req.body.Profesion;
    var embarazo_temp = (req.body.Embarazo_temp == 'on');
    if (embarazo_temp) {
        embarazo_temp = 1;
    }
    else {
        embarazo_temp = 0;
    }
    var cne = (req.body.CNE == 'on');
    if (cne) {
        cne = 1;
    }
    else {
        cne = 0;
    }
    var pensionado = (req.body.Pensionado == 'on');
    if (pensionado) {
        pensionado = 1;
    }
    else {
        pensionado = 0;
    }
    var discapacitado = (req.body.Discapacitado == 'on');
    if (discapacitado) {
        discapacitado = 1;
    }
    else {
        discapacitado = 0;
    }
    var tipo_discapacidad = req.body.Tipo_discapacidad;
    var parentesco = req.body.parentesco;
    var ingreso_mensual = req.body.Ingreso_mensual;
    var sqlite3 = require('sqlite3').verbose(); // Base de datos
    var db = new sqlite3.Database(file);
    var datosIngresados = [
        nombre,
        sexo,
        ci,
        fecha,
        edad,
        discapacitado,
        tipo_discapacidad,
        parentesco,
        instruccion,
        embarazo_temp,
        cne,
        profesion,
        pensionado,
        ingreso_mensual,
        jefeCI
    ];
    //console.log(datosIngresados);
    // var i = 0;
    // while (i < datosIngresados.length) {
    //     //console.log(i); 
    //     //console.log(datosIngresados[i]); 
    //     i = i + 1;
    // }  
    console.log(datosIngresados);
    var insertar = "INSERT INTO Familiares VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    try {
        //Insertamos nuevo jefe
        db.run(insertar, datosIngresados,
            function(error) {
                if (error) {
                    console.log(error);
                    console.log("Error en Registro");
                    var msjError = "SQLITE_CONSTRAINT: UNIQUE constraint failed: Familiares.Jefe_CI";
                    if (error.message == msjError) {
                        msjError = "Error: Ya existe alguien con la CI " + ci + "\n";
                    }
                    else {
                        msjError = "Error en Registro" + "\n";
                    }
                    res.render("error", {
                        titulo: 'Registro',
                        error: msjError
                    });
                }
                else {
                    console.log("Registro Exitoso");
                    console.log("Insertado nuevo familiar" + nombre + ci + " por " + sess.usuario);
                    res.redirect(307, 'listaGrupos');
                }
            });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        res.render("error", {
            titulo: 'Registro',
            error: 'Error en registro'
        });
    }
});


/*
 * Eliminar familiar
 * ---------------
 */
app.post('/familiarEliminar', urlencodedParser, function(req, res) {
    sess = req.session;
    console.log(req.body);
    var jefeCI = req.body.jefeCI;
    var nombre = req.body.nombre;
    if (sess.password) {
        var clave = sess.password;
    }
    else {
        return res.render('error', {
            titulo: 'Eliminar familiar',
            error: 'Asesor no logueado'
        });
    }
    var eliminar = "DELETE FROM Familiares WHERE Jefe_CI = ? AND Nombre = ?";
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database(file);
    db.serialize;
    try {
        db.run(eliminar, [jefeCI, nombre],
            function(error) {
                if (error) {
                    console.log(error);
                    return res.render('error', {
                        titulo: 'Eliminar familiar',
                        error: error
                    });
                }
                else {
                    // Si es exitoso regresamos
                    console.log("Eliminado familiar", nombre, '-', jefeCI, "por usuario ", sess.usuario);
                    res.redirect(307, 'listaGrupos');
                }
            });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        res.render("error", {
            titulo: 'Registro',
            error: 'Error en registro'
        });
    }
});


/*
 * EDITAR familiar
 * ---------------
 */
app.post('/editarFamiliar', urlencodedParser, function(req, res) {
    sess = req.session;
    var jefeCI = req.body.jefeCI;
    var ci = req.body.ciEditar;
    var nombre = req.body.nombreEditar;
    //var nombreAnterior = req.body.nombreAnterior;
    //var ciAnterior = req.body.ciAnterior;
    console.log(req.body);
    if (sess.usuario && jefeCI) {
        var sqlite3 = require('sqlite3').verbose();
        var db = new sqlite3.Database(file);
        var buscar = "SELECT Nombres, Apellidos, Edificio FROM Jefes" +
            " WHERE ci =?";
        try {
            //Buscamos datos jefe familiar
            db.get(buscar, [jefeCI], (err, row) => {
                if (err) {
                    console.log(err);
                    return res.render('error', {
                        titulo: 'Modificar Jefe',
                        error: "Error obteniendo jefe"
                    });
                }
                var jefeNombres = row.Nombres + " " + row.Apellidos;
                var jefeEdificio = row.Edificio;
                //Buscamos datos familiar a editar
                var buscar2 = "SELECT * FROM Familiares" +
                    " WHERE ci =? AND nombre =? AND Jefe_CI=?";
                db.get(buscar2, [ci, nombre, jefeCI], (err, row) => {
                    if (err) {
                        console.log(err);
                        return res.render('error', {
                            titulo: 'Modificar familiar',
                            error: "Error obteniendo familiar"
                        });
                    }
                    var datosCheck = {};
                    if (row.Embarazo_temp == 1) {
                        datosCheck.embarazo = 1;
                    }
                    if (row.Pensionado == 1) {
                        datosCheck.pensionado = 1;
                    }
                    if (row.Discapacitado == 1) {
                        datosCheck.discapacitado = 1;
                    }
                    if (row.CNE == 1) {
                        datosCheck.cne = 1;
                    }
                    return res.render('editgrupos2', { // Si hay (editar)
                        title: 'Editar Familiar',
                        usuario: sess.usuario,
                        tarea: 'Editar',
                        jefeCI: jefeCI,
                        jefeNombres: jefeNombres,
                        jefeEdificio: jefeEdificio,
                        familiar: row,
                        datosCheck: datosCheck,
                        crear: 'Si'
                    });
                });
            });
        }
        catch (err) {
            // manejamos error
            console.log(err);
        }
    }
    else {
        res.render('error', {
            titulo: 'Agregar/editar Familiar',
            error: 'usuario no logueado'
        });
    }
});


/*
 * Despues Editar Familiar
 * ---------------
 */
app.post('/familiarEditado', urlencodedParser, function(req, res) {
    sess = req.session;
    console.log(req.body);
    if (sess.password) {
        var clave = sess.password;
    }
    else {
        return res.render('error', {
            titulo: 'Crear Jefe',
            error: 'Usuario no logueado'
        });
    }
    //Parametros entrada
    var ciAnterior = req.body.ciAnterior;
    var nombreAnterior = req.body.nombreAnterior;
    var jefeCI = req.body.jefeCI;
    var nombre = req.body.nombres;
    var sexo = req.body.sexo;
    var ci = req.body.ci;
    var edad = req.body.edad;
    var fecha = req.body.fecha;
    var instruccion = req.body.Instruccion;
    var profesion = req.body.Profesion;
    var embarazo_temp = (req.body.Embarazo_temp == 'on');
    if (embarazo_temp) {
        embarazo_temp = 1;
    }
    else {
        embarazo_temp = 0;
    }
    var cne = (req.body.CNE == 'on');
    if (cne) {
        cne = 1;
    }
    else {
        cne = 0;
    }
    var pensionado = (req.body.Pensionado == 'on');
    if (pensionado) {
        pensionado = 1;
    }
    else {
        pensionado = 0;
    }
    var discapacitado = (req.body.Discapacitado == 'on');
    if (discapacitado) {
        discapacitado = 1;
    }
    else {
        discapacitado = 0;
    }
    var tipo_discapacidad = req.body.Tipo_discapacidad;
    var parentesco = req.body.parentesco;
    var ingreso_mensual = req.body.Ingreso_mensual;
    var sqlite3 = require('sqlite3').verbose(); // Base de datos
    var db = new sqlite3.Database(file);
    var datosIngresados = [
        nombre,
        sexo,
        ci,
        fecha,
        edad,
        discapacitado,
        tipo_discapacidad,
        parentesco,
        instruccion,
        profesion,
        embarazo_temp,
        cne,
        pensionado,
        ingreso_mensual,
        jefeCI,
        nombreAnterior,
        ciAnterior
    ];
    console.log(datosIngresados);
    var actualizar = "UPDATE Familiares SET Nombre = ?, Sexo=?" +
        " , Ci = ?, Fecha_nac=? , Edad=?" +
        " , Discapacitado = ? , Discapacidad=? , Parentesco=? , Instruccion=?" +
        " , Profesion = ? , Embarazo_temp=?" +
        " , CNE = ? , Pensionado=? " +
        " , Ingreso_mensual=?" +
        " WHERE Jefe_CI = ? AND nombre=? AND Ci=?";
    //console.log(actualizar);


    try {
        //Insertamos nuevo jefe
        db.run(actualizar, datosIngresados,
            function(error) {
                if (error) {
                    console.log(error);
                    console.log("Error en Registro");
                    var msjError = "SQLITE_CONSTRAINT: UNIQUE constraint failed: Jefes.Ci";
                    if (error.message == msjError) {
                        msjError = "Error: Ya existe alguien con la CI " + ci + "\n";
                    }
                    else {
                        msjError = "Error en Registro" + "\n";
                    }
                    res.render("error", {
                        titulo: 'Registro',
                        error: msjError
                    });
                }
                else {
                    console.log("Registro Exitoso");
                    console.log("Editado Familiar" + nombre + ci + " por " + sess.usuario);
                    res.redirect(307, 'listaGrupos');
                }
            });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        res.render("error", {
            titulo: 'Registro',
            error: 'Error en registro'
        });
    }
});

























/*
 * Estadisticas
 * ---------------
 */
app.get('/estadisticas', function(req, res) {
    sess = req.session;
    //console.log(req.body);
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database(file);
    var buscar = "SELECT * FROM " +
        "(SELECT COUNT(nombre) AS personas FROM personas), " +
        "(SELECT COUNT(nombres) AS familias FROM jefes), " +
        "(SELECT COUNT(nombre) AS edificios FROM edificios)," +
        "(SELECT COUNT(nombre) AS hombres FROM personas WHERE sexo='M'), " +
        "(SELECT COUNT(nombre) AS mujeres FROM personas WHERE sexo='F'), " +
        "(SELECT COUNT(nombre) AS cne FROM personas WHERE cne='1'), " +
        "(SELECT COUNT(nombre) AS pensionados FROM personas WHERE pensionado='1'), " +
        "(SELECT COUNT(nombre) AS discapacitados FROM personas WHERE discapacitado='1'), " +
        "(SELECT COUNT(nombre) AS embarazo_temp FROM personas WHERE embarazo_temp='1'), " +
        "(SELECT COUNT(nombre) AS menores_15 FROM personas WHERE edad < 15), " +
        "(SELECT COUNT(nombre) AS de_15_17 FROM personas WHERE (edad < 18) AND  (14 < edad)), " +
        "(SELECT COUNT(nombre) AS mayores FROM personas WHERE 18 <= edad AND edad !=''), " +
        "(SELECT COUNT(nombre) AS sin_instruccion FROM personas WHERE instruccion='Sin Instrucción'), " +
        "(SELECT COUNT(nombre) AS basica FROM personas WHERE instruccion='Basica'), " +
        "(SELECT COUNT(nombre) AS bachiller FROM personas WHERE instruccion='Bachiller'), " +
        "(SELECT COUNT(nombre) AS tec_medio FROM personas WHERE instruccion='Tecnico Medio'), " +
        "(SELECT COUNT(nombre) AS tec_superior FROM personas WHERE instruccion='Tecnico Superior'), " +
        "(SELECT COUNT(nombre) AS universitario FROM personas WHERE instruccion='Universitario'), " +
        "(SELECT COUNT(nombre) AS postgrado FROM personas WHERE instruccion='Post Grado'), " +
        "(SELECT COUNT(nombres) AS  propia FROM Jefes WHERE Tenencia_vivienda='Propia'), " +
        "(SELECT COUNT(nombres) AS  alquilada FROM Jefes WHERE Tenencia_vivienda='Alquilada'), " +
        "(SELECT COUNT(nombres) AS  traspaso FROM Jefes WHERE Tenencia_vivienda='Traspaso'), " +
        "(SELECT COUNT(nombres) AS  invadida FROM Jefes WHERE Tenencia_vivienda='Invadida'), " +
        "(SELECT COUNT(nombres) AS  pagandose FROM Jefes WHERE Tenencia_vivienda='Pagándose'), " +
        "(SELECT COUNT(nombres) AS  otra FROM Jefes WHERE Tenencia_vivienda='Otra'), " +
        "(SELECT COUNT(nombre) AS lactancia FROM personas WHERE edad = 0), " +
        "(SELECT COUNT(nombre) AS preescolar FROM personas WHERE (edad < 5) AND  (1 <= edad)), " +
        "(SELECT COUNT(nombre) AS escolar FROM personas WHERE (edad < 10) AND  (5 <= edad)), " +
        "(SELECT COUNT(nombre) AS adolescente FROM personas WHERE (edad < 15) AND  (10 <= edad)), " +
        "(SELECT COUNT(nombre) AS adolescentes FROM personas WHERE (edad < 20) AND  (15 <= edad)), " +
        "(SELECT COUNT(nombre) AS adultojoven FROM personas WHERE (edad < 35) AND  (20 <= edad)), " +
        "(SELECT COUNT(nombre) AS adultojoven2 FROM personas WHERE (edad < 50) AND  (35 <= edad)), " +
        "(SELECT COUNT(nombre) AS adultomaduro FROM personas WHERE (edad < 60) AND  (50 <= edad)), " +
        "(SELECT COUNT(nombre) AS adultomayor FROM personas WHERE edad > 60 AND edad !=''), " +
        "(SELECT COUNT(nombre) AS sinedad FROM personas WHERE edad='');";
    try {
        db.get(buscar, [], (err, row) => {
            if (err) {
                console.log(err);
                return res.render('error', {
                    titulo: 'Estadísticas',
                    error: "Error obteniendo estadísticas"
                });
            }
            console.log("datos estadísticas", row);
            var electores = row.de_15_17 + row.mayores;
            if (sess.usuario) {
                return res.render('estadisticas', {
                    usuario: sess.usuario,
                    num: row,
                    electores: electores
                });
            }
            else {
                return res.render('estadisticas', {
                    usuario: sess.usuario,
                    num: row,
                    electores: electores
                });

            }


        });
    }
    catch (err) {
        // manejamos error
        console.log(err);
        return res.render('error', {
            titulo: 'Estadísticas',
            error: "Error obteniendo estadísticas"
        });
    }
});


/*
 * DESCARGAR BASE DE DATOS (SQLITE3)
 * ----------------------------------
 */
app.post('/baseDatos.db', function(req, res) {
    sess = req.session;
    if (sess.usuario) {
        res.sendFile('comunal.db', { root: __dirname });
    }
    else {
        res.render("error", {
            titulo: 'Descarga base de datos',
            error: 'Error debe loguearse para descargar'
        });
    }
});




/*
 * INICIO SERVIDOR
 * --------------------------
 */


var server = app.listen(8080, function() {
    console.log('Servidor web iniciado');
});

// Heroku Azure
//var server=app.listen(port,function(){
//  console.log('Servidor web iniciado');
//});
