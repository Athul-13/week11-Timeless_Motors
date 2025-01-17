import { Outlet, useNavigate } from "react-router-dom"
import AdminSideBar from "../components/AdminSideBar"
import { Search } from "lucide-react"
import { useDispatch } from "react-redux"
import { logout } from "../redux/authSlice"

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate("/homePage");
    }

    return (
        <>
            <nav className="flex items-center justify-between px-6 py-3 bg-gray-200 shadow-sm border-b-black ">
            {/* Logo/Brand */}
            <div className="flex items-center">
                <h1 className="text-xl font-serif">Timeless Motors</h1>
            </div>

            {/* Search Bar */}
            <div className="flex items-center flex-1 max-w-2xl mx-10">
                <div className="relative w-full">
                <input
                    type="search"
                    placeholder="Search..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:border-gray-400"
                />
                <Search 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    size={20} 
                />
                </div>
            </div>

            {/* Logout Button */}
            <button 
                className="px-6 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                onClick={handleLogout}
            >
                Log Out
            </button>
            </nav>
            <div className="flex">

                < AdminSideBar />
                
                <div className="flex-1">
                    < Outlet />
                </div>
            </div>
            
        </>
    )
}

export default AdminDashboard