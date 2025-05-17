const API_URL = 'http://localhost:3001/api/passengers';

// Elementos del DOM
const passengersTableBody = document.getElementById('passengersTableBody');
const newPassengerBtn = document.getElementById('newPassengerBtn');
const passengerModal = document.getElementById('passengerModal');
const passengerForm = document.getElementById('passengerForm');
const modalTitle = document.getElementById('modalTitle');
const cancelBtn = document.getElementById('cancelBtn');
const detailsModal = document.getElementById('detailsModal');
const detailsContent = document.getElementById('detailsContent');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');

// Estado del modal
let currentPassengerId = null;

// Función para mostrar el modal
function showModal(title = 'Nuevo Pasajero', passenger = null) {
    modalTitle.textContent = title;
    passengerForm.reset();
    currentPassengerId = passenger?.id || null;
    
    if (passenger) {
        document.getElementById('nombre').value = passenger.nombre;
        document.getElementById('apellido').value = passenger.apellido;
        document.getElementById('documentType').value = passenger.documentType;
        document.getElementById('documentNumber').value = passenger.documentNumber;
        document.getElementById('birthDate').value = passenger.birthDate;
        document.getElementById('nationality').value = passenger.nationality;
        document.getElementById('email').value = passenger.email;
        document.getElementById('phone').value = passenger.phone;
        document.getElementById('status').value = passenger.status;
    }
    
    passengerModal.style.display = 'block';
}

// Función para cerrar el modal
function closeModal() {
    passengerModal.style.display = 'none';
    currentPassengerId = null;
}

// Función para mostrar mensaje de error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    passengerForm.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Función para mostrar mensaje de éxito
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    passengerForm.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

// Función para validar el formulario
function validateForm() {
    const documentNumber = document.getElementById('documentNumber').value;
    const birthDate = document.getElementById('birthDate').value;
    
    // Validar número de documento
    if (!documentNumber || documentNumber.length < 6) {
        showError('El número de documento debe tener al menos 6 caracteres');
        return false;
    }
    
    // Validar fecha de nacimiento
    if (!birthDate) {
        showError('La fecha de nacimiento es requerida');
        return false;
    }
    
    return true;
}

// Función para cargar los pasajeros
async function loadPassengers() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar los pasajeros');
        const data = await response.json();
        renderPassengers(data.passengers);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los pasajeros');
    }
}

// Función para renderizar los pasajeros
function renderPassengers(passengers) {
    passengersTableBody.innerHTML = passengers.map(passenger => `
        <tr>
            <td>${passenger.nombre}</td>
            <td>${passenger.apellido}</td>
            <td>
                <span class="status-badge ${passenger.documentType.toLowerCase()}">
                    ${passenger.documentType}
                </span>
            </td>
            <td>${passenger.documentNumber}</td>
            <td>${new Date(passenger.birthDate).toLocaleDateString()}</td>
            <td>${passenger.nationality}</td>
            <td>
                <span class="status-badge ${passenger.status}">
                    ${passenger.status.charAt(0).toUpperCase() + passenger.status.slice(1)}
                </span>
            </td>
            <td>
                <span class="flight-count">${passenger.flights?.length || 0} vuelos</span>
            </td>
            <td>
                <button onclick="editPassenger(${passenger.id})" class="action-btn edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deletePassenger(${passenger.id})" class="action-btn delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="showPassengerDetails(${passenger.id})" class="action-btn details">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para editar pasajero
function editPassenger(id) {
    // Aquí iría la lógica para obtener los datos del pasajero
    showModal('Editar Pasajero', { id });
}

// Función para eliminar pasajero
async function deletePassenger(id) {
    if (!confirm('¿Estás seguro de eliminar este pasajero?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al eliminar el pasajero');
        
        showSuccess('Pasajero eliminado exitosamente');
        loadPassengers();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar el pasajero');
    }
}

// Función para mostrar detalles del pasajero
async function showPassengerDetails(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar los detalles');
        const passenger = await response.json();
        
        // Renderizar detalles
        detailsContent.innerHTML = `
            <div class="details-section">
                <h3>Información Personal</h3>
                <ul class="details-list">
                    <li><span class="details-label">Nombre:</span> ${passenger.nombre} ${passenger.apellido}</li>
                    <li><span class="details-label">Documento:</span> ${passenger.documentType} - ${passenger.documentNumber}</li>
                    <li><span class="details-label">Fecha Nac.:</span> ${new Date(passenger.birthDate).toLocaleDateString()}</li>
                    <li><span class="details-label">Nacionalidad:</span> ${passenger.nationality}</li>
                    <li><span class="details-label">Email:</span> ${passenger.email}</li>
                    <li><span class="details-label">Teléfono:</span> ${passenger.phone}</li>
                    <li><span class="details-label">Estado:</span> <span class="status-badge ${passenger.status}">${passenger.status}</span></li>
                </ul>
            </div>
            
            <div class="details-section">
                <h3>Historial de Vuelos</h3>
                <div class="flight-list">
                    ${passenger.flights?.map(flight => `
                        <div class="flight-item">
                            <div>
                                <span class="details-label">Vuelo:</span> ${flight.flightNumber}<br>
                                <span class="details-label">Origen:</span> ${flight.origin}<br>
                                <span class="details-label">Destino:</span> ${flight.destination}<br>
                                <span class="details-label">Fecha:</span> ${new Date(flight.date).toLocaleDateString()}<br>
                                <span class="details-label">Estado:</span> <span class="status-badge ${flight.status}">${flight.status}</span>
                            </div>
                            <div>
                                <span class="details-label">Asiento:</span> ${flight.seat}<br>
                                <span class="details-label">Clase:</span> ${flight.class}<br>
                                <span class="details-label">Precio:</span> $${flight.price.toFixed(2)}
                            </div>
                        </div>
                    `).join('') || '<p>No hay vuelos registrados</p>'}
                </div>
            </div>
        `;
        
        detailsModal.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los detalles del pasajero');
    }
}

// Event Listeners
newPassengerBtn.addEventListener('click', () => showModal());
cancelBtn.addEventListener('click', closeModal);
closeDetailsBtn.addEventListener('click', () => detailsModal.style.display = 'none');

passengerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        documentType: document.getElementById('documentType').value,
        documentNumber: document.getElementById('documentNumber').value,
        birthDate: document.getElementById('birthDate').value,
        nationality: document.getElementById('nationality').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        status: document.getElementById('status').value
    };

    try {
        const response = await fetch(
            currentPassengerId ? `${API_URL}/${currentPassengerId}` : API_URL,
            {
                method: currentPassengerId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            }
        );

        if (!response.ok) throw new Error('Error al guardar el pasajero');
        
        showSuccess(currentPassengerId ? 'Pasajero actualizado exitosamente' : 'Pasajero creado exitosamente');
        closeModal();
        loadPassengers();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar el pasajero');
    }
});

// Inicializar
loadPassengers();
