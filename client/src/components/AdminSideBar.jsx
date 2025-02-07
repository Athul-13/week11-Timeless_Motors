import {
    LayoutDashboard,
    Users,
    Bell,
    Gavel,
    Image,
    ShoppingCart,
    Grid,
    MessagesSquare,
    UserRoundCog,
    FileClock
  } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const AdminSideBar = () => {
    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: <Users size={20} />, label: 'Users', path: '/admin/users' },
        { icon: <UserRoundCog size={20}/>, label: 'KYC Verification', path: '/admin/kyc' },
        { icon: <FileClock size={20}/>, label: 'User Activity', path: '/admin/activity-log'},
        { icon: <Bell size={20} />, label: 'Notifications', path: '/admin/notifications' },
        { icon: <Gavel size={20} />, label: 'Auction management', path: '/admin/auctions' },
        { icon: <Image size={20} />, label: 'Banner Management', path: '/admin/banners' },
        { icon: <ShoppingCart size={20} />, label: 'Orders/Transactions', path: '/admin/orders' },
        { icon: <Grid size={20} />, label: 'Categories', path: '/admin/categories' },
        { icon: <MessagesSquare size={20} />, label: 'Support', path: '/admin/support' }
    ];

    return (
        <div className="w-64 bg-gray-300 min-h-screen p-4">
            <ul className="space-y-4">
            {menuItems.map((item) => (
                <li key={item.label}>
                    <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                        `flex gap-3 w-full text-left px-4 py-2 rounded ${
                          isActive
                            ? "border border-black bg-[#494949] text-white"
                            : "hover:bg-gray-300"
                        }`
                      }
                    >
                    {item.icon}
                    <span>{item.label}</span>
                    </NavLink>
                </li>
            ))}
            </ul>

        </div>
    )
}

export default AdminSideBar