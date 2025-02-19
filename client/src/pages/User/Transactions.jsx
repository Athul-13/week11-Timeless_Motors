import { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Calendar, Filter, FileText } from 'lucide-react';
import { walletService } from '../../utils/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // Replace with your API call
        const response = await walletService.fetchTransactions();
        console.log('res',response);
        setTransactions(response.transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-gray-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium text-gray-900">Transaction History</h1>
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
      </div>
    </div>
  );
};

export default Transactions;