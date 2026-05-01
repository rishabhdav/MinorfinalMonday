import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import Login from './components/Login';
import Register from './components/Register';
import CNNRetinaNet from './components/CNNRetinaNet';
import ResNetClassifier from './components/ResNetClassifier';
import EfficientNetClassifier from './components/EfficientNetClassifier';
import PredictionHistory from './components/PredictionHistory';
import ProfilePage from './components/ProfilePage';
import Models from './components/Models';
import AdminDashboard from './components/AdminDashboard';
import AdminUsersPage from './components/AdminUsersPage';
import AdminModelUsagePage from './components/AdminModelUsagePage';
import { useAuth } from './context/AuthContext';

function HomeRedirect() {
  const { isAuthenticated, isInitialized, user } = useAuth();

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/resnet-classifier'} replace />;
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/cnn-retinanet"
          element={
            <RequireAuth>
              <CNNRetinaNet />
            </RequireAuth>
          }
        />
        <Route
          path="/resnet-classifier"
          element={
            <RequireAuth>
              <ResNetClassifier />
            </RequireAuth>
          }
        />
        <Route
          path="/efficientnet-classifier"
          element={
            <RequireAuth>
              <EfficientNetClassifier />
            </RequireAuth>
          }
        />
        <Route
          path="/predictions-history"
          element={
            <RequireAuth>
              <PredictionHistory />
            </RequireAuth>
          }
        />
        <Route
          path="/models"
          element={
            <RequireAuth>
              <Models />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAdmin>
              <AdminUsersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/history"
          element={
            <RequireAdmin>
              <PredictionHistory />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/model-usage"
          element={
            <RequireAdmin>
              <AdminModelUsagePage />
            </RequireAdmin>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        <Route path="/ensemble-vision" element={<Navigate to="/efficientnet-classifier" replace />} />
        <Route path="/transformer-dr" element={<Navigate to="/efficientnet-classifier" replace />} />
        <Route path="/hybrid-neural-net" element={<Navigate to="/efficientnet-classifier" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
