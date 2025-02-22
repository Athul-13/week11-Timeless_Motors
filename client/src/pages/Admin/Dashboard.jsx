import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import {
  CircleDollarSign, Users,
  ShoppingCart, Package,
  CreditCardIcon
} from 'lucide-react';
import { orderService, listingService, categoryService, adminServices, walletService } from '../../utils/api';

const Dashboard = () => {
  const [timeFilter, setTimeFilter] = useState('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState({
    salesData: [],
    listingTypeData: [],
    orderStatusData: [],
    categoryPerformanceData: []
  });
  const [metrics, setMetrics] = useState({
    users: [],
    listings: [],
    orders: {orders: []},
    wallet: []
  });

  useEffect(() => {
    fetchDashboardData(timeFilter);
  }, [timeFilter]);

  const fetchDashboardData = async (filter) => {
    setIsLoading(true);
    try {
      // First, let's log the API responses to debug
      console.log('Fetching data...');
      
      const ordersResponse = await orderService.getAllOrders();
      console.log('Orders response:', ordersResponse);
      
      const listingsResponse = await listingService.getAllListings();
      console.log('Listings response:', listingsResponse);
      
      const categoriesResponse = await categoryService.getAllCategories();
      console.log('Categories response:', categoriesResponse);
      
      const activityLogResponse = await adminServices.fetchAllActivity();
      console.log('Activity log response:', activityLogResponse);
      
      const usersResponse = await adminServices.getAllUsers();
      console.log('Users response:', usersResponse);
      
      const walletResponse = await walletService.fetchWallet();
      console.log('Wallet response:', walletResponse);
  
      // Only proceed with data processing if we have valid responses
      if (!ordersResponse?.orders || !listingsResponse || !categoriesResponse?.data) {
        console.error('Invalid or missing data in API responses');
        return;
      }
  
      // Process data only after confirming we have valid responses
      const salesData = processSalesData(ordersResponse.orders, filter);
      console.log('Processed sales data:', salesData);
  
      const listingTypeData = processListingTypeData(listingsResponse, filter);
      console.log('Processed listing type data:', listingTypeData);
  
      const orderStatusData = processOrderStatusData(ordersResponse.orders);
      console.log('Processed order status data:', orderStatusData);
  
      const categoryData = processCategoryData(ordersResponse.orders, categoriesResponse.data, filter);
      console.log('Processed category data:', categoryData);
  
      // Update state only if we have valid processed data
      setChartData({
        salesData: salesData || [],
        listingTypeData: listingTypeData || [],
        orderStatusData: orderStatusData || [],
        categoryPerformanceData: categoryData || []
      });
  
      setMetrics({
        users: usersResponse || [],
        listings: listingsResponse || [],
        orders: ordersResponse || { orders: [] },
        wallet: walletResponse?.balance || 0
      });
  
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Log the full error details
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
    } finally {
      setIsLoading(false);
    }
  };
  console.log('sales',chartData.salesData);

  // Calculate key metrics
  const totalActiveUsers = metrics.users.filter(user => user.status === 'active' || user.status === 'verified').length;
  const totalRevenue = metrics.orders.orders
  .filter(order => order.orderStatus === "Confirmed" || order.orderStatus === 'Delivered')
  .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const activeListings = metrics.listings.filter(listing => listing.status === 'active').length;
  const totalOrders = metrics.orders.orders.length;

  // Process orders into sales timeline data
  const processSalesData = (orders, filter) => {
    // Group orders by time period based on filter
    const groupedData = {};
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      let key;
  
      if (filter === 'daily') {
        // Group by hour for daily view
        key = orderDate.getHours().toString().padStart(2, '0') + ':00';
      } else if (filter === 'weekly') {
        // Group by ISO week number for weekly view
        const firstDayOfYear = new Date(orderDate.getFullYear(), 0, 1);
        const pastDaysOfYear = (orderDate - firstDayOfYear) / 86400000;
        key = `Week ${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
      } else if (filter === 'monthly') {
        // Group by month for monthly view
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = monthNames[orderDate.getMonth()];
      } else if (filter === 'yearly') {
        // Group by year for yearly view
        key = orderDate.getFullYear().toString();
      } else {
        // Group by year for all-time view
        key = orderDate.getFullYear().toString();
      }
  
      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, orders: 0 };
      }
  
      groupedData[key].revenue += order.totalAmount || 0;
      groupedData[key].orders += 1;
    });
  
    // Convert to array format for Recharts
    return Object.keys(groupedData).map(key => ({
      name: key,
      revenue: groupedData[key].revenue,
      orders: groupedData[key].orders
    }));
  };
  

  // Process listings to show fixed price vs auction distribution
  const processListingTypeData = (listings, filter) => {
    // Group listings by time period and type
    const groupedData = {};
    
    listings.forEach(listing => {
      const listingDate = new Date(listing.createdAt);
      let key;
  
      if (filter === 'daily') {
        // Group by day of the week for daily view
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        key = days[listingDate.getDay()];
      } else if (filter === 'weekly') {
        // Group by ISO week number for weekly view
        const firstDayOfYear = new Date(listingDate.getFullYear(), 0, 1);
        const pastDaysOfYear = (listingDate - firstDayOfYear) / 86400000;
        key = `Week ${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
      } else if (filter === 'monthly') {
        // Group by month for monthly view
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = monthNames[listingDate.getMonth()];
      } else {
        // Group by year for yearly/all-time view
        key = listingDate.getFullYear().toString();
      }
  
      if (!groupedData[key]) {
        groupedData[key] = { fixedPrice: 0, auction: 0 };
      }
  
      // Assuming listing has a 'type' field that indicates whether it's fixed price or auction
      if (listing.isAuction) {
        groupedData[key].auction += 1;
      } else {
        groupedData[key].fixedPrice += 1;
      }
    });
  
    // Convert to array format for Recharts
    return Object.keys(groupedData).map(key => ({
      name: key,
      fixedPrice: groupedData[key].fixedPrice,
      auction: groupedData[key].auction
    }));
  };
  

  // Process orders to show status distribution
  const processOrderStatusData = (orders) => {
    const statusCounts = {};
    
    orders.forEach(order => {
      const status = order.orderStatus || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Convert to array format for Recharts
    return Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status]
    }));
  };

  // Process orders by category
  const processCategoryData = (orders, categories, filter) => {
    // Create a map of category IDs to names
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category._id] = category.name;
    });
    
    // Group orders by time period and category
    const groupedData = {};
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      let key;
      
      if (filter === 'daily') {
        // Group by day of week for daily view
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        key = days[orderDate.getDay()];
      } else if (filter === 'monthly') {
        // For monthly, group into quarters
        const quarter = Math.floor(orderDate.getMonth() / 3) + 1;
        key = `Q${quarter}`;
      } else {
        // Group by year for yearly/all-time view
        key = orderDate.getFullYear().toString();
      }
      
      if (!groupedData[key]) {
        groupedData[key] = {};
        // Initialize all categories with zero
        categories.forEach(category => {
          groupedData[key][category.name] = 0;
        });
      }
      
      // Sum up order amount by category
      // Assuming order has items with categoryId
      order.items?.forEach(item => {
        if (item.listing && item.listing.categoryId) {
          const categoryName = categoryMap[item.listing.categoryId] || 'Other';
          groupedData[key][categoryName] = (groupedData[key][categoryName] || 0) + (item.price || 0);
        }
      });
    });
    
    // Convert to array format for Recharts
    return Object.keys(groupedData).map(key => ({
      name: key,
      ...groupedData[key]
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const handleFilterChange = (e) => {
    setTimeFilter(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800"> Analytics Dashboard</h1>
        <div className="flex items-center">
          <label htmlFor="timeFilter" className="mr-2 text-gray-700">Time Period:</label>
          <select 
            id="timeFilter" 
            value={timeFilter} 
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="alltime">All Time</option>
          </select>
        </div>
      </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Sales Performance */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Sales Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Revenue ($)" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" name="Order Count" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Listing Type Distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Listing Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.listingTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="fixedPrice" fill="#8884d8" name="Fixed Price Listings" />
              <Bar dataKey="auction" fill="#82ca9d" name="Auction Listings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Order Status Distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} orders`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4: Category Performance */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Category Sales Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.categoryPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(chartData.categoryPerformanceData[0] || {})
                .filter(key => key !== 'name')
                .map((category, index) => (
                  <Area 
                    key={category}
                    type="monotone" 
                    dataKey={category} 
                    stackId="1" 
                    fill={COLORS[index % COLORS.length]} 
                    stroke={COLORS[index % COLORS.length]} 
                  />
                ))
              }
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;