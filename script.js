// ========== CONFIGURACIÓN ==========
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxru1hqaBbSs3u-MkangwHy2QTjuZC9AQE6-6TrufedVBrw2BzeUsfL_uvacNgyylZZVA/exec';

let currentDate = new Date();
let selectedDate = null;
let reservasData = [];
let currentFilter = 'PENDIENTE';

// Servicios por tipo
const serviciosPorTipo = {
    barberia: [
        { nombre: 'Corte de cabello', precio: 30, duracion: 30 },
        { nombre: 'Corte + Barba', precio: 45, duracion: 45 },
        { nombre: 'Solo Barba', precio: 20, duracion: 20 },
        { nombre: 'Diseño/Fade', precio: 35, duracion: 30 }
    ],
    salon: [
        { nombre: 'Corte Mujer', precio: 40, duracion: 45 },
        { nombre: 'Tinte/Coloración', precio: 80, duracion: 90 },
        { nombre: 'Brushing/Planchado', precio: 35, duracion: 45 },
        { nombre: 'Tratamiento Capilar', precio: 60, duracion: 60 },
        { nombre: 'Peinado', precio: 50, duracion: 45 }
    ],
    manicure: [
        { nombre: 'Manicure Básico', precio: 25, duracion: 45 },
        { nombre: 'Manicure Semi-permanente', precio: 40, duracion: 60 },
        { nombre: 'Pedicure', precio: 30, duracion: 60 },
        { nombre: 'Uñas Acrílicas/Gelish', precio: 50, duracion: 90 }
    ],
    tratamientos: [
        { nombre: 'Alisado', precio: 150, duracion: 120 },
        { nombre: 'Keratina', precio: 120, duracion: 120 },
        { nombre: 'Nutrición Profunda', precio: 70, duracion: 60 }
    ]
};

// ========== NAVEGACIÓN ==========
function showMain() {
    document.getElementById('mainPage').style.display = 'block';
    document.getElementById('reservasPage').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
}

function showReservas() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('reservasPage').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    initCalendar();
}

function showAdminPanel() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('reservasPage').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminReservas();
    updateDashboard();
}

// ========== MODAL LOGIN ADMIN ==========
function openAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
    document.getElementById('loginError').textContent = '';
}

async function loginAdmin(event) {
    event.preventDefault();
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    
    showLoader();
    
    try {
        const params = new URLSearchParams();
        params.append('action', 'login');
        params.append('username', user);
        params.append('password', pass);
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: params
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeAdminLogin();
            showAdminPanel();
        } else {
            document.getElementById('loginError').textContent = 'Usuario o contraseña incorrectos';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loginError').textContent = 'Error de conexión';
    } finally {
        hideLoader();
    }
}

function logoutAdmin() {
    showMain();
}

// ========== CALENDARIO ==========
function initCalendar() {
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dias.forEach(dia => {
        const header = document.createElement('div');
        header.className = 'calendar-day calendar-day-header';
        header.textContent = dia;
        calendar.appendChild(header);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendar.appendChild(emptyDay);
    }
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const dayDate = new Date(year, month, day);
        dayDate.setHours(0, 0, 0, 0);
        
        if (dayDate < today) {
            dayElement.classList.add('disabled');
        } else {
            dayElement.onclick = () => selectDate(year, month, day);
        }
        
        if (selectedDate && 
            selectedDate.getFullYear() === year && 
            selectedDate.getMonth() === month && 
            selectedDate.getDate() === day) {
            dayElement.classList.add('selected');
        }
        
        calendar.appendChild(dayElement);
    }
}

function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    const dateStr = selectedDate.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('fechaSeleccionada').value = dateStr;
    renderCalendar();
    updateHorarios();
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// ========== FORMULARIO ==========
function updateServicios() {
    const tipo = document.getElementById('tipoServicio').value;
    const select = document.getElementById('servicioEspecifico');
    
    select.innerHTML = '<option value="">Selecciona un servicio</option>';
    
    if (tipo && serviciosPorTipo[tipo]) {
        serviciosPorTipo[tipo].forEach(servicio => {
            const option = document.createElement('option');
            option.value = JSON.stringify(servicio);
            option.textContent = `${servicio.nombre} - Bs. ${servicio.precio}`;
            select.appendChild(option);
        });
    }
    
    updateResumen();
}

async function updateHorarios() {
    if (!selectedDate) return;
    
    const profesional = document.getElementById('profesional').value;
    if (!profesional) return;
    
    showLoader();
    
    try {
        const fechaStr = selectedDate.toISOString().split('T')[0];
        
        const response = await fetch(`${SCRIPT_URL}?action=getHorariosDisponibles&fecha=${fechaStr}&profesional=${profesional}`);
        const result = await response.json();
        
        const container = document.getElementById('horariosDisponibles');
        container.innerHTML = '';
        
        const horarios = [];
        for (let h = 8; h < 19; h++) {
            horarios.push(`${h.toString().padStart(2, '0')}:00`);
            if (h < 18) {
                horarios.push(`${h.toString().padStart(2, '0')}:30`);
            }
        }
        
        horarios.forEach(horario => {
            const slot = document.createElement('div');
            slot.className = 'horario-slot';
            slot.textContent = horario;
            
            const ocupado = result.horariosOcupados && result.horariosOcupados.includes(horario);
            
            if (ocupado) {
                slot.classList.add('disabled');
            } else {
                slot.onclick = () => selectHorario(horario);
            }
            
            container.appendChild(slot);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        hideLoader();
    }
}

function selectHorario(horario) {
    document.querySelectorAll('.horario-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
    document.getElementById('horarioSeleccionado').value = horario;
    
    updateResumen();
}

function updateResumen() {
    const fecha = document.getElementById('fechaSeleccionada').value;
    const horario = document.getElementById('horarioSeleccionado').value;
    const servicioStr = document.getElementById('servicioEspecifico').value;
    const profesional = document.getElementById('profesional').value;
    
    if (!fecha || !horario || !servicioStr || !profesional) return;
    
    const servicio = JSON.parse(servicioStr);
    const profesionalNombre = document.getElementById('profesional').selectedOptions[0].text;
    
    const resumen = `
        <p><strong>📅 Fecha:</strong> ${fecha}</p>
        <p><strong>🕐 Hora:</strong> ${horario}</p>
        <p><strong>✂️ Servicio:</strong> ${servicio.nombre}</p>
        <p><strong>👤 Profesional:</strong> ${profesionalNombre}</p>
        <p><strong>💰 Precio:</strong> Bs. ${servicio.precio}</p>
        <p><strong>⏱️ Duración:</strong> ${servicio.duracion} minutos</p>
    `;
    
    document.getElementById('resumenContent').innerHTML = resumen;
    document.getElementById('resumenReserva').style.display = 'block';
}

async function submitReserva(event) {
    event.preventDefault();
    
    const fechaStr = selectedDate.toISOString().split('T')[0];
    const horario = document.getElementById('horarioSeleccionado').value;
    const servicioStr = document.getElementById('servicioEspecifico').value;
    const servicio = JSON.parse(servicioStr);
    const profesional = document.getElementById('profesional').value;
    const nombre = document.getElementById('nombreCliente').value;
    const telefono = document.getElementById('telefonoCliente').value;
    const email = document.getElementById('emailCliente').value;
    const notas = document.getElementById('notasCliente').value;
    
    showLoader();
    
    try {
        const params = new URLSearchParams();
        params.append('action', 'crearReserva');
        params.append('fecha', fechaStr);
        params.append('hora', horario);
        params.append('tipoServicio', document.getElementById('tipoServicio').value);
        params.append('servicio', servicio.nombre);
        params.append('precio', servicio.precio);
        params.append('duracion', servicio.duracion);
        params.append('profesional', profesional);
        params.append('profesionalNombre', document.getElementById('profesional').selectedOptions[0].text);
        params.append('cliente', nombre);
        params.append('telefono', telefono);
        params.append('email', email);
        params.append('notas', notas);
        params.append('estado', 'PENDIENTE');
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: params
        });
        
        const result = await response.json();
        
        if (result.success) {
            const reserva = {
                fecha: fechaStr,
                hora: horario,
                servicio: servicio.nombre,
                profesionalNombre: document.getElementById('profesional').selectedOptions[0].text,
                cliente: nombre
            };
            mostrarConfirmacion(reserva);
            document.getElementById('reservaForm').reset();
            selectedDate = null;
            renderCalendar();
        } else {
            alert('Error al crear la reserva. Intenta nuevamente.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión. Verifica tu internet.');
    } finally {
        hideLoader();
    }
}

function mostrarConfirmacion(reserva) {
    const detalles = `
        <p><strong>Código de Reserva:</strong> ${Date.now()}</p>
        <p><strong>Fecha:</strong> ${new Date(reserva.fecha).toLocaleDateString('es-ES')}</p>
        <p><strong>Hora:</strong> ${reserva.hora}</p>
        <p><strong>Servicio:</strong> ${reserva.servicio}</p>
        <p><strong>Profesional:</strong> ${reserva.profesionalNombre}</p>
        <p><strong>Cliente:</strong> ${reserva.cliente}</p>
    `;
    
    document.getElementById('confirmacionDetalles').innerHTML = detalles;
    document.getElementById('confirmacionModal').style.display = 'block';
}

function closeConfirmacion() {
    document.getElementById('confirmacionModal').style.display = 'none';
    showMain();
}

// ========== ADMIN PANEL ==========
async function loadAdminReservas() {
    showLoader();
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getReservas`);
        const result = await response.json();
        
        if (result.success) {
            reservasData = result.reservas;
            renderReservasTable();
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        hideLoader();
    }
}

function filterReservas(estado) {
    currentFilter = estado;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderReservasTable();
}

function renderReservasTable() {
    const tbody = document.getElementById('adminReservasBody');
    tbody.innerHTML = '';
    
    let reservasFiltradas = reservasData;
    if (currentFilter !== 'TODAS') {
        reservasFiltradas = reservasData.filter(r => r.estado === currentFilter);
    }
    
    if (reservasFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No hay reservas</td></tr>';
        return;
    }
    
    reservasFiltradas.forEach((reserva, index) => {
        const tr = document.createElement('tr');
        
        const estadoClass = `estado-${reserva.estado.toLowerCase()}`;
        
        let acciones = '';
        if (reserva.estado === 'PENDIENTE') {
            acciones = `
                <button class="btn-aceptar" onclick="aceptarReserva(${index})">✅ Aceptar</button>
                <button class="btn-rechazar" onclick="rechazarReserva(${index})">❌ Rechazar</button>
            `;
        } else {
            acciones = '<span style="color: #999;">-</span>';
        }
        
        tr.innerHTML = `
            <td>${reserva.cliente}</td>
            <td>${reserva.telefono}</td>
            <td>${new Date(reserva.fecha).toLocaleDateString('es-ES')}</td>
            <td>${reserva.hora}</td>
            <td>${reserva.servicio}</td>
            <td>${reserva.profesionalnombre}</td>
            <td><span class="estado-badge ${estadoClass}">${reserva.estado}</span></td>
            <td>${acciones}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

function aceptarReserva(index) {
    const reserva = reservasData[index];
    
    const mensaje = `¡Hola ${reserva.cliente}! ✅ Tu reserva ha sido CONFIRMADA para el ${new Date(reserva.fecha).toLocaleDateString('es-ES')} a las ${reserva.hora}. Servicio: ${reserva.servicio}. ¡Te esperamos!`;
    
    const url = `https://wa.me/591${reserva.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    
    updateReservaEstado(reserva.id, 'CONFIRMADA');
}

function rechazarReserva(index) {
    const reserva = reservasData[index];
    
    const mensaje = `Hola ${reserva.cliente}, lamentablemente no pudimos confirmar tu reserva para el ${new Date(reserva.fecha).toLocaleDateString('es-ES')} a las ${reserva.hora}. ¿Te gustaría agendar otro horario?`;
    
    const url = `https://wa.me/591${reserva.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    
    updateReservaEstado(reserva.id, 'RECHAZADA');
}

async function updateReservaEstado(id, estado) {
    try {
        const params = new URLSearchParams();
        params.append('action', 'updateEstado');
        params.append('id', id);
        params.append('estado', estado);
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: params
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadAdminReservas();
            updateDashboard();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function updateDashboard() {
    const hoy = new Date().toISOString().split('T')[0];
    
    const reservasHoy = reservasData.filter(r => r.fecha === hoy).length;
    const pendientes = reservasData.filter(r => r.estado === 'PENDIENTE').length;
    const confirmadas = reservasData.filter(r => r.estado === 'CONFIRMADA').length;
    const ingresos = reservasData
        .filter(r => r.estado === 'CONFIRMADA')
        .reduce((sum, r) => sum + (r.precio || 0), 0);
    
    document.getElementById('statHoy').textContent = reservasHoy;
    document.getElementById('statPendientes').textContent = pendientes;
    document.getElementById('statConfirmadas').textContent = confirmadas;
    document.getElementById('statIngresos').textContent = `Bs. ${ingresos}`;
}

// ========== UTILIDADES ==========
function openMap() {
    window.open('https://www.google.com/maps/search/?api=1&query=Satélite+Norte+Warnes+Santa+Cruz+Bolivia', '_blank');
}

function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    showMain();
});
