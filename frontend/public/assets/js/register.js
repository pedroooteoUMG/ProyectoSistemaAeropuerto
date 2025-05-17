document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    registerForm.parentNode.insertBefore(errorMessage, registerForm);

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validaciones básicas
        if (!nombre || !apellido || !email || !password || !confirmPassword) {
            errorMessage.textContent = 'Por favor, complete todos los campos';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Las contraseñas no coinciden';
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre,
                    apellido,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registro exitoso! Por favor, inicia sesión.');
                window.location.href = '/views/login/login.html';
            } else {
                errorMessage.textContent = data.message || 'Error al registrarse';
            }
        } catch (error) {
            errorMessage.textContent = 'Error al conectarse con el servidor';
        }
    });
});
