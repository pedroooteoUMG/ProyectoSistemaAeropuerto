const request = require('supertest');
const app = require('../app');
const { User } = require('../models/user');
const { config } = require('../config');

// Datos de prueba
const testUser = {
  email: 'test@example.com',
  password: 'Test123!',
  nombre: 'Test',
  apellido: 'Usuario',
  role: 'operador'
};

describe('Auth Controller', () => {
  let token;

  beforeAll(async () => {
    // Limpiar la base de datos de prueba
    await User.deleteByEmail(testUser.email);

    // Crear usuario de prueba
    await User.create(testUser);
  });

  afterAll(async () => {
    // Limpiar después de los tests
    await User.deleteByEmail(testUser.email);
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      token = response.body.token;
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/register', () => {
    const newUser = {
      email: 'newuser@example.com',
      password: 'NewUser123!',
      nombre: 'New',
      apellido: 'User',
      role: 'operador'
    };

    it('should register successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(newUser);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.userId).toBeDefined();

      // Limpiar usuario registrado
      await User.deleteByEmail(newUser.email);
    });

    it('should fail with existing email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /auth/profile', () => {
    it('should get profile successfully', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /auth/profile', () => {
    const updatedData = {
      nombre: 'Updated',
      apellido: 'Name'
    };

    it('should update profile successfully', async () => {
      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .put('/auth/profile')
        .send(updatedData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should send password reset email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password successfully', async () => {
      // Primero obtener token de reseteo
      const forgotResponse = await request(app)
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      // Simular token de reseteo
      const resetToken = 'test-reset-token';
      const resetResponse = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!'
        });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body.success).toBe(true);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
