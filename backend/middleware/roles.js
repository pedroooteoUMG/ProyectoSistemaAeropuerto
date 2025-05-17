const ROLES = {
    ADMIN: 'administrador',
    USER: 'usuario'
};

// Middleware para verificar roles
const checkRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado'
            });
        }

        if (req.user.rol !== requiredRole) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para esta acción'
            });
        }

        next();
    };
};

module.exports = {
    ROLES,
    checkRole
};
