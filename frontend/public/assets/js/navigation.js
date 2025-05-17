document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay sesión iniciada
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/views/login.html';
        return;
    }

    // Obtener información del usuario
    fetch('http://localhost:3001/api/users/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = '/views/login.html';
            return;
        }
        return response.json();
    })
    .then(user => {
        document.getElementById('userName').textContent = user.nombre;
        setupNavigation(user.roles);
    })
    .catch(error => {
        console.error('Error:', error);
        localStorage.removeItem('token');
        window.location.href = '/views/login.html';
    });

    // Manejar cierre de sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/views/login.html';
    });

    // Manejar navegación
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            document.getElementById('viewFrame').src = href;
            document.getElementById('currentView').textContent = link.textContent.trim();
        });
    });

    // Manejar mensajes de las vistas
    const viewFrame = document.getElementById('viewFrame');
    viewFrame.addEventListener('load', () => {
        const frameWindow = viewFrame.contentWindow;
        frameWindow.addEventListener('message', (event) => {
            if (event.data.type === 'error') {
                showError(event.data.message);
            } else if (event.data.type === 'success') {
                showSuccess(event.data.message);
            }
        });
    });
});

// Configurar navegación según roles
function setupNavigation(roles) {
    const navItems = document.querySelectorAll('.nav-menu li');
    navItems.forEach(item => {
        const view = item.querySelector('a').textContent.trim().toLowerCase();
        const allowedRoles = getRequiredRolesForView(view);
        
        if (!roles.some(role => allowedRoles.includes(role))) {
            item.style.display = 'none';
        }
    });
}

// Obtener roles requeridos para cada vista
function getRequiredRolesForView(view) {
    const rolesByView = {
        'dashboard': ['admin', 'operador', 'analista', 'agente'],
        'vuelos': ['admin', 'operador', 'analista'],
        'pasajeros': ['admin', 'operador', 'agente'],
        'reservas': ['admin', 'operador', 'agente'],
        'seguridad': ['admin', 'agente seguridad'],
        'reportes': ['admin', 'analista'],
        'usuarios': ['admin']
    };
    
    return rolesByView[view] || ['admin'];
}

// Mostrar mensaje de error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Mostrar mensaje de éxito
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}
