import React, { useState, useEffect } from "react";
import { Container, Form, Row, Col, Button, Table } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import UploadImage from "../pages/UploadImage";

const Appone = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contact: "",
    gender: "",
    subject: "math",
    resume: null,
    url: "",
    about: ""
  });

  const [records, setRecords] = useState([]); 

  
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value
    }));
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      firstname: formData.firstname,
      lastname: formData.lastname,
      email: formData.email,
      contact: formData.contact,
      gender: formData.gender,
      subject: formData.subject,
      image_url: formData.url,
      about: formData.about
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/save-form/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      alert("Server response: " + data.message);

      // Refresh records after adding new one
      fetchRecords();

    } catch (err) {
      console.error(err);
      alert("Failed to send data to backend.");
    }
  };

  // Fetch records from Django API (which reads MongoDB)
  const fetchRecords = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/get-forms/");
      const data = await response.json();
      setRecords(data.records);
    } catch (err) {
      console.error("Failed to fetch records: ", err);
    }
  };

  // Fetch records on component load
  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <Container className="mt-5">
      <h1 className="mb-4 text-center">Form in React</h1>

      {/* Form */}
      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="firstname">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Your First Name"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group controlId="lastname">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Your Last Name"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group controlId="contact">
              <Form.Label>Contact</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Phone #"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Gender</Form.Label>
          <div className="d-flex gap-3">
            <Form.Check
              type="radio"
              label="Male"
              name="gender"
              value="Male"
              checked={formData.gender === "Male"}
              onChange={handleChange}
            />
            <Form.Check
              type="radio"
              label="Female"
              name="gender"
              value="Female"
              checked={formData.gender === "Female"}
              onChange={handleChange}
            />
            <Form.Check
              type="radio"
              label="Other"
              name="gender"
              value="Other"
              checked={formData.gender === "Other"}
              onChange={handleChange}
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3" controlId="subject">
          <Form.Label>Subject</Form.Label>
          <Form.Select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
          >
            <option value="math">Math</option>
            <option value="physics">Physics</option>
            <option value="english">English</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="resume">
          <Form.Label>Resume</Form.Label>
          <Form.Control
            type="file"
            name="resume"
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3 d-flex align-items-center">
          <Form.Label className="me-2 mb-0" htmlFor="url">URL:</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter your image URL"
            name="url"
            value={formData.url}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="about">
          <Form.Label>About</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            placeholder="Enter Description"
            name="about"
            value={formData.about}
            onChange={handleChange}
          />
        </Form.Group>

        <div className="d-flex justify-content-center gap-3">
          <Button type="reset" variant="secondary" className="px-4">
            Reset
          </Button>
          <Button type="submit" variant="primary" className="px-4">
            Submit
          </Button>
        </div>
      </Form>

      {/* Table of records */}
      <h2 className="mt-5 text-center">Saved Records</h2>
      <Table striped bordered hover responsive className="mt-3">
        <thead>
          <tr>
            <th>First</th>
            <th>Last</th>
            <th>Email</th>
            <th>Contact</th>
            <th>Gender</th>
            <th>Subject</th>
            <th>Image URL</th>
            <th>About</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? (
            records.map((rec) => (
              <tr key={rec._id}>
                <td>{rec.firstname}</td>
                <td>{rec.lastname}</td>
                <td>{rec.email}</td>
                <td>{rec.contact}</td>
                <td>{rec.gender}</td>
                <td>{rec.subject}</td>
                <td>{rec.image_url}</td>
                <td>{rec.about}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center">No records found</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default Appone;
