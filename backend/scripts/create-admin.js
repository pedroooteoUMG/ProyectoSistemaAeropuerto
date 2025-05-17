const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');

// Configurar oracledb
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Configuración de la base de datos
const dbConfig = {
    user: 'aeropuerto',
    password: 'aeropuerto',
    connectString: 'localhost:1521/orcl'
};

async function createAdmin() {
    try {
        // Verificar si el usuario ya existe
        // Conectar a la base de datos
        const connection = await oracledb.getConnection(dbConfig);
        
        // Verificar si el usuario ya existe
        const result = await connection.execute(
            'SELECT * FROM AER_Usuario WHERE USR_email = :email',
            { email: 'admin@aeropuerto.com' }
        );

        if (existingUser.rows.length > 0) {
            console.log('El usuario admin ya existe');
            return;
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Insertar el usuario admin
        const sql = `
            INSERT INTO AER_Usuario (
                USR_email,
                USR_password,
                USR_nombre,
                USR_apellido,
                USR_rol,
                USR_estado,
                USR_fecha_creacion,
                USR_ultimo_login
            ) VALUES (
                :email,
                :password,
                :nombre,
                :apellido,
                :rol,
                :estado,
                SYSDATE,
                SYSDATE
            )
        `;

        const binds = {
            email: 'admin@aeropuerto.com',
            password: hashedPassword,
            nombre: 'Administrador',
            apellido: 'Sistema',
            rol: 'administrador',
            estado: 'activo'
        };

        // Ejecutar la inserción
        await connection.execute(sql, binds);
        
        // Cerrar la conexión
        await connection.close();
        console.log('Usuario admin creado exitosamente');
    } catch (error) {
        console.error('Error al crear el usuario admin:', error);
        throw error;
    }
}

// Ejecutar el script
createAdmin();
