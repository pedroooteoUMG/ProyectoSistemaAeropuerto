const API_URL = 'http://localhost:3001/api/bookings';

// Elementos del DOM
const bookingsTableBody = document.getElementById('bookingsTableBody');
const newBookingBtn = document.getElementById('newBookingBtn');
const bookingModal = document.getElementById('bookingModal');
const bookingForm = document.getElementById('bookingForm');
const modalTitle = document.getElementById('modalTitle');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const detailsModal = document.getElementById('detailsModal');
const detailsContent = document.getElementById('detailsContent');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const searchInput = document.getElementById('searchInput');
const dateRange = document.getElementById('dateRange');
const statusFilter = document.getElementById('status');
const classFilter = document.getElementById('class');

// Estado del modal
let currentBookingId = null;

// Función para mostrar modal
function showModal(title = 'Nueva Reserva', booking = null) {
    modalTitle.textContent = title;
    bookingForm.reset();
    currentBookingId = booking?.id || null;
    
    if (booking) {
        document.getElementById('passenger').value = booking.passengerId;
        document.getElementById('flight').value = booking.flightId;
        document.getElementById('class').value = booking.class;
        document.getElementById('seat').value = booking.seat;
        document.getElementById('price').value = booking.price;
        document.getElementById('status').value = booking.status;
        document.getElementById('notes').value = booking.notes;
    }
    
    bookingModal.style.display = 'block';
}

// Función para cerrar modal
function closeModal() {
    bookingModal.style.display = 'none';
    currentBookingId = null;
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
        
        const passengerSelect = document.getElementById('passenger');
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

// Función para cargar vuelos
async function loadFlights() {
    try {
        const response = await fetch('http://localhost:3001/api/flights', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar vuelos');
        const flights = await response.json();
        
        const flightSelect = document.getElementById('flight');
        flights.forEach(flight => {
            const option = document.createElement('option');
            option.value = flight.id;
            option.textContent = `${flight.flightNumber} - ${flight.origin} a ${flight.destination}`;
            flightSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al cargar vuelos');
    }
}

// Función para cargar reservas
async function loadBookings() {
    try {
        const params = new URLSearchParams();
        if (dateRange.value !== 'all') params.append('dateRange', dateRange.value);
        if (statusFilter.value) params.append('status', statusFilter.value);
        if (classFilter.value) params.append('class', classFilter.value);
        
        const response = await fetch(`${API_URL}?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar reservas');
        const bookings = await response.json();
        renderBookings(bookings);
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al cargar reservas');
    }
}

// Función para renderizar reservas
function renderBookings(bookings) {
    bookingsTableBody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${booking.bookingNumber}</td>
            <td>${booking.passengerName}</td>
            <td>${booking.flightNumber} (${booking.origin} a ${booking.destination})</td>
            <td>
                <span class="status-badge ${booking.class.toLowerCase()}">
                    ${booking.class}
                </span>
            </td>
            <td>
                <span class="status-badge ${booking.status.toLowerCase()}">
                    ${booking.status}
                </span>
            </td>
            <td>${new Date(booking.date).toLocaleDateString()}</td>
            <td>$${booking.price.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editBooking(${booking.id})" class="action-btn edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteBooking(${booking.id})" class="action-btn delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="showBookingDetails(${booking.id})" class="action-btn details">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Función para editar reserva
function editBooking(id) {
    // Aquí iría la lógica para obtener los datos de la reserva
    showModal('Editar Reserva', { id });
}

// Función para eliminar reserva
async function deleteBooking(id) {
    if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al eliminar la reserva');
        
        showMessage(successMessage, 'Reserva eliminada exitosamente');
        loadBookings();
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al eliminar la reserva');
    }
}

// Función para mostrar detalles de reserva
async function showBookingDetails(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar los detalles');
        const booking = await response.json();
        
        // Renderizar detalles
        detailsContent.innerHTML = `
            <div class="details-section">
                <h3>Información de Reserva</h3>
                <ul class="details-list">
                    <li><span class="details-label">Número:</span> ${booking.bookingNumber}</li>
                    <li><span class="details-label">Pasajero:</span> ${booking.passengerName}</li>
                    <li><span class="details-label">Vuelo:</span> ${booking.flightNumber}</li>
                    <li><span class="details-label">Clase:</span> <span class="status-badge ${booking.class.toLowerCase()}">${booking.class}</span></li>
                    <li><span class="details-label">Estado:</span> <span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span></li>
                    <li><span class="details-label">Fecha:</span> ${new Date(booking.date).toLocaleDateString()}</li>
                    <li><span class="details-label">Precio:</span> $${booking.price.toFixed(2)}</li>
                    <li><span class="details-label">Asiento:</span> ${booking.seat}</li>
                    <li><span class="details-label">Notas:</span> ${booking.notes || 'Sin notas'}</li>
                </ul>
            </div>
        `;
        
        detailsModal.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al cargar los detalles de la reserva');
    }
}

// Event Listeners
newBookingBtn.addEventListener('click', () => showModal());
cancelBtn.addEventListener('click', closeModal);
closeDetailsBtn.addEventListener('click', () => detailsModal.style.display = 'none');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = bookingsTableBody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

dateRange.addEventListener('change', loadBookings);
statusFilter.addEventListener('change', loadBookings);
classFilter.addEventListener('change', loadBookings);

bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        passengerId: document.getElementById('passenger').value,
        flightId: document.getElementById('flight').value,
        class: document.getElementById('class').value,
        seat: document.getElementById('seat').value,
        price: document.getElementById('price').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value
    };

    try {
        const response = await fetch(
            currentBookingId ? `${API_URL}/${currentBookingId}` : API_URL,
            {
                method: currentBookingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            }
        );

        if (!response.ok) throw new Error('Error al guardar la reserva');
        
        showMessage(successMessage, currentBookingId ? 'Reserva actualizada exitosamente' : 'Reserva creada exitosamente');
        closeModal();
        loadBookings();
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al guardar la reserva');
    }
});

// Inicializar
loadPassengers();
loadFlights();
loadBookings();
