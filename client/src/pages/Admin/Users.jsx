import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Check, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers, updateUserStatus } from '../../redux/userSlice';

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingStatuses, setPendingStatuses] = useState({});
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);

  useEffect(() => {
    setTimeout(()=>{
      setLoading(false)
    },500)
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const columns = [
    {
      header: 'Name',
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
      // Add filtering for name
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        return value.toLowerCase().includes(filterValue.toLowerCase());
      }
    },
    {
      header: 'Email',
      accessorKey: 'email',
      // Add filtering for email
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        return value.toLowerCase().includes(filterValue.toLowerCase());
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        const isToggleOn = status === 'active' || status === 'verified';
        
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusToggle(
                row.original._id, 
                isToggleOn ? 'inactive' : 'active'
              )}
              disabled={Boolean(pendingStatuses[row.original._id])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isToggleOn ? 'bg-gray-600' : 'bg-gray-200'
              } ${pendingStatuses[row.original._id] ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isToggleOn ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            {pendingStatuses[row.original._id] && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            )}
          </div>
        );
      },
    },
    {
      header: 'Verified',
      id: 'verified',
      accessorFn: (row) => row.status === 'verified',
      cell: ({ row }) => {
        const status = row.original.status;
        const isVerified = status === 'verified';
        
        return (
          <div className="flex items-center gap-2">
            {isVerified ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <button
                onClick={() => handleStatusToggle(row.original._id, 'verified')}
                disabled={Boolean(pendingStatuses[row.original._id]) || status === 'inactive'}
                className={`flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  status === 'inactive'
                    ? 'text-gray-700 bg-gray-100 cursor-not-allowed'
                    : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'
                }`}
              >
                <AlertCircle className="h-4 w-4" />
                Verify
              </button>
            )}
          </div>
        );
      },
    },
    {
      header: 'Date Joined',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: {
      globalFilter: searchQuery,
    },
    onGlobalFilterChange: setSearchQuery,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Add filtered row model
    globalFilterFn: (row, columnId, filterValue) => {
      // Custom global filter to search across multiple columns
      const searchLower = filterValue.toLowerCase();
      return (
        row.original.first_name.toLowerCase().includes(searchLower) ||
        row.original.last_name.toLowerCase().includes(searchLower) ||
        row.original.email.toLowerCase().includes(searchLower) ||
        row.original.status.toLowerCase().includes(searchLower)
      );
    },
  });

  const handleStatusToggle = (userId, newStatus) => {
    setPendingAction({ userId, newStatus });
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingAction) return;
    
    const { userId, newStatus } = pendingAction;
    setPendingStatuses(prev => {
      return {
        ...prev,
        [userId]: newStatus
      };
    });

    try {
      await dispatch(updateUserStatus({ userId, newStatus })).unwrap();
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err)
    } finally {
      setPendingStatuses(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setPendingAction(null);
      setShowStatusDialog(false);
    }
  };

  return (
    <div className="relative m-10">
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
        <h2 className="text-2xl font-bold text-gray-800">
          User Management
        </h2>
        
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search users..."
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
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b bg-white hover:bg-gray-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 text-sm text-gray-600"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showStatusDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Status Change</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to change this user's status to{' '}
              <span className="font-medium">{pendingAction?.newStatus}</span>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowStatusDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                onClick={confirmStatusChange}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;