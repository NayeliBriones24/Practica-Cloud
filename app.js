/*
Fecha: 20/07/2026
Integrantes:
- Briones Pico Angela Nayeli
-Velez Lopera Domenica Liceth
*/
// Categorías disponibles según el tipo de movimiento.
const categorias = {
    ingreso: [
        "Sueldo",
        "Ventas",
        "Bonificaciones",
        "Regalos",
        "Otros ingresos"
    ],
    gasto: [
        "Alimentación",
        "Transporte",
        "Educación",
        "Salud",
        "Servicios básicos",
        "Entretenimiento",
        "Compras",
        "Otros gastos"
    ]
};

// Claves utilizadas para guardar datos en localStorage.
const CLAVE_MOVIMIENTOS = "finanzasCloud_movimientos";
const CLAVE_PRESUPUESTO = "finanzasCloud_presupuesto";

// Recuperar datos guardados o iniciar valores vacíos.
let movimientos = obtenerMovimientosGuardados();
let presupuestoMensual = obtenerPresupuestoGuardado();

// Referencias del formulario de movimientos.
const formMovimiento = document.getElementById("formMovimiento");
const movimientoId = document.getElementById("movimientoId");
const tipo = document.getElementById("tipo");
const descripcion = document.getElementById("descripcion");
const categoria = document.getElementById("categoria");
const monto = document.getElementById("monto");
const fecha = document.getElementById("fecha");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
const modoFormulario = document.getElementById("modoFormulario");
const mensajeFormulario = document.getElementById("mensajeFormulario");

// Referencias del presupuesto.
const formPresupuesto = document.getElementById("formPresupuesto");
const presupuestoMensualInput = document.getElementById("presupuestoMensual");
const barraPresupuesto = document.getElementById("barraPresupuesto");
const porcentajePresupuesto = document.getElementById("porcentajePresupuesto");
const textoPresupuesto = document.getElementById("textoPresupuesto");
const alertaPresupuesto = document.getElementById("alertaPresupuesto");

// Referencias del resumen.
const totalIngresos = document.getElementById("totalIngresos");
const totalGastos = document.getElementById("totalGastos");
const saldoDisponible = document.getElementById("saldoDisponible");
const presupuestoRestante = document.getElementById("presupuestoRestante");

// Referencias de filtros y tabla.
const buscar = document.getElementById("buscar");
const filtroTipo = document.getElementById("filtroTipo");
const filtroCategoria = document.getElementById("filtroCategoria");
const orden = document.getElementById("orden");
const tablaMovimientos = document.getElementById("tablaMovimientos");
const sinResultados = document.getElementById("sinResultados");
const contadorRegistros = document.getElementById("contadorRegistros");

// Botones generales.
const btnExportar = document.getElementById("btnExportar");
const btnLimpiarDatos = document.getElementById("btnLimpiarDatos");

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

function iniciarAplicacion() {
    establecerFechaActual();
    actualizarCategoriasFormulario();
    actualizarFiltroCategorias();

    if (presupuestoMensual > 0) {
        presupuestoMensualInput.value = presupuestoMensual;
    }

    renderizarAplicacion();
}

// ================================================
// EVENTOS
// ================================================

formMovimiento.addEventListener("submit", guardarMovimiento);
tipo.addEventListener("change", actualizarCategoriasFormulario);
btnCancelarEdicion.addEventListener("click", cancelarEdicion);

formPresupuesto.addEventListener("submit", guardarPresupuesto);

buscar.addEventListener("input", renderizarTabla);
filtroTipo.addEventListener("change", renderizarTabla);
filtroCategoria.addEventListener("change", renderizarTabla);
orden.addEventListener("change", renderizarTabla);

btnExportar.addEventListener("click", exportarCSV);
btnLimpiarDatos.addEventListener("click", limpiarTodosLosDatos);

// ================================================
// LOCALSTORAGE
// ================================================

