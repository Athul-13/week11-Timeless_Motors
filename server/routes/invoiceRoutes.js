const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const router = express.Router();
const Order = require('../models/Order');

router.get("/generate-invoice/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('product', 'year model make starting_bid current_bid type images')
      .populate('user', 'first_name last_name email');

      if (order && order.product) {
        order.product.name = `${order.product.year} ${order.product.make} ${order.product.model}`;
        // Determine the correct price field based on listing type
        order.product.price =
          order.product.type === 'auction'
            ? order.product.current_bid
            : order.product.starting_bid;
      }
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const reportDir = path.join(__dirname, "../public/invoices");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const fileName = `invoice-${order.orderNumber}-${Date.now()}.pdf`;
    const filePath = path.join(reportDir, fileName);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Helper functions
    const drawHorizontalLine = (y) => {
      doc.moveTo(50, y).lineTo(550, y).stroke();
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    // Company Logo and Header
    doc.fontSize(24)
      .font('Helvetica-Bold')
      .text('TIMELESS MOTORS', { align: 'center' })
      .fontSize(12)
      .text('Luxury Car Marketplace', { align: 'center' })
      .moveDown();

    // Invoice Title and Basic Info
    doc.fontSize(16)
      .text('TAX INVOICE', { align: 'center' })
      .moveDown();

    // Invoice Details Box
    doc.rect(50, doc.y, 500, 100).stroke();
    const invoiceStartY = doc.y + 10;

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .text('Invoice Number:', 60, invoiceStartY)
      .font('Helvetica')
      .text(order.orderNumber, 180, invoiceStartY)
      .font('Helvetica-Bold')
      .text('Order Date:', 300, invoiceStartY)
      .font('Helvetica')
      .text(formatDate(order.timestamps.orderedAt), 420, invoiceStartY)
      .moveDown();

    doc.font('Helvetica-Bold')
      .text('Payment Method:', 60, doc.y)
      .font('Helvetica')
      .text(order.payment.method.toUpperCase(), 180, doc.y)
      .font('Helvetica-Bold')
      .text('Payment Status:', 300, doc.y)
      .font('Helvetica')
      .text(order.payment.status, 420, doc.y)
      .moveDown();

    if (order.payment.razorpay_payment_id) {
      doc.font('Helvetica-Bold')
        .text('Transaction ID:', 60, doc.y)
        .font('Helvetica')
        .text(order.payment.razorpay_payment_id, 180, doc.y)
        .moveDown();
    }

    // Billing and Shipping Information
    doc.moveDown()
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('BILLING & SHIPPING DETAILS')
      .moveDown();

    // Address Box
    doc.rect(50, doc.y, 500, 120).stroke();
    const addressStartY = doc.y + 10;

    doc.fontSize(10)
      .text('Shipped To:', 60, addressStartY)
      .font('Helvetica')
      .text([
        order.shippingAddress.name,
        order.shippingAddress.address,
        order.shippingAddress.landmark,
        `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
        `${order.shippingAddress.country} - ${order.shippingAddress.pincode}`,
        `Phone: ${order.shippingAddress.phone_number}`
      ].join('\n'), 60, addressStartY + 20);

    // Order Details
    doc.moveDown(2)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('ORDER DETAILS')
      .moveDown();

    // Product Details Table
    const tableTop = doc.y;
    doc.font('Helvetica-Bold')
      .fontSize(10);

    // Table Headers
    const columns = {
      item: { x: 50, w: 250 },
      price: { x: 300, w: 80 },
      tax: { x: 380, w: 80 },
      total: { x: 460, w: 90 }
    };

    Object.entries(columns).forEach(([key, { x, w }]) => {
      doc.text(key.toUpperCase(), x, tableTop, { width: w, align: 'left' });
    });

    drawHorizontalLine(tableTop + 20);

    // Product Details
    doc.font('Helvetica')
      .text(order.product.name, columns.item.x, tableTop + 40)
      .text(`₹${order.price.amount.toLocaleString()}`, columns.price.x, tableTop + 40)
      .text(`₹${order.tax.amount.toLocaleString()}`, columns.tax.x, tableTop + 40)
      .text(`₹${order.totalAmount.toLocaleString()}`, columns.total.x, tableTop + 40);

    // Tax Details
    doc.moveDown(3)
      .font('Helvetica-Bold')
      .text('Tax Details:')
      .font('Helvetica')
      .text(`GST (${order.tax.percentage}%): ₹${order.tax.amount.toLocaleString()}`);

    // Total Amount Box
    doc.moveDown()
      .rect(350, doc.y, 200, 60)
      .stroke();

    const totalBoxY = doc.y + 10;
    doc.font('Helvetica-Bold')
      .text('Total Amount:', 360, totalBoxY)
      .font('Helvetica')
      .text(`₹${order.totalAmount.toLocaleString()}`, 460, totalBoxY)
      .moveDown()
      .font('Helvetica-Bold')
      .text('Order Status:', 360, totalBoxY + 25)
      .font('Helvetica')
      .text(order.orderStatus, 460, totalBoxY + 25);

    // Footer
    doc.fontSize(8)
      .text('This is a computer-generated invoice and does not require a physical signature.', 50, doc.page.height - 70, {
        align: 'center',
        width: 500
      })
      .moveDown()
      .text('Timeless Motors - Thank you for your business!', {
        align: 'center',
        width: 500
      });

    doc.end();

    stream.on("finish", () => {
      res.json({
        success: true,
        invoiceUrl: `/invoices/${fileName}`,
        orderNumber: order.orderNumber
      });
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

module.exports = router;