import { useState, useEffect } from 'react';
import axios from 'axios';
import './style.css';


function App() {
  const [page, setPage] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [dashboard, setDashboard] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const register = async () => {
    try {
      await axios.post('http://localhost:5000/api/register', form);
      alert('Registered successfully');
      setPage('login');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  const login = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', form);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setPage('dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(res.data.message);
    } catch (err) {
      alert('Unauthorized or session expired');
      localStorage.removeItem('token');
      setToken(null);
      setPage('login');
    }
  };

  useEffect(() => {
    if (token && page === 'dashboard') fetchDashboard();
  }, [token, page]);

  return (
    <div style={{ padding: 20 }}>
      {page === 'register' && (
        <div>
          <h2>Register</h2>
          <input name="username" placeholder="Username" value={form.username} onChange={handleChange} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
          <button onClick={register}>Register</button>
          <p>Already have an account? <button onClick={() => setPage('login')}>Login</button></p>
        </div>
      )}

      {page === 'login' && (
        <div>
          <h2>Login</h2>
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
          <button onClick={login}>Login</button>
          <p>Don't have an account? <button onClick={() => setPage('register')}>Register</button></p>
        </div>
      )}

      {page === 'dashboard' && (
        <div>
          <h2>Dashboard</h2>
          <p>{dashboard}</p>
          <button onClick={() => { localStorage.removeItem('token'); setToken(null); setPage('login'); }}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;
