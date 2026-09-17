// ====== DATABASE.JS - Manejo de IndexedDB ======
// Esta es la "memoria" de REGISAPP. Aquí se guardarán todos los datos.

const DB_NAME = 'RegisAppDB';
const DB_VERSION = 1;

// Nombres de las "tablas" (stores)
const STORES = {
    OPERACIONES: 'operaciones',
    GASTOS_FIJOS: 'gastosFijos',
    DEBERES: 'deberes',
    MANTENIMIENTO: 'mantenimiento',
    KILOMETRAJE: 'kilometraje'
};

let db = null;

// ====== ABRIR/CREAR LA BASE DE DATOS ======
function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Error al abrir DB:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('✅ Base de datos abierta correctamente');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('🔄 Creando estructura de la base de datos...');

            // Tabla de Operaciones
            if (!db.objectStoreNames.contains(STORES.OPERACIONES)) {
                const store = db.createObjectStore(STORES.OPERACIONES, { keyPath: 'id', autoIncrement: true });
                store.createIndex('fecha', 'fecha', { unique: false });
                store.createIndex('tipo', 'tipo', { unique: false }); // 'ingreso' o 'gasto'
                store.createIndex('categoria', 'categoria', { unique: false }); // 'personal' o 'empresa'
            }

            // Tabla de Gastos Fijos
            if (!db.objectStoreNames.contains(STORES.GASTOS_FIJOS)) {
                const store = db.createObjectStore(STORES.GASTOS_FIJOS, { keyPath: 'id', autoIncrement: true });
                store.createIndex('estado', 'estado', { unique: false }); // 'Pago' o 'Pendiente'
            }

            // Tabla de Deberes (Deudas)
            if (!db.objectStoreNames.contains(STORES.DEBERES)) {
                const store = db.createObjectStore(STORES.DEBERES, { keyPath: 'id', autoIncrement: true });
                store.createIndex('acredor', 'acredor', { unique: false });
            }

            // Tabla de Mantenimiento
            if (!db.objectStoreNames.contains(STORES.MANTENIMIENTO)) {
                const store = db.createObjectStore(STORES.MANTENIMIENTO, { keyPath: 'id', autoIncrement: true });
                store.createIndex('fecha', 'fecha', { unique: false });
            }

            // Tabla de Kilometraje
            if (!db.objectStoreNames.contains(STORES.KILOMETRAJE)) {
                const store = db.createObjectStore(STORES.KILOMETRAJE, { keyPath: 'id', autoIncrement: true });
                store.createIndex('fecha', 'fecha', { unique: false });
            }

            console.log('✅ Estructura de base de datos creada');
        };
    });
}

// ====== FUNCIONES GENÉRICAS PARA CRUD ======

// Guardar un nuevo registro
function guardarRegistro(storeName, datos) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Base de datos no abierta'));
            return;
        }
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(datos);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Obtener todos los registros de una tabla
function obtenerTodos(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Base de datos no abierta'));
            return;
        }
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Actualizar un registro existente
function actualizarRegistro(storeName, id, nuevosDatos) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Base de datos no abierta'));
            return;
        }
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Primero obtener el registro actual
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const registro = getRequest.result;
            if (!registro) {
                reject(new Error('Registro no encontrado'));
                return;
            }
            // Combinar los datos existentes con los nuevos
            const actualizado = { ...registro, ...nuevosDatos };
            const putRequest = store.put(actualizado);
            putRequest.onsuccess = () => resolve(actualizado);
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Eliminar un registro
function eliminarRegistro(storeName, id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Base de datos no abierta'));
            return;
        }
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ====== DATOS DE EJEMPLO (Para que la app no empiece vacía) ======

