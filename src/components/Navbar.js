import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlane, faTicket, faShieldAlt, faChartBar } from '@fortawesome/free-solid-svg-icons';

const NavbarComponent = () => {
  return (
    <Navbar expand="lg" className="bg-primary">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <FontAwesomeIcon icon={faPlane} className="me-2" />
          Aeropuerto Internacional
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/flights">
              <FontAwesomeIcon icon={faPlane} className="me-2" />
              Vuelos
            </Nav.Link>
            <Nav.Link as={Link} to="/bookings">
              <FontAwesomeIcon icon={faTicket} className="me-2" />
              Reservaciones
            </Nav.Link>
            <Nav.Link as={Link} to="/security">
              <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
              Seguridad
            </Nav.Link>
            <Nav.Link as={Link} to="/reports">
              <FontAwesomeIcon icon={faChartBar} className="me-2" />
              Reportes
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
