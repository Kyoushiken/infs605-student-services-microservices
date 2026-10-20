import React, { useEffect, useState } from 'react'

const STUDENT_API = 'http://localhost:5001'
const COURSE_API = 'http://localhost:5002'
const FEEDBACK_API = 'http://localhost:5004'

export default function FeedbacK() {
    const [students, setStudents] = useState([])
    const [courses, setCourses] = useState([])
    const [items, setItems] = useState([])
    const [studentId, setStudentId] = useState('')
    const [courseId, setCourseId] = useState('')
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [message, setMessage] = useState(null)

    const loadFeedback = () =>
        fetch(`${FEEDBACK_API}/feedback`)
            .then(r => r.json())
            .then(setItems)
            .catch(() => setMessage({ ok: false, text: 'Cannot reach the feedback API' }))

        useEffect(() => {
            fetch(`${STUDENT_API}/students`).then(r => r.json()).then(setStudents).catch(() => {})
            fetch(`${COURSE_API}/courses`).then(r => r.json()).then(setCourses).catch(() => {})
            loadFeedback()
        }, [])

        const submit = async () => {
            if (!studentId || !courseId || !comment) {
                setMessage({ ok: false, text: 'Pick a student, a course and write a comment' })
                return
            }
            try {
                const res = await fetch(`${FEEDBACK_API}/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        student_id: Number(studentId),
                        course_id: Number(courseId),
                        rating: Number(rating),
                        comment
                    })
                })
                const body = await res.json().catch(() => ({}))
                if (!res.ok) {
                    setMessage({ ok: false, text: `Failed (${res.status}): ${body.error || 'server error'}` })
                    return
                }
                setMessage({
                    ok: true,
                    text: body.notification_sent
                    ? 'Feedback saved and confirmation email sent'
                    : 'Feedback saved, but the notification service did not respond'
                })
                setComment('')
                loadFeedback()
            } catch {
                setMessage({ ok: false, text: 'Cannot reach the feedback API' })
            }
        }

        const studentName = id => students.find(s => s.id === id)?.name || `Student ${id}`
        const courseCode = id => courses.find(c => c.id === id)?.code || `Course ${id}`

        return (
            <section>
                <h2>Course Feedback ({items.length})</h2>

                <div className="card">
                    <select value={studentId} onChange={e => setStudentId(e.target.value)}>
                        <option value="">Select student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={courseId} onChange={e => setCourseId(e.target.value)}>
                        <option value="">Select course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.code}: {c.title}</option>)}
                    </select>
                    <select value={rating} onChange={e => setRating(e.target.value)}>
                        {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} / 5</option>)}
                    </select>
                    <input placeholder="Comment" value={comment} onChange={e => setComment(e.target.value)} />
                    <button className="btn-primary" onClick={submit}>Submit feedback</button>
                    {message && (
                        <div className={message.ok ? 'fb-msg fb-ok' : 'fb-msg fb-err'}>{message.text}</div>
                    )}
                </div>

            <div className="notif-list">
                {items.map(f => (
                <div key={f.id} className="notif-item">
                    <div className="notif-to">
                        {studentName(f.student_id)} on {courseCode(f.course_id)}: {f.rating}/5
                    </div>
                    <div>{f.comment}</div>
                </div>
                ))}
            </div>
        </section>
    )
}
