import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FormBuilder from "./pages/FormBuilder";
import WaitingApproval from "./pages/WaitingApproval";
import PublicCatalog from "./pages/PublicCatalog";

import PublicFormView from "./pages/PublicFormView";
import FormResponses from "./pages/FormResponses";
import Team from "./pages/Team";
import Migrate from "./pages/Migrate";
import AdminGuard from "./components/AdminGuard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicCatalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/waiting-approval" element={<WaitingApproval />} />
          <Route 
            path="/dashboard/*" 
            element={
              <AdminGuard>
                <Dashboard />
              </AdminGuard>
            } 
          />
          <Route 
            path="/builder" 
            element={
              <AdminGuard>
                <FormBuilder />
              </AdminGuard>
            } 
          />
          <Route 
            path="/responses/:formId" 
            element={
              <AdminGuard>
                <FormResponses />
              </AdminGuard>
            } 
          />
          <Route 
            path="/team" 
            element={
              <AdminGuard>
                <Team />
              </AdminGuard>
            } 
          />
          <Route 
            path="/migrate" 
            element={
              <AdminGuard>
                <Migrate />
              </AdminGuard>
            } 
          />
          {/* Public Form Route */}
          <Route path="/:orgSlug/:formSlug" element={<PublicFormView />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
