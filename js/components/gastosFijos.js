// ====== GASTOS FIJOS.JS - Gestión de Gastos Fijos Mensuales ======

async function renderGastosFijos() {
    return `
        <div class="pagina activa" id="pagina-gastosFijos">
            <h2 style="margin-bottom: 16px; font-size: 20px;">💳 Gastos Fijos</h2>
            
            <!-- Resumen -->
            <div class="card" style="background: #f8f9fc;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: #8898aa;">Pagado</div>
                        <div style="font-size: 18px; font-weight: 700; color: #2ecc71;" id="gf-total-pagado">$0</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: #8898aa;">Pendiente</div>
                        <div style="font-size: 18px; font-weight: 700; color: #e74c3c;" id="gf-total-pendiente">$0</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: #8898aa;">Total</div>
                        <div style="font-size: 18px; font-weight: 700; color: #2d7dff;" id="gf-total-general">$0</div>
                    </div>
                </div>
            </div>

            <!-- Botón para agregar -->
            <button onclick="GastosFijos.mostrarFormulario()" class="btn-primary" style="margin-bottom: 12px;">
                <i class="fas fa-plus"></i> Agregar Gasto Fijo
            </button>

            <!-- Lista de Gastos Fijos -->
            <div class="card" id="tabla-gastos-fijos-container">
                <p style="color: #8898aa; text-align: center; padding: 20px;">Cargando gastos fijos...</p>
            </div>
        </div>
    `;
}

