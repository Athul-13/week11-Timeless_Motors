import { useState, useEffect } from "react"
import { flexRender, getCoreRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table"
import { Package, Download, ChevronDown, ChevronUp } from "lucide-react"
import { toast, Toaster } from "react-hot-toast"

import { orderService } from "../../utils/api"

const StatusDropdown = ({ currentValue, options, onStatusChange, loading, colorMap }) => {
  return (
    <select
      value={currentValue}
      onChange={(e) => onStatusChange(e.target.value)}
      disabled={loading}
      className={`${
        colorMap[currentValue]
      } px-2 py-1 rounded-full text-sm font-medium cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
    >
      {options.map((status) => (
        <option key={status} value={status} className="bg-white text-gray-800">
          {status}
        </option>
      ))}
    </select>
  )
};

const OrderDetails = ({ order, onStatusChange, onPaymentStatusChange, statusLoading, paymentStatusLoading }) => {
  const orderStatusOptions = ['Pending', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded']
  const paymentStatusOptions = ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded']

  const orderStatusColorMap = {
    Pending: "bg-yellow-100 text-yellow-800",
    Processing: "bg-blue-100 text-blue-800",
    Confirmed: "bg-green-100 text-green-800",
    Shipped: "bg-indigo-100 text-indigo-800",
    Delivered: "bg-teal-100 text-teal-800",
    Cancelled: "bg-red-100 text-red-800",
    Refunded: "bg-gray-100 text-gray-800"
  }

  const paymentStatusColorMap = {
    Pending: "bg-yellow-100 text-yellow-800",
    Processing: "bg-blue-100 text-blue-800",
    Completed: "bg-green-100 text-green-800",
    Failed: "bg-red-100 text-red-800",
    Refunded: "bg-gray-100 text-gray-800"
  }

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Product Details</h3>
          <div className="space-y-1">
            <p><span className="font-medium">Price:</span> ₹{order.price.amount}</p>
            <p><span className="font-medium">Tax ({order.tax.percentage}%):</span> ₹{order.tax.amount}</p>
            <p><span className="font-medium">Total Amount:</span> ₹{order.totalAmount}</p>
          </div>
        </div>

        
        <div>
          <h3 className="font-semibold mb-2">Order Status</h3>
          <div className="space-y-1">
            <StatusDropdown
              currentValue={order.orderStatus}
              options={orderStatusOptions}
              onStatusChange={(status) => onStatusChange(order._id, status)}
              loading={statusLoading}
              colorMap={orderStatusColorMap}
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Payment Information</h3>
          <div className="space-y-1">
            <p><span className="font-medium">Method:</span> {order.payment.method}</p>
            <p>
              <span className="font-medium">Status: </span>
              <StatusDropdown
                currentValue={order.payment.status}
                options={paymentStatusOptions}
                onStatusChange={(status) => onPaymentStatusChange(order._id, status)}
                loading={paymentStatusLoading}
                colorMap={paymentStatusColorMap}
              />
            </p>
            {order.payment.transactionId && (
              <p><span className="font-medium">Transaction ID:</span> {order.payment.transactionId}</p>
            )}
            {order.payment.paidAt && (
              <p><span className="font-medium">Paid At:</span> {new Date(order.payment.paidAt).toLocaleString()}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Shipping Address</h3>
          <div className="space-y-1">
            <p>{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.landmark}</p>
            <p>{`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`}</p>
            <p>{order.shippingAddress.country}</p>
            <p><span className="font-medium">Phone:</span> {order.shippingAddress.phone_number}</p>
          </div>
        </div>
        

        {order.orderType === 'Auction' && order.auctionDetails && (
          <div className="col-span-3 mt-4">
            <h3 className="font-semibold mb-2">Auction Details</h3>
            <div className="space-y-1">
              <p><span className="font-medium">Bid Price:</span> ₹{order.auctionDetails.bidPrice}</p>
              <p><span className="font-medium">Bid End Time:</span> {new Date(order.auctionDetails.bidEndTime).toLocaleString()}</p>
              <p><span className="font-medium">Time Remaining:</span> {order.auctionDetails.timeRemaining} hours</p>
            </div>
          </div>
        )}

        {/* <div className="col-span-3 mt-4">
          <h3 className="font-semibold mb-2">Order Timeline</h3>
          <div className="space-y-2">
            {Object.entries(order.timestamps).map(([key, value]) => 
              value && (
                <p key={key}>
                  <span className="font-medium">{key.replace('At', '')}: </span>
                  {new Date(value).toLocaleString()}
                </p>
              )
            )}
          </div>
        </div> */}

        {order.cancellation && order.cancellation.reason && (
          <div className="col-span-3 mt-4">
            <h3 className="font-semibold mb-2 text-red-600">Cancellation Details</h3>
            <div className="space-y-1">
              <p><span className="font-medium">Reason:</span> {order.cancellation.reason}</p>
              <p><span className="font-medium">Description:</span> {order.cancellation.description}</p>
              <p><span className="font-medium">Requested:</span> {new Date(order.cancellation.requestedAt).toLocaleString()}</p>
              {order.cancellation.processedAt && (
                <p><span className="font-medium">Processed:</span> {new Date(order.cancellation.processedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [statusLoading, setStatusLoading] = useState(false)
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await orderService.getAllOrders()
      setOrders(response.orders)
      setLoading(false)
    } catch (err) {
      toast.error("Failed to fetch orders")
      setLoading(false)
    }
  }

  const handleOrderStatusChange = async (orderId, newStatus) => {
    setStatusLoading(true)
    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, orderStatus: newStatus } : order
      ))
      toast.success("Order status updated successfully")
    } catch (error) {
      toast.error("Failed to update order status")
    } finally {
      setStatusLoading(false)
    }
  }

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    setPaymentStatusLoading(true)
    try {
      await orderService.updatePaymentStatus(orderId, newStatus)
      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, payment: { ...order.payment, status: newStatus } } : order
      ))
      toast.success("Payment status updated successfully")
    } catch (error) {
      toast.error("Failed to update payment status")
    } finally {
      setPaymentStatusLoading(false)
    }
  }

  const toggleRow = (orderId) => {
    const newExpandedRows = new Set(expandedRows)
    if (expandedRows.has(orderId)) {
      newExpandedRows.delete(orderId)
    } else {
      newExpandedRows.add(orderId)
    }
    setExpandedRows(newExpandedRows)
  }

  const columns = [
    {
      header: "Order Number",
      accessorKey: "orderNumber",
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    },
    {
      header: "User",
      accessorFn: (row) => `${row.user.first_name} ${row.user.last_name}`,
      cell: ({ getValue }) => <span>{getValue()}</span>,
    },
    {
      header: "Order Type",
      accessorKey: "orderType",
      cell: ({ getValue }) => {
        const orderType = getValue()
        return (
          <span
            className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium ${
              orderType === "Auction" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
            }`}
          >
            <Package className="h-4 w-4" />
            {orderType}
          </span>
        )
      },
    },
        {
      header: "Order Status",
      accessorKey: "orderStatus",
      cell: ({ getValue, row }) => {
        const status = getValue()
        let statusClass = ""
        switch (status) {
          case "Pending": statusClass = "bg-yellow-100 text-yellow-800"; break;
          case "Processing": statusClass = "bg-blue-100 text-blue-800"; break;
          case "Confirmed": statusClass = "bg-green-100 text-green-800"; break;
          case "Shipped": statusClass = "bg-indigo-100 text-indigo-800"; break;
          case "Delivered": statusClass = "bg-teal-100 text-teal-800"; break;
          case "Cancelled": statusClass = "bg-red-100 text-red-800"; break;
          case "Refunded": statusClass = "bg-gray-100 text-gray-800"; break;
          default: statusClass = "bg-gray-100 text-gray-800";
        }
        return (
          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium ${statusClass}`}>
            {status}
          </span>
        )
      },
    },
    {
        header: "Payment Status",
        accessorKey: "payment.status",
        cell: ({ getValue }) => {
          const status = getValue();
          let statusClass = "";
      
          switch (status) {
            case "Pending":
              statusClass = "bg-yellow-100 text-yellow-800";
              break;
            case "Processing":
              statusClass = "bg-blue-100 text-blue-800";
              break;
            case "Completed":
              statusClass = "bg-green-100 text-green-800";
              break;
            case "Failed":
              statusClass = "bg-red-100 text-red-800";
              break;
            case "Refunded":
              statusClass = "bg-gray-100 text-gray-800";
              break;
            default:
              statusClass = "bg-gray-100 text-gray-800";
          }
      
          return (
            <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium ${statusClass}`}>
              {status}
            </span>
          );
        },
      },      
    {
      header: "Order Date",
      accessorKey: "timestamps.orderedAt",
      cell: ({ getValue }) => {
        const orderDate = new Date(getValue())
        return (
          <div>
            <span>{orderDate.toLocaleDateString()}</span>
            <span className="text-xs text-gray-500 block">{orderDate.toLocaleTimeString()}</span>
          </div>
        )
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleRow(row.original._id)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            {expandedRows.has(row.original._id) ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => handleDownloadInvoice(row.original)}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      globalFilter: searchQuery,
    },
    onGlobalFilterChange: setSearchQuery,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchLower = filterValue.toLowerCase()
      return (
        row.original.orderNumber.toLowerCase().includes(searchLower) ||
        row.original.user.first_name.toLowerCase().includes(searchLower) ||
        row.original.user.last_name.toLowerCase().includes(searchLower) ||
        row.original.orderType.toLowerCase().includes(searchLower) ||
        row.original.orderStatus.toLowerCase().includes(searchLower)
      )
    },
  })

  const handleDownloadInvoice = (order) => {
    // Implement download invoice logic
    console.log("Download invoice for order:", order)
  }

  return (
    <div className="relative m-10">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
        <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search orders..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="rounded-md border border-gray-300">
          <table className="w-full table-auto">
            <thead className="bg-gray-300">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <>
                  <tr key={row.id} className="border-b bg-white hover:bg-gray-100">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm text-gray-600">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {expandedRows.has(row.original._id) && (
                    <tr>
                      <td colSpan={columns.length}>
                      <OrderDetails 
                        order={row.original} 
                        onStatusChange={handleOrderStatusChange}
                        onPaymentStatusChange={handlePaymentStatusChange}
                        statusLoading={statusLoading}
                        paymentStatusLoading={paymentStatusLoading}
                      />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Orders