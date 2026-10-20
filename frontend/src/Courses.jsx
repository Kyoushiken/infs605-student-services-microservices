import React, { useEffect, useState } from 'react'

const COURSE_API = 'http://localhost:5002'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [credits, setCredits] = useState('')

  const load = () =>
    fetch(`${COURSE_API}/courses`)
      .then(r => r.json())
      .then(setCourses)
      .catch(() => alert('Cannot reach the course API'))

  useEffect(() => { load() }, [])

  const addCourse = async () => {
    if (!code || !title || !credits) { alert('Fill in all fields'); return }
    const res = await fetch(`${COURSE_API}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, title, credits: Number(credits) })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(`Failed (${res.status}): ${err.error || 'server error'}`)
      return
    }
    setCode(''); setTitle(''); setCredits('')
    load()
  }

  return (
  <section>
    <h2>Course Catalogue ({courses.length})</h2>

    <div className="course-grid">
      {courses.map(c => (
        <div key={c.id} className="course-card">
          <span className="course-code">{c.code}</span>
          <div className="course-title">{c.title}</div>
          <span className="course-credits">{c.credits} credits</span>
        </div>
      ))}
    </div>

    <div className="course-admin">
      <h3 className="course-heading">Add a course</h3>
      <div className="card">
        <input placeholder="Code" value={code} onChange={e => setCode(e.target.value)} />
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <input placeholder="Credits" value={credits} onChange={e => setCredits(e.target.value)} />
        <button className="btn-primary" onClick={addCourse}>Add course</button>
      </div>
    </div>
  </section>
)
}