function obtenerMovimientosGuardados() {
    try {
        const datos = localStorage.getItem(CLAVE_MOVIMIENTOS);
        return datos ? JSON.parse(datos) : [];
    } catch (error) {
        console.error("No se pudieron recuperar los movimientos:", error);
        return [];
    }
}

function obtenerPresupuestoGuardado() {
    const valor = Number(localStorage.getItem(CLAVE_PRESUPUESTO));
    return Number.isFinite(valor) && valor > 0 ? valor : 0;
}

function guardarMovimientosEnNavegador() {
    localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos));
}

function guardarPresupuestoEnNavegador() {
    localStorage.setItem(CLAVE_PRESUPUESTO, String(presupuestoMensual));
}

// ================================================
// FORMULARIO Y CATEGORÍAS
// ================================================

function establecerFechaActual() {
    if (!fecha.value) {
        const hoy = new Date();
        const zonaLocal = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);
        fecha.value = zonaLocal.toISOString().split("T")[0];
    }
}

function actualizarCategoriasFormulario() {
    const lista = categorias[tipo.value] || [];

    categoria.innerHTML = lista
        .map(nombre => `<option value="${escaparHTML(nombre)}">${escaparHTML(nombre)}</option>`)
        .join("");
}

function actualizarFiltroCategorias() {
    const categoriaSeleccionada = filtroCategoria.value;

    const todasLasCategorias = [
        ...new Set([
            ...categorias.ingreso,
            ...categorias.gasto,
            ...movimientos.map(movimiento => movimiento.categoria)
        ])
    ].sort((a, b) => a.localeCompare(b, "es"));

    filtroCategoria.innerHTML = `
        <option value="todas">Todas las categorías</option>
        ${todasLasCategorias
            .map(nombre => `<option value="${escaparHTML(nombre)}">${escaparHTML(nombre)}</option>`)
            .join("")}
    `;

    if (todasLasCategorias.includes(categoriaSeleccionada)) {
        filtroCategoria.value = categoriaSeleccionada;
    }
}

// ================================================
// CRUD: CREAR Y ACTUALIZAR
// ================================================

function guardarMovimiento(evento) {
    evento.preventDefault();
    limpiarMensaje();

    const datos = {
        tipo: tipo.value,
        descripcion: descripcion.value.trim(),
        categoria: categoria.value,
        monto: Number(monto.value),
        fecha: fecha.value
    };

    const error = validarMovimiento(datos);

    if (error) {
        mostrarMensaje(error, "error");
        return;
    }

    const idEdicion = movimientoId.value;

    if (idEdicion) {
        actualizarMovimiento(idEdicion, datos);
        mostrarMensaje("Movimiento actualizado correctamente.", "correcto");
    } else {
        crearMovimiento(datos);
        mostrarMensaje("Movimiento registrado correctamente.", "correcto");
    }

    guardarMovimientosEnNavegador();
    actualizarFiltroCategorias();
    renderizarAplicacion();
    reiniciarFormulario();
}

function validarMovimiento(datos) {
    if (!datos.descripcion) {
        return "Ingrese una descripción.";
    }

    if (datos.descripcion.length < 3) {
        return "La descripción debe tener al menos 3 caracteres.";
    }

    if (!datos.categoria) {
        return "Seleccione una categoría.";
    }

    if (!Number.isFinite(datos.monto) || datos.monto <= 0) {
        return "Ingrese un monto mayor que cero.";
    }

    if (!datos.fecha) {
        return "Seleccione una fecha.";
    }

    return "";
}

function crearMovimiento(datos) {
    movimientos.push({
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        ...datos,
        creadoEn: new Date().toISOString()
    });
}

function actualizarMovimiento(id, datos) {
    movimientos = movimientos.map(movimiento =>
        movimiento.id === id
            ? {
                ...movimiento,
                ...datos,
                actualizadoEn: new Date().toISOString()
            }
            : movimiento
    );
}

// ================================================
// CRUD: EDITAR Y ELIMINAR
// ================================================

