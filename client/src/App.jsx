import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import About from "./pages/About";
import AddListingForm from "./pages/User/AddListingForm";
import AddCategory from "./pages/Admin/AddCategory";
import AdminAddListing from "./pages/Admin/AdminAddListing";
import AuctionManagement from "./pages/Admin/AuctionManagement";
import BannerManagement from "./pages/Admin/BannerManagement";
import Categories from "./pages/Admin/Categories";
import Dashboard from "./pages/Admin/Dashboard";
import Notifications from "./pages/Admin/Notifications";
import Orders from "./pages/Admin/Orders";
import Support from "./pages/Admin/Support";
import Users from "./pages/Admin/Users";
import AdminDashboard from "./pages/Admin/AdminDasboard";
import HomePage from "./pages/User/HomePage";
import LandingPage from "./pages/LandingPage";
import Listings from "./pages/User/Listings";
import LoginForm from "./pages/Auth/LoginForm";
import MyBids from "./pages/User/MyBids";
import MyListings from "./pages/User/MyListings";
import PastOrders from "./pages/User/PastOrders";
import Payments from "./pages/User/Payments";
import ProfileDetails from "./pages/User/ProfileDetails";
import SignupForm from "./pages/Auth/SignupForm";
import UserDetails from "./pages/User/UserDetails";
import VerifyOTP from "./pages/Auth/VerifyOTP";
import ListingDetail from "./pages/User/ListingDetail";
import ListingsDetails from "./pages/Admin/ListingDetails";


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
          < Listings /> 
        } />
        <Route path="/listing/:id" element={
          <ListingDetail />} 
        />

        <Route path="/addlisting" element={
          <PrivateRoute>
            < AddListingForm />
          </PrivateRoute>
        } />

        <Route path="/about" element={
          < About />
        } />

        <Route path="/profile" element={< UserDetails />}>
          <Route index element={<Navigate to="profileDetails" replace />} />
          <Route path="profileDetails" element={< ProfileDetails />} />
          <Route path="payments" element={< Payments />} />
          <Route path="myListings" element={< MyListings />} />
          <Route path="myBids" element={< MyBids />} />
          <Route path="pastOrders" element={< PastOrders />} />
        </Route>

        <Route path="/admin" element={< AdminDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={< Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="auctions" element={<AuctionManagement />} />
            <Route path="/admin/auctions/new-listing" element={< AdminAddListing />} />
            <Route path="/admin/auctions/edit/:listingId" element={< AdminAddListing />} />
            <Route path="/admin/auctions/listings/:listingId" element={< ListingsDetails />} />
            <Route path="banners" element={<BannerManagement />} />
            <Route path="orders" element={<Orders />} />
            <Route path="categories" element={<Categories />} />
            <Route path="/admin/categories/new-SubCategory" element={< AddCategory />} />
            <Route path="support" element={<Support />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}