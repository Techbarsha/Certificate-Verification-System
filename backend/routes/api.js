// routes/api.js
import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import StudentData from '../models/studentData.js';
import Admin from '../models/admin.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload route
router.post('/upload', upload.single('file'), async (req, res) => {
  const { adminEmail } = req.body;

  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!adminEmail) return res.status(400).json({ error: "Admin email is required" });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const admin = await Admin.findOne({ email: new RegExp(`^${adminEmail}$`, 'i') });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    for (const item of data) {
      const newStudentData = await StudentData.create({
        certificateId: item.certificateID,
        email: item.email,
        name: item.name,
        internshipDomain: item.internshipDomain,
        internshipStartDate: item.internshipStartDate,
        internshipEndDate: item.internshipEndDate,
        adminId: admin._id,
      });
    }

    res.status(200).json({ message: "File uploaded and data saved successfully!" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file", details: error.message });
  }
});

// PDF generation route
router.get('/generate-pdf/:certificateId', async (req, res) => {
  const { certificateId } = req.params;

  try {
    const certificateData = await StudentData.findOne({ certificateId });
    if (!certificateData) return res.status(404).json({ error: "Certificate not found" });

    const doc = new PDFDocument();
    const pdfFilePath = `./pdfs/${certificateId}.pdf`; // Ensure this directory exists

    doc.pipe(fs.createWriteStream(pdfFilePath));
    doc.fontSize(25).text(`Certificate of Completion`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`This certifies that ${certificateData.name} has completed an internship in ${certificateData.internshipDomain}.`);
    doc.text(`Internship Start Date: ${certificateData.internshipStartDate}`);
    doc.text(`Internship End Date: ${certificateData.internshipEndDate}`);
    doc.text(`Certificate ID: ${certificateData.certificateId}`);
    doc.text(`Issued to: ${certificateData.email}`);
    doc.end();

    res.status(200).json({ message: "PDF generated successfully", pdfFilePath });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "An error occurred while generating the PDF" });
  }
});

export default router;
