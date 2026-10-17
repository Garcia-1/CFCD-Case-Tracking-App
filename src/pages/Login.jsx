import React, { useState } from 'react'

export default function Login() {
  const [role, setRole] = useState('user')
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(role, id, password)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(rgba(0,0,0,.4), rgba(0,0,0,.4)), url('/bg.jpg') center/cover`
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        padding: '30px',
        borderRadius: '5px',
        width: '320px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Court Login</h2>
        
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
          <button 
            onClick={() => setRole('user')}
            style={{
              flex: 1,
              padding: '8px',
              background: role === 'user' ? '#000' : '#fff',
              color: role === 'user' ? '#fff' : '#000',
              border: '1px solid #999',
              cursor: 'pointer'
            }}
          >
            User
          </button>
          <button 
            onClick={() => setRole('admin')}
            style={{
              flex: 1,
              padding: '8px',
              background: role === 'admin' ? '#000' : '#fff',
              color: role === 'admin' ? '#fff' : '#000',
              border: '1px solid #999',
              cursor: 'pointer'
            }}
          >
            Admin
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
            {role === 'admin' ? 'Admin ID' : 'User ID'}
          </label>
          <input 
            type="text"
            value={id}
            onChange={e => setId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
            Password
          </label>
          <input 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button 
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '10px',
            background: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          Login
        </button>
      </div>
    </div>
  )
}
