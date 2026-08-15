const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * PDF Document Generator Service using PDFKit
 * Perfectly aligned A4 document generator with professional formatting
 */
const generatePDFDocument = async ({ automationId, type, title, content, recipientName, dateStr }) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadDir = path.join(__dirname, '../public/uploads/documents');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${type || 'doc'}_${automationId}_${Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      const relativePath = `/uploads/documents/${fileName}`;

      // Standard A4 dimensions: 595.28 x 841.89 pt. Printable width with margin 50 = 495.28 pt (x: 50 to 545.28)
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Top Banner Background
      doc.rect(0, 0, 595.28, 50).fill('#0F7A3F');

      // Top Banner Header Text
      doc.fillColor('#FFFFFF')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('COMMANDFLOW AI — AUTOMATED DOCUMENT ENGINE', 50, 18, {
           width: 320,
           align: 'left'
         });

      doc.fillColor('#EAF6EE')
         .fontSize(9)
         .font('Helvetica')
         .text(`ID: ${automationId}`, 350, 19, {
           width: 195.28,
           align: 'right'
         });

      // Move down past header banner
      doc.y = 75;

      // Date & Reference
      const formattedDate = dateStr || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.fillColor('#4B5563')
         .fontSize(9)
         .font('Helvetica')
         .text(`Date: ${formattedDate}`, 50, doc.y, {
           width: 495.28,
           align: 'right'
         });

      doc.moveDown(1.5);

      // Main Document Title
      doc.fillColor('#1F2937')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(title || 'OFFICIAL DOCUMENT REQUEST', 50, doc.y, {
           width: 495.28,
           align: 'center'
         });
      
      doc.moveDown(0.75);

      // Horizontal Separator Line
      const currentY = doc.y;
      doc.strokeColor('#D1E7DD')
         .lineWidth(1)
         .moveTo(50, currentY)
         .lineTo(545.28, currentY)
         .stroke();

      doc.moveDown(1.5);

      // Recipient Block
      if (recipientName) {
        doc.fillColor('#1F2937')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('TO:', 50, doc.y);
        
        doc.fillColor('#374151')
           .fontSize(10)
           .font('Helvetica')
           .text(`${recipientName}`, 50, doc.y, {
             width: 495.28,
             align: 'left'
           });

        doc.moveDown(1.5);
      }

      // Content Body
      doc.fillColor('#1F2937')
         .fontSize(10.5)
         .font('Helvetica')
         .text(content || 'No content provided.', 50, doc.y, {
           width: 495.28,
           align: 'left',
           lineGap: 5
         });

      doc.moveDown(3);

      // Signature Block (Right aligned, clean box)
      const sigStartY = Math.max(doc.y, 650);
      doc.fillColor('#1F2937')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Sincerely / Submitted By,', 345.28, sigStartY, {
           width: 200,
           align: 'right'
         });

      doc.moveDown(2.5);

      doc.fillColor('#6B7280')
         .fontSize(9)
         .font('Helvetica')
         .text('__________________________', 345.28, doc.y, {
           width: 200,
           align: 'right'
         });
      
      doc.moveDown(0.3);

      doc.text('Authorized Sender Signature', 345.28, doc.y, {
        width: 200,
        align: 'right'
      });

      // Footer Banner / Text at bottom of page
      doc.fontSize(8)
         .fillColor('#9CA3AF')
         .font('Helvetica')
         .text('Generated automatically by CommandFlow AI Platform. Official communication document.', 50, 790, {
           width: 495.28,
           align: 'center'
         });

      doc.end();

      stream.on('finish', () => {
        resolve({
          fileName,
          filePath,
          relativePath
        });
      });

      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePDFDocument
};
