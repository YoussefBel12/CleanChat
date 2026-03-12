



import Login from "./components/Login";
import Register from "./components/Register";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function App() {



    return (
        <Router>
            <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
               |
                <Link to="/login"> Login</Link> |
                <Link to="/register"> Register</Link>
            </nav>

            <Routes>
                
                <Route path="/" element={<Login />} />

              
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </Router>
    );
}

export default App;
