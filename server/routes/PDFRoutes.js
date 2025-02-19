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
      // Always filter for Confirmed orders
      'payment.status': 'Completed'
    };

    // Apply Date Filtering
    const now = new Date();
    if (dateFilter === "today") {
      query["timestamps.orderedAt"] = {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lt: new Date(now.setHours(23, 59, 59, 999)),
      };
    } else if (dateFilter === "week") {
      query["timestamps.orderedAt"] = {
        $gte: new Date(now.setDate(now.getDate() - 7)),
      };
    } else if (dateFilter === "month") {
      query["timestamps.orderedAt"] = {
        $gte: new Date(now.setMonth(now.getMonth() - 1)),
      };
    } else if (dateFilter === "custom" && startDate && endDate) {
      query["timestamps.orderedAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Apply Search Filtering
    if (searchQuery) {
      query.$or = [
        { orderNumber: new RegExp(searchQuery, "i") },
        { "shippingAddress.name": new RegExp(searchQuery, "i") },
        { "shippingAddress.city": new RegExp(searchQuery, "i") }
      ];
    }

    // Fetch Confirmed Sales Data with populated product details
    const salesData = await Order.find(query)
      .populate('product', 'name description price')
      .populate('user', 'name email')
      .sort({ "timestamps.orderedAt": -1 });

    // Create PDF directory if it doesn't exist
    const reportDir = path.join(__dirname, "../public/reports");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Generate PDF
    const fileName = `confirmed-sales-report-${Date.now()}.pdf`;
    const filePath = path.join(reportDir, fileName);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title and Header
    doc.fontSize(20).text("Confirmed Orders Report", { align: "center" }).moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Filter: ${dateFilter}`);

    if (dateFilter === "custom") {
      doc.text(`Period: ${startDate} to ${endDate}`);
    }
    if (searchQuery) doc.text(`Search Query: ${searchQuery}`);
    doc.moveDown();

    // Summary Statistics
    const totalSales = salesData.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalTax = salesData.reduce((sum, order) => sum + order.tax.amount, 0);
    const ordersByPaymentMethod = {};
    const paymentStatusCount = {};

    salesData.forEach(order => {
      ordersByPaymentMethod[order.payment.method] = (ordersByPaymentMethod[order.payment.method] || 0) + 1;
      paymentStatusCount[order.payment.status] = (paymentStatusCount[order.payment.status] || 0) + 1;
    });

    doc.fontSize(14).text("Summary", { underline: true }).moveDown();
    doc.fontSize(12)
      .text(`Total Confirmed Orders: ${salesData.length}`)
      .text(`Total Sales Amount: ₹${totalSales.toLocaleString()}`)
      .text(`Total Tax Collected: ₹${totalTax.toLocaleString()}`).moveDown();

    // Payment Method Distribution
    doc.fontSize(14).text("Payment Method Distribution", { underline: true }).moveDown();
    doc.fontSize(12);
    Object.entries(ordersByPaymentMethod).forEach(([method, count]) => {
      doc.text(`${method}: ${count} orders`);
    });
    doc.moveDown();

    // Payment Status Distribution
    doc.fontSize(14).text("Payment Status Distribution", { underline: true }).moveDown();
    doc.fontSize(12);
    Object.entries(paymentStatusCount).forEach(([status, count]) => {
      doc.text(`${status}: ${count} orders`);
    });
    doc.moveDown();

    // Detailed Orders Table
    doc.fontSize(14).text("Order Details", { underline: true }).moveDown();

    // Table headers
    const startX = 50;
    let currentY = doc.y;
    
    doc.fontSize(10);
    const headers = [
      { text: "Order #", width: 80 },
      { text: "Date", width: 80 },
      { text: "Customer", width: 100 },
      { text: "Amount", width: 70 },
      { text: "Payment Method", width: 70 },
      { text: "Payment Status", width: 70 }
    ];

    headers.forEach((header, i) => {
      let xPos = startX;
      headers.slice(0, i).forEach(h => xPos += h.width);
      doc.text(header.text, xPos, currentY);
    });
    doc.moveDown();

    // Table rows
    salesData.forEach((order) => {
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }

      currentY = doc.y;
      let xPos = startX;

      doc.text(order.orderNumber, xPos, currentY);
      xPos += headers[0].width;

      doc.text(new Date(order.timestamps.orderedAt).toLocaleDateString(), xPos, currentY);
      xPos += headers[1].width;

      doc.text(order.shippingAddress.name, xPos, currentY);
      xPos += headers[2].width;

      doc.text(`₹${order.totalAmount.toLocaleString()}`, xPos, currentY);
      xPos += headers[3].width;

      doc.text(order.payment.method, xPos, currentY);
      xPos += headers[4].width;

      doc.text(order.payment.status, xPos, currentY);

      doc.moveDown();
    });

    doc.end();

    // Return PDF URL and summary
    stream.on("finish", () => {
      res.json({
        pdfUrl: `/reports/${fileName}`,
        summary: {
          totalOrders: salesData.length,
          totalSales,
          totalTax,
          ordersByPaymentMethod,
          paymentStatusCount
        },
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

module.exports = router;