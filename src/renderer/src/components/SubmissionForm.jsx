import { useState } from 'react'
import PropTypes from 'prop-types'
import { CheckCircle, AlertTriangle, Send, Clock, Activity } from 'lucide-react'
import { formatDateTime, formatDecimalHoursToHHMM, formatTime } from '../utils/timeUtils'

const SubmissionForm = ({ session, onSubmit, onCancel }) => {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const needsComment = session.productiveHours < 8

  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (needsComment && !comment.trim()) {
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await onSubmit(comment.trim() || '')
      if (result === true) {
        // Success: you can add a success message or close the modal if needed
        return
      } else {
        setError('Submission failed. Please try again.')
      }
    } catch (err) {
      console.log(err)
      setError('Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Submit Work Summary</h2>
            <p className="text-sm text-gray-500">
              Review your work session before final submission.
            </p>
          </div>

          {/* Session Summary */}
          <div className="space-y-6 mb-8">
            {/* Date and Status */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                Today&#39;s Session
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Clock In</div>
                  <div className="font-semibold text-gray-900">
                    {formatDateTime(new Date(session.clockIn))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Clock Out</div>
                  <div className="font-semibold text-gray-900">
                    {session.clockOut ? formatDateTime(new Date(session.clockOut)) : 'Now'}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-900">
                  {formatTime(session.totalMinutes)} hrs
                </div>
                <div className="text-xs text-blue-700">Total Time</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                <Activity className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-amber-900">
                  {formatTime(session.idleMinutes)} hrs
                </div>
                <div className="text-xs text-amber-700">Idle Time</div>
              </div>
            </div>

            {/* Productive Hours Highlight */}
            <div
              className={`rounded-2xl p-6 border-2 ${
                session.productiveHours >= 8
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-2">Productive Hours</div>
                <div
                  className={`text-4xl font-bold mb-2 ${
                    session.productiveHours >= 8 ? 'text-green-600' : 'text-amber-600'
                  }`}
                >
                  {formatDecimalHoursToHHMM(session.productiveHours)}
                </div>
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    session.productiveHours >= 8
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {session.productiveHours >= 8 ? '✓ Full Day' : '⚠ Partial Day'}
                </div>
              </div>
            </div>

            {/* Comment Section for < 8 hours */}
            {needsComment && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Explanation Required</p>
                    <p className="text-xs text-amber-700">
                      Less than 8 hours — please provide a reason
                    </p>
                  </div>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g., Health issue, urgent errand..."
                  className="w-full rounded-xl border-2 border-amber-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none transition"
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-2 text-xs text-amber-600">
                  <span>{comment.length}/300</span>
                  {comment.trim().length < 10 && (
                    <span className="text-amber-700 font-medium">More details required</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}

          {error && <div className="mb-4 text-center text-red-600 font-semibold">{error}</div>}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-semibold transition"
            >
              Continue Working
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (needsComment && comment.trim().length < 10)}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold flex justify-center items-center hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition shadow"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
SubmissionForm.propTypes = {
  session: PropTypes.shape({
    clockIn: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
      .isRequired,
    clockOut: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    totalMinutes: PropTypes.number.isRequired,
    idleMinutes: PropTypes.number.isRequired,
    screenshots: PropTypes.array.isRequired,
    productiveHours: PropTypes.number.isRequired
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default SubmissionForm
