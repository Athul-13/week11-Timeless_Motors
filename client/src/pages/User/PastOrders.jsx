import { useState, useEffect, useRef } from "react"
import { FileText, ChevronDown, ChevronUp, AlertCircle, ChevronRight, ChevronLeft, Loader2, Download } from "lucide-react"
import { adminServices, orderService } from "../../utils/api"
import toast from "react-hot-toast"

const OrderActionDialog = ({ isOpen, onClose, actionType, order, onConfirm }) => {
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const initialFocusRef = useRef(null)

  const cancelReasons = [
    "Changed my mind",
    "Found a better deal elsewhere",
    "Delivery time too long",
    "Ordered by mistake",
    "Payment issues",
    "Other"
  ]

  const returnReasons = [
    "Product damaged",
    "Product doesn't match description",
    "Performance issues",
    "Defective parts",
    "Quality not as expected",
    "Other"
  ]

  const reasons = actionType === "cancel" ? cancelReasons : returnReasons
  const title = actionType === "cancel" ? "Cancel Order" : "Return Order"
  const confirmBtnText = actionType === "cancel" ? "Confirm Cancellation" : "Confirm Return"
  const confirmBtnColor = actionType === "cancel" ? "bg-red-600" : "bg-yellow-600"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Prepare data for submission
      const data = {
        orderId: order._id,
        reason,
        description
      }

      await onConfirm(data)
      onClose()
    } catch (err) {
      setError(err.message || `Failed to ${actionType} order`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-medium text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {actionType === "cancel"
              ? "Please provide a reason for cancelling this order."
              : "Please provide details about why you're returning this item."}
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                id="reason"
                ref={initialFocusRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a reason</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-24"
                placeholder="Please provide any additional information..."
              />
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-2 px-4 rounded-lg text-white ${confirmBtnColor} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  actionType === "cancel" ? "focus:ring-red-500" : "focus:ring-yellow-500"
                } disabled:opacity-50`}
                disabled={loading || !reason}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  confirmBtnText
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const DownloadInvoiceButton = ({ orderId, orderNumber, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Send request to generate invoice
      const response = await adminServices.generateInvoice(orderId)

      const { invoiceUrl, orderNumber } = response

        toast.success(`Invoice generated for order ${orderNumber}`);
        window.open(`https://timeless-motors.onrender.com${invoiceUrl}`, '_blank');

    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate invoice. Please try again.');
      toast.error('Failed to generate invoice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={`flex border text-sm font-medium mt-2 items-center gap-2 transition-colors disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          <span>Download Invoice</span>
        </>
      )}
    </button>
  );
};