async function cargarDatosEjemplo() {
    // Verificar si ya hay datos
    const operaciones = await obtenerTodos(STORES.OPERACIONES);
    if (operaciones.length > 0) return; // Ya hay datos, no cargar ejemplo

    console.log('📝 Cargando datos de ejemplo...');

    // Operaciones de ejemplo
    const hoy = new Date().toISOString().split('T')[0];
    
    const datosEjemplo = {
        operaciones: [
            { fecha: hoy, tipo: 'ingreso', categoria: 'empresa', descripcion: 'Servicios de Transporte', concepto: 'Indraiver', valor: 235000 },
            { fecha: hoy, tipo: 'ingreso', categoria: 'personal', descripcion: 'Salario', concepto: 'Salario', valor: 31000 },
            { fecha: hoy, tipo: 'gasto', categoria: 'empresa', descripcion: 'Gasolina', concepto: 'Gasolina', valor: 70000 },
            { fecha: hoy, tipo: 'gasto', categoria: 'personal', descripcion: 'Mercado', concepto: 'Mercado', valor: 107000 },
            { fecha: hoy, tipo: 'gasto', categoria: 'personal', descripcion: 'Diversion', concepto: 'Cerveza', valor: 7000 },
        ],
        gastosFijos: [
            { concepto: 'Plan Celular', comentario: 'Claro', valor: 45000, diaPago: 1, fechaRealPago: '', estado: 'Pendiente' },
            { concepto: 'Mercado', comentario: '', valor: 300000, diaPago: 1, fechaRealPago: '', estado: 'Pendiente' },
            { concepto: 'Arriendo', comentario: '', valor: 140000, diaPago: 3, fechaRealPago: '', estado: 'Pendiente' },
            { concepto: 'Barberia', comentario: '', valor: 65000, diaPago: 5, fechaRealPago: '', estado: 'Pendiente' },
            { concepto: 'Diversión', comentario: '', valor: 200000, diaPago: 5, fechaRealPago: '', estado: 'Pendiente' },
        ],
        deberes: [
            { concepto: 'Dia de la Madre y Mercado', acredor: 'Laura', fecha: '2026-05-28', total: 110000, pagado: 0, interes: 0 },
            { concepto: 'Celular', acredor: 'Miguel', fecha: '2026-03-28', total: 50000, pagado: 0, interes: 0 },
            { concepto: 'Tatto', acredor: 'Jhonatan', fecha: '', total: 500000, pagado: 0, interes: 0 },
        ],
        mantenimiento: [
            { fecha: '2026-04-27', descripcion: 'Cambio de bateria', valor: 220000, lugar: 'Servicio de bateria a domicilio', kilometraje: '150.900 km' },
            { fecha: '2026-05-04', descripcion: 'Cambio de correa de distribución', valor: 580000, lugar: 'Taller La Estrella', kilometraje: '151.900 km' },
        ],
        kilometraje: [
            { fecha: '2026-05-05', inicio: 151539, fin: '', kmDia: 0, valorGalon: 0, kmPorGalon: 0 },
        ]
    };

    // Guardar datos de ejemplo
    for (const op of datosEjemplo.operaciones) {
        await guardarRegistro(STORES.OPERACIONES, op);
    }
    for (const gf of datosEjemplo.gastosFijos) {
        await guardarRegistro(STORES.GASTOS_FIJOS, gf);
    }
    for (const d of datosEjemplo.deberes) {
        await guardarRegistro(STORES.DEBERES, d);
    }
    for (const m of datosEjemplo.mantenimiento) {
        await guardarRegistro(STORES.MANTENIMIENTO, m);
    }
    for (const k of datosEjemplo.kilometraje) {
        await guardarRegistro(STORES.KILOMETRAJE, k);
    }

    console.log('✅ Datos de ejemplo cargados correctamente');
}

// ====== EXPORTAR FUNCIONES ======
// (Estas funciones estarán disponibles globalmente)
window.DB = {
    abrirDB,
    guardarRegistro,
    obtenerTodos,
    actualizarRegistro,
    eliminarRegistro,
    cargarDatosEjemplo,
    STORES
};