// ====== MANTENIMIENTO.JS - Gestión de Reparaciones y Kilometraje ======

async function renderMantenimiento() {
    return `
        <div class="pagina activa" id="pagina-mantenimiento">
            <h2 style="margin-bottom: 16px; font-size: 20px;">🔧 Mantenimiento</h2>
            
            <!-- Sección de Kilometraje -->
            <div class="card">
                <h3>📊 Kilometraje Diario</h3>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                    <div style="flex: 1; min-width: 100px;">
                        <label style="font-size: 12px; color: #8898aa;">Fecha</label>
                        <input type="date" id="km-fecha" value="${obtenerFechaHoy()}" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #dce0e6;">
                    </div>
                    <div style="flex: 1; min-width: 80px;">
                        <label style="font-size: 12px; color: #8898aa;">Inicio (km)</label>
                        <input type="number" id="km-inicio" placeholder="0" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #dce0e6;">
                    </div>
                    <div style="flex: 1; min-width: 80px;">
                        <label style="font-size: 12px; color: #8898aa;">Fin (km)</label>
                        <input type="number" id="km-fin" placeholder="0" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #dce0e6;">
                    </div>
                    <div style="flex: 1; min-width: 80px;">
                        <label style="font-size: 12px; color: #8898aa;">$ Galón</label>
                        <input type="number" id="km-valor-gal" placeholder="0" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #dce0e6;">
                    </div>
                </div>
                <button onclick="Mantenimiento.guardarKilometraje()" class="btn-primary" style="font-size: 13px; padding: 10px;">
                    <i class="fas fa-save"></i> Guardar Kilometraje
                </button>
                <div id="km-resultado" style="margin-top: 10px; padding: 10px; background: #f0f7ff; border-radius: 10px; display: none;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Km recorridos:</span>
                        <span id="km-recorridos" style="font-weight: 700;">0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Km por galón:</span>
                        <span id="km-por-gal" style="font-weight: 700; color: #2d7dff;">0</span>
                    </div>
                </div>
            </div>

            <!-- Sección de Mantenimiento -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="font-size: 16px;">🔩 Reparaciones</h3>
                <button onclick="Mantenimiento.mostrarFormulario()" class="btn-primary" style="width: auto; padding: 8px 16px; font-size: 13px;">
                    <i class="fas fa-plus"></i> Agregar
                </button>
            </div>

            <div class="card" id="tabla-mantenimiento-container">
                <p style="color: #8898aa; text-align: center; padding: 20px;">Cargando mantenimientos...</p>
            </div>
        </div>
    `;
}

// ====== GUARDAR KILOMETRAJE ======
async function guardarKilometraje() {
    const fecha = document.getElementById('km-fecha').value;
    const inicio = parseFloat(document.getElementById('km-inicio').value);
    const fin = parseFloat(document.getElementById('km-fin').value);
    const valorGalon = parseFloat(document.getElementById('km-valor-gal').value);

    if (!fecha || !inicio) {
        alert('Por favor, ingresa al menos la fecha y el kilometraje inicial.');
        return;
    }

    // Calcular km recorridos (si hay fin)
    let kmDia = 0;
    let kmPorGalon = 0;
    
    if (fin && fin > inicio) {
        kmDia = fin - inicio;
        // Si se ingresó el valor del galón, calcular km por galón
        // Asumimos que con el valor del galón se compra 1 galón
        if (valorGalon && valorGalon > 0) {
            // Esta fórmula es una estimación: si con $X se compra 1 galón,
            // entonces los km recorridos son los que se hicieron con ese galón
            kmPorGalon = kmDia;
        }
    }

    const registro = {
        fecha,
        inicio,
        fin: fin || '',
        kmDia,
        valorGalon: valorGalon || 0,
        kmPorGalon
    };

    try {
        await DB.guardarRegistro(DB.STORES.KILOMETRAJE, registro);
        
        // Mostrar resultado
        const resultadoDiv = document.getElementById('km-resultado');
        if (resultadoDiv) {
            resultadoDiv.style.display = 'block';
            document.getElementById('km-recorridos').textContent = `${kmDia} km`;
            document.getElementById('km-por-gal').textContent = kmPorGalon > 0 ? `${kmPorGalon} km/gal` : 'N/A';
        }

        alert('✅ Kilometraje guardado correctamente');
    } catch (error) {
        console.error('Error al guardar kilometraje:', error);
        alert('Error al guardar.');
    }
}