// ====== MOSTRAR FORMULARIO NUEVO GASTO FIJO ======
function mostrarFormularioGF() {
    const html = `
        <div id="modal-gf" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px;">
            <div style="background: white; border-radius: 20px; padding: 24px; max-width: 400px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-bottom: 16px;">➕ Nuevo Gasto Fijo</h3>
                <form id="form-gf" onsubmit="GastosFijos.guardar(event)">
                    <div class="form-group">
                        <label>Concepto *</label>
                        <input type="text" id="gf-concepto" placeholder="Ej: Arriendo, Celular..." required>
                    </div>
                    <div class="form-group">
                        <label>Comentario</label>
                        <input type="text" id="gf-comentario" placeholder="Detalle adicional">
                    </div>
                    <div class="form-group">
                        <label>Valor ($) *</label>
                        <input type="number" id="gf-valor" placeholder="0" required>
                    </div>
                    <div class="form-group">
                        <label>Día de Pago</label>
                        <input type="number" id="gf-dia" placeholder="1-31" min="1" max="31">
                    </div>
                    <div class="form-group">
                        <label>Fecha Real de Pago</label>
                        <input type="date" id="gf-fecha-real">
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <select id="gf-estado">
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pago">Pagado</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 16px;">
                        <button type="button" onclick="GastosFijos.cerrarModal()" class="btn-secondary" style="flex:1;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:2;">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const modalExistente = document.getElementById('modal-gf');
    if (modalExistente) modalExistente.remove();

    document.body.insertAdjacentHTML('beforeend', html);
}

// ====== CERRAR MODAL ======
function cerrarModalGF() {
    const modal = document.getElementById('modal-gf');
    if (modal) modal.remove();
}

// ====== GUARDAR GASTO FIJO ======
async function guardarGF(event) {
    event.preventDefault();

    const concepto = document.getElementById('gf-concepto').value.trim();
    const comentario = document.getElementById('gf-comentario').value.trim();
    const valor = parseFloat(document.getElementById('gf-valor').value);
    const dia = parseInt(document.getElementById('gf-dia').value) || null;
    const fechaReal = document.getElementById('gf-fecha-real').value || '';
    const estado = document.getElementById('gf-estado').value;

    if (!concepto || !valor || valor <= 0) {
        alert('Por favor, completa los campos obligatorios.');
        return;
    }

    const nuevoGF = {
        concepto,
        comentario: comentario || '',
        valor,
        diaPago: dia,
        fechaRealPago: fechaReal,
        estado: estado,
        fechaCreacion: new Date().toISOString()
    };

    try {
        await DB.guardarRegistro(DB.STORES.GASTOS_FIJOS, nuevoGF);
        cerrarModalGF();
        await GastosFijos.actualizar();
    } catch (error) {
        console.error('Error al guardar gasto fijo:', error);
        alert('Error al guardar.');
    }
}

// ====== ACTUALIZAR TABLA DE GASTOS FIJOS ======
async function actualizarGastosFijos() {
    try {
        const gf = await DB.obtenerTodos(DB.STORES.GASTOS_FIJOS);
        const container = document.getElementById('tabla-gastos-fijos-container');

        let totalPagado = 0;
        let totalPendiente = 0;
        let totalGeneral = 0;

        if (gf.length === 0) {
            container.innerHTML = `
                <p style="color: #8898aa; text-align: center; padding: 30px;">
                    <i class="fas fa-credit-card" style="font-size: 40px; display: block; margin-bottom: 10px;"></i>
                    No hay gastos fijos registrados
                </p>
            `;
            document.getElementById('gf-total-pagado').textContent = '$0';
            document.getElementById('gf-total-pendiente').textContent = '$0';
            document.getElementById('gf-total-general').textContent = '$0';
            return;
        }

        let html = `
            <div style="overflow-x: auto;">
                <table class="tabla">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Valor</th>
                            <th>Estado</th>
                            <th style="text-align: center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        gf.forEach(g => {
            totalGeneral += g.valor;
            if (g.estado === 'Pago') {
                totalPagado += g.valor;
            } else {
                totalPendiente += g.valor;
            }

            const estadoClass = g.estado === 'Pago' ? 'pagado' : 'pendiente';

            html += `
                <tr>
                    <td>
                        <div style="font-weight: 500;">${g.concepto}</div>
                        ${g.comentario ? `<div style="font-size: 11px; color: #8898aa;">${g.comentario}</div>` : ''}
                    </td>
                    <td style="font-weight: 600;">$${formatearNumero(g.valor)}</td>
                    <td>
                        <span class="estado-pago ${estadoClass}">${g.estado}</span>
                        ${g.fechaRealPago ? `<div style="font-size: 10px; color: #8898aa;">${formatearFecha(g.fechaRealPago)}</div>` : ''}
                    </td>
                    <td style="text-align: center;">
                        <button onclick="GastosFijos.cambiarEstado(${g.id}, '${g.estado}')" style="background: none; border: none; color: #2d7dff; cursor: pointer; font-size: 14px; margin-right: 8px;">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button onclick="GastosFijos.eliminar(${g.id})" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 14px;">
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

        // Actualizar resumen
        document.getElementById('gf-total-pagado').textContent = `$${formatearNumero(totalPagado)}`;
        document.getElementById('gf-total-pendiente').textContent = `$${formatearNumero(totalPendiente)}`;
        document.getElementById('gf-total-general').textContent = `$${formatearNumero(totalGeneral)}`;

    } catch (error) {
        console.error('Error al actualizar gastos fijos:', error);
    }
}

// ====== CAMBIAR ESTADO ======
async function cambiarEstadoGF(id, estadoActual) {
    const nuevoEstado = estadoActual === 'Pago' ? 'Pendiente' : 'Pago';
    const fechaReal = nuevoEstado === 'Pago' ? obtenerFechaHoy() : '';
    
    try {
        await DB.actualizarRegistro(DB.STORES.GASTOS_FIJOS, id, {
            estado: nuevoEstado,
            fechaRealPago: fechaReal
        });

        // Si se marcó como pagado, crear una operación automática
        if (nuevoEstado === 'Pago') {
            const gf = await DB.obtenerTodos(DB.STORES.GASTOS_FIJOS);
            const gasto = gf.find(g => g.id === id);
            if (gasto) {
                await DB.guardarRegistro(DB.STORES.OPERACIONES, {
                    fecha: fechaReal,
                    tipo: 'gasto',
                    categoria: 'personal',
                    descripcion: `${gasto.concepto} (Gasto Fijo)`,
                    concepto: gasto.comentario || '',
                    valor: gasto.valor
                });
                // Actualizar dashboard si está visible
                if (window.Dashboard) {
                    await Dashboard.actualizar();
                }
            }
        }

        await GastosFijos.actualizar();
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar el estado.');
    }
}

// ====== ELIMINAR ======
async function eliminarGF(id) {
    if (!confirm('¿Estás seguro de eliminar este gasto fijo?')) return;
    
    try {
        await DB.eliminarRegistro(DB.STORES.GASTOS_FIJOS, id);
        await GastosFijos.actualizar();
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar.');
    }
}

// ====== EXPORTAR ======
window.GastosFijos = {
    render: renderGastosFijos,
    actualizar: actualizarGastosFijos,
    mostrarFormulario: mostrarFormularioGF,
    cerrarModal: cerrarModalGF,
    guardar: guardarGF,
    cambiarEstado: cambiarEstadoGF,
    eliminar: eliminarGF
};