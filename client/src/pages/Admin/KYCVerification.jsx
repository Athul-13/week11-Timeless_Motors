import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
  } from '@tanstack/react-table';
  import { FileText, Download } from 'lucide-react';
  import { useState, useEffect } from 'react';
  import { toast, Toaster } from 'react-hot-toast';
  import { KYCService } from '../../utils/api';
  
  const KYCVerification = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [kycDocuments, setKycDocuments] = useState([]);
  
    useEffect(() => {
      const fetchDocuments = async () => {
        try {
          const response = await KYCService.getAllDocuments();
          console.log('res',response.documents);
          setKycDocuments(response.documents);
          setLoading(false);
        } catch (err) {
          toast.error('Failed to fetch KYC documents');
          setLoading(false);
        }
      };
  
      fetchDocuments();
    }, []);
  
    const columns = [
      {
        header: 'Name',
        accessorFn: (row) => `${row.user.first_name} ${row.user.last_name}`,
        cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        // Add filtering for name
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId);
          return value.toLowerCase().includes(filterValue.toLowerCase());
        }
      },
      {
        header: 'Email',
        accessorKey: 'user.email',
        // Add filtering for email
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId);
          return value.toLowerCase().includes(filterValue.toLowerCase());
        }
      },
      {
        header: 'Document Type',
        accessorKey: 'documentType',
        cell: ({ getValue }) => {
          const documentType = getValue();
          return (
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <FileText className="h-4 w-4" />
              {documentType}
            </span>
          );
        },
        // Add filtering for document type
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId);
          return value.toLowerCase().includes(filterValue.toLowerCase());
        }
      },
      {
        header: 'Upload Time',
        accessorKey: 'createdAt',
        cell: ({ row }) => {
          const uploadTime = new Date(row.original.createdAt);
          return (
            <div>
              <span>{uploadTime.toLocaleDateString()}</span>
              <span className="text-xs text-gray-500 block">
                {uploadTime.toLocaleTimeString()}
              </span>
            </div>
          );
        },
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <a
              href={row.original.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Download className="h-5 w-5" />
            </a>
          </div>
        ),
      },
    ];
  
    const table = useReactTable({
        data: kycDocuments,
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
            row.original.user.first_name.toLowerCase().includes(searchLower) ||
            row.original.user.last_name.toLowerCase().includes(searchLower) ||
            row.original.user.email.toLowerCase().includes(searchLower) ||
            row.original.documentType.toLowerCase().includes(searchLower)
          );
        },
      });
  
      return (
        <div className="relative m-10">
          <Toaster position="top-center" />
          
          <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
            <h2 className="text-2xl font-bold text-gray-800">
              KYC Document Verification
            </h2>
            
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search KYC documents..."
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
        </div>
      );
  
  };
  
  export default KYCVerification;