
import { Routes, Route, Outlet, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home            from './pages/Home'
import Listings        from './pages/Listings'
import PropertyDetails from './pages/PropertyDetails'
import Login           from './pages/Login'
import Register        from './pages/Register'
import Payment         from './pages/Payment'
import Reviews         from './pages/Reviews'
import Dashboard       from './pages/Dashboard'
import Admin           from './pages/Admin'
import NewListing      from './pages/NewListing'

function LayoutWrapper() {
  return <Layout><Outlet /></Layout>
}

export default function App() {
  return (
    <Routes>
      {/* Public auth pages */}
      <Route path="/login"    element={<Login />}    />
      <Route path="/register" element={<Register />} />

      {/* Admin — own layout, Admin role only */}
      <Route path="/admin/*" element={
        <ProtectedRoute roles={['Admin']}><Admin /></ProtectedRoute>
      } />

      {/* Dashboard  own layout, any logged-in user */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      {/* New listing  own layout, landlords only */}
      <Route path="/listings/new" element={
        <ProtectedRoute roles={['Landlord','HotelManager']}><NewListing /></ProtectedRoute>
      } />

      {/* Standard pages with Navbar + Footer */}
      <Route element={<LayoutWrapper />}>
        <Route path="/"             element={<Home />}            />
        <Route path="/listings"     element={<Listings />}        />
        <Route path="/listings/:id" element={<PropertyDetails />} />
        <Route path="/reviews"      element={<Reviews />}         />
        <Route path="/listings/:id/pay" element={
          <ProtectedRoute roles={['Renter','Student','Visitor']}>
            <Payment />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}