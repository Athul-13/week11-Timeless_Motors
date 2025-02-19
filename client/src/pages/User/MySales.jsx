import { useState, useEffect } from "react"
import { FileText, ChevronDown, ChevronUp } from "lucide-react"
import { orderService } from "../../utils/api"

const SaleCard = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false)

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
      case "Cancelled":
        return "bg-red-100 text-red-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Shipped":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
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
            <div className="text-gray-600 mt-1 space-y-1">
              <p>Year: {order.product?.year}</p>
              <p>Buyer: {order.shippingAddress?.name}</p>
              <p>Sale Type: {order.orderType}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium text-green-600">₹{order.totalAmount?.toLocaleString()}</p>
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
              <h3 className="text-sm font-medium text-gray-900 mb-2">Sale Details</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Type: {order.orderType}</p>
                <p className="text-sm text-gray-600">Base Price: ₹{order.price?.amount?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  Tax: ₹{order.tax?.amount?.toLocaleString()} ({order.tax?.percentage}%)
                </p>
                {order.orderType === 'Auction' && order.auctionDetails && (
                  <>
                    <p className="text-sm text-gray-600">Final Bid: ₹{order.auctionDetails.bidPrice?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Auction Ended: {formatDate(order.auctionDetails.bidEndTime)}</p>
                  </>
                )}
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
                {order.payment?.paidAt && (
                  <p className="text-sm text-gray-600">Paid on: {formatDate(order.payment.paidAt)}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Buyer's Shipping Address</h3>
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

          {order.cancellation && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">Cancellation Details</h3>
              <p className="text-sm text-red-600">Reason: {order.cancellation.reason}</p>
              {order.cancellation.description && (
                <p className="text-sm text-red-600">Description: {order.cancellation.description}</p>
              )}
              <p className="text-sm text-red-600">Requested on: {formatDate(order.cancellation.requestedAt)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const MySales = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchSales = async () => {
      try {
        const data = await orderService.getSellerOrders()
        if (mounted) {
          if (data.success) {
            setSales(data.sellerOrders)
          } else {
            setError(data.message)
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to fetch sales")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchSales()

    return () => {
      mounted = false
    }
  }, [])
  console.log('sale',sales);

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
          <p className="font-medium">Error loading sales</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No sales found</p>
          <p className="text-sm text-gray-500 mt-2">When you sell an item, your sales will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">Your Sales</h1>
        <div className="space-y-4">
          {sales.map((sale) => (
            <SaleCard key={sale._id} order={sale} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MySales