import { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Calendar, Filter, FileText, ExternalLink, Wallet, Package, Gavel, Receipt, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { walletService } from '../../utils/api';
import { toast, Toaster } from 'react-hot-toast';

const AllTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await walletService.fetchAllTransactions();
        setTransactions(response.transactions);
      } catch (error) {
        toast.error('Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchQuery.toLowerCase();
    const userName = `${transaction.wallet?.user?.first_name || ''} ${transaction.wallet?.user?.last_name || ''}`.toLowerCase();
    const orderId = transaction.metadata?.orderId?.orderNumber || '';
    const productId = transaction.metadata?.productId ? 
      `${transaction.metadata.productId.make || ''} ${transaction.metadata.productId.model || ''} ${transaction.metadata.productId.year || ''}` : 
      '';
    
    return (
      (filter === 'all' || transaction.type === filter) &&
      (searchQuery === '' ||
        (transaction.txn_id || '').toLowerCase().includes(searchLower) ||
        userName.includes(searchLower) ||
        orderId.toLowerCase().includes(searchLower) ||
        productId.toLowerCase().includes(searchLower))
    );
  });

   // Pagination calculations
   const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
   const indexOfLastItem = currentPage * itemsPerPage;
   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
   const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
 
   // Navigation functions
   const nextPage = () => {
     setCurrentPage(prev => Math.min(prev + 1, totalPages));
   };
 
   const prevPage = () => {
     setCurrentPage(prev => Math.max(prev - 1, 1));
   };
 

  const toggleRowExpansion = (txnId) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(txnId)) {
      newExpandedRows.delete(txnId);
    } else {
      newExpandedRows.add(txnId);
    }
    setExpandedRows(newExpandedRows);
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Success':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-blue-100 text-blue-800';
      case 'Failed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTransactionIcon = (type) => {
    return type === 'Payment' || type === 'Withdrawal' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  const formatDate = (date) => {
    const formattedDate = new Date(date).toLocaleDateString();
    const formattedTime = new Date(date).toLocaleTimeString();
    return { date: formattedDate, time: formattedTime };
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'Fee', label: 'Commision' },
    { value: 'Payment', label: 'Payments' },
    { value: 'Withdrawal', label: 'Withdrawals' },
    { value: 'Deposit', label: 'Deposits' },
    { value: 'Refund', label: 'Refunds' },
    { value: 'Auction Earnings', label: 'Auction Earnings' }
  ];

  const MetadataRow = ({ metadata }) => {
    if (!metadata) return null;
    return (
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50">
        {metadata.orderId && (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Order: {metadata.orderId.orderNumber}</span>
          </div>
        )}
        {metadata.auctionId && (
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Auction: {metadata.auctionId}</span>
          </div>
        )}
        {metadata.productId && (
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Product: {metadata.productId.make} {metadata.productId.model} ({metadata.productId.year})</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="relative m-10">
        <div className="rounded-md border border-gray-300 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-800">No transactions found</p>
          <p className="text-sm text-gray-500 mt-2">Your transaction history will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative m-10">
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
        <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
        
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
              placeholder="Search by ID, name, order, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>{filterOptions.find(opt => opt.value === filter)?.label}</span>
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-300 shadow-lg z-10">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setFilter(option.value);
                      setIsFilterOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-gray-300">
        <table className="w-full table-auto">
          <thead className="bg-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300">Transaction ID</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300">User</th>
              {/* <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300">Wallet</th> */}
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300">Type</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300">Method</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300">Date & Time</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((transaction) => {
              const { date, time } = formatDate(transaction.timestamp);
              return (
                <>
                  <tr 
                    key={transaction.txn_id} 
                    className="border-b bg-white hover:bg-gray-100 cursor-pointer"
                    onClick={() => toggleRowExpansion(transaction.txn_id)}
                  >
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {transaction.txn_id}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-gray-500" />
                          <span className=" text-xs">{transaction.wallet.user.first_name} {transaction.wallet.user.last_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.method}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>
                          <span>{date}</span>
                          <span className="text-xs text-gray-500 block">{time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className={transaction.type === 'Payment' || transaction.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500'}>
                          {transaction.type === 'Payment' || transaction.type === 'Withdrawal' ? '- ' : '+ '}
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium ${getStatusStyles(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                    {expandedRows.has(transaction.txn_id) && (
                      <tr>
                        <td colSpan="8" className="border-b">
                          <MetadataRow metadata={transaction.metadata} />
                        </td>
                      </tr>
                    )}
                  </>
                );
            })}
          </tbody>
        </table>

        {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 px-4">
        <div className="text-sm text-gray-700">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AllTransactions;