import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapPin, CreditCard, Truck, CheckCircle, Calendar, Clock, Car, Settings, Fuel, Gauge } from "lucide-react";
import { orderService } from "../../utils/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderService.getOrder(orderId);
        if (response.success) {
          setOrder(response.order);
          console.log('order:',response.order);
        } else {
          console.error("Failed to fetch order:", response.message);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Order not found</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Order Confirmed</h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600">Order Timeline</span>
            </div>
            <div className="ml-7 space-y-2">
              <p className="text-sm text-gray-600">
                Ordered: {new Date(order.timestamps.orderedAt).toLocaleString()}
              </p>
              {order.timestamps.confirmedAt && (
                <p className="text-sm text-gray-600">
                  Confirmed: {new Date(order.timestamps.confirmedAt).toLocaleString()}
                </p>
              )}
              {order.timestamps.shippedAt && (
                <p className="text-sm text-gray-600">
                  Shipped: {new Date(order.timestamps.shippedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Vehicle Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="w-full h-48 mb-4 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={order.product.images[0]?.url || "/placeholder-car.jpg"}
                      alt={`${order.product.make} ${order.product.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-medium text-gray-800">
                    {`${order.product.year} ${order.product.make} ${order.product.model}`}
                  </h4>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600">Body Type: {order.product.body_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        Transmission: {order.product.transmission_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600">Fuel Type: {order.product.fuel_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600">Engine: {order.product.cc_capacity} CC</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-800">Purchase Details</p>
                    <p className="text-sm text-gray-600 mt-2">Type: {order.orderType}</p>
                    {order.auctionDetails && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-gray-600">
                          Winning Bid: ₹{order.auctionDetails.bidPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Auction Ended: {new Date(order.auctionDetails.bidEndTime).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Order Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className="font-medium text-green-600">{order.orderStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800">₹{order.price.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({order.tax.percentage}%)</span>
                      <span className="text-gray-800">₹{order.tax.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-gray-200">
                      <span className="text-gray-800">Total</span>
                      <span className="text-gray-800">₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <h3 className="font-medium text-gray-800 mt-4 mb-2">Shipping Address</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-gray-800">{order.shippingAddress.name}</p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.address}, {order.shippingAddress.landmark}
                        <br />
                        {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                        <br />
                        {order.shippingAddress.country}
                        <br />
                        {order.shippingAddress.phone_number}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-medium text-gray-800 mt-4 mb-2">Payment Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {order.payment.method === "razorpay" ? (
                      <CreditCard className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Truck className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <p className="text-gray-800">
                        {order.payment.method === "razorpay" ? "Razorpay" : "Cash on Delivery"}
                      </p>
                      <p className="text-sm text-gray-600">Status: {order.payment.status}</p>
                    </div>
                  </div>
                  {order.payment.transactionId && (
                    <p className="text-sm text-gray-600 ml-8">
                      Transaction ID: {order.payment.transactionId}
                    </p>
                  )}
                  {order.payment.paidAt && (
                    <p className="text-sm text-gray-600 ml-8">
                      Paid on: {new Date(order.payment.paidAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium
                      hover:bg-indigo-700 transition-colors duration-300"
          >
            Print Order Details
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrderConfirmation;