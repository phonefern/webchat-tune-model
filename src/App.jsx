import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './pages/ProtectedRoute';
import AppContainer from './component/AppContainer';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={ <ProtectedRoute><ChatPage/></ProtectedRoute>} />
        <Route path='/app' element={ <ProtectedRoute><AppContainer /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
