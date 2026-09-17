// ====== OPERACIONES.JS - Gestión de Ingresos y Gastos Diarios ======

async function renderOperaciones() {
    return `
        <div class="pagina activa" id="pagina-operaciones">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 style="font-size: 20px;">📋 Operaciones</h2>
                <button onclick="Operaciones.mostrarFormulario()" class="btn-primary" style="width: auto; padding: 10px 18px;">
                    <i class="fas fa-plus"></i> Nuevo
                </button>
            </div>

            <!-- Filtros -->
            <div class="card" style="padding: 12px;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <select id="filtro-tipo" onchange="Operaciones.aplicarFiltros()" style="flex:1; padding: 8px; border-radius: 8px; border: 1px solid #dce0e6;">
                        <option value="todos">Todos</option>
                        <option value="ingreso">Ingresos</option>
                        <option value="gasto">Gastos</option>
                    </select>
                    <select id="filtro-categoria" onchange="Operaciones.aplicarFiltros()" style="flex:1; padding: 8px; border-radius: 8px; border: 1px solid #dce0e6;">
                        <option value="todas">Todas</option>
                        <option value="personal">Personal</option>
                        <option value="empresa">Empresa</option>
                    </select>
                </div>
            </div>

            <!-- Tabla de Operaciones -->
            <div class="card">
                <div class="tabla-container" id="tabla-operaciones-container">
                    <p style="color: #8898aa; text-align: center; padding: 20px;">Cargando operaciones...</p>
                </div>
            </div>

            <!-- Total del día -->
            <div class="card" style="background: #f8f9fc;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600;">Total del día</span>
                    <span id="total-dia-operaciones" style="font-size: 18px; font-weight: 700; color: #2d7dff;">$0</span>
                </div>
            </div>
        </div>
    `;
}

