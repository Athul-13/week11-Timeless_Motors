const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const router = express.Router();
const Order = require('../models/Order');

router.get("/generate-sales-report", async (req, res) => {
  try {
    const { dateFilter, startDate, endDate, searchQuery } = req.query;

    let query = {
      'payment.status': 'Completed'
    };

    // Date filtering logic remains the same
    const toUTC = (date) => new Date(Date.UTC(
      date.getFullYear(), date.getMonth(), date.getDate(),
      date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()
    ));
    
    if (dateFilter === "today") {
      query["timestamps.orderedAt"] = {
        $gte: toUTC(new Date(new Date().setHours(0, 0, 0, 0))),
        $lt: toUTC(new Date(new Date().setHours(23, 59, 59, 999))),
      };
    } else if (dateFilter === "week") {
      query["timestamps.orderedAt"] = {
        $gte: toUTC(new Date(new Date().setDate(new Date().getDate() - 7))),
      };
    } else if (dateFilter === "month") {
      query["timestamps.orderedAt"] = {
        $gte: toUTC(new Date(new Date().setMonth(new Date().getMonth() - 1))),
      };
    } else if (dateFilter === "custom" && startDate && endDate) {
      query["timestamps.orderedAt"] = {
        $gte: toUTC(new Date(startDate)),
        $lte: toUTC(new Date(endDate)),
      };
    }
    

    if (searchQuery) {
      query.$or = [
        { orderNumber: new RegExp(searchQuery, "i") },
        { "shippingAddress.name": new RegExp(searchQuery, "i") },
        { "shippingAddress.city": new RegExp(searchQuery, "i") }
      ];
    }

    const salesData = await Order.find(query)
      .populate('product', 'name description price')
      .populate('user', 'name email')
      .sort({ "timestamps.orderedAt": -1 });

    const reportDir = path.join(__dirname, "../public/reports");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const fileName = `timeless-motors-sales-report-${Date.now()}.pdf`;
    const filePath = path.join(reportDir, fileName);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Helper functions for consistent styling
    const drawHorizontalLine = (y) => {
      doc.moveTo(50, y).lineTo(550, y).stroke();
    };

    const drawTableRow = (items, x, y, widths, options = {}) => {
      items.forEach((item, i) => {
        doc.text(item.toString(), x, y, {
          width: widths[i],
          align: options.align || 'left'
        });
        x += widths[i];
      });
    };

    // Company Header
    doc.font('Helvetica-Bold')
      .fontSize(24)
      .text('TIMELESS MOTORS', { align: 'center' })
      .fontSize(14)
      .text('Sales Report', { align: 'center' })
      .moveDown();

    // Report Details
    doc.font('Helvetica')
      .fontSize(10)
      .text(`Report Generated: ${new Date().toLocaleString()}`)
      .text(`Period: ${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}`)
      .moveDown();

    if (dateFilter === "custom") {
      doc.text(`Date Range: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`);
    }
    if (searchQuery) doc.text(`Search Filter: ${searchQuery}`);
    doc.moveDown();

    // Summary Statistics with bordered box
    const totalSales = salesData.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalTax = salesData.reduce((sum, order) => sum + order.tax.amount, 0);
    const tenPercentSales = totalSales * 0.1;
    
    doc.rect(50, doc.y, 500, 100).stroke(); // Draws the box

    doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY', 60, doc.y + 10);
    doc.moveDown(); // Moves to next line

    const summaryStartY = doc.y; // Store current Y position for alignment

    doc.font('Helvetica').fontSize(10)
      .text(`Total Orders: ${salesData.length}`, 60, summaryStartY + 10)
      .text(`Total Revenue: ₹${totalSales.toLocaleString()}`, 280, summaryStartY + 10)
      .text(`Total Commission Earned: ₹${tenPercentSales.toLocaleString()}`, 280, summaryStartY + 25)
      .text(`Total Tax Collected: ₹${totalTax.toLocaleString()}`, 60, summaryStartY + 25)
      .text(`Average Order Value: ₹${(totalSales / salesData.length).toFixed(2)}`, 280, summaryStartY + 40)
      .moveDown(2);


    // Payment Methods Distribution
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('Payment Method Distribution', { underline: true })
      .moveDown();

    const ordersByPaymentMethod = {};
    salesData.forEach(order => {
      ordersByPaymentMethod[order.payment.method] = (ordersByPaymentMethod[order.payment.method] || 0) + 1;
    });

    Object.entries(ordersByPaymentMethod).forEach(([method, count]) => {
      doc.font('Helvetica')
        .fontSize(10)
        .text(`${method}: ${count} orders (${((count / salesData.length) * 100).toFixed(1)}%)`);
    });
    doc.moveDown();

    // Detailed Orders Table
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('Order Details', { underline: true })
      .moveDown();

    // Table headers
    const tableWidths = [80, 80, 120, 80, 80, 80];
    const headers = ['Order #', 'Date', 'Customer', 'Amount', 'Payment', 'Status'];
    
    doc.font('Helvetica-Bold')
      .fontSize(10);
    
    drawTableRow(headers, 50, doc.y, tableWidths);
    doc.moveDown();
    drawHorizontalLine(doc.y - 5);
    
    // Table rows
    doc.font('Helvetica')
      .fontSize(9);

    salesData.forEach((order, index) => {
      if (doc.y > 700) {
        doc.addPage();
        doc.font('Helvetica-Bold')
          .fontSize(10);
        drawTableRow(headers, 50, 50, tableWidths);
        drawHorizontalLine(65);
        doc.font('Helvetica')
          .fontSize(9);
      }

      const row = [
        order.orderNumber,
        new Date(order.timestamps.orderedAt).toLocaleDateString(),
        order.shippingAddress.name,
        `₹${order.totalAmount.toLocaleString()}`,
        order.payment.method,
        order.payment.status
      ];

      drawTableRow(row, 50, doc.y, tableWidths);
      doc.moveDown();

      // Add lighter line between rows
      if (index < salesData.length - 1) {
        doc.opacity(0.5);
        drawHorizontalLine(doc.y - 5);
        doc.opacity(1);
      }
    });

    // Footer
    doc.fontSize(8)
      .text('Timeless Motors - Confidential Business Document', 50, doc.page.height - 50, {
        align: 'center',
        width: 500
      });

    doc.end();

    stream.on("finish", () => {
      res.json({
        pdfUrl: `/reports/${fileName}`,
        summary: {
          totalOrders: salesData.length,
          totalSales,
          totalTax,
          ordersByPaymentMethod,
          averageOrderValue: totalSales / salesData.length
        },
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

module.exports = router;