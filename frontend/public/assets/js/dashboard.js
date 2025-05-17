const API_URL = 'http://localhost:3001/api';

// Elementos del DOM
const dateRange = document.getElementById('dateRange');
const refreshBtn = document.getElementById('refreshBtn');
const alertsList = document.getElementById('alertsList');

// Gráficos
let bookingsChart;
let passengersChart;
let flightsStatusChart;

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

// Función para obtener estadísticas
async function getStatistics() {
    try {
        const [start, end] = dateRanges[dateRange.value]();
        
        // Obtener estadísticas
        const [flights, passengers, bookings] = await Promise.all([
            fetch(`${API_URL}/flights/stats?start=${start.toISOString()}&end=${end.toISOString()}`),
            fetch(`${API_URL}/passengers/stats?start=${start.toISOString()}&end=${end.toISOString()}`),
            fetch(`${API_URL}/bookings/stats?start=${start.toISOString()}&end=${end.toISOString()}`)
        ]);

        const [flightsData, passengersData, bookingsData] = await Promise.all([
            flights.json(),
            passengers.json(),
            bookings.json()
        ]);

        // Actualizar estadísticas
        document.getElementById('flightsCount').textContent = flightsData.total;
        document.getElementById('passengersCount').textContent = passengersData.total;
        document.getElementById('bookingsCount').textContent = bookingsData.total;
        document.getElementById('incomeAmount').textContent = `$${bookingsData.income.toFixed(2)}`;

        // Actualizar gráficos
        updateBookingsChart(flightsData.byMonth);
        updatePassengersChart(passengersData.byNationality);
        updateFlightsStatusChart(flightsData.byStatus);

        // Obtener y mostrar alertas
        const alerts = await fetch(`${API_URL}/alerts?start=${start.toISOString()}&end=${end.toISOString()}`);
        const alertData = await alerts.json();
        renderAlerts(alertData.alerts);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        showError('Error al cargar las estadísticas');
    }
}

// Función para actualizar gráfico de reservas por mes
function updateBookingsChart(data) {
    if (!bookingsChart) {
        const ctx = document.getElementById('bookingsChart').getContext('2d');
        bookingsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.month),
                datasets: [{
                    label: 'Reservas',
                    data: data.map(d => d.count),
                    borderColor: '#1976d2',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } else {
        bookingsChart.data.labels = data.map(d => d.month);
        bookingsChart.data.datasets[0].data = data.map(d => d.count);
        bookingsChart.update();
    }
}

// Función para actualizar gráfico de distribución de pasajeros
function updatePassengersChart(data) {
    if (!passengersChart) {
        const ctx = document.getElementById('passengersChart').getContext('2d');
        passengersChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(d => d.nationality),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: ['#1976d2', '#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } else {
        passengersChart.data.labels = data.map(d => d.nationality);
        passengersChart.data.datasets[0].data = data.map(d => d.count);
        passengersChart.update();
    }
}

// Función para actualizar gráfico de estado de vuelos
function updateFlightsStatusChart(data) {
    if (!flightsStatusChart) {
        const ctx = document.getElementById('flightsStatusChart').getContext('2d');
        flightsStatusChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.status),
                datasets: [{
                    label: 'Vuelos',
                    data: data.map(d => d.count),
                    backgroundColor: ['#1976d2', '#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } else {
        flightsStatusChart.data.labels = data.map(d => d.status);
        flightsStatusChart.data.datasets[0].data = data.map(d => d.count);
        flightsStatusChart.update();
    }
}

// Función para renderizar alertas
function renderAlerts(alerts) {
    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item alert-${alert.type}">
            <i class="fas ${alert.icon}"></i>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
            </div>
        </div>
    `).join('');
}

// Función para mostrar mensaje de error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Event Listeners
dateRange.addEventListener('change', getStatistics);
refreshBtn.addEventListener('click', getStatistics);

// Inicializar
getStatistics();
