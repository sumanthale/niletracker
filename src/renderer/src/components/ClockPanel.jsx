// ClockPanel.jsx
import { useState  } from 'react'

export default function ClockPanel() {
  const [isTracking, setIsTracking] = useState(false)
  const [clockInTime, setClockInTime] = useState(null)
  const [clockOutTime, setClockOutTime] = useState(null)
  const [workingTime, setWorkingTime] = useState(0)
  const [idleTime, setIdleTime] = useState(0)

  const handleClockIn = () => {
    setClockInTime(Date.now())
    setIsTracking(true)
    window.electron.startIdleTracking() // Trigger main process
  }

  const handleClockOut = () => {
    setClockOutTime(Date.now())
    setIsTracking(false)
    window.electron.stopIdleTracking() // Trigger main process
    window.electron.getIdleAndWorkTime().then(({ idle, work }) => {
      setIdleTime(idle)
      setWorkingTime(work)
    })
  }
console.log(workingTime, idleTime);

  return (
    <div className="p-4 rounded-xl shadow-lg bg-white space-y-4">
      {!isTracking ? (
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleClockIn}>
          Clock In
        </button>
      ) : (
        <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleClockOut}>
          Clock Out
        </button>
      )}
      {clockOutTime && (
        <div className="space-y-1">
          <p>
            <strong>Working Time:</strong> {Math.floor(workingTime / 1000)} seconds
          </p>
          <p>
            <strong>Idle Time:</strong> {Math.floor(idleTime / 1000)} seconds
          </p>
        </div>
      )}
    </div>
  )
}
