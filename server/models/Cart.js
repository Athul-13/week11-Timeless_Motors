const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
        product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
  }
],
});

const Cart = mongoose.model('Cart', CartSchema);
module.exports = Cart;