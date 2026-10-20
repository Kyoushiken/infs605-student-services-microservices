import React, { useEffect, useState } from 'react'

const NOTIFY_API = 'http://localhost:5003'

export default function Notifications() {
  const [items, setItems] = useState([])

  const load = () =>
    fetch(`${NOTIFY_API}/notifications`)
      .then(r => r.json())
      .then(setItems)
      .catch(() => alert('Cannot reach the notification API'))

  useEffect(() => { load() }, [])

  return (
    <section>
      <h2>Notifications ({items.length})</h2>
      <button className="btn-secondary" onClick={load}>Refresh</button>
      {items.length === 0 && <p>No emails sent yet.</p>}
      <div className="notif-list">
        {[...items].reverse().map(n => (
          <div key={n.id} className="notif-item">
            <div className="notif-to">To: {n.to}</div>
            <div>{n.message}</div>
          </div>
        ))}
      </div>
    </section>
  )
}