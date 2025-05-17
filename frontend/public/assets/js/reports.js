const API_URL = 'http://localhost:3001/api/reports';

// Elementos del DOM
const reportType = document.getElementById('reportType');
const dateRange = document.getElementById('dateRange');
const format = document.getElementById('format');
const generateReportBtn = document.getElementById('generateReportBtn');
const previewContent = document.getElementById('previewContent');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const progressModal = document.getElementById('progressModal');
const progressBar = document.querySelector('.progress');
const progressText = document.getElementById('progressText');

// Parámetros específicos
const flightsParams = document.getElementById('flightsParams');
const passengersParams = document.getElementById('passengersParams');
const bookingsParams = document.getElementById('bookingsParams');

// Configuración de fechas
const dateRanges = {
    today: () => [new Date(), new Date()],
    week: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return [start, end];
    },
    month: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        return [start, end];
    },
    year: () => {
        const end = new Date();
        const start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        return [start, end];
    },
    custom: () => [new Date(), new Date()]
};

// Función para mostrar mensaje
function showMessage(element, message) {
    element.querySelector('span').textContent = message;
    element.style.display = 'flex';
    setTimeout(() => element.style.display = 'none', 3000);
}

// Función para actualizar parámetros específicos
function updateSpecificParams() {
    const type = reportType.value;
    flightsParams.style.display = type === 'flights' ? 'block' : 'none';
    passengersParams.style.display = type === 'passengers' ? 'block' : 'none';
    bookingsParams.style.display = type === 'bookings' ? 'block' : 'none';
}

// Función para obtener parámetros del reporte
function getReportParams() {
    const type = reportType.value;
    const [start, end] = dateRanges[dateRange.value]();
    const params = {
        type,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        format: format.value
    };

    // Agregar parámetros específicos según el tipo de reporte
    if (type === 'flights') {
        params.origin = document.getElementById('origin').value;
        params.destination = document.getElementById('destination').value;
        params.airline = document.getElementById('airline').value;
    } else if (type === 'passengers') {
        params.nationality = document.getElementById('nationality').value;
        params.minAge = document.getElementById('minAge').value;
        params.maxAge = document.getElementById('maxAge').value;
    } else if (type === 'bookings') {
        params.status = document.getElementById('status').value;
        params.class = document.getElementById('class').value;
    }

    return params;
}

// Función para generar vista previa
async function generatePreview() {
    try {
        const params = getReportParams();
        const response = await fetch(`${API_URL}/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) throw new Error('Error al generar la vista previa');
        const data = await response.json();
        
        // Renderizar vista previa
        previewContent.innerHTML = renderPreview(data);
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al generar la vista previa');
    }
}

// Función para generar reporte
async function generateReport() {
    try {
        // Mostrar modal de progreso
        progressModal.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        const params = getReportParams();
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) throw new Error('Error al generar el reporte');
        
        // Obtener el progreso del reporte
        const progress = await response.json();
        updateProgress(progress);

        // Esperar a que el reporte esté listo
        while (progress.progress < 100) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const status = await fetch(`${API_URL}/status/${progress.id}`);
            const currentProgress = await status.json();
            updateProgress(currentProgress);
        }

        // Descargar el reporte
        const downloadUrl = `${API_URL}/download/${progress.id}`;
        window.location.href = downloadUrl;

        showMessage(successMessage, 'Reporte generado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        showMessage(errorMessage, 'Error al generar el reporte');
    } finally {
        progressModal.style.display = 'none';
    }
}

// Función para actualizar el progreso
function updateProgress(progress) {
    progressBar.style.width = `${progress.progress}%`;
    progressText.textContent = `${progress.progress}%`;
}

// Función para renderizar vista previa
function renderPreview(data) {
    const type = reportType.value;
    let html = '<div class="preview-header">';
    html += `<h3>Reporte de ${type.charAt(0).toUpperCase() + type.slice(1)}</h3>`;
    html += `<p>Periodo: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}</p>`;
    html += '</div>';

    if (type === 'flights') {
        html += '<table class="preview-table">';
        html += '<thead><tr><th>Vuelo</th><th>Origen</th><th>Destino</th><th>Aerolínea</th><th>Fecha</th></tr></thead>';
        html += '<tbody>';
        data.flights.forEach(flight => {
            html += `<tr>
                <td>${flight.flightNumber}</td>
                <td>${flight.origin}</td>
                <td>${flight.destination}</td>
                <td>${flight.airline}</td>
                <td>${new Date(flight.date).toLocaleDateString()}</td>
            </tr>`;
        });
        html += '</tbody></table>';
    } else if (type === 'passengers') {
        html += '<table class="preview-table">';
        html += '<thead><tr><th>Nombre</th><th>Nacionalidad</th><th>Edad</th><th>Vuelos</th></tr></thead>';
        html += '<tbody>';
        data.passengers.forEach(passenger => {
            html += `<tr>
                <td>${passenger.name}</td>
                <td>${passenger.nationality}</td>
                <td>${passenger.age}</td>
                <td>${passenger.flights}</td>
            </tr>`;
        });
        html += '</tbody></table>';
    } else if (type === 'bookings') {
        html += '<table class="preview-table">';
        html += '<thead><tr><th>Reserva</th><th>Pasajero</th><th>Vuelo</th><th>Estado</th><th>Precio</th></tr></thead>';
        html += '<tbody>';
        data.bookings.forEach(booking => {
            html += `<tr>
                <td>${booking.bookingNumber}</td>
                <td>${booking.passenger}</td>
                <td>${booking.flight}</td>
                <td>${booking.status}</td>
                <td>$${booking.price.toFixed(2)}</td>
            </tr>`;
        });
        html += '</tbody></table>';
    }

    return html;
}

// Event Listeners
reportType.addEventListener('change', updateSpecificParams);
dateRange.addEventListener('change', generatePreview);
format.addEventListener('change', generatePreview);
generateReportBtn.addEventListener('click', generateReport);

// Inicializar
updateSpecificParams();
generatePreview();
