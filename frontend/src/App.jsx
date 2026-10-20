import React, { useEffect, useMemo, useState } from 'react'
import './index.css' // Import the new CSS file
import Courses from './Courses'
import Notifications from './Notifications'
import Feedback from './Feedback'

const API = 'http://localhost:5001'
const COURSE_API = 'http://localhost:5002'

export default function App() {
  const [students, setStudents] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const [attDate, setAttDate] = useState('')
  const [attStatus, setAttStatus] = useState('')
  const [tab, setTab] = useState('students')

  const fetchStudents = () => {
    fetch(`${API}/students`)
      .then(r => r.json())
      .then(setStudents)
  }

  useEffect(() => { fetchStudents() }, [])

  const addStudent = async () => {
    if (!name || !email) return
    const res = await fetch(`${API}/students`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email })
    })
    if (res.ok) {
      setName(''); setEmail('')
      fetchStudents()
    }
  }

  const deleteStudent = async (id) => {
    await fetch(`${API}/students/${id}`, { method: 'DELETE' })
    fetchStudents()
  }

  const addAttendance = async (id) => {
    if (!attDate) return
    await fetch(`${API}/students/${id}/attendance`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ date: attDate, status: attStatus })
    })
    setAttDate('')
    fetchStudents()
  }

  const filtered = useMemo(() => students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  ), [students, search])

  const tabs = [
    ['students', 'Students'],
    ['courses', 'Courses'],
    ['feedback', 'Feedback'],
    ['notifications', 'Notifications'],
  ]

  return (
    <div className="container">
      <h1>Admin Portal</h1>
      <p>Manage students, search, and record attendance.</p>

      <nav className="tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            classname={tab === key ? 'tab tab-active' : 'tab'}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* === Add Student + Search Section === */}
      {tab === 'students' && (
        <>
          <section className="grid-2">
          <div className="card">
            <h2>Add Student</h2>
            <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
            <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <button className="btn-primary" onClick={addStudent}>Add</button>
          </div>

          <div className="card">
            <h2>Search</h2>
            <input placeholder="Search by name or email" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </section>

        {/* === Student List Section === */}
        <h2>Students ({filtered.length})</h2>
        <div className="grid-gap">
          {filtered.map(s => (
            <div key={s.id} className="grid-row">
              <div>
                <div style={{ fontWeight: 'bold', color: '#212121' }}>{s.name}</div>
                <div style={{ color: '#616161' }}>{s.email}</div>

                <details>
                  <summary>Attendance ({(s.attendance || []).length})</summary>
                  <ul>
                    {(s.attendance || []).map((a,i) => (
                      <li key={i}>{a.date} – {a.status}</li>
                    ))}
                  </ul>
                </details>
              </div>

              <div className="justify-end">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="date" value={attDate} onChange={e=>setAttDate(e.target.value)} />
                  <select value={attStatus} onChange={e=>setAttStatus(e.target.value)}>
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Late</option>
                    <option>Excused</option>
                  </select>
                  <button className="btn-secondary" onClick={()=>addAttendance(s.id)}>Record</button>
                </div>
                <button className="btn-danger" onClick={()=>deleteStudent(s.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {tab === 'courses' && <Courses />}
      {tab === 'feedback' && <Feedback />}
      {tab === 'notifications' && <Notifications />}
      
      

      
    </div>
  )
}