import { useState, useEffect } from 'react';
import axios from 'axios';
import './style.css';

function App() {
  const [page, setPage] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [dashboardMessage, setDashboardMessage] = useState('');
  const [profile, setProfile] = useState({
    employee_id: '',
    name: '',
    department_id: '',
    designation_id: '',
    date_joined: ''
  });
  const [fetchedProfile, setFetchedProfile] = useState(null);

  const departments = [
    { id: 1, name: 'Human Resources' },
    { id: 2, name: 'Engineering' },
    { id: 3, name: 'Marketing' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'Finance' }
  ];

  const designations = [
    { id: 1, name: 'Intern' },
    { id: 2, name: 'Software Engineer' },
    { id: 3, name: 'Project Manager' },
    { id: 4, name: 'HR Officer' },
    { id: 5, name: 'Sales Executive' }
  ];

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleProfileChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });

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
      setUsername(res.data.username || form.username);
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
      setDashboardMessage(res.data.message);
    } catch (err) {
      alert('Unauthorized or session expired');
      localStorage.removeItem('token');
      setToken(null);
      setPage('login');
    }
  };

  const saveProfile = async () => {
    try {
      await axios.post('http://localhost:5000/api/employee-profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile saved!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving profile');
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/view-profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFetchedProfile(res.data);
      setPage('view-profile');
    } catch (err) {
      alert('Error fetching profile');
    }
  };

  useEffect(() => {
    if (token && page === 'dashboard') fetchDashboard();
  }, [token, page]);

  return (
    <div className="container">
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
          <p>{dashboardMessage}</p>

          <h3>Complete Your Profile</h3>
          <input name="employee_id" placeholder="Employee ID" value={profile.employee_id} onChange={handleProfileChange} />
          <input name="name" placeholder="Full Name" value={profile.name} onChange={handleProfileChange} />
          <select name="department_id" value={profile.department_id} onChange={handleProfileChange}>
            <option value="">Select Department</option>
            {departments.map(dep => <option key={dep.id} value={dep.id}>{dep.name}</option>)}
          </select>
          <select name="designation_id" value={profile.designation_id} onChange={handleProfileChange}>
            <option value="">Select Designation</option>
            {designations.map(des => <option key={des.id} value={des.id}>{des.name}</option>)}
          </select>
          <input type="date" name="date_joined" value={profile.date_joined} onChange={handleProfileChange} />
          <button onClick={saveProfile}>Save Profile</button>

          <br /><br />
          <button onClick={fetchProfile}>View My Profile</button>
          <br /><br />
          <button onClick={() => { localStorage.removeItem('token'); setToken(null); setPage('login'); }}>Logout</button>
        </div>
      )}

      {page === 'view-profile' && fetchedProfile && (
        <div>
          <h2>Your Profile</h2>
          <p><strong>Employee ID:</strong> {fetchedProfile.employee_id}</p>
          <p><strong>Name:</strong> {fetchedProfile.name}</p>
          <p><strong>Department:</strong> {fetchedProfile.department_name}</p>
          <p><strong>Designation:</strong> {fetchedProfile.designation_name}</p>
          <p><strong>Date Joined:</strong> {fetchedProfile.date_joined}</p>
          <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
        </div>
      )}
    </div>
  );
}

export default App;


