import { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Calendar, Filter, FileText, ChevronRight, ChevronLeft, CircleDollarSign, Plus, ArrowDownCircle } from 'lucide-react';
import { walletService } from '../../utils/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  
  // Dialog states
  const [isAddMoneyDialogOpen, setIsAddMoneyDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Suggested amounts
  const suggestedAddAmounts = [100, 500, 1000, 5000];
  const suggestedWithdrawAmounts = [100, 500, 1000, 'All'];

  useEffect(() => {
    let mounted = true;

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // Replace with your API call
        const response = await walletService.fetchTransactions(currentPage, itemsPerPage);
        if(mounted) {
          if(response.success) {
            setTransactions(response.data.transactions);

            if(response.data.totalPages) {
              setTotalPages(response.data.totalPages);
            } else if (response.data.totalCount) {
              setTotalPages(Math.ceil(response.data.totalCount / itemsPerPage));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const fetchBalance = async () => {
      const balance = await walletService.fetchWallet();
      setBalance(balance.balance);
    };
  
    fetchBalance();
  }, []);

  const handleAddMoney = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    try {
      // Replace with your API call
      // const response = await walletService.addMoney(Number(amount));
      // if (response.success) {
      //   setBalance(prevBalance => prevBalance + Number(amount));
      // }
      console.log('Adding money:', amount);
      setBalance(prevBalance => prevBalance + Number(amount));
      setIsAddMoneyDialogOpen(false);
      setAmount('');
    } catch (error) {
      console.error('Error adding money:', error);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = amount === 'All' ? balance : Number(amount);
    
    if (amount !== 'All' && (!amount || isNaN(amount) || Number(amount) <= 0)) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount > balance) {
      alert('Insufficient balance');
      return;
    }
    
    try {
      // Replace with your API call
      // const response = await walletService.withdraw(withdrawAmount);
      // if (response.success) {
      //   setBalance(prevBalance => prevBalance - withdrawAmount);
      // }
      console.log('Withdrawing money:', withdrawAmount);
      setBalance(prevBalance => prevBalance - withdrawAmount);
      setIsWithdrawDialogOpen(false);
      setAmount('');
    } catch (error) {
      console.error('Error withdrawing money:', error);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Success':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-blue-100 text-blue-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type) => {
    return type === 'Payment' || type === 'Withdrawal' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // Ensures AM/PM format
    });
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
    { value: 'Payment', label: 'Payments' },
    { value: 'Withdrawal', label: 'Withdrawals' },
    { value: 'Deposit', label: 'Deposits' },
    { value: 'Refund', label: 'Refunds' },
    { value: 'Auction Earnings', label: 'Auction Earnings' }
  ];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No transactions found</p>
          <p className="text-sm text-gray-500 mt-2">Your transaction history will appear here.</p>
        </div>
      </div>
    );
  }

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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
        {/* Wallet section with buttons */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Wallet Balance</p>
                <h3 className="text-2xl font-bold">₹{balance.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <CircleDollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setIsAddMoneyDialogOpen(true);
                setAmount('');
              }}
              className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Money
            </button>
            <button
              onClick={() => {
                setIsWithdrawDialogOpen(true);
                setAmount('');
              }}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <ArrowDownCircle className="w-5 h-5 mr-2" />
              Withdraw
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium text-gray-900">Transaction History</h1>
          <div className="flex items-center space-x-4">
            <div className="space-x-2">
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
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center px-4 py-2 bg-white rounded-lg hover:bg-gray-50 focus:outline-none transition-colors duration-200"
              >
                <Filter className="w-4 h-4 mr-2 text-gray-700" />
                <span className="text-gray-700">{filterOptions.find(opt => opt.value === filter)?.label}</span>
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-10 overflow-hidden">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200"
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

        <div className="space-y-4">
          {transactions
            .filter(transaction => filter === 'all' || transaction.type === filter)
            .map((transaction) => (
              <div
                key={transaction._id}
                className="bg-white rounded-xl overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-gray-100 ${
                        transaction.type === 'Payment' || transaction.type === 'Withdrawal' 
                          ? 'text-red-500' 
                          : 'text-green-500'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <h2 className="text-xl font-medium text-gray-900">{transaction.description}</h2>
                        <div className="flex items-center text-sm text-gray-600 mt-1 space-x-2">
                          <span>{transaction.type}</span>
                          <span>•</span>
                          <span>{transaction.method}</span>
                          <span>•</span>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(transaction.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-medium ${
                        transaction.type === 'Payment' || transaction.type === 'Withdrawal' 
                          ? 'text-red-500' 
                          : 'text-green-500'
                      }`}>
                        {transaction.type === 'Payment' || transaction.type === 'Withdrawal' ? ' ' : '+ '}
                        {formatAmount(transaction.amount)}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${getStatusStyles(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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

      {/* Add Money Dialog */}
      {isAddMoneyDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 mx-4">
            <h2 className="text-xl font-bold mb-4">Add Money to Wallet</h2>
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Amount (₹)
              </label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter amount"
              />
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Suggested Amounts:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedAddAmounts.map((suggestedAmount) => (
                  <button
                    key={suggestedAmount}
                    onClick={() => setAmount(suggestedAmount.toString())}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-medium transition-colors duration-200"
                  >
                    ₹{suggestedAmount}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsAddMoneyDialogOpen(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMoney}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Money Dialog */}
      {isWithdrawDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 mx-4">
            <h2 className="text-xl font-bold mb-4">Withdraw Money</h2>
            <div className="mb-4">
              <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Amount (₹)
              </label>
              <input
                type="text"
                id="withdrawAmount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter amount"
              />
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Suggested Amounts:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedWithdrawAmounts.map((suggestedAmount) => (
                  <button
                    key={suggestedAmount}
                    onClick={() => setAmount(suggestedAmount.toString())}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-medium transition-colors duration-200"
                  >
                    {suggestedAmount === 'All' ? 'All' : `₹${suggestedAmount}`}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsWithdrawDialogOpen(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;