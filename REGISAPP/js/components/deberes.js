// ====== DEBERES.JS - Gestión de Deudas ======

async function renderDeberes() {
    return `
        <div class="pagina activa" id="pagina-deberes">
            <h2 style="margin-bottom: 16px; font-size: 20px;">📋 Deberes (Deudas)</h2>
            
            <!-- Resumen -->
            <div class="card" style="background: #f8f9fc;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: #8898aa;">Total Deudas</div>
                        <div style="font-size: 18px; font-weight: 700; color: #e74c3c;" id="deb-total-deudas">$0</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 11px; color: #8898aa;">Cuota Diaria</div>
                        <div style="font-size: 18px; font-weight: 700; color: #2d7dff;" id="deb-cuota-diaria">$0</div>
                    </div>
                </div>
            </div>

            <!-- Botón para agregar -->
            <button onclick="Deberes.mostrarFormulario()" class="btn-primary" style="margin-bottom: 12px;">
                <i class="fas fa-plus"></i> Agregar Deuda
            </button>

            <!-- Lista de Deudas -->
            <div class="card" id="tabla-deberes-container">
                <p style="color: #8898aa; text-align: center; padding: 20px;">Cargando deudas...</p>
            </div>
        </div>
    `;
}

// ====== MOSTRAR FORMULARIO NUEVA DEUDA ======
function mostrarFormularioDeb() {
    const html = `
        <div id="modal-deb" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px;">
            <div style="background: white; border-radius: 20px; padding: 24px; max-width: 400px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-bottom: 16px;">➕ Nueva Deuda</h3>
                <form id="form-deb" onsubmit="Deberes.guardar(event)">
                    <div class="form-group">
                        <label>Concepto *</label>
                        <input type="text" id="deb-concepto" placeholder="Ej: Préstamo, Compra..." required>
                    </div>
                    <div class="form-group">
                        <label>Acreedor *</label>
                        <input type="text" id="deb-acredor" placeholder="Nombre de la persona/entidad" required>
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date" id="deb-fecha" value="${obtenerFechaHoy()}">
                    </div>
                    <div class="form-group">
                        <label>Total ($) *</label>
                        <input type="number" id="deb-total" placeholder="0" required>
                    </div>
                    <div class="form-group">
                        <label>Pagado ($)</label>
                        <input type="number" id="deb-pagado" placeholder="0" value="0">
                    </div>
                    <div class="form-group">
                        <label>Interés (%)</label>
                        <input type="number" id="deb-interes" placeholder="0" value="0">
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 16px;">
                        <button type="button" onclick="Deberes.cerrarModal()" class="btn-secondary" style="flex:1;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:2;">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const modalExistente = document.getElementById('modal-deb');
    if (modalExistente) modalExistente.remove();

    document.body.insertAdjacentHTML('beforeend', html);
}

// ====== CERRAR MODAL ======
function cerrarModalDeb() {
    const modal = document.getElementById('modal-deb');
    if (modal) modal.remove();
}

// ====== GUARDAR DEUDA ======
async function guardarDeb(event) {
    event.preventDefault();

    const concepto = document.getElementById('deb-concepto').value.trim();
    const acredor = document.getElementById('deb-acredor').value.trim();
    const fecha = document.getElementById('deb-fecha').value;
    const total = parseFloat(document.getElementById('deb-total').value);
    const pagado = parseFloat(document.getElementById('deb-pagado').value) || 0;
    const interes = parseFloat(document.getElementById('deb-interes').value) || 0;

    if (!concepto || !acredor || !total || total <= 0) {
        alert('Por favor, completa los campos obligatorios.');
        return;
    }

    const nuevaDeuda = {
        concepto,
        acredor,
        fecha: fecha || '',
        total,
        pagado,
        interes,
        fechaCreacion: new Date().toISOString()
    };

    try {
        await DB.guardarRegistro(DB.STORES.DEBERES, nuevaDeuda);
        cerrarModalDeb();
        await Deberes.actualizar();
        if (window.Dashboard) {
            await Dashboard.actualizar();
        }
    } catch (error) {
        console.error('Error al guardar deuda:', error);
        alert('Error al guardar.');
    }
}

// ====== ACTUALIZAR TABLA DE DEUDAS ======
async function actualizarDeberes() {
    try {
        const deudas = await DB.obtenerTodos(DB.STORES.DEBERES);
        const container = document.getElementById('tabla-deberes-container');

        let totalDeudas = 0;

        if (deudas.length === 0) {
            container.innerHTML = `
                <p style="color: #8898aa; text-align: center; padding: 30px;">
                    <i class="fas fa-hand-holding-usd" style="font-size: 40px; display: block; margin-bottom: 10px;"></i>
                    No hay deudas registradas
                </p>
            `;
            document.getElementById('deb-total-deudas').textContent = '$0';
            document.getElementById('deb-cuota-diaria').textContent = '$0';
            return;
        }

        let html = `
            <div style="overflow-x: auto;">
                <table class="tabla">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Acreedor</th>
                            <th style="text-align: right;">Total</th>
                            <th style="text-align: right;">Pagado</th>
                            <th style="text-align: right;">Resta</th>
                            <th style="text-align: center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        deudas.forEach(d => {
            const resta = d.total - d.pagado;
            totalDeudas += resta;

            html += `
                <tr>
                    <td>
                        <div style="font-weight: 500;">${d.concepto}</div>
                        ${d.fecha ? `<div style="font-size: 10px; color: #8898aa;">${formatearFecha(d.fecha)}</div>` : ''}
                    </td>
                    <td>${d.acredor}</td>
                    <td style="text-align: right; font-weight: 500;">$${formatearNumero(d.total)}</td>
                    <td style="text-align: right; color: #2ecc71;">$${formatearNumero(d.pagado)}</td>
                    <td style="text-align: right; font-weight: 700; color: ${resta > 0 ? '#e74c3c' : '#2ecc71'};">$${formatearNumero(resta)}</td>
                    <td style="text-align: center;">
                        <button onclick="Deberes.eliminar(${d.id})" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 14px;">
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
        document.getElementById('deb-total-deudas').textContent = `$${formatearNumero(totalDeudas)}`;
        document.getElementById('deb-cuota-diaria').textContent = `$${formatearNumero(totalDeudas / 30)}`;

    } catch (error) {
        console.error('Error al actualizar deudas:', error);
    }
}

// ====== ELIMINAR DEUDA ======
async function eliminarDeb(id) {
    if (!confirm('¿Estás seguro de eliminar esta deuda?')) return;
    
    try {
        await DB.eliminarRegistro(DB.STORES.DEBERES, id);
        await Deberes.actualizar();
        if (window.Dashboard) {
            await Dashboard.actualizar();
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar.');
    }
}

// ====== EXPORTAR ======
window.Deberes = {
    render: renderDeberes,
    actualizar: actualizarDeberes,
    mostrarFormulario: mostrarFormularioDeb,
    cerrarModal: cerrarModalDeb,
    guardar: guardarDeb,
    eliminar: eliminarDeb
};