// Updated OrderCard component with dialog integration
const OrderCard = ({ order, onCancelOrder, onReturnOrder, onRetryPayment }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState(null) // 'cancel' or 'return'

  if (!order) return null

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusStyles = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800"
      case "Processing":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCancelClick = (e) => {
    e.stopPropagation()
    setDialogType("cancel")
    setDialogOpen(true)
  }

  const handleReturnClick = (e) => {
    e.stopPropagation()
    setDialogType("return")
    setDialogOpen(true)
  }

  const handleDialogConfirm = async (data) => {
    if (dialogType === "cancel") {
      await onCancelOrder(data)
    } else if (dialogType === "return") {
      await onReturnOrder(data)
    }
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div
        className="p-6 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-medium text-gray-900">
              {order.product?.make} {order.product?.model}
            </h2>
            <p className="text-gray-600 mt-1">Year: {order.product?.year}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium text-gray-900">₹{order.totalAmount?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusStyles(order.orderStatus)}`}>
            {order.orderStatus}
          </span>
          <button className="flex items-center text-gray-700 hover:text-gray-900 transition-colors duration-200">
            <span className="mr-2">{isExpanded ? "Hide Details" : "Show Details"}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 border-t border-gray-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Order Details</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Type: {order.orderType}</p>
                <p className="text-sm text-gray-600">Price: ₹{order.price?.amount?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  Tax: ₹{order.tax?.amount?.toLocaleString()} ({order.tax?.percentage}%)
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Information</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Method: {order.payment?.method}</p>
                <p className="text-sm text-gray-600">Status: {order.payment?.status}</p>
                {order.payment?.transactionId && (
                  <p className="text-sm text-gray-500">Transaction ID: {order.payment.transactionId}</p>
                )}
              </div>
              <DownloadInvoiceButton 
                orderId={order._id} 
                orderNumber={order.orderNumber} 
                className="p-1"
                variant="secondary"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">{order.shippingAddress?.name}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress?.address}</p>
              {order.shippingAddress?.landmark && (
                <p className="text-sm text-gray-600">Landmark: {order.shippingAddress.landmark}</p>
              )}
              <p className="text-sm text-gray-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
              </p>
              <p className="text-sm text-gray-600">{order.shippingAddress?.country}</p>
              <p className="text-sm text-gray-600">Phone: {order.shippingAddress?.phone_number}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Order Timeline</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Ordered on: {formatDate(order.timestamps?.orderedAt)}</p>
              {order.timestamps?.processedAt && (
                <p className="text-sm text-gray-600">Processed on: {formatDate(order.timestamps.processedAt)}</p>
              )}
              {order.timestamps?.shippedAt && (
                <p className="text-sm text-gray-600">Shipped on: {formatDate(order.timestamps.shippedAt)}</p>
              )}
              {order.timestamps?.deliveredAt && (
                <p className="text-sm text-gray-600">Delivered on: {formatDate(order.timestamps.deliveredAt)}</p>
              )}
            </div>
          </div>

          {order.orderStatus === "Cancelled" || order.orderStatus === 'Refunded' && order.cancellation && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">Cancellation Details</h3>
              <p className="text-sm text-red-600">Reason: {order.cancellation.reason}</p>
              {order.cancellation.description && (
                <p className="text-sm text-red-600">Description: {order.cancellation.description}</p>
              )}
            </div>
          )}

          {/* Buttons for Cancel and Return */}
          <div className="flex space-x-4">
            {["Pending", "Processing"].includes(order.orderStatus) && (
              <button
                className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium text-sm hover:bg-red-200 transition"
                onClick={handleCancelClick}
              >
                Cancel Order
              </button>
            )}
            {order.orderStatus === "Delivered" && (
              <button
                className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium text-sm hover:bg-yellow-200 transition"
                onClick={handleReturnClick}
              >
                Return Order
              </button>
            )}

            {order.payment?.method === "razorpay" && order.payment?.status === "Pending" && (
              <button
                className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium text-sm hover:bg-yellow-200 transition"
                onClick={() => onRetryPayment(order)}
              >
                Retry Payment
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dialog for cancel/return actions */}
      <OrderActionDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        actionType={dialogType}
        order={order}
        onConfirm={handleDialogConfirm}
      />
    </div>
  )
}

const PastOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

   // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  useEffect(() => {
    let mounted = true

    const fetchOrders = async () => {
      try {
        // Update API call to include pagination parameters
        const data = await orderService.getUserOrders(currentPage, itemsPerPage)
        if (mounted) {
          if (data.success) {
            setOrders(data.data.orders || data.data) // Adjust based on your API response structure
            // Set total pages if your API returns it
            if (data.data.totalPages) {
              setTotalPages(data.data.totalPages)
            } else if (data.data.totalCount) {
              // Calculate total pages if API returns only total count
              setTotalPages(Math.ceil(data.data.totalCount / itemsPerPage))
            }
          } else {
            setError(data.message)
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to fetch orders")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    setLoading(true)
    fetchOrders()

    return () => {
      mounted = false
    }
  }, [currentPage, itemsPerPage])

  const handleCancelOrder = async (cancelData) => {
    try {
      const { orderId, reason, description } = cancelData;
      
      // Call API with correct parameters
      const response = await orderService.orderCancellation(orderId, { reason, description });
  
      if (response.success) {
        // Update local orders state
        setOrders(orders.map(order => 
          order._id === orderId
            ? {
                ...order,
                orderStatus: "Cancelled",
                cancellation: {
                  reason,
                  description,
                  requestedAt: new Date(),
                },
              }
            : order
        ));
        return Promise.resolve();
      } else {
        return Promise.reject(new Error(response.message || "Failed to cancel order"));
      }
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const handleReturnOrder = async (returnData) => {
    try {
      const { orderId, reason, description } = returnData;
      
      // Call API with correct parameters
      const response = await orderService.orderReturn(orderId, { reason, description });
  
      if (response.success) {
        // Update local orders state
        setOrders(orders.map(order => 
          order._id === orderId
            ? {
                ...order,
                orderStatus: "Refunded",
                cancellation: {
                  reason,
                  description,
                  requestedAt: new Date(),
                },
              }
            : order
        ));

        return Promise.resolve();
      } else {
        return Promise.reject(new Error(response.message || "Failed to cancel order"));
      }
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const handleRetryPayment = async (orderId) => {
    try {
      
      const order = await orderService.getOrder(orderId._id);

      const orderDetails = order.order
      
      if (!order) {
        toast.error('Order not found');
        return;
      }
      console.log('order:',orderDetails);
      
      // Only allow retry for orders with pending payment status
      if (orderDetails.payment.status !== 'Pending' && orderDetails.payment.status !== 'Failed') {
        toast.error('This order does not require payment retry');
        return;
      }
      
      // Create a new Razorpay order
      const razorpayOrder = await orderService.createRazorpayOrder({
        amount: orderDetails.totalAmount
      });
      
      if (!razorpayOrder || !razorpayOrder.id) {
        toast.error('Failed to create payment request');
        return;
      }
      
      // Load Razorpay SDK
      const res = await loadRazorpay(); // Assuming this is your SDK loading function
      if (!res) {
        toast.error('Failed to load Razorpay SDK');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: 'Timeless Motors',
        description: `Payment retry for Order #${orderDetails.orderNumber}`,
        handler: async (response) => {
          console.log('respnse',response);
          let paymentVerified = false;

          try {
            const verificationResult = await orderService.verifyPayment(response);
            paymentVerified = verificationResult.success;
            console.log('payment',paymentVerified);
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }

          console.log('Sending to backend:', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            paymentStatus: paymentVerified ? 'Completed' : 'Pending'
          });

          try {
            // Record this payment attempt
            const paymentAttempt = {
              attemptedAt: new Date(),
              status: paymentVerified ? 'Completed' : 'Pending',
              error: paymentVerified ? null : 'Verification failed'
            };
            
            const updateData = {
              'payment.razorpay_order_id': razorpayOrder.id,
              'payment.razorpay_payment_id': response.razorpay_payment_id || null,
              'payment.razorpay_signature': response.razorpay_signature || null,
              'payment.status': paymentVerified ? 'Completed' : 'Pending',
              $push: { 'payment.paymentAttempts': paymentAttempt }
            };
            
            // If payment is successful, update payment completion time
            if (paymentVerified) {
              updateData['payment.paidAt'] = new Date();
              // Update order status to Processing if it was Pending
              if (orderDetails.orderStatus === 'Pending') {
                updateData.orderStatus = 'Processing';
                updateData['timestamps.processedAt'] = new Date();
              }
            }
            
            const updateResult = await orderService.updateOrder(orderId._id, updateData);
            
            if (updateResult.success) {
              if (paymentVerified) {
                toast.success('Payment successful! Your order has been updated.');
              } else {
                toast.error('Payment validation failed. Please contact support.');
              }
            setCurrentPage(currentPage);

            } else {
              toast.error('Failed to update order status');
            }
          } catch (updateError) {
            toast.error('Failed to update order');
            console.error('Order Update Error:', updateError);
          }
        },
        prefill: {
          name: orderDetails.shippingAddress.name,
          contact: orderDetails.shippingAddress.phone_number
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: async function() {
            // Record the dismissed payment attempt
            try {
              await orderService.updateOrder(orderId._id, {
                $push: {
                  'payment.paymentAttempts': {
                    attemptedAt: new Date(),
                    status: 'Pending',
                    error: 'Payment window dismissed by user'
                  }
                }
              });
              toast.error('Payment retry canceled');

            } catch (error) {
              console.error('Failed to record payment dismissal:', error);
            }
          }
        }
      };
      
      // Step 8: Open Razorpay payment window
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
    } catch (error) {
      toast.error(error.message || 'Failed to retry payment');
      console.error('Retry Payment Error:', error);
    }
  };
  
  // Helper function to load Razorpay SDK
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
    });
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-medium">Error loading orders</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No orders found</p>
          <p className="text-sm text-gray-500 mt-2">When you make a purchase, your orders will appear here.</p>
        </div>
      </div>
    )
  }

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first and last page
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Middle
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-gray-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium text-gray-900">Your Orders</h1>
          <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
              Show:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard 
              key={order._id} 
              order={order} 
              onCancelOrder={handleCancelOrder} 
              onReturnOrder={handleReturnOrder}
              onRetryPayment={handleRetryPayment}
            />
          ))}
        </div>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center">
            <nav className="flex items-center space-x-1" aria-label="Pagination">
              {/* Previous page button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md flex items-center justify-center ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Page numbers */}
              {getPageNumbers().map((pageNum, index) => (
                pageNum === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                )
              ))}
              
              {/* Next page button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md flex items-center justify-center ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}

export default PastOrders