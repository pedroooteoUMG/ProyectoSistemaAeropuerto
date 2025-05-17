const API_URL = 'http://localhost:3001/api/security';

// Elementos del DOM
const incidentsTableBody = document.getElementById('incidentsTableBody');
const newIncidentBtn = document.getElementById('newIncidentBtn');
const incidentModal = document.getElementById('incidentModal');
const incidentForm = document.getElementById('incidentForm');
const modalTitle = document.getElementById('modalTitle');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const detailsModal = document.getElementById('detailsModal');
const detailsContent = document.getElementById('detailsContent');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const searchInput = document.getElementById('searchInput');
const dateFilter = document.getElementById('date');
const statusFilter = document.getElementById('status');
const severityFilter = document.getElementById('severity');

// Estado del modal
let currentIncidentId = null;

// Función para mostrar modal
function showModal(title = 'Nuevo Incidente', incident = null) {
    modalTitle.textContent = title;
    incidentForm.reset();
    currentIncidentId = incident?.id || null;
    
    if (incident) {
        document.getElementById('pasajero').value = incident.pasajero;
        document.getElementById('empleado').value = incident.empleado;
        document.getElementById('descripcion').value = incident.descripcion;
        document.getElementById('ubicacion').value = incident.ubicacion;
        document.getElementById('severity').value = incident.severity;
        document.getElementById('status').value = incident.status;
        document.getElementById('notes').value = incident.notes;
    }
    
    incidentModal.style.display = 'block';
}

// Función para cerrar modal
function closeModal() {
    incidentModal.style.display = 'none';
    currentIncidentId = null;
}

// Función para mostrar mensaje
function showMessage(element, message) {
    element.querySelector('span').textContent = message;
    element.style.display = 'flex';
    setTimeout(() => element.style.display = 'none', 3000);
}

// Función para cargar pasajeros
async function loadPassengers() {
    try {
        const response = await fetch('http://localhost:3001/api/passengers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar pasajeros');
        const passengers = await response.json();
        
        const passengerSelect = document.getElementById('pasajero');
        passengers.forEach(passenger => {
            const option = document.createElement('option');
            option.value = passenger.id;
            option.textContent = `${passenger.nombre} ${passenger.apellido}`;
            passengerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al cargar pasajeros');
    }
}

// Función para cargar empleados
async function loadEmployees() {
    try {
        const response = await fetch('http://localhost:3001/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar empleados');
        const users = await response.json();
        
        const employeeSelect = document.getElementById('empleado');
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.nombre} ${user.apellido}`;
            employeeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al cargar empleados');
    }
}

// Función para cargar incidentes
async function loadIncidents() {
    try {
        const params = new URLSearchParams();
        if (dateFilter.value) params.append('date', dateFilter.value);
        if (statusFilter.value) params.append('status', statusFilter.value);
        if (severityFilter.value) params.append('severity', severityFilter.value);
        
        const response = await fetch(`${API_URL}/incidents?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar incidentes');
        const data = await response.json();
        renderIncidents(data.incidents);
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al cargar incidentes');
    }
}

// Función para renderizar incidentes
function renderIncidents(incidents) {
    incidentsTableBody.innerHTML = incidents.map(incident => `
        <tr>
            <td>${incident.id}</td>
            <td>${new Date(incident.fecha).toLocaleDateString()}</td>
            <td>${incident.pasajeroName}</td>
            <td>${incident.empleadoName}</td>
            <td>${incident.ubicacion}</td>
            <td>
                <span class="severity-badge ${incident.severity.toLowerCase()}">
                    ${incident.severity}
                </span>
            </td>
            <td>
                <span class="status-badge ${incident.status.toLowerCase().replace(/_/g, '-')}">
                    ${incident.status.replace(/_/g, ' ')}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="editIncident(${incident.id})" class="action-btn edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteIncident(${incident.id})" class="action-btn delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="showIncidentDetails(${incident.id})" class="action-btn details">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Función para editar incidente
function editIncident(id) {
    // Aquí iría la lógica para obtener los datos del incidente
    showModal('Editar Incidente', { id });
}

// Función para eliminar incidente
async function deleteIncident(id) {
    if (!confirm('¿Estás seguro de eliminar este incidente?')) return;
    
    try {
        const response = await fetch(`${API_URL}/incidents/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al eliminar el incidente');
        
        showMessage(successMessage, 'Incidente eliminado exitosamente');
        loadIncidents();
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al eliminar el incidente');
    }
}

// Función para mostrar detalles del incidente
async function showIncidentDetails(id) {
    try {
        const response = await fetch(`${API_URL}/incidents/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar los detalles');
        const incident = await response.json();
        
        // Renderizar detalles
        detailsContent.innerHTML = `
            <div class="details-section">
                <h3>Información del Incidente</h3>
                <ul class="details-list">
                    <li><span class="details-label">Número:</span> ${incident.id}</li>
                    <li><span class="details-label">Fecha:</span> ${new Date(incident.fecha).toLocaleDateString()}</li>
                    <li><span class="details-label">Pasajero:</span> ${incident.pasajeroName}</li>
                    <li><span class="details-label">Empleado:</span> ${incident.empleadoName}</li>
                    <li><span class="details-label">Ubicación:</span> ${incident.ubicacion}</li>
                    <li><span class="details-label">Gravedad:</span> <span class="severity-badge ${incident.severity.toLowerCase()}">${incident.severity}</span></li>
                    <li><span class="details-label">Estado:</span> <span class="status-badge ${incident.status.toLowerCase().replace(/_/g, '-')}">${incident.status.replace(/_/g, ' ')}</span></li>
                    <li><span class="details-label">Descripción:</span> ${incident.descripcion}</li>
                    <li><span class="details-label">Notas:</span> ${incident.notes || 'Sin notas'}</li>
                </ul>
            </div>
        `;
        
        detailsModal.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al cargar los detalles del incidente');
    }
}

// Event Listeners
newIncidentBtn.addEventListener('click', () => showModal());
cancelBtn.addEventListener('click', closeModal);
closeDetailsBtn.addEventListener('click', () => detailsModal.style.display = 'none');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = incidentsTableBody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

dateFilter.addEventListener('change', loadIncidents);
statusFilter.addEventListener('change', loadIncidents);
severityFilter.addEventListener('change', loadIncidents);

incidentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        pasajero: document.getElementById('pasajero').value,
        empleado: document.getElementById('empleado').value,
        descripcion: document.getElementById('descripcion').value,
        ubicacion: document.getElementById('ubicacion').value,
        severity: document.getElementById('severity').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value
    };

    try {
        const response = await fetch(
            currentIncidentId ? `${API_URL}/incidents/${currentIncidentId}` : `${API_URL}/incidents`,
            {
                method: currentIncidentId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            }
        );

        if (!response.ok) throw new Error('Error al guardar el incidente');
        
        showMessage(successMessage, currentIncidentId ? 'Incidente actualizado exitosamente' : 'Incidente creado exitosamente');
        closeModal();
        loadIncidents();
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al guardar el incidente');
    }
});

// Inicializar
loadPassengers();
loadEmployees();
loadIncidents();
