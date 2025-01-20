import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { adminServices } from '../../utils/api';

// Component for the search bar
const SearchBar = ({ searchQuery, setSearchQuery, handleSearch }) => (
  <div className="mt-4">
    <form onSubmit={handleSearch} className="flex items-center">
      <input
        type="text"
        placeholder="Search users..."
        className="w-full max-w-md p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyUp={(e) => handleSearch(e, e.target.value)}
      />
      <button 
        type="submit" 
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg"
      >
        Search
      </button>
    </form>
  </div>
);

// Component for the users table
const UsersTable = ({ users, onStatusChange, onDelete }) => {
  const statusOptions = ['active', 'inactive', 'verified'];

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full bg-gray-700 rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b text-left text-white">Name</th>
            <th className="px-4 py-2 border-b text-left text-white">Email</th>
            <th className="px-4 py-2 border-b text-left text-white">Status</th>
            <th className="px-4 py-2 border-b text-left text-white">Date of Join</th>
            <th className="px-4 py-2 border-b text-left text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} className="border-b">
              <td className="px-4 py-2 text-white">{user.first_name}</td>
              <td className="px-4 py-2 text-white">{user.email}</td>
              <td className="px-4 py-2">
                <select
                  value={user.status}
                  onChange={(e) => onStatusChange(user._id, e.target.value)}
                  className="bg-gray-600 text-white p-1 rounded border border-gray-500"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2 text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-2">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2">
                  Edit
                </button>
                <button
                  onClick={() => onDelete(user._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Users component
const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const loadingToast = toast.loading('Fetching users...');
    try {
      const data = await adminServices.getAllUsers();
      setUsers(data);
      toast.success('Users loaded successfully', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to fetch users', { id: loadingToast });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e, optionalQuery = null) => {
    e?.preventDefault();
    const query = optionalQuery || searchQuery;

    if (!query.trim()) {
      fetchUsers();
      return;
    }

    const searchToast = toast.loading('Searching users...');
    try {
      const data = await adminServices.searchUsers(query);
      setUsers(data);
      if (data.length === 0) {
        toast('No users found matching your search', {
          id: searchToast,
          icon: '🔍'
        });
      } else {
        toast.success(`Found ${data.length} users`, { id: searchToast });
      }
    } catch (err) {
      toast.error('Search failed', { id: searchToast });
      console.error(err);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    const statusToast = toast.loading('Updating status...');
    try {
      const result = await adminServices.updateUserStatus(userId, newStatus);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));
      toast.success(result.message || 'Status updated successfully', { id: statusToast });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status', { id: statusToast });
      console.error('Status update error:', err.response?.data || err);
    }
};

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const deleteToast = toast.loading('Deleting user...');
      try {
        await adminServices.deleteUser(userId);
        setUsers(users.filter(user => user._id !== userId));
        toast.success('User deleted successfully', { id: deleteToast });
      } catch (err) {
        toast.error('Failed to delete user', { id: deleteToast });
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 m-10">
      {/* Toaster component for showing notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
              color: 'white',
            },
          },
          error: {
            duration: 3000,
            style: {
              background: '#EF4444',
              color: 'white',
            },
          },
          loading: {
            style: {
              background: '#3B82F6',
              color: 'white',
            },
          },
        }}
      />

      <div className="container mx-auto p-4">
        <h2 className="text-3xl font-bold text-center text-black mt-4">
          User Management
        </h2>

        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
        />

        {loading ? (
          <p className="text-center mt-4">Loading...</p>
        ) : (
          <UsersTable 
            users={users}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default Users;