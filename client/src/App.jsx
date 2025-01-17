import { BrowserRouter, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import About from "./pages/About";
import AddListingForm from "./pages/AddListingForm";
import AuctionManagement from "./pages/Admin/AuctionManagement";
import BannerManagement from "./pages/Admin/BannerManagement";
import Categories from "./pages/Admin/Categories";
import Dashboard from "./pages/Admin/Dashboard";
import Notifications from "./pages/Admin/Notifications";
import Orders from "./pages/Admin/Orders";
import Support from "./pages/Admin/Support";
import Users from "./pages/Admin/Users";
import AdminDashboard from "./pages/AdminDasboard";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import Listings from "./pages/Listings";
import LoginForm from "./pages/LoginForm";
import MyBids from "./pages/MyBids";
import MyListings from "./pages/MyListings";
import PastOrders from "./pages/PastOrders";
import Payments from "./pages/Payments";
import ProfileDetails from "./pages/ProfileDetails";
import SignupForm from "./pages/SignupForm";
import UserDetails from "./pages/UserDetails";
import VerifyOTP from "./pages/VerifyOTP";
import AdminAddListing from "./pages/Admin/AdminAddListing";


export default function App () {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          < LandingPage />
        } />

        <Route path="/login" element={
          < LoginForm />
        } />

        <Route path="/signup" element={
          < SignupForm />
        } />

        <Route path="/verifyOTP" element={
          < VerifyOTP />
        } />

        <Route path="/homePage" element={
          <PrivateRoute>
            < HomePage />
          </PrivateRoute>     
        } />

        <Route path="/listings" element={
          <PrivateRoute>
            < Listings />
          </PrivateRoute> 
        } />

        <Route path="/addlisting" element={
          <PrivateRoute>
            < AddListingForm />
          </PrivateRoute>
        } />

        <Route path="/about" element={
          < About />
        } />

        <Route path="/profile" element={< UserDetails />}>
          <Route path="profileDetails" element={< ProfileDetails />} />
          <Route path="payments" element={< Payments />} />
          <Route path="myListings" element={< MyListings />} />
          <Route path="myBids" element={< MyBids />} />
          <Route path="pastOrders" element={< PastOrders />} />
        </Route>

        <Route path="/admin" element={< AdminDashboard />}>
            <Route path="dashboard" element={< Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="auctions" element={<AuctionManagement />} />
            <Route path="/admin/auctions/new-listing" element={< AdminAddListing />} />
            <Route path="banners" element={<BannerManagement />} />
            <Route path="orders" element={<Orders />} />
            <Route path="categories" element={<Categories />} />
            <Route path="support" element={<Support />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}