function editarMovimiento(id) {
    const movimiento = movimientos.find(item => item.id === id);

    if (!movimiento) {
        mostrarMensaje("No se encontró el movimiento.", "error");
        return;
    }

    movimientoId.value = movimiento.id;
    tipo.value = movimiento.tipo;
    actualizarCategoriasFormulario();
    descripcion.value = movimiento.descripcion;
    categoria.value = movimiento.categoria;
    monto.value = movimiento.monto;
    fecha.value = movimiento.fecha;

    btnGuardar.textContent = "Actualizar movimiento";
    btnCancelarEdicion.classList.remove("oculto");
    modoFormulario.textContent = "Modo: edición";

    formMovimiento.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function eliminarMovimiento(id) {
    const movimiento = movimientos.find(item => item.id === id);

    if (!movimiento) {
        return;
    }

    const confirmado = confirm(
        `¿Está seguro de eliminar el movimiento "${movimiento.descripcion}"?`
    );

    if (!confirmado) {
        return;
    }

    movimientos = movimientos.filter(item => item.id !== id);

    guardarMovimientosEnNavegador();
    actualizarFiltroCategorias();
    renderizarAplicacion();

    if (movimientoId.value === id) {
        reiniciarFormulario();
    }

    mostrarMensaje("Movimiento eliminado correctamente.", "correcto");
}

function cancelarEdicion() {
    reiniciarFormulario();
    mostrarMensaje("Edición cancelada.", "correcto");
}

function reiniciarFormulario() {
    formMovimiento.reset();
    movimientoId.value = "";
    tipo.value = "ingreso";
    actualizarCategoriasFormulario();
    establecerFechaActual();

    btnGuardar.textContent = "Guardar movimiento";
    btnCancelarEdicion.classList.add("oculto");
    modoFormulario.textContent = "Modo: nuevo";
}

// ================================================
// PRESUPUESTO
// ================================================

function guardarPresupuesto(evento) {
    evento.preventDefault();

    const valor = Number(presupuestoMensualInput.value);

    if (!Number.isFinite(valor) || valor <= 0) {
        alert("Ingrese un presupuesto mayor que cero.");
        return;
    }

    presupuestoMensual = valor;
    guardarPresupuestoEnNavegador();
    actualizarResumen();

    alert("Presupuesto mensual guardado correctamente.");
}

function actualizarEstadoPresupuesto(totalDeGastos) {
    alertaPresupuesto.className = "alerta alerta--oculta";

    if (presupuestoMensual <= 0) {
        porcentajePresupuesto.textContent = "0%";
        textoPresupuesto.textContent = "No se ha definido un presupuesto.";
        barraPresupuesto.style.width = "0%";
        barraPresupuesto.style.background = "var(--verde)";
        presupuestoRestante.textContent = formatearMoneda(0);
        return;
    }

    const porcentajeReal = (totalDeGastos / presupuestoMensual) * 100;
    const porcentajeVisual = Math.min(porcentajeReal, 100);
    const restante = presupuestoMensual - totalDeGastos;

    porcentajePresupuesto.textContent = `${porcentajeReal.toFixed(1)}%`;
    textoPresupuesto.textContent =
        `${formatearMoneda(totalDeGastos)} utilizados de ${formatearMoneda(presupuestoMensual)}.`;

    barraPresupuesto.style.width = `${porcentajeVisual}%`;
    presupuestoRestante.textContent = formatearMoneda(restante);

    if (porcentajeReal >= 100) {
        barraPresupuesto.style.background = "var(--rojo)";
        mostrarAlertaPresupuesto(
            "Has alcanzado o superado el presupuesto mensual.",
            "peligro"
        );
    } else if (porcentajeReal >= 80) {
        barraPresupuesto.style.background = "var(--amarillo)";
        mostrarAlertaPresupuesto(
            "Advertencia: estás cerca de alcanzar el presupuesto mensual.",
            "preventiva"
        );
    } else {
        barraPresupuesto.style.background = "var(--verde)";
        mostrarAlertaPresupuesto(
            "Tus gastos se encuentran dentro del presupuesto establecido.",
            "correcta"
        );
    }
}

function mostrarAlertaPresupuesto(texto, tipoAlerta) {
    alertaPresupuesto.textContent = texto;
    alertaPresupuesto.className = `alerta alerta--${tipoAlerta}`;
}

// ================================================
// RESUMEN Y RENDERIZADO
// ================================================

function renderizarAplicacion() {
    actualizarResumen();
    renderizarTabla();
}

function actualizarResumen() {
    const ingresos = sumarPorTipo("ingreso");
    const gastos = sumarPorTipo("gasto");
    const saldo = ingresos - gastos;

    totalIngresos.textContent = formatearMoneda(ingresos);
    totalGastos.textContent = formatearMoneda(gastos);
    saldoDisponible.textContent = formatearMoneda(saldo);

    saldoDisponible.style.color = saldo < 0 ? "var(--rojo)" : "var(--primario)";

    actualizarEstadoPresupuesto(gastos);
}

function sumarPorTipo(tipoBuscado) {
    return movimientos
        .filter(movimiento => movimiento.tipo === tipoBuscado)
        .reduce((acumulado, movimiento) => acumulado + movimiento.monto, 0);
}

function renderizarTabla() {
    const movimientosFiltrados = obtenerMovimientosFiltrados();

    tablaMovimientos.innerHTML = movimientosFiltrados
        .map(crearFilaMovimiento)
        .join("");

    const hayResultados = movimientosFiltrados.length > 0;

    sinResultados.classList.toggle("oculto", hayResultados);
    document.querySelector(".tabla-contenedor").classList.toggle(
        "oculto",
        !hayResultados
    );

    const textoMovimiento =
        movimientosFiltrados.length === 1 ? "movimiento" : "movimientos";

    contadorRegistros.textContent =
        `${movimientosFiltrados.length} ${textoMovimiento}`;
}

function crearFilaMovimiento(movimiento) {
    const esIngreso = movimiento.tipo === "ingreso";
    const signo = esIngreso ? "+" : "-";
    const claseMonto = esIngreso ? "monto-ingreso" : "monto-gasto";
    const claseInsignia = esIngreso ? "insignia--ingreso" : "insignia--gasto";

    return `
        <tr>
            <td>${formatearFecha(movimiento.fecha)}</td>
            <td>${escaparHTML(movimiento.descripcion)}</td>
            <td>${escaparHTML(movimiento.categoria)}</td>
            <td>
                <span class="insignia ${claseInsignia}">
                    ${capitalizar(movimiento.tipo)}
                </span>
            </td>
            <td class="${claseMonto}">
                ${signo}${formatearMoneda(movimiento.monto)}
            </td>
            <td>
                <div class="acciones-tabla">
                    <button
                        class="boton-tabla boton-editar"
                        type="button"
                        onclick="editarMovimiento('${movimiento.id}')"
                    >
                        Editar
                    </button>

                    <button
                        class="boton-tabla boton-eliminar"
                        type="button"
                        onclick="eliminarMovimiento('${movimiento.id}')"
                    >
                        Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// ================================================
// BÚSQUEDA, FILTROS Y ORDENAMIENTO
// ================================================

function obtenerMovimientosFiltrados() {
    const textoBusqueda = buscar.value.trim().toLowerCase();
    const tipoSeleccionado = filtroTipo.value;
    const categoriaSeleccionada = filtroCategoria.value;
    const ordenSeleccionado = orden.value;

    const resultado = movimientos.filter(movimiento => {
        const coincideTexto =
            movimiento.descripcion.toLowerCase().includes(textoBusqueda);

        const coincideTipo =
            tipoSeleccionado === "todos" ||
            movimiento.tipo === tipoSeleccionado;

        const coincideCategoria =
            categoriaSeleccionada === "todas" ||
            movimiento.categoria === categoriaSeleccionada;

        return coincideTexto && coincideTipo && coincideCategoria;
    });

    return ordenarMovimientos(resultado, ordenSeleccionado);
}

function ordenarMovimientos(lista, criterio) {
    const copia = [...lista];

    switch (criterio) {
        case "fecha-asc":
            return copia.sort((a, b) => a.fecha.localeCompare(b.fecha));

        case "monto-desc":
            return copia.sort((a, b) => b.monto - a.monto);

        case "monto-asc":
            return copia.sort((a, b) => a.monto - b.monto);

        case "fecha-desc":
        default:
            return copia.sort((a, b) => {
                const comparacionFecha = b.fecha.localeCompare(a.fecha);

                if (comparacionFecha !== 0) {
                    return comparacionFecha;
                }

                return (b.creadoEn || "").localeCompare(a.creadoEn || "");
            });
    }
}

// ================================================
// EXPORTACIÓN CSV
// ================================================

function exportarCSV() {
    if (movimientos.length === 0) {
        alert("No existen movimientos para exportar.");
        return;
    }

    const encabezados = [
        "Fecha",
        "Descripción",
        "Categoría",
        "Tipo",
        "Monto"
    ];

    const filas = movimientos.map(movimiento => [
        movimiento.fecha,
        movimiento.descripcion,
        movimiento.categoria,
        movimiento.tipo,
        movimiento.monto.toFixed(2)
    ]);

    const contenidoCSV = [encabezados, ...filas]
        .map(fila =>
            fila
                .map(valor => `"${String(valor).replaceAll('"', '""')}"`)
                .join(",")
        )
        .join("\n");

    // BOM para que Excel reconozca correctamente tildes y ñ.
    const blob = new Blob(["\uFEFF" + contenidoCSV], {
        type: "text/csv;charset=utf-8;"
    });

    const enlace = document.createElement("a");
    const url = URL.createObjectURL(blob);

    enlace.href = url;
    enlace.download = `movimientos_financieros_${obtenerFechaArchivo()}.csv`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
}

