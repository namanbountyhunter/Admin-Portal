import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Table,
  Spinner,
  Alert,
  Modal,
  Button,
  Form,
  Pagination,
} from "react-bootstrap";
import axios from "axios";
import UploadImage from "./UploadImage";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Media,
  ImageRun,
} from "docx";

const toBase64 = async (url) => {
  const response = await fetch(url, { mode: "cors" });
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

const FormRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editRecord, setEditRecord] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setselectedImage] = useState(null);
  const pdfRef = useRef();
  const [wordLoading, setWordLoading] = useState(false);

  const fetchRecords = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/forms/?page=${pageNumber}`
      );
      const data = response.data;

      if (data.records && data.records.length > 0) {
        setRecords(data.records);
        setTotalPages(Math.ceil(data.count / 10)); // Assuming 10 per page
        setError("");
      } else {
        setRecords([]);
        setError("No records found.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch records from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(page);
  }, [page]);

  const handleEditClick = (record) => {
    const recordWithId = {
      ...record,
      _id: record._id || record.id,
    };
    setEditRecord(recordWithId);
    setFormValues(recordWithId);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const fetchImageBuffer = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Image fetch failed");
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return new Uint8Array(arrayBuffer); // 👈 correct format
    } catch (e) {
      console.error("Image fetch error:", e);
      return null;
    }
  };

  const downloadWord = async () => {
    setWordLoading(true);
    try {
      const children = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        children.push(
          new Paragraph({
            text: `#${i + 1} Record`,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph(`First Name: ${record.firstname}`),
          new Paragraph(`Last Name: ${record.lastname}`),
          new Paragraph(`Email: ${record.email}`),
          new Paragraph(`Contact: ${record.contact}`),
          new Paragraph(`Gender: ${record.gender}`),
          new Paragraph(`Subject: ${record.subject}`),
          new Paragraph(`About: ${record.about}`)
        );

        // Handle image
        if (record.image_url && record.image_url !== "No Image") {
          console.log("Fetching image from:", record.image_url);

          const imageBuffer = await fetchImageBuffer(record.image_url);
          if (imageBuffer) {
            const image = new ImageRun({
              data: imageBuffer,
              transformation: {
                width: 300,
                height: 200,
              },
            });

            children.push(new Paragraph("Image:"));
            children.push(new Paragraph({ children: [image] }));
          } else {
            children.push(new Paragraph("⚠️ Image could not be loaded"));
          }
        } else {
          children.push(new Paragraph("No image provided"));
        }

        // Add a line break between records
        children.push(new Paragraph(" "));
      }

      // ✅ Create doc with sections
      const doc = new Document({
        creator: "Form Records App",
        title: "Form Submissions",
        description: "List of submitted forms with optional images",
        sections: [
          {
            properties: {},
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "form_data.docx");
    } catch (err) {
      console.error("❌ Failed to generate document:", err);
      alert("Failed to generate Word document: " + err.message);
    } finally {
      setWordLoading(false);
    }
  };

  const downloadPDF = () => {
    const input = pdfRef.current;
    if (!input) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 10;
    let position = margin;

    html2canvas(input, {
      scale: 2,
      useCORS: true,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfHeight;

      pdf.addImage(imgData, "PNG", margin, margin, pdfWidth, pdfHeight);
      heightLeft -= pageHeight - margin;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - heightLeft;
        pdf.addImage(imgData, "PNG", margin, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight - margin;
      }

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 5,
          { align: "center" }
        );
      }

      pdf.save("form_data.pdf");
    });
  };

  const handleUpdateSubmit = async () => {
    try {
      if (!editRecord || !editRecord._id) {
        alert("Invalid record ID.");
        return;
      }

      const updateData = { ...formValues };
      delete updateData._id;

      const response = await fetch(
        `http://127.0.0.1:8000/api/update/${editRecord._id}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (response.ok && data.message) {
        alert("Record updated successfully!");
        setEditRecord(null);
        fetchRecords(page);
      } else {
        alert(`Update failed: ${data.error || "Unknown error."}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating record.");
    }
  };

  const handleSoftDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/soft-delete-form/${id}/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await response.json();
        if (data.message) {
          alert("Record deleted successfully!");
          fetchRecords(page);
        } else {
          alert("Delete failed.");
        }
      } catch (err) {
        console.error(err);
        alert("Error deleting record.");
      }
    }
  };

  const renderPagination = () => {
    let items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === page}
          onClick={() => setPage(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    return <Pagination className="justify-content-center">{items}</Pagination>;
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4 text-center">Form Submissions</h2>

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3 no-print">
            <h4 className="mb-0">Submissions Table</h4>
            <Button variant="success" onClick={downloadPDF}>
              Download Table as PDF
            </Button>
            <Button
              variant="primary"
              onClick={downloadWord}
              disabled={wordLoading}
            >
              {wordLoading ? "Generating..." : "Download Table as Word"}
            </Button>
          </div>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>FirstName</th>
                <th>LastName</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Gender</th>
                <th>Subject</th>
                <th>Image</th>
                <th>About</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record._id}>
                  <td>{(page - 1) * 10 + index + 1}</td>
                  <td>{record.firstname}</td>
                  <td>{record.lastname}</td>
                  <td>{record.email}</td>
                  <td>{record.contact}</td>
                  <td>{record.gender}</td>
                  <td>{record.subject}</td>
                  <td>
                    {record.image_url ? (
                      <img
                        src={record.image_url}
                        alt="Preview"
                        onClick={() => setselectedImage(record.image_url)}
                        style={{
                          width: "60px",
                          height: "auto",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td>{record.about}</td>
                  <td>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleEditClick(record)}
                    >
                      Edit
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleSoftDelete(record._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {renderPagination()}
        </>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setselectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full Preview"
            style={{ maxHeight: "90%", borderRadius: "10px" }}
          />
        </div>
      )}

      {/* Edit Modal */}
      <Modal show={!!editRecord} onHide={() => setEditRecord(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Form Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {[
              "firstname",
              "lastname",
              "email",
              "contact",
              "gender",
              "subject",
              "about",
            ].map((field) => (
              <Form.Group key={field} className="mb-3">
                <Form.Label>{field}</Form.Label>
                <Form.Control
                  type="text"
                  name={field}
                  value={formValues[field] || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            ))}
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="text"
                name="image_url"
                value={formValues.image_url || ""}
                onChange={handleChange}
              />
              <UploadImage
                onUploadSuccess={(url) =>
                  setFormValues((prev) => ({ ...prev, image_url: url }))
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditRecord(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateSubmit}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Hidden PDF Preview */}
      <div
        ref={pdfRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "800px",
          backgroundColor: "#fff",
          color: "#000",
          padding: "20px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Form Submissions
        </h2>
        {records.map((record, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "16px",
              fontSize: "12px",
            }}
          >
            <p>
              <strong>#{index + 1}</strong>
            </p>
            <p>
              <strong>First Name:</strong> {record.firstname}
            </p>
            <p>
              <strong>Last Name:</strong> {record.lastname}
            </p>
            <p>
              <strong>Email:</strong> {record.email}
            </p>
            <p>
              <strong>Contact:</strong> {record.contact}
            </p>
            <p>
              <strong>Gender:</strong> {record.gender}
            </p>
            <p>
              <strong>Subject:</strong> {record.subject}
            </p>
            <p>
              <strong>About:</strong> {record.about}
            </p>
            {record.image_url ? (
              <img
                src={record.image_url}
                alt="Uploaded"
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  height: "auto",
                  objectFit: "contain",
                  marginTop: "10px",
                  borderRadius: "8px",
                }}
              />
            ) : (
              <p>
                <strong>Image:</strong> No Image
              </p>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
};

export default FormRecords;
