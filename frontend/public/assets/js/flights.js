const API_URL = 'http://localhost:3001/api/flights';

// Elementos del DOM
const flightsTableBody = document.getElementById('flightsTableBody');
const newFlightBtn = document.getElementById('newFlightBtn');
const flightModal = document.getElementById('flightModal');
const flightForm = document.getElementById('flightForm');
const modalTitle = document.getElementById('modalTitle');
const cancelBtn = document.getElementById('cancelBtn');

// Estado del modal
let currentFlightId = null;

// Función para mostrar el modal
function showModal(title = 'Nuevo Vuelo', flight = null) {
    modalTitle.textContent = title;
    flightForm.reset();
    currentFlightId = flight?.id || null;
    
    if (flight) {
        document.getElementById('flightNumber').value = flight.flightNumber;
        document.getElementById('originCity').value = flight.origin;
        document.getElementById('destinationCity').value = flight.destination;
        document.getElementById('flightDate').value = flight.date;
        document.getElementById('flightTime').value = flight.time;
        document.getElementById('status').value = flight.status;
    }
    
    flightModal.style.display = 'block';
}

// Función para cerrar el modal
function closeModal() {
    flightModal.style.display = 'none';
    currentFlightId = null;
}

// Función para mostrar mensaje de error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    flightForm.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Función para mostrar mensaje de éxito
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    flightForm.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

// Función para cargar los vuelos
async function loadFlights() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar los vuelos');
        const flights = await response.json();
        renderFlights(flights);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los vuelos');
    }
}

// Función para renderizar los vuelos
function renderFlights(flights) {
    flightsTableBody.innerHTML = flights.map(flight => `
        <tr>
            <td>${flight.flightNumber}</td>
            <td>${flight.origin}</td>
            <td>${flight.destination}</td>
            <td>${new Date(flight.date).toLocaleDateString()}</td>
            <td>${flight.time}</td>
            <td>
                <span class="status-badge ${flight.status}">
                    ${flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
                </span>
            </td>
            <td>
                <button onclick="editFlight(${flight.id})" class="action-btn edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteFlight(${flight.id})" class="action-btn delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para editar vuelo
function editFlight(id) {
    // Aquí iría la lógica para obtener los datos del vuelo
    showModal('Editar Vuelo', { id });
}

// Función para eliminar vuelo
async function deleteFlight(id) {
    if (!confirm('¿Estás seguro de eliminar este vuelo?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al eliminar el vuelo');
        
        showSuccess('Vuelo eliminado exitosamente');
        loadFlights();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar el vuelo');
    }
}

// Event Listeners
newFlightBtn.addEventListener('click', () => showModal());
cancelBtn.addEventListener('click', closeModal);

flightForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        flightNumber: document.getElementById('flightNumber').value,
        origin: document.getElementById('originCity').value,
        destination: document.getElementById('destinationCity').value,
        date: document.getElementById('flightDate').value,
        time: document.getElementById('flightTime').value,
        status: document.getElementById('status').value
    };

    try {
        const response = await fetch(
            currentFlightId ? `${API_URL}/${currentFlightId}` : API_URL,
            {
                method: currentFlightId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            }
        );

        if (!response.ok) throw new Error('Error al guardar el vuelo');
        
        showSuccess(currentFlightId ? 'Vuelo actualizado exitosamente' : 'Vuelo creado exitosamente');
        closeModal();
        loadFlights();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar el vuelo');
    }
});

// Inicializar
loadFlights();
