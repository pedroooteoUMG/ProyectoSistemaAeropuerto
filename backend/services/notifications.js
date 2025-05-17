const nodemailer = require('nodemailer');
const { monitoring } = require('./monitoring');
const { cache } = require('./cache');

// Configuración de correo
const mailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Servicio de Notificaciones
class Notifications {
  constructor() {
    // Inicializar Twilio solo si está configurado
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      const twilio = require('twilio');
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
      this.twilioClient = null;
    }

    // Inicializar el transportador de correo
    this.mailer = nodemailer.createTransport(mailConfig);

    // Configuración de límites
    this.limits = {
      email: {
        daily: 1000,
        hourly: 200,
        current: 0,
        lastReset: Date.now()
      },
      sms: {
        daily: 500,
        hourly: 100,
        current: 0,
        lastReset: Date.now()
      }
    };

    // Configuración de plantillas
    this.templates = {
      email: {
        welcome: require('../templates/email/welcome'),
        resetPassword: require('../templates/email/resetPassword'),
        bookingConfirmation: require('../templates/email/bookingConfirmation'),
        securityAlert: require('../templates/email/securityAlert')
      },
      sms: {
        bookingConfirmation: require('../templates/sms/bookingConfirmation'),
        securityAlert: require('../templates/sms/securityAlert')
      }
    };

    // Iniciar limpieza de caché
    this.startCacheCleanup();
  }

  // Enviar correo electrónico
  async sendEmail(to, subject, template, data) {
    try {
      // Verificar límites
      if (this.checkLimits('email')) {
        throw new Error('Límite diario de correos alcanzado');
      }

      // Obtener plantilla
      const emailTemplate = this.templates.email[template];
      const emailContent = emailTemplate(data);

      // Enviar correo
      const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@aeropuerto.com',
        to,
        subject,
        html: emailContent.html,
        text: emailContent.text
      };

      await this.mailer.sendMail(mailOptions);
      
      // Actualizar estadísticas
      this.limits.email.current++;
      monitoring.metrics.emailsSent++;

      return true;
    } catch (error) {
      monitoring.createSystemAlert(
        'notifications',
        1,
        0,
        `Error al enviar correo: ${error.message}`
      );
      throw error;
    }
  }

  // Enviar SMS
  async sendSMS(to, template, data) {
    if (!this.twilioClient) {
      throw new Error('Twilio no está configurado');
    }

    try {
      // Verificar límites
      if (this.checkLimits('sms')) {
        throw new Error('Límite diario de SMS alcanzado');
      }

      // Obtener plantilla
      const smsTemplate = this.templates.sms[template];
      const smsContent = smsTemplate(data);

      // Enviar SMS
      const message = await this.twilioClient.messages.create({
        body: smsContent,
        from: process.env.TWILIO_FROM_NUMBER,
        to
      });
      
      // Actualizar estadísticas
      this.limits.sms.current++;
      monitoring.metrics.smsSent++;

      return message.sid;
    } catch (error) {
      monitoring.createSystemAlert(
        'notifications',
        1,
        0,
        `Error al enviar SMS: ${error.message}`
      );
      throw error;
    }
  }

  // Verificar límites
  checkLimits(type) {
    const now = Date.now();
    const limit = this.limits[type];

    // Reset diario
    const hoursSinceReset = (now - limit.lastReset) / (1000 * 60 * 60);
    if (hoursSinceReset >= 24) {
      limit.current = 0;
      limit.lastReset = now;
    }

    // Reset horario
    const hours = Math.floor(hoursSinceReset);
    if (hours >= 1) {
      limit.current = 0;
    }

    return limit.current >= limit.daily;
  }

  // Enviar notificación de seguridad
  async sendSecurityNotification(data) {
    try {
      // Enviar correo de alerta
      await this.sendEmail(
        process.env.SECURITY_EMAILS.split(','),
        'Alerta de Seguridad - Aeropuerto Internacional',
        'securityAlert',
        data
      );

      // Enviar SMS de alerta
      await this.sendSMS(
        process.env.SECURITY_PHONES.split(','),
        'securityAlert',
        data
      );

      // Crear alerta en sistema
      await cache.autoCache('security_alerts', {
        type: 'security',
        severity: data.severity,
        message: data.message
      }, null, 3600);

      return true;
    } catch (error) {
      monitoring.createSystemAlert(
        'security',
        1,
        0,
        `Error al enviar notificación de seguridad: ${error.message}`
      );
      throw error;
    }
  }

  // Enviar notificación de reserva
  async sendBookingNotification(booking) {
    try {
      // Enviar correo de confirmación
      await this.sendEmail(
        booking.email,
        'Confirmación de Reserva - Aeropuerto Internacional',
        'bookingConfirmation',
        booking
      );

      // Enviar SMS de confirmación
      await this.sendSMS(
        booking.phone,
        'bookingConfirmation',
        booking
      );

      return true;
    } catch (error) {
      monitoring.createSystemAlert(
        'bookings',
        1,
        0,
        `Error al enviar notificación de reserva: ${error.message}`
      );
      throw error;
    }
  }

  // Limpiar caché de notificaciones
  async startCacheCleanup() {
    try {
      setInterval(async () => {
        // Limpiar caché de notificaciones expiradas
        await cache.clearCacheByType('notifications');

        // Actualizar estadísticas
        monitoring.metrics.cacheCleanup++;
      }, 3600000); // Cada hora
    } catch (error) {
      monitoring.createSystemAlert(
        'cache',
        1,
        0,
        `Error al limpiar caché de notificaciones: ${error.message}`
      );
      throw error;
    }
  }

  // Obtener estadísticas
  getStats() {
    return {
      emails: {
        sent: monitoring.metrics.emailsSent,
        limit: this.limits.email.daily,
        current: this.limits.email.current
      },
      sms: {
        sent: monitoring.metrics.smsSent,
        limit: this.limits.sms.daily,
        current: this.limits.sms.current
      },
      cache: {
        cleanups: monitoring.metrics.cacheCleanup,
        size: monitoring.metrics.cacheSize
      }
    };
  }
}

module.exports = new Notifications();
