import Sidebar from "../../components/SideBar";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Outlet } from "react-router-dom";

const UserDetails = () => {
    return (
      <>
  
      < Navbar />
  
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
  
        {/* Main Content */}
        <div className="flex-1 p-8">
          <Outlet/>
        </div>
      </div>
  
      < Footer />
  
      </>
    );
  };

export default UserDetails