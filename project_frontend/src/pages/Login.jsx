import React, { useState } from 'react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
      alert('Login successful');
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard'; // adjust as needed
    } else {
      alert('Login failed: ' + (data.error || 'Unknown error'));
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={styles.title}>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    background: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: '40px',
    borderRadius: '10px',
    background: '#fff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '350px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
  },
  input: {
    padding: '12px',
    margin: '8px 0',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '16px',
  },
  button: {
    marginTop: '15px',
    padding: '12px',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default Login;
