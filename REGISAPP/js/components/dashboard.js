// ====== DASHBOARD.JS - Pantalla de Inicio (Resumen) ======

async function renderDashboard() {
    return `
        <div class="pagina activa" id="pagina-dashboard">
            <h2 style="margin-bottom: 16px; font-size: 20px;">📊 Resumen Financiero</h2>
            
            <!-- Tarjeta de Resumen -->
            <div class="card">
                <h3>💰 Resumen General</h3>
                <div class="resumen-grid" id="resumen-general">
                    <div class="resumen-item ingresos">
                        <div class="valor" id="total-ingresos">$0</div>
                        <div class="etiqueta">Ingresos</div>
                    </div>
                    <div class="resumen-item gastos">
                        <div class="valor" id="total-gastos">$0</div>
                        <div class="etiqueta">Gastos</div>
                    </div>
                    <div class="resumen-item saldo">
                        <div class="valor" id="total-saldo">$0</div>
                        <div class="etiqueta">Saldo</div>
                    </div>
                </div>
            </div>

            <!-- Tarjeta de Resumen por Categoría -->
            <div class="card">
                <h3>🏷️ Por Categoría</h3>
                <div id="resumen-categoria">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                        <span>🏢 Empresa</span>
                        <span id="resumen-empresa">$0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                        <span>👤 Personal</span>
                        <span id="resumen-personal">$0</span>
                    </div>
                </div>
            </div>

            <!-- Tarjeta de Deberes -->
            <div class="card">
                <h3>📋 Deberes Pendientes</h3>
                <div id="resumen-deberes">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                        <span>Total Deudas</span>
                        <span id="total-deudas">$0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                        <span>Cuota Mínima Diaria</span>
                        <span id="cuota-diaria">$0</span>
                    </div>
                </div>
            </div>

            <!-- Tarjeta de Últimos Gastos -->
            <div class="card">
                <h3>🕐 Últimos Gastos</h3>
                <div id="ultimos-gastos">
                    <p style="color: #8898aa; text-align: center; padding: 10px;">Cargando...</p>
                </div>
            </div>
        </div>
    `;
}

// ====== ACTUALIZAR DASHBOARD CON DATOS REALES ======
async function actualizarDashboard() {
    try {
        // Obtener todas las operaciones
        const operaciones = await DB.obtenerTodos(DB.STORES.OPERACIONES);
        
        // Calcular totales
        let totalIngresos = 0;
        let totalGastos = 0;
        let totalEmpresa = 0;
        let totalPersonal = 0;

        operaciones.forEach(op => {
            if (op.tipo === 'ingreso') {
                totalIngresos += op.valor;
                if (op.categoria === 'empresa') totalEmpresa += op.valor;
                else totalPersonal += op.valor;
            } else if (op.tipo === 'gasto') {
                totalGastos += op.valor;
                if (op.categoria === 'empresa') totalEmpresa -= op.valor;
                else totalPersonal -= op.valor;
            }
        });

        const saldo = totalIngresos - totalGastos;

        // Actualizar el DOM
        document.getElementById('total-ingresos').textContent = `$${formatearNumero(totalIngresos)}`;
        document.getElementById('total-gastos').textContent = `$${formatearNumero(totalGastos)}`;
        document.getElementById('total-saldo').textContent = `$${formatearNumero(saldo)}`;
        document.getElementById('resumen-empresa').textContent = `$${formatearNumero(totalEmpresa)}`;
        document.getElementById('resumen-personal').textContent = `$${formatearNumero(totalPersonal)}`;

        // ====== DEBERES ======
        const deberes = await DB.obtenerTodos(DB.STORES.DEBERES);
        let totalDeudas = 0;
        deberes.forEach(d => {
            totalDeudas += (d.total - d.pagado);
        });
        
        // Cuota diaria (asumiendo 30 días)
        const cuotaDiaria = totalDeudas / 30;
        
        document.getElementById('total-deudas').textContent = `$${formatearNumero(totalDeudas)}`;
        document.getElementById('cuota-diaria').textContent = `$${formatearNumero(cuotaDiaria)}`;

        // ====== ÚLTIMOS GASTOS ======
        const gastos = operaciones
            .filter(op => op.tipo === 'gasto')
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 5);

        const container = document.getElementById('ultimos-gastos');
        if (gastos.length === 0) {
            container.innerHTML = '<p style="color: #8898aa; text-align: center; padding: 10px;">No hay gastos recientes</p>';
        } else {
            container.innerHTML = gastos.map(g => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eef1f5;">
                    <div>
                        <div style="font-weight: 500;">${g.descripcion}</div>
                        <div style="font-size: 11px; color: #8898aa;">${g.fecha} · ${g.categoria}</div>
                    </div>
                    <div style="color: #e74c3c; font-weight: 600;">-$${formatearNumero(g.valor)}</div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error al actualizar dashboard:', error);
    }
}

// ====== FUNCIÓN AUXILIAR: Formatear números ======
function formatearNumero(num) {
    if (num === undefined || num === null) return '0';
    return Math.round(num).toLocaleString('es-CO');
}

// ====== EXPORTAR ======
window.Dashboard = {
    render: renderDashboard,
    actualizar: actualizarDashboard
};