const bcrypt = require('bcryptjs');

// Contraseñas iniciales
const initialPasswords = {
    admin: 'admin123',
    operador: 'operador123',
    seguridad: 'seguridad123',
    checkin: 'checkin123',
    reportes: 'reportes123'
};

// Generar hashes para cada contraseña
const generateHashes = async () => {
    try {
        for (const [user, password] of Object.entries(initialPasswords)) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            console.log(`Hash para ${user}: ${hash}`);
        }
    } catch (error) {
        console.error('Error al generar hashes:', error);
    }
};

generateHashes();
