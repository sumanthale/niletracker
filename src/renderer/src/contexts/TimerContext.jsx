import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { FirebaseService } from '../services/firebaseService'
import { calculateProductiveHours, generateDummyScreenshots } from '../utils/timeUtils'
import PropTypes from 'prop-types'
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

// eslint-disable-next-line react-refresh/only-export-components
export const useTimer = () => {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}

const STORAGE_KEY = 'timetracker_active_session'

export const TimerProvider = ({ children }) => {
  const { currentUser } = useAuth()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const currentIdleStartRef = useRef(null)
  const tickIntervalRef = useRef(null)

  const [timerState, setTimerState] = useState({
    isWorking: false,
    currentSession: null,
    startTime: null,
    elapsedSeconds: 0,
    idleEvents: [],
    screenshots: [],
    totalIdleMinutes: 0
  })

  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  // Load persisted state on mount
  useEffect(() => {
    if (!currentUser) return

    const loadPersistedState = () => {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${currentUser.uid}`)
        if (stored) {
          const parsedState = JSON.parse(stored)

          // Check if the stored session is from today
          const today = new Date().toDateString()
          const sessionDate = new Date(parsedState.currentSession?.date).toDateString()

          if (sessionDate === today && parsedState.isWorking) {
            // Calculate elapsed time since last save
            const now = Date.now()
            const additionalSeconds = Math.floor((now - parsedState.lastSaved) / 1000)

            setTimerState({
              ...parsedState,
              elapsedSeconds: parsedState.elapsedSeconds + additionalSeconds
            })
          }
        }
      } catch (error) {
        console.error('Error loading persisted timer state:', error)
      }
    }

    loadPersistedState()
  }, [currentUser])

  useEffect(() => {
    const loadSessions = async () => {
      if (currentUser) {
        try {
          const userSessions = await FirebaseService.getUserSessions(currentUser.uid)
          setSessions(userSessions)
        } catch (error) {
          console.error('Error loading sessions:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadSessions()
  }, [currentUser])

  // Persist state whenever it changes
  useEffect(() => {
    if (!currentUser || !timerState.isWorking) return

    const stateToSave = {
      ...timerState,
      lastSaved: Date.now()
    }

    localStorage.setItem(`${STORAGE_KEY}_${currentUser.uid}`, JSON.stringify(stateToSave))
  }, [timerState, currentUser])

  // Timer tick effect
  useEffect(() => {
    if (timerState.isWorking) {
      tickIntervalRef.current = setInterval(() => {
        setTimerState((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1
        }))
      }, 1000)
    }

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current)
    }
  }, [timerState.isWorking])

  useEffect(() => {
    if (!timerState.isWorking) return

    const handleIdleStart = (startTime) => {
      currentIdleStartRef.current = new Date(startTime)
      if (currentIdleStartRef.current) {
        console.log('Idle started at:', currentIdleStartRef.current)
      }
    }

    const handleIdleEnd = (endTime) => {
      console.log('Idle ended at:', endTime)
      if (!currentIdleStartRef.current) return

      const end = new Date(endTime)
      const duration = Math.floor((end - currentIdleStartRef.current) / 60000)

      if (duration > 0) {
        const event = {
          id: Date.now().toString(),
          startTime: currentIdleStartRef.current.toISOString(),
          endTime: end.toISOString(),
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

    window.electron.onIdleStart?.(handleIdleStart)
    window.electron.onIdleEnd?.(handleIdleEnd)

    return () => {
      // Clean up listeners on stop/cancel
      window.electron.offIdleStart?.()
      window.electron.offIdleEnd?.()
    }
  }, [timerState.isWorking])

  // Simulate screenshot capture
  useEffect(() => {
    if (!timerState.isWorking) return

    const screenshotInterval = setInterval(() => {
      const newScreenshot = generateDummyScreenshots(1)[0]
      setTimerState((prev) => ({
        ...prev,
        screenshots: [...prev.screenshots, newScreenshot]
      }))
    }, 600000) // Every 10 minutes

    return () => clearInterval(screenshotInterval)
  }, [timerState.isWorking])

  const startWork = useCallback(async () => {
    if (!currentUser) return

    setTimerState((prev) => {
      if (prev.isWorking) return prev

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

      return {
        isWorking: true,
        currentSession: session,
        startTime: Date.now(),
        elapsedSeconds: 0,
        idleEvents: [],
        screenshots: [],
        totalIdleMinutes: 0
      }
    })
    await window.electron.startIdleTracking()
  }, [currentUser])

  const stopWork = useCallback(async () => {
    await window.electron.stopIdleTracking()

    setTimerState((prev) => {
      if (!prev.currentSession) return prev

      const totalMinutes = Math.floor(prev.elapsedSeconds / 60)
      const productiveHours = calculateProductiveHours(totalMinutes, prev.totalIdleMinutes)

      const updatedSession = {
        ...prev.currentSession,
        clockOut: new Date().toISOString(),
        totalMinutes,
        idleMinutes: prev.totalIdleMinutes,
        productiveHours,
        screenshots: prev.screenshots
      }

      setShowSubmissionForm(true)

      return {
        ...prev,
        currentSession: updatedSession
      }
    })
  }, [])

  const cancelWork = useCallback(async () => {
    if (!currentUser) return

    try {
      await window.electron.stopIdleTracking()
    } catch (error) {
      console.error('Failed to stop idle tracking on cancel:', error)
    }

    localStorage.removeItem(`${STORAGE_KEY}_${currentUser.uid}`)

    setTimerState(() => INITIAL_TIMER_STATE)

    setShowSubmissionForm(false)
  }, [currentUser])

  const submitSession = useCallback(
    async (comment) => {
      if (!timerState.currentSession || !currentUser) return

      const finalSession = {
        ...timerState.currentSession,
        status: 'submitted',
        approvalStatus: 'pending',
        lessHoursComment: comment
      }

      try {
        await FirebaseService.saveSession(currentUser.uid, finalSession)

        // Clear persisted state after successful submission
        localStorage.removeItem(`${STORAGE_KEY}_${currentUser.uid}`)

        // Reset timer state
        setTimerState({
          isWorking: false,
          currentSession: null,
          startTime: null,
          elapsedSeconds: 0,
          idleEvents: [],
          screenshots: [],
          totalIdleMinutes: 0
        })

        setSessions((prev) => [finalSession, ...prev])
        setShowSubmissionForm(false)
      } catch (error) {
        console.error('Error submitting session:', error)
        throw error
      }
    },
    [timerState.currentSession, currentUser]
  )

  // Clear persisted state when user logs out
  useEffect(() => {
    if (!currentUser) {
      setTimerState(() => INITIAL_TIMER_STATE)

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
    setSessions
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

TimerProvider.propTypes = {
  children: PropTypes.node.isRequired
}
