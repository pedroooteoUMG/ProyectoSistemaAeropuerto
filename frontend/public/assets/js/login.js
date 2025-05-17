document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            errorMessage.style.display = 'flex';
            errorMessage.querySelector('span').textContent = 'Por favor, complete todos los campos';
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('Error al iniciar sesión');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            
            // Redirigir a la navegación principal
            window.location.href = '/views/navigation.html';
        } catch (error) {
            console.error('Error:', error);
            errorMessage.style.display = 'flex';
            errorMessage.querySelector('span').textContent = error.message || 'Error al iniciar sesión';
        }
    });
});
