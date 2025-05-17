import React from 'react';
import { Container, Row, Col, Card, CardGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlaneDeparture, faPlaneArrival, faTicketAlt, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

const Home = () => {
  return (
    <Container fluid className="mt-4">
      <h1 className="text-center mb-4">Bienvenido al Sistema de Aeropuerto</h1>
      
      <CardGroup className="mb-4">
        <Card>
          <Card.Body>
            <FontAwesomeIcon icon={faPlaneDeparture} size="3x" className="mb-3 text-primary" />
            <Card.Title>Vuelos de Salida</Card.Title>
            <Card.Text>
              Consulta y gestiona los vuelos de salida programados
            </Card.Text>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body>
            <FontAwesomeIcon icon={faPlaneArrival} size="3x" className="mb-3 text-primary" />
            <Card.Title>Vuelos de Llegada</Card.Title>
            <Card.Text>
              Monitorea los vuelos de llegada en tiempo real
            </Card.Text>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body>
            <FontAwesomeIcon icon={faTicketAlt} size="3x" className="mb-3 text-primary" />
            <Card.Title>Reservaciones</Card.Title>
            <Card.Text>
              Gestionar y consultar reservaciones de pasajeros
            </Card.Text>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body>
            <FontAwesomeIcon icon={faShieldAlt} size="3x" className="mb-3 text-primary" />
            <Card.Title>Seguridad</Card.Title>
            <Card.Text>
              Control de seguridad y verificación de pasajeros
            </Card.Text>
          </Card.Body>
        </Card>
      </CardGroup>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Estadísticas en Tiempo Real</Card.Title>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Vuelos en Tiempo Real</span>
                <span className="badge bg-success">12</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Reservas Pendientes</span>
                <span className="badge bg-warning">8</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Alertas de Seguridad</span>
                <span className="badge bg-danger">3</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Próximos Vuelos</Card.Title>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vuelo</th>
                      <th>Destino</th>
                      <th>Hora</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>IB1234</td>
                      <td>Madrid</td>
                      <td>15:30</td>
                      <td>
                        <span className="badge bg-success">En tiempo</span>
                      </td>
                    </tr>
                    <tr>
                      <td>IB5678</td>
                      <td>Barcelona</td>
                      <td>16:45</td>
                      <td>
                        <span className="badge bg-warning">Por confirmar</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