// ================================================
// LIMPIEZA GENERAL
// ================================================

function limpiarTodosLosDatos() {
    if (movimientos.length === 0 && presupuestoMensual === 0) {
        alert("No existen datos para eliminar.");
        return;
    }

    const confirmado = confirm(
        "Esta acción eliminará todos los movimientos y el presupuesto guardado. ¿Desea continuar?"
    );

    if (!confirmado) {
        return;
    }

    movimientos = [];
    presupuestoMensual = 0;

    localStorage.removeItem(CLAVE_MOVIMIENTOS);
    localStorage.removeItem(CLAVE_PRESUPUESTO);

    presupuestoMensualInput.value = "";
    buscar.value = "";
    filtroTipo.value = "todos";
    filtroCategoria.value = "todas";
    orden.value = "fecha-desc";

    reiniciarFormulario();
    actualizarFiltroCategorias();
    renderizarAplicacion();

    alert("Todos los datos fueron eliminados.");
}

// ================================================
// FUNCIONES AUXILIARES
// ================================================

function formatearMoneda(valor) {
    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
    }).format(valor);
}

function formatearFecha(fechaISO) {
    if (!fechaISO) {
        return "";
    }

    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

function obtenerFechaArchivo() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function escaparHTML(texto) {
    const elemento = document.createElement("div");
    elemento.textContent = texto;
    return elemento.innerHTML;
}

function mostrarMensaje(texto, tipoMensaje) {
    mensajeFormulario.textContent = texto;
    mensajeFormulario.className =
        `mensaje mensaje--${tipoMensaje}`;

    setTimeout(() => {
        limpiarMensaje();
    }, 4000);
}

function limpiarMensaje() {
    mensajeFormulario.textContent = "";
    mensajeFormulario.className = "mensaje";
}

// Se exponen estas funciones porque son llamadas desde los botones de la tabla.
window.editarMovimiento = editarMovimiento;
window.eliminarMovimiento = eliminarMovimiento;