// ====== MOSTRAR FORMULARIO PARA NUEVA OPERACIÓN ======
function mostrarFormularioOperacion() {
    const html = `
        <div id="modal-operacion" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px;">
            <div style="background: white; border-radius: 20px; padding: 24px; max-width: 400px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-bottom: 16px;">➕ Nueva Operación</h3>
                <form id="form-operacion" onsubmit="Operaciones.guardarOperacion(event)">
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date" id="op-fecha" value="${obtenerFechaHoy()}" required>
                    </div>
                    <div class="form-group">
                        <label>Tipo</label>
                        <select id="op-tipo" required>
                            <option value="ingreso">Ingreso</option>
                            <option value="gasto">Gasto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <select id="op-categoria" required>
                            <option value="personal">Personal</option>
                            <option value="empresa">Empresa</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <input type="text" id="op-descripcion" placeholder="Ej: Salario, Mercado, Gasolina..." required>
                    </div>
                    <div class="form-group">
                        <label>Concepto / Detalle</label>
                        <input type="text" id="op-concepto" placeholder="Detalle adicional">
                    </div>
                    <div class="form-group">
                        <label>Valor ($)</label>
                        <input type="number" id="op-valor" placeholder="0" required>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 16px;">
                        <button type="button" onclick="Operaciones.cerrarModal()" class="btn-secondary" style="flex:1;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:2;">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Eliminar modal existente si hay
    const modalExistente = document.getElementById('modal-operacion');
    if (modalExistente) modalExistente.remove();

    document.body.insertAdjacentHTML('beforeend', html);
}

// ====== CERRAR MODAL ======
function cerrarModalOperacion() {
    const modal = document.getElementById('modal-operacion');
    if (modal) modal.remove();
}

// ====== GUARDAR OPERACIÓN ======
async function guardarOperacion(event) {
    event.preventDefault();

    const fecha = document.getElementById('op-fecha').value;
    const tipo = document.getElementById('op-tipo').value;
    const categoria = document.getElementById('op-categoria').value;
    const descripcion = document.getElementById('op-descripcion').value.trim();
    const concepto = document.getElementById('op-concepto').value.trim();
    const valor = parseFloat(document.getElementById('op-valor').value);

    if (!descripcion || !valor || valor <= 0) {
        alert('Por favor, completa todos los campos correctamente.');
        return;
    }

    const nuevaOperacion = {
        fecha,
        tipo,
        categoria,
        descripcion,
        concepto: concepto || descripcion,
        valor,
        fechaCreacion: new Date().toISOString()
    };

    try {
        await DB.guardarRegistro(DB.STORES.OPERACIONES, nuevaOperacion);
        cerrarModalOperacion();
        // Recargar la tabla
        await Operaciones.actualizar();
        // Actualizar dashboard también
        if (window.Dashboard) {
            await Dashboard.actualizar();
        }
    } catch (error) {
        console.error('Error al guardar operación:', error);
        alert('Error al guardar. Por favor, intenta de nuevo.');
    }
}

// ====== ACTUALIZAR TABLA DE OPERACIONES ======
async function actualizarOperaciones() {
    try {
        const operaciones = await DB.obtenerTodos(DB.STORES.OPERACIONES);
        
        // Ordenar por fecha (más reciente primero)
        operaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        const container = document.getElementById('tabla-operaciones-container');
        
        if (operaciones.length === 0) {
            container.innerHTML = `
                <p style="color: #8898aa; text-align: center; padding: 30px;">
                    <i class="fas fa-inbox" style="font-size: 40px; display: block; margin-bottom: 10px;"></i>
                    No hay operaciones registradas
                </p>
                <button onclick="Operaciones.mostrarFormulario()" class="btn-primary">
                    <i class="fas fa-plus"></i> Agregar tu primera operación
                </button>
            `;
            return;
        }

        let html = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th style="text-align: right;">Valor</th>
                        <th style="text-align: center;">Acción</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Aplicar filtros
        const filtroTipo = document.getElementById('filtro-tipo')?.value || 'todos';
        const filtroCategoria = document.getElementById('filtro-categoria')?.value || 'todas';

        let totalDia = 0;
        const hoy = obtenerFechaHoy();

        const operacionesFiltradas = operaciones.filter(op => {
            let mostrar = true;
            if (filtroTipo !== 'todos' && op.tipo !== filtroTipo) mostrar = false;
            if (filtroCategoria !== 'todas' && op.categoria !== filtroCategoria) mostrar = false;
            return mostrar;
        });

        operacionesFiltradas.forEach(op => {
            const esIngreso = op.tipo === 'ingreso';
            const color = esIngreso ? '#2ecc71' : '#e74c3c';
            const signo = esIngreso ? '+' : '-';
            
            // Sumar total del día
            if (op.fecha === hoy) {
                totalDia += esIngreso ? op.valor : -op.valor;
            }

            html += `
                <tr>
                    <td style="font-size: 12px;">${formatearFecha(op.fecha)}</td>
                    <td>
                        <div style="font-weight: 500;">${op.descripcion}</div>
                        <div style="font-size: 11px; color: #8898aa;">${op.concepto || ''}</div>
                    </td>
                    <td><span style="font-size: 11px; background: #f0f2f5; padding: 2px 10px; border-radius: 12px;">${op.categoria}</span></td>
                    <td style="text-align: right; font-weight: 600; color: ${color};">${signo}$${formatearNumero(op.valor)}</td>
                    <td style="text-align: center;">
                        <button onclick="Operaciones.eliminar(${op.id})" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 16px;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;

        // Actualizar total del día
        const totalDiaElement = document.getElementById('total-dia-operaciones');
        if (totalDiaElement) {
            totalDiaElement.textContent = `$${formatearNumero(totalDia)}`;
            totalDiaElement.style.color = totalDia >= 0 ? '#2d7dff' : '#e74c3c';
        }

    } catch (error) {
        console.error('Error al actualizar operaciones:', error);
        const container = document.getElementById('tabla-operaciones-container');
        container.innerHTML = `<p style="color: #e74c3c; text-align: center; padding: 20px;">Error al cargar operaciones</p>`;
    }
}

// ====== ELIMINAR OPERACIÓN ======
async function eliminarOperacion(id) {
    if (!confirm('¿Estás seguro de eliminar esta operación?')) return;
    
    try {
        await DB.eliminarRegistro(DB.STORES.OPERACIONES, id);
        await Operaciones.actualizar();
        if (window.Dashboard) {
            await Dashboard.actualizar();
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la operación.');
    }
}

// ====== APLICAR FILTROS ======
function aplicarFiltros() {
    actualizarOperaciones();
}

// ====== EXPORTAR ======
window.Operaciones = {
    render: renderOperaciones,
    actualizar: actualizarOperaciones,
    mostrarFormulario: mostrarFormularioOperacion,
    cerrarModal: cerrarModalOperacion,
    guardarOperacion: guardarOperacion,
    eliminar: eliminarOperacion,
    aplicarFiltros: aplicarFiltros
};