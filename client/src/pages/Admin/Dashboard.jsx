import { Building, CircleDollarSign, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dummy data from JSONPlaceholder
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, postsRes] = await Promise.all([
          fetch('https://jsonplaceholder.typicode.com/users'),
          fetch('https://jsonplaceholder.typicode.com/posts')
        ]);
        const usersData = await usersRes.json();
        const postsData = await postsRes.json();

        setTimeout(() => {
          setUsers(usersData);
          setPosts(postsData);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Wallet usage data
  const walletData = [
    { name: 'Manual Wallet', value: 45 },
    { name: 'Exchange Wallet', value: 55 },
  ];

  // Generate dummy activity data
  const activityData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    transactions: Math.floor(Math.random() * 100) + 50,
    users: Math.floor(Math.random() * 50) + 20
  }));

  const COLORS = ['#FFD700', '#FF69B4'];
  const CHART_COLORS = {
    transactions: '#8884d8',
    users: '#82ca9d'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-white">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Custom card using div */}
        <div className="bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors">
          <div className="flex items-center p-4 space-x-4">
            <div className="p-2 rounded-full bg-purple-500">
              <CircleDollarSign className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">1200</div>
              <div className="text-gray-200">Total Funds</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors">
          <div className="flex items-center p-4 space-x-4">
            <div className="p-2 rounded-full bg-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-gray-200">Total Customers</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors">
          <div className="flex items-center p-4 space-x-4">
            <div className="p-2 rounded-full bg-green-500">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{posts.length}</div>
              <div className="text-gray-200">Total Posts</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors">
          <div className="flex items-center p-4 space-x-4">
            <div className="p-2 rounded-full bg-orange-500">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.floor(posts.length / users.length)}</div>
              <div className="text-gray-200">Posts per User</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Usage Chart */}
        <div className="bg-gray-500 text-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Wallet Usage</h3>
            <select className="bg-gray-500 text-gray-200 border border-gray-700 rounded px-2 py-1">
              <option>This Week</option>
            </select>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={walletData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {walletData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 mt-4">
            {walletData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span>{entry.name}: {entry.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-gray-500 text-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Weekly Activity</h3>
            <select className="bg-gray-500 text-gray-200 border border-gray-700 rounded px-2 py-1">
              <option>This Week</option>
            </select>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="day" 
                  stroke="#000"
                />
                <YAxis 
                  stroke="#000"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#333',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke={CHART_COLORS.transactions}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke={CHART_COLORS.users}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: CHART_COLORS.transactions }}
              />
              <span>Transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: CHART_COLORS.users }}
              />
              <span>Active Users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;