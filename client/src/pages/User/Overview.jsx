import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import {
  CircleDollarSign, ShoppingCart, Package, Store,
  CreditCard, Clock
} from 'lucide-react';
import { orderService, listingService, profileServices, walletService } from '../../utils/api';

const Overview = () => {
  const [userData, setUserData] = useState({
    isSeller: false,
    profile: null,
    orders: [],
    listings: [],
    sellerOrders: [],
    loading: true
  });
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      const balance = await walletService.fetchWallet();
      setBalance(balance.balance);
    };
  
    fetchBalance();
  }, []);
  

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profile, buyerOrders, listings, sellerOrders] = await Promise.all([
          profileServices.getProfile(),
          orderService.getUserOrders(),
          listingService.getListingsByUser(),
          orderService.getSellerOrders()
        ]);

        const isSeller = listings && listings.data.length > 0;

        setUserData({
          isSeller,
          profile,
          orders: buyerOrders.data.orders || [],
          listings: listings.data || [],
          sellerOrders: sellerOrders.data.sellerOrders || { data: [] },
          loading: false
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchUserData();
  }, []);


  if (userData.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Calculate buyer metrics
  const totalSpent = userData.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const totalOrders = userData.orders.length;
  
  // Calculate seller metrics if applicable
  const activeListings = userData.isSeller ? 
    userData.listings.filter(listing => listing.status === 'active').length : 0;
    

  // Process order data for charts - include both buyer and seller orders if applicable
  const processOrderData = (orders, isBuyer = true) => {
    return orders.reduce((acc, order) => {
      const date = new Date(order.timestamps.orderedAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (!acc[date]) {
        acc[date] = { date, amount: 0, count: 0 };
      }
      acc[date].amount += order.totalAmount || 0;
      acc[date].count += 1;
      return acc;
    }, {});
  };

  const buyerOrdersByDate = processOrderData(userData.orders);
  const sellerOrdersByDate = userData.isSeller ? 
    processOrderData(userData.sellerOrders, false) : {};

  // Combine buyer and seller order status data
  const orderStatusData = [...userData.orders, ...(userData.isSeller ? userData.sellerOrders : [])]
    .reduce((acc, order) => {
      if (!acc[order.orderStatus]) {
        acc[order.orderStatus] = { status: order.orderStatus, count: 0 };
      }
      acc[order.orderStatus].count += 1;
      return acc;
    }, {});

  return (
    <div className="p-6 space-y-6 bg-gray-100">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Buyer Metrics */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Spent</p>
              <h3 className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Orders Placed</p>
              <h3 className="text-2xl font-bold">{totalOrders}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Wallet</p>
              <h3 className="text-2xl font-bold">₹{balance.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <CircleDollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {userData.isSeller && (
          <>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Active Listings</p>
                  <h3 className="text-2xl font-bold">{activeListings}</h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Store className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Purchase History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">
            {userData.isSeller ? 'Purchase & Sales History' : 'Purchase History'}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  data={Object.values(buyerOrdersByDate)}
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  name="Purchases (₹)"
                  strokeWidth={2}
                />
                {userData.isSeller && (
                  <Line
                    data={Object.values(sellerOrdersByDate)}
                    type="monotone"
                    dataKey="amount"
                    stroke="#82ca9d"
                    name="Sales (₹)"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Order Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.values(orderStatusData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Number of Orders">
                  {Object.values(orderStatusData).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300'][index % 4]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {userData.isSeller && (
          <>
            {/* Listing Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Listing Performance</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userData.listings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="make" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bid_count" fill="#8884d8" name="Bids" />
                    <Bar dataKey="current_bid" fill="#82ca9d" name="Current Bid (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Listings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Recent Listings</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Make/Model</th>
                      <th className="px-4 py-2 text-left">Price</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.listings.slice(0, 5).map((listing, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{`${listing.make} ${listing.model}`}</td>
                        <td className="px-4 py-2">₹{listing.starting_bid?.toLocaleString()}</td>
                        <td className="px-4 py-2">{listing.type}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            listing.status === 'active' ? 'bg-green-100 text-green-800' :
                            listing.status === 'pending start' ? 'bg-yellow-100 text-yellow-800' :
                            listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {listing.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Overview;