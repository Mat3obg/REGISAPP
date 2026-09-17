// ====== APP.JS - Controlador Principal de REGISAPP ======

// Variables globales
let componenteActual = 'dashboard';

// ====== INICIALIZAR APP ======
async function iniciarApp() {
    console.log('🚀 Iniciando REGISAPP...');
    
    try {
        // 1. Abrir la base de datos
        await DB.abrirDB();
        console.log('✅ Base de datos lista');
        
        // 2. Cargar datos de ejemplo (solo si es la primera vez)
        await DB.cargarDatosEjemplo();
        
        // 3. Configurar el menú de navegación
        configurarNavegacion();
        
        // 4. Cargar el componente inicial (Dashboard)
        await cargarComponente('dashboard');
        
        console.log('✅ REGISAPP lista para usar');
    } catch (error) {
        console.error('❌ Error al iniciar REGISAPP:', error);
        document.getElementById('main-content').innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <h2>⚠️ Error al iniciar</h2>
                <p style="color: #8898aa;">${error.message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

// ====== CONFIGURAR MENÚ DE NAVEGACIÓN ======
function configurarNavegacion() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const component = this.dataset.component;
            if (component && component !== componenteActual) {
                cargarComponente(component);
            }
        });
    });
}

// ====== CARGAR UN COMPONENTE ======
async function cargarComponente(nombre) {
    console.log(`📱 Cargando componente: ${nombre}`);
    componenteActual = nombre;

    // Actualizar menú
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.component === nombre);
    });

    const mainContent = document.getElementById('main-content');

    // Renderizar según el componente
    switch (nombre) {
        case 'dashboard':
            mainContent.innerHTML = await Dashboard.render();
            await Dashboard.actualizar();
            break;
        case 'operaciones':
            mainContent.innerHTML = await Operaciones.render();
            await Operaciones.actualizar();
            break;
        case 'gastosFijos':
            mainContent.innerHTML = await GastosFijos.render();
            await GastosFijos.actualizar();
            break;
        case 'deberes':
            mainContent.innerHTML = await Deberes.render();
            await Deberes.actualizar();
            break;
        case 'mantenimiento':
            mainContent.innerHTML = await Mantenimiento.render();
            await Mantenimiento.actualizar();
            break;
        default:
            mainContent.innerHTML = `<div style="padding: 40px; text-align: center;"><h2>Componente no encontrado</h2></div>`;
    }
}

// ====== INICIAR CUANDO LA PÁGINA ESTÉ LISTA ======
document.addEventListener('DOMContentLoaded', iniciarApp);

// ====== FUNCIONES AUXILIARES GLOBALES ======

// Obtener la fecha actual en formato YYYY-MM-DD
function obtenerFechaHoy() {
    return new Date().toISOString().split('T')[0];
}

// Formatear fecha para mostrar
function formatearFecha(fecha) {
    if (!fecha) return '';
    const partes = fecha.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fecha;
}