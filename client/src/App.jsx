import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
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
import Overview from "./pages/User/Overview";
import ProfileDetails from "./pages/User/ProfileDetails";
import SignupForm from "./pages/Auth/SignupForm";
import UserDetails from "./pages/User/UserDetails";
import VerifyOTP from "./pages/Auth/VerifyOTP";
import ListingDetail from "./pages/User/ListingDetail";
import ListingsDetails from "./pages/Admin/ListingDetails";
import ForgotPassword from "./pages/Auth/FogotPassword";
import ChangePassword from "./pages/Auth/ChangePassword";
import Wishlist from "./pages/User/Wishlist";
import Cart from "./pages/User/Cart";
import AddListing from "./pages/User/AddListing";
import Checkout from "./pages/User/Checkout";
import OrderConfirmation from "./pages/User/OrderConfirmation";
import KYCVerification from "./pages/Admin/KYCVerification";
import { SocketProvider } from "./utils/socketContext";
import Inbox from "./pages/User/Inbox";
import ActivityLog from "./pages/Admin/ActivityLog";
import SalesReport from "./pages/Admin/SalesReport";
import Transactions from "./pages/User/Transactions";
import AllTransactions from "./pages/Admin/AllTransactions";
import MySales from "./pages/User/MySales";
import FAQPage from "./pages/FAQPage";



export default function App () {
  return(
    <SocketProvider>
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

          <Route path="/forgot-password" element={
            < ForgotPassword />
          } />

          <Route path="/change-password" element={
            <ChangePassword/>
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
              < AddListing />
            </PrivateRoute>
          } />

          <Route path='/addlisting/new' element={
            <PrivateRoute>
              < AddListingForm />
            </PrivateRoute>
          } />

          <Route path="/wishlist" element={
            <PrivateRoute>
              < Wishlist />
            </PrivateRoute>
          } />

          <Route path="/cart" element={
            <PrivateRoute>
              <Cart/>
            </PrivateRoute>
          } />

          <Route path="/checkout" element={
            <PrivateRoute>
              < Checkout />
            </PrivateRoute>
          } />

          <Route path="/orders/:orderId" element={
            <PrivateRoute>
              < OrderConfirmation />
            </PrivateRoute>
          } />

          <Route path="/faqs" element={
            < FAQPage />
          } />

          <Route path="/about" element={
            < About />
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              < UserDetails />
            </PrivateRoute>  
          }>
            <Route index element={<Navigate to="profileDetails" replace />} />
            <Route path="profileDetails" element={< ProfileDetails />} />
            <Route path="overview" element={< Overview />} />
            <Route path="transactions" element={< Transactions />} />
            <Route path="sales" element={< MySales />} />
            <Route path="myListings" element={< MyListings />} />
            <Route path="/profile/myListings/edit/:listingId" element={< AddListingForm />} />
            <Route path="myBids" element={< MyBids />} />
            <Route path="pastOrders" element={< PastOrders />} />
            <Route path="inbox" element={< Inbox />} />
          </Route>

          <Route path="/admin" element={
            <AdminRoute>
              < AdminDashboard />
            </AdminRoute>  
          }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={< Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="kyc" element={<KYCVerification />} />
              <Route path="activity-log" element={< ActivityLog />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="auctions" element={<AuctionManagement />} />
              <Route path="/admin/auctions/new-listing" element={< AdminAddListing />} />
              <Route path="/admin/auctions/edit/:listingId" element={< AdminAddListing />} />
              <Route path="/admin/auctions/listings/:listingId" element={< ListingsDetails />} />
              <Route path="banners" element={<BannerManagement />} />
              <Route path="orders" element={<Orders />} />
              <Route path="transactions" element={< AllTransactions />} />
              <Route path="report" element={< SalesReport />} />
              <Route path="categories" element={<Categories />} />
              <Route path="/admin/categories/new-SubCategory" element={< AddCategory />} />
              <Route path="/admin/categories/edit/:categoryId" element={< AddCategory />} />
              <Route path="support" element={<Support />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}