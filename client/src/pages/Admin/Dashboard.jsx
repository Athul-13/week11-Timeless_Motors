import { 
  adminServices, 
  listingService, 
  orderService, 
  categoryService, 
  walletService
} from '../../utils/api';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, CartesianGrid,
   XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import {
  CircleDollarSign, Users,
  ShoppingCart, Package,
  CreditCardIcon
} from 'lucide-react';
import OrderStatusPieChart from '../../components/OrderStatusPieChart';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    users: [],
    listings: [],
    orders: [],
    categories: [],
    activityLogs: [],
    wallet: []
  });
  const [loading, setLoading] = useState(true);
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [users, listings, orders, categories, activityLogs, wallet] = await Promise.all([
          adminServices.getAllUsers(),
          listingService.getAllListings(),
          orderService.getAllOrders(),
          categoryService.getAllCategories(),
          adminServices.fetchAllActivity(),
          walletService.fetchWallet()
        ]);

        // Process orders data for status distribution
        const orderStatusCount = orders.orders.reduce((acc, order) => {
          acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
          return acc;
        }, {});

        const orderStatusData = Object.entries(orderStatusCount).map(([status, count]) => ({
          name: status,
          value: count
        }));

        // Process activity logs with actual events
        const processedActivities = activityLogs.reduce((acc, log) => {
          const date = new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
          if (!acc[date]) {
            acc[date] = { 
              date,
              auth: 0,      // Authentication related events
              account: 0,   // Account management events
              system: 0     // System events
            };
          }
          
          // Categorize different types of events
          if (log.action.includes('login') || log.action.includes('logout') || log.action.includes('failed login')) {
            acc[date].auth++;
          } else if (log.action.includes('password') || log.action.includes('profile') || log.action.includes('settings')) {
            acc[date].account++;
          } else {
            acc[date].system++;
          }
          
          return acc;
        }, {});

        // Process listings by type
        const listingTypeData = listings.reduce((acc, listing) => {
          acc[listing.type] = (acc[listing.type] || 0) + 1;
          return acc;
        }, {});

        setMetrics({
          users,
          listings,
          orders,
          categories,
          orderStatusData,
          activities: Object.values(processedActivities),
          listingTypeData: Object.entries(listingTypeData).map(([type, count]) => ({
            name: type,
            value: count
          })),
          wallet: wallet.balance
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  console.log(metrics);

  useEffect(() => {
    if (!loading) {
      setAnimationStarted(true);
    }
  }, [loading]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
  const ANIMATION_DURATION = 2500;
  const EASING = "ease-in-out";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Calculate key metrics
  const totalOrders = metrics.orders.orders.length;
  const totalActiveUsers = metrics.users.filter(user => user.status === 'active' || user.status === 'verified').length;
  const activeListings = metrics.listings.filter(listing => listing.status === 'active').length;
  const totalRevenue = metrics.orders.orders
  .filter(order => order.orderStatus === "Confirmed")
  .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Calculate revenue data with proper date grouping
  const revenueData = metrics.orders.orders.reduce((acc, order) => {
    const date = new Date(order.timestamps.orderedAt || order.createdAt)
      .toLocaleDateString('en-US', { weekday: 'short' });
    
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, orders: 0 };
    }
    acc[date].revenue += order.totalAmount || 0;
    acc[date].orders++;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 bg-gray-100">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Active Users</p>
              <h3 className="text-2xl font-bold">{totalActiveUsers}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Money</p>
              <h3 className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CircleDollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold">₹{metrics.wallet.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CreditCardIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Active Listings</p>
              <h3 className="text-2xl font-bold">{activeListings}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold">{totalOrders}</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">System Activity Timeline</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.activities}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="auth"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Authentication Events"
                  animationDuration={ANIMATION_DURATION}
                  animationBegin={0}
                  animationEasing={EASING}
                />
                <Area
                  type="monotone"
                  dataKey="account"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Account Management"
                  animationDuration={ANIMATION_DURATION}
                  animationBegin={500}
                  animationEasing={EASING}
                />
                <Area
                  type="monotone"
                  dataKey="system"
                  stackId="1"
                  stroke="#ffc658"
                  fill="#ffc658"
                  name="System Events"
                  animationDuration={ANIMATION_DURATION}
                  animationBegin={1000}
                  animationEasing={EASING}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        {/* <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Order Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={ANIMATION_DURATION}
                  animationEasing={EASING}
                  startAngle={-270}
                  endAngle={90}
                >
                  {metrics.orderStatusData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div> */}
        < OrderStatusPieChart orderStatusData={metrics.orderStatusData} />

        {/* Revenue Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Revenue Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={Object.values(revenueData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  name="Revenue (₹)"
                  animationDuration={ANIMATION_DURATION}
                  animationBegin={0}
                  animationEasing={EASING}
                  strokeWidth={2}
                  dot={{ strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#82ca9d"
                  name="Order Count"
                  animationDuration={ANIMATION_DURATION}
                  animationBegin={500}
                  animationEasing={EASING}
                  strokeWidth={2}
                  dot={{ strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Listing Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Listings by Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.listingTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8" 
                  name="Number of Listings"
                  animationDuration={ANIMATION_DURATION}
                  animationBegin={0}
                  animationEasing={EASING}
                >
                  {metrics.listingTypeData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;