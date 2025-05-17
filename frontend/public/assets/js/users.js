const API_URL = 'http://localhost:3001/api/users';

// Elementos del DOM
const usersTableBody = document.getElementById('usersTableBody');
const newUserBtn = document.getElementById('newUserBtn');
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const modalTitle = document.getElementById('modalTitle');
const cancelBtn = document.getElementById('cancelBtn');

// Estado del modal
let currentUserId = null;

// Función para mostrar el modal
function showModal(title = 'Nuevo Usuario', user = null) {
    modalTitle.textContent = title;
    userForm.reset();
    currentUserId = user?.id || null;
    
    if (user) {
        document.getElementById('nombre').value = user.nombre;
        document.getElementById('apellido').value = user.apellido;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.rol;
        document.getElementById('status').value = user.estado;
    }
    
    // Solo mostrar campos de contraseña para nuevo usuario
    const passwordFields = userForm.querySelectorAll('[type="password"]');
    passwordFields.forEach(field => {
        field.style.display = currentUserId ? 'none' : 'block';
    });
    
    userModal.style.display = 'block';
}

// Función para cerrar el modal
function closeModal() {
    userModal.style.display = 'none';
    currentUserId = null;
}

// Función para mostrar mensaje de error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    userForm.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Función para mostrar mensaje de éxito
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    userForm.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

// Función para validar el formulario
function validateForm() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentUserId && password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return false;
    }
    
    return true;
}

// Función para cargar los usuarios
async function loadUsers() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar los usuarios');
        const data = await response.json();
        renderUsers(data.users);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los usuarios');
    }
}

// Función para renderizar los usuarios
function renderUsers(users) {
    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.nombre}</td>
            <td>${user.apellido}</td>
            <td>${user.email}</td>
            <td>
                <span class="status-badge ${user.rol}">
                    ${user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                </span>
            </td>
            <td>
                <span class="status-badge ${user.estado}">
                    ${user.estado.charAt(0).toUpperCase() + user.estado.slice(1)}
                </span>
            </td>
            <td>${user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString() : '-'}</td>
            <td>
                <button onclick="editUser(${user.id})" class="action-btn edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteUser(${user.id})" class="action-btn delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para editar usuario
function editUser(id) {
    // Aquí iría la lógica para obtener los datos del usuario
    showModal('Editar Usuario', { id });
}

// Función para eliminar usuario
async function deleteUser(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al eliminar el usuario');
        
        showSuccess('Usuario eliminado exitosamente');
        loadUsers();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar el usuario');
    }
}

// Event Listeners
newUserBtn.addEventListener('click', () => showModal());
cancelBtn.addEventListener('click', closeModal);

userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        rol: document.getElementById('role').value,
        estado: document.getElementById('status').value
    };

    try {
        const response = await fetch(
            currentUserId ? `${API_URL}/${currentUserId}` : API_URL,
            {
                method: currentUserId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            }
        );

        if (!response.ok) throw new Error('Error al guardar el usuario');
        
        showSuccess(currentUserId ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        closeModal();
        loadUsers();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar el usuario');
    }
});

// Inicializar
loadUsers();