// ====== MOSTRAR FORMULARIO NUEVO MANTENIMIENTO ======
function mostrarFormularioMant() {
    const html = `
        <div id="modal-mant" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px;">
            <div style="background: white; border-radius: 20px; padding: 24px; max-width: 400px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-bottom: 16px;">➕ Nuevo Mantenimiento</h3>
                <form id="form-mant" onsubmit="Mantenimiento.guardar(event)">
                    <div class="form-group">
                        <label>Fecha *</label>
                        <input type="date" id="mant-fecha" value="${obtenerFechaHoy()}" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción *</label>
                        <input type="text" id="mant-descripcion" placeholder="Ej: Cambio de aceite" required>
                    </div>
                    <div class="form-group">
                        <label>Valor ($)</label>
                        <input type="number" id="mant-valor" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Lugar de Reparación</label>
                        <input type="text" id="mant-lugar" placeholder="Taller, mecánico...">
                    </div>
                    <div class="form-group">
                        <label>Kilometraje</label>
                        <input type="text" id="mant-kilometraje" placeholder="Ej: 150.900 km">
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 16px;">
                        <button type="button" onclick="Mantenimiento.cerrarModal()" class="btn-secondary" style="flex:1;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:2;">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const modalExistente = document.getElementById('modal-mant');
    if (modalExistente) modalExistente.remove();

    document.body.insertAdjacentHTML('beforeend', html);
}

// ====== CERRAR MODAL ======
function cerrarModalMant() {
    const modal = document.getElementById('modal-mant');
    if (modal) modal.remove();
}

// ====== GUARDAR MANTENIMIENTO ======
async function guardarMant(event) {
    event.preventDefault();

    const fecha = document.getElementById('mant-fecha').value;
    const descripcion = document.getElementById('mant-descripcion').value.trim();
    const valor = parseFloat(document.getElementById('mant-valor').value) || 0;
    const lugar = document.getElementById('mant-lugar').value.trim();
    const kilometraje = document.getElementById('mant-kilometraje').value.trim();

    if (!fecha || !descripcion) {
        alert('Por favor, completa los campos obligatorios.');
        return;
    }

    const nuevoMant = {
        fecha,
        descripcion,
        valor,
        lugar: lugar || '',
        kilometraje: kilometraje || '',
        fechaCreacion: new Date().toISOString()
    };

    try {
        await DB.guardarRegistro(DB.STORES.MANTENIMIENTO, nuevoMant);
        cerrarModalMant();
        await Mantenimiento.actualizar();
    } catch (error) {
        console.error('Error al guardar mantenimiento:', error);
        alert('Error al guardar.');
    }
}

// ====== ACTUALIZAR TABLA DE MANTENIMIENTO ======
async function actualizarMantenimiento() {
    try {
        const mantenimientos = await DB.obtenerTodos(DB.STORES.MANTENIMIENTO);
        const container = document.getElementById('tabla-mantenimiento-container');

        if (mantenimientos.length === 0) {
            container.innerHTML = `
                <p style="color: #8898aa; text-align: center; padding: 30px;">
                    <i class="fas fa-tools" style="font-size: 40px; display: block; margin-bottom: 10px;"></i>
                    No hay mantenimientos registrados
                </p>
            `;
            return;
        }

        // Ordenar por fecha (más reciente primero)
        mantenimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        let html = `
            <div style="overflow-x: auto;">
                <table class="tabla">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th style="text-align: right;">Valor</th>
                            <th style="text-align: center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        mantenimientos.forEach(m => {
            html += `
                <tr>
                    <td style="font-size: 12px;">${formatearFecha(m.fecha)}</td>
                    <td>
                        <div style="font-weight: 500;">${m.descripcion}</div>
                        ${m.lugar ? `<div style="font-size: 11px; color: #8898aa;">${m.lugar}</div>` : ''}
                        ${m.kilometraje ? `<div style="font-size: 11px; color: #8898aa;">${m.kilometraje}</div>` : ''}
                    </td>
                    <td style="text-align: right; font-weight: 500;">${m.valor ? '$' + formatearNumero(m.valor) : '-'}</td>
                    <td style="text-align: center;">
                        <button onclick="Mantenimiento.eliminar(${m.id})" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        console.error('Error al actualizar mantenimiento:', error);
    }
}

// ====== ELIMINAR MANTENIMIENTO ======
async function eliminarMant(id) {
    if (!confirm('¿Estás seguro de eliminar este mantenimiento?')) return;
    
    try {
        await DB.eliminarRegistro(DB.STORES.MANTENIMIENTO, id);
        await Mantenimiento.actualizar();
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar.');
    }
}

// ====== EXPORTAR ======
window.Mantenimiento = {
    render: renderMantenimiento,
    actualizar: actualizarMantenimiento,
    guardarKilometraje: guardarKilometraje,
    mostrarFormulario: mostrarFormularioMant,
    cerrarModal: cerrarModalMant,
    guardar: guardarMant,
    eliminar: eliminarMant
};