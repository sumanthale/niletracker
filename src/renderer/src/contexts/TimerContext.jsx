import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { FirebaseService } from '../services/firebaseService'
import { calculateProductiveHours } from '../utils/timeUtils'
import PropTypes from 'prop-types'
import axios from 'axios'

const STORAGE_KEY = 'timetracker_active_session'
const INITIAL_TIMER_STATE = {
  isWorking: false,
  currentSession: null,
  startTime: null,
  elapsedSeconds: 0,
  idleEvents: [],
  screenshots: [],
  totalIdleMinutes: 0
}

const TimerContext = createContext(undefined)

export const useTimer = () => {
  const context = useContext(TimerContext)
  if (!context) throw new Error('useTimer must be used within a TimerProvider')
  return context
}

export const TimerProvider = ({ children }) => {
  const { currentUser } = useAuth()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [timerState, setTimerState] = useState(INITIAL_TIMER_STATE)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  const tickIntervalRef = useRef(null)
  const currentIdleStartRef = useRef(null)

  const persistState = useCallback(() => {
    if (!currentUser || !timerState.isWorking) return
    localStorage.setItem(
      `${STORAGE_KEY}_${currentUser.uid}`,
      JSON.stringify({ ...timerState, lastSaved: Date.now() })
    )
  }, [timerState, currentUser])

  useEffect(() => {
    if (!currentUser) return

    const stored = localStorage.getItem(`${STORAGE_KEY}_${currentUser.uid}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const today = new Date().toDateString()
        const storedDate = new Date(parsed.currentSession?.date).toDateString()
        if (parsed.isWorking && storedDate === today) {
          setTimerState(parsed)
          startEvents()
        }
      } catch (err) {
        console.error('Failed to load persisted timer state:', err)
      }
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    FirebaseService.getUserSessions(currentUser.uid, 30)
      .then(setSessions)
      .catch((err) => console.error('Failed to load sessions:', err))
      .finally(() => setLoading(false))
  }, [currentUser])

  const reloadSessions = useCallback(() => {
    if (!currentUser) return
    setLoading(true)
    FirebaseService.getUserSessions(currentUser.uid, 30)
      .then(setSessions)
      .catch((err) => console.error('Failed to reload sessions:', err))
      .finally(() => setLoading(false))
  }, [currentUser])


  useEffect(() => persistState(), [persistState])

  useEffect(() => {
    if (timerState.isWorking) {
      tickIntervalRef.current = setInterval(
        () => setTimerState((prev) => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 })),
        1000
      )
    }
    return () => clearInterval(tickIntervalRef.current)
  }, [timerState.isWorking])

  useEffect(() => {
    if (!timerState.isWorking) return

    const onIdleStart = (start) => (currentIdleStartRef.current = new Date(start))

    const onIdleEnd = (end) => {
      if (!currentIdleStartRef.current) return
      const endTime = new Date(end)
      const duration = Math.floor((endTime - currentIdleStartRef.current) / 60000)
      if (duration > 0) {
        const event = {
          id: Date.now().toString(),
          startTime: currentIdleStartRef.current.toISOString(),
          endTime: endTime.toISOString(),
          duration
        }
        setTimerState((prev) => ({
          ...prev,
          idleEvents: [...prev.idleEvents, event],
          totalIdleMinutes: prev.totalIdleMinutes + duration
        }))
      }
      currentIdleStartRef.current = null
    }

    window.electron.onIdleStart?.(onIdleStart)
    window.electron.onIdleEnd?.(onIdleEnd)

    return () => {
      window.electron.offIdleStart?.()
      window.electron.offIdleEnd?.()
    }
  }, [timerState.isWorking])

  useEffect(() => {
    if (!timerState.isWorking) return

    const onScreenshot = async (screenshot) => {
      if (!screenshot?.image) return
      try {
        const formData = new FormData()
        formData.append('file', screenshot.image)
        formData.append('upload_preset', 'niletracker')

        const res = await axios.post(
          'https://api.cloudinary.com/v1_1/dtrvrov97/image/upload',
          formData
        )

        const imageUrl = res.data.secure_url
        const shot = {
          id: Date.now().toString(),
          timestamp: screenshot.timestamp,
          image: imageUrl
        }

        setTimerState((prev) => ({
          ...prev,
          screenshots: [shot, ...prev.screenshots]
        }))
      } catch (err) {
        console.error('Failed to upload screenshot:', err)
      }
    }

    window.electron.screenshotTaken?.(onScreenshot)
    return () => window.electron.offScreenshotTaken?.()
  }, [timerState.isWorking])

  const startEvents = () => {
    window.electron.startScreenShotCapture?.()
    window.electron.startIdleTracking?.()
  }

  const stopEvents = () => {
    window.electron.stopScreenShotCapture?.()
    window.electron.stopIdleTracking?.()
  }

  const startWork = useCallback(() => {
    if (!currentUser) return

    const now = new Date()
    const session = {
      id: Date.now().toString(),
      date: now.toISOString(),
      clockIn: now.toISOString(),
      totalMinutes: 0,
      idleMinutes: 0,
      productiveHours: 0,
      screenshots: [],
      status: 'active'
    }

    setTimerState({
      isWorking: true,
      currentSession: session,
      startTime: Date.now(),
      elapsedSeconds: 0,
      idleEvents: [],
      screenshots: [],
      totalIdleMinutes: 0
    })
    startEvents()
  }, [currentUser])

  const stopWork = useCallback(() => {
    setTimerState((prev) => {
      if (!prev.currentSession) return prev

      const totalMinutes = Math.floor(prev.elapsedSeconds / 60)
      const productiveHours = calculateProductiveHours(totalMinutes, prev.totalIdleMinutes)

      const updated = {
        ...prev.currentSession,
        clockOut: new Date().toISOString(),
        totalMinutes,
        idleMinutes: prev.totalIdleMinutes,
        productiveHours,
        screenshots: prev.screenshots
      }

      setShowSubmissionForm(true)
      return { ...prev, currentSession: updated }
    })
  }, [])

  const cancelWork = useCallback(() => {
    if (!currentUser) return
    stopEvents()
    localStorage.removeItem(`${STORAGE_KEY}_${currentUser.uid}`)
    setTimerState(INITIAL_TIMER_STATE)
    setShowSubmissionForm(false)
  }, [currentUser])

  const submitSession = useCallback(
    async (comment) => {
      if (!timerState.currentSession || !currentUser) return

      const final = {
        ...timerState.currentSession,
        status: 'submitted',
        approvalStatus: 'pending',
        lessHoursComment: comment
      }

      try {
        await FirebaseService.saveSession(currentUser.uid, final)
        stopEvents()
        localStorage.removeItem(`${STORAGE_KEY}_${currentUser.uid}`)

        setTimerState(INITIAL_TIMER_STATE)
        setSessions((prev) => [final, ...prev])
        setShowSubmissionForm(false)
      } catch (err) {
        console.error('Failed to submit session:', err)
        throw err
      }
    },
    [timerState.currentSession, currentUser]
  )

  useEffect(() => {
    if (!currentUser) {
      setTimerState(INITIAL_TIMER_STATE)
      setShowSubmissionForm(false)
    }
  }, [currentUser])

  const value = {
    ...timerState,
    startWork,
    stopWork,
    cancelWork,
    submitSession,
    showSubmissionForm,
    setShowSubmissionForm,
    sessions,
    loading,
    setSessions,
    reloadSessions
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

TimerProvider.propTypes = {
  children: PropTypes.node.isRequired
}
