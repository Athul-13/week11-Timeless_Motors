import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const menuItems = [
    { name: "Profile Details", path: "/profile/profileDetails" },
    { name: "Overview", path: "/profile/overview" },
    { name: "Transactions", path: "/profile/transactions"},
    { name: "Sales", path: "/profile/sales"},
    { name: "My Listings", path: "/profile/myListings" },
    { name: "My Bids", path: "/profile/myBids" },
    { name: "Past Orders", path: "/profile/pastOrders" },
    { name: "Inbox", path: "/profile/inbox" },
  ];

  return (
    <div className="bg-gray-200 h-full w-64 p-4 ms-10 my-8">
      <h2 className="text-center text-lg font-bold mb-8">Account</h2>
      <ul className="space-y-4">
        {menuItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `block w-full text-left px-4 py-2 rounded ${
                  isActive
                    ? "border border-black bg-gray-300"
                    : "hover:bg-gray-300"
                }`
              }
            >
              
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
