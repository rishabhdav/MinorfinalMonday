import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import RequireAuth from './components/RequireAuth';
import Login from './components/Login';
import Register from './components/Register';
import CNNRetinaNet from './components/CNNRetinaNet';
import ResNetClassifier from './components/ResNetClassifier';
import EfficientNetClassifier from './components/EfficientNetClassifier';
import PredictionHistory from './components/PredictionHistory';
import { useAuth } from './context/AuthContext';

function HomeRedirect() {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return null;
  }

  return <Navigate to={isAuthenticated ? '/resnet-classifier' : '/login'} replace />;
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

        <Route path="/ensemble-vision" element={<Navigate to="/efficientnet-classifier" replace />} />
        <Route path="/transformer-dr" element={<Navigate to="/efficientnet-classifier" replace />} />
        <Route path="/hybrid-neural-net" element={<Navigate to="/efficientnet-classifier" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
