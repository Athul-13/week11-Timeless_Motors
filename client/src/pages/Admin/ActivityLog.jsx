import { useState, useEffect } from "react"
import { flexRender, getCoreRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table"
import { Toaster } from "react-hot-toast"
import { adminServices } from "../../utils/api"

const ActivityLog = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [activityLogs, setActivityLogs] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setTimeout(() => {
          setLoading(false)
        }, 500)
  
        const response = await adminServices.fetchAllActivity()
        setActivityLogs(response)
      } catch (error) {
        console.error("Error fetching activity logs:", error)
      }
    }
  
    fetchData()
  
    // Cleanup function to clear timeout
    return () => clearTimeout(fetchData)
  }, [])

  const columns = [
    {
      header: "User",
      accessorFn: (row) => {
        return row.userId ? `${row.userId.first_name} ${row.userId.last_name}` : 'N/A'
      },
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId)
        return value.toLowerCase().includes(filterValue.toLowerCase())
      },
    },
    {
      header: "Email",
      accessorFn: (row) => row.userId?.email || 'N/A',
      cell: ({ getValue }) => <span className="text-sm">{getValue()}</span>,
    },
    {
      header: "Action",
      accessorKey: "action",
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId)
        return value.toLowerCase().includes(filterValue.toLowerCase())
      },
    },
    {
      header: "Details",
      accessorKey: "details",
      cell: ({ getValue }) => <span className="text-sm text-gray-500">{getValue()}</span>,
    },
    {
      header: "IP Address",
      accessorKey: "ipAddress",
    },
    {
      header: "Timestamp",
      accessorKey: "timestamp",
      cell: ({ getValue }) => <span>{new Date(getValue()).toLocaleString()}</span>,
    },
  ]

  const table = useReactTable({
    data: activityLogs,
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
        (row.original.userId?.first_name || '').toLowerCase().includes(searchLower) ||
        (row.original.userId?.last_name || '').toLowerCase().includes(searchLower) ||
        (row.original.userId?.email || '').toLowerCase().includes(searchLower) ||
        row.original.action.toLowerCase().includes(searchLower) ||
        row.original.details.toLowerCase().includes(searchLower) ||
        row.original.ipAddress.toLowerCase().includes(searchLower)
      )
    },
  })

  return (
    <div className="relative m-10">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
        <h2 className="text-2xl font-bold text-gray-800">Activity Logs</h2>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search logs..."
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
                <tr key={row.id} className="border-b bg-white hover:bg-gray-100">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 text-sm text-gray-600">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ActivityLog