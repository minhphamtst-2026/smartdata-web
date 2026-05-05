import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminMenus } from './pages/admin/AdminMenus';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminAdmins } from './pages/admin/AdminAdmins';
import { AdminOrders } from './pages/admin/AdminOrders';
import { CategoryPage } from './pages/CategoryPage';
import { PackageDetail } from './pages/PackageDetail';
import { InfoPage } from './pages/InfoPage';
import { AuthProvider } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { setupAdminsBackground } from './setupAdmins';

function App() {
  useEffect(() => {
    setupAdminsBackground();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <NetworkProvider>
          <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/package/:id" element={<PackageDetail />} />
                <Route path="/page/:slug" element={<InfoPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminPackages />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="menus" element={<AdminMenus />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="admins" element={<AdminAdmins />} />
                </Route>
              </Routes>
            </main>
            <Footer />
          </div>
        </NetworkProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
