import { useState, useEffect } from "react";
import {
  Play,
  Square,
  BarChart3,
  Activity,
  Camera,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useTimer } from "../contexts/TimerContext";
import { useAuth } from "../contexts/AuthContext";
import { FirebaseService } from "../services/firebaseService";
import {
  calculateProductiveHours,
  formatDate,
  formatDecimalHoursToHHMM,
  formatTime,
} from "../utils/timeUtils";
import Timer from "./Timer";
import IdleTracker from "./IdleTracker";
import ScreenshotGallery from "./ScreenshotGallery";
import SubmissionForm from "./SubmissionForm";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const {
    isWorking,
    currentSession,
    elapsedSeconds,
    idleEvents,
    screenshots,
    totalIdleMinutes,
    startWork,
    stopWork,
    cancelWork,
    submitSession,
    showSubmissionForm,
    setShowSubmissionForm,
    setSessions,
  } = useTimer();

  const [todaySession, setTodaySession] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [checkingTodaySession, setCheckingTodaySession] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Check if user has already submitted today's session
  useEffect(() => {
    const checkTodaySession = async () => {
      if (!currentUser) return;

      try {
        const session = await FirebaseService.getTodaySession(currentUser.uid);
        setTodaySession(session);
      } catch (error) {
        console.error("Error checking today session:", error);
      } finally {
        setCheckingTodaySession(false);
      }
    };

    checkTodaySession();
  }, [currentUser]);

  const handleSubmit = async (comment) => {
    try {
      await submitSession(comment);
      // Refresh today's session after submission
      const session = await FirebaseService.getTodaySession(currentUser?.uid);
      setTodaySession(session);
    } catch (error) {
      console.error("Error submitting session:", error);
    }
  };

  const handleCancelSubmission = () => {
    setShowSubmissionForm(false);
  };

  const handleDeleteTodaySession = async () => {
    if (!todaySession || !currentUser) return;

    setIsDeleting(true);
    try {
      await FirebaseService.deleteSession(todaySession.id);
      setTodaySession(null);
      // Optionally, deltete the session from local state
      setSessions((prev) => prev.filter((s) => s.id !== todaySession.id));
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelWork = () => {
    setShowCancelConfirm(false);
    cancelWork();
  };

  const currentProductiveHours = calculateProductiveHours(
    Math.floor(elapsedSeconds / 60),
    totalIdleMinutes
  );

  const formattedProductiveTime = formatDecimalHoursToHHMM(
    currentProductiveHours
  );

  // Show loading while checking today's session
  if (checkingTodaySession) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking today&#39;s productivity...</p>
        </div>
      </div>
    );
  }

  // Show today's session summary if already submitted
  if (todaySession) {
    return (
      <>
        <div className="space-y-8 pb-24">
          {/* Session Success Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl shadow-xl border border-green-200 overflow-hidden">
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-semibold text-green-900 mb-2">
                Productivity Logged
              </h2>
              <p className="text-green-700 mb-8">
                You&#39;sve successfully submitted your session for today.
              </p>

              {/* Summary Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-sm">
                <div className="grid grid-cols-2 gap-6 mb-4 text-sm text-gray-600">
                  <div className="text-center">
                    <p className="mb-1">Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(new Date(todaySession.date))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="mb-1">Status</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        todaySession.approvalStatus === "approved"
                          ? "bg-green-100 text-green-800"
                          : todaySession.approvalStatus === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {todaySession.approvalStatus === "approved" &&
                        "✓ Approved"}
                      {todaySession.approvalStatus === "rejected" &&
                        "✗ Rejected"}
                      {todaySession.approvalStatus === "pending" &&
                        "⏳ Pending"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <SummaryItem
                    label="Total Time"
                    value={formatTime(todaySession.totalMinutes)}
                    color="text-blue-600"
                  />
                  <SummaryItem
                    label="Productive"
                    value={`${todaySession.productiveHours.toFixed(1)}h`}
                    color="text-green-600"
                  />
                  <SummaryItem
                    label="Screenshots"
                    value={todaySession.screenshots.length}
                    color="text-purple-600"
                  />
                </div>
              </div>

              {/* Clock-In/Out Times */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-sm text-sm text-gray-600 flex justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Clock In:</span>
                  <span className="font-medium">
                    {new Date(todaySession.clockIn).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>Clock Out:</span>
                  <span className="font-medium">
                    {todaySession.clockOut
                      ? new Date(todaySession.clockOut).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Comment Section */}
              {todaySession.lessHoursComment && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left shadow-sm">
                  <div className="text-sm font-semibold text-amber-800 mb-1">
                    Your Note
                  </div>
                  <p className="text-sm text-amber-700">
                    {todaySession.lessHoursComment}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete & Create New
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-3">
                Delete this session to submit a new one for today.
              </p>
            </div>
          </div>

          {/* Quick Stats Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Today&#39;ss Summary
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={todaySession.productiveHours >= 8 ? "✅" : "⚠️"}
                title={
                  todaySession.productiveHours >= 8 ? "Full Day" : "Partial Day"
                }
                value={`${todaySession.productiveHours.toFixed(1)}h`}
                note="of 8h goal"
                color="blue"
              />
              <StatCard
                icon="📸"
                title="Screenshots"
                value={todaySession.screenshots.length}
                note="captured"
                color="purple"
              />
            </div>
          </div>
        </div>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Confirm Deletion
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete today&#39;ss session? This action
                cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteTodaySession();
                    setShowConfirm(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  {isDeleting ? "Deleting..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-20">
        {/* Enhanced Timer Section */}
        <div className="relative">
          <Timer seconds={elapsedSeconds} isActive={isWorking} />
          <div className="flex justify-center -mt-24 z-10 absolute left-0 right-0">
            {!isWorking ? (
              <button
                onClick={startWork}
                className="group relative overflow-hidden flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">Start Working</div>
                    <div className="text-xs opacity-90">
                      Begin your productive session
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex sm:flex-row  gap-3 mt-3">
                {/* Cancel & Restart Button */}
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-48 flex-1 flex items-center justify-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-red-400 text-white text-sm font-medium shadow-sm hover:shadow-md transition hover:scale-[1.01] active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <div className="text-left leading-tight">
                    <div className="font-semibold">
                     Restart    
                       <br />
                       <span className="text-xs font-normal">Cancel Session</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={stopWork}
                  className=" w-full flex-1 flex items-center justify-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-medium shadow-sm hover:shadow-md transition hover:scale-[1.01] active:scale-95"
                >
                  <Square className="w-4 h-4" />
                  <div className="text-left leading-tight">
                    <div className="font-semibold">End Session</div>
                    <div className="text-xs font-normal opacity-90">
                      Submit time
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
          {/* Floating Status Indicator */}
          {isWorking && (
            <div className="absolute -top-2 -right-2">
              <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Stats Dashboard */}
        {isWorking && (
          <div className="space-y-3 text-sm">
            {/* Primary Stats */}
            <div className="grid grid-cols-1 gap-3">
              {/* Productive Hours */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-900">
                      {/* {currentProductiveHours.toFixed(1)}h */}
                      {formattedProductiveTime} hrs
                    </div>
                    <div className="text-[11px] text-blue-700 tracking-wide uppercase">
                      Productive
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-blue-600">
                  <span>Target: 8h</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      currentProductiveHours >= 8
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {currentProductiveHours >= 8 ? "On Track" : "In Progress"}
                  </span>
                </div>
              </div>

              {/* Efficiency */}
              {/* <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-emerald-900">
                      {efficiencyPercentage}%
                    </div>
                    <div className="text-[11px] text-emerald-700 tracking-wide uppercase">
                      Efficiency
                    </div>
                  </div>
                </div>
                <div className="w-full bg-emerald-200/50 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(efficiencyPercentage, 100)}%` }}
                  ></div>
                </div>
              </div> */}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <MiniStat
                icon={<Camera className="w-4 h-4 text-purple-600" />}
                value={screenshots.length}
                label="Screenshots"
                bg="purple-100"
              />
              <MiniStat
                icon={<Activity className="w-4 h-4 text-amber-600" />}
                value={idleEvents.length}
                label="Idle Events"
                bg="amber-100"
              />
              <MiniStat
                icon={<Zap className="w-4 h-4 text-indigo-600" />}
                value={Math.floor(elapsedSeconds / 60)}
                label="Total Minutes"
                bg="indigo-100"
              />
            </div>

            {/* Progress Bar */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2 text-[13px] font-medium text-gray-700">
                <span>Daily Progress</span>
                <span className="text-xs text-gray-500">
                  {Math.min(
                    Math.round((currentProductiveHours / 8) * 100),
                    100
                  )}
                  % Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full mb-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (currentProductiveHours / 8) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>0h</span>
                <span>4h</span>
                <span className="font-semibold text-gray-600">8h Goal</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Activity Sections */}
        {isWorking && (
          <div className="space-y-6">
            <IdleTracker
              idleEvents={idleEvents}
              totalIdleMinutes={totalIdleMinutes}
            />
            <ScreenshotGallery screenshots={screenshots} />
          </div>
        )}

        {/* Welcome State for Non-Working */}
        {!isWorking && !showSubmissionForm && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to be productive?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start your work session to begin tracking time, capturing
              screenshots, and monitoring your productivity.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-xs font-medium text-gray-600">
                  Track Time
                </div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Camera className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-xs font-medium text-gray-600">
                  Screenshots
                </div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-xs font-medium text-gray-600">
                  Analytics
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submission Form */}
      {showSubmissionForm && currentSession && (
        <SubmissionForm
          session={currentSession}
          onSubmit={handleSubmit}
          onCancel={handleCancelSubmission}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Cancel Current Session?
                </h3>
                <p className="text-sm text-gray-600">
                  This will discard all progress
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-2">You will lose:</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    • {formatTime(Math.floor(elapsedSeconds / 60))} hrs of tracked
                    time
                  </li>
                  <li>• {screenshots.length} captured screenshots</li>
                  <li>• {idleEvents.length} idle events</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Keep Working
              </button>
              <button
                onClick={handleCancelWork}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;

import PropTypes from "prop-types";

const MiniStat = ({
  icon,
  value,
  label,
  bg,
}) => (
  <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
    <div
      className={`w-8 h-8 rounded-md flex items-center justify-center mx-auto mb-1 bg-${bg}`}
    >
      {icon}
    </div>
    <div className="text-lg font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-600">{label}</div>
  </div>
);

MiniStat.propTypes = {
  icon: PropTypes.node.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  bg: PropTypes.string.isRequired,
};

const SummaryItem = ({
  label,
  value,
  color,
}) => (
  <div className="text-center">
    <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    <div className="text-xs text-gray-600">{label}</div>
  </div>
);

SummaryItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
};

const StatCard = ({
  icon,
  title,
  value,
  note,
  color,
}) => {
  const colorMap = {
    blue: ["from-blue-50", "to-indigo-100", "text-blue-900", "text-blue-600"],
    purple: [
      "from-purple-50",
      "to-pink-100",
      "text-purple-900",
      "text-purple-600",
    ],
  }[color] || ["from-gray-50", "to-gray-100", "text-gray-900", "text-gray-600"];

  return (
    <div
      className={`bg-gradient-to-br ${colorMap[0]} ${colorMap[1]} rounded-xl p-4`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-bold ${colorMap[2]}`}>{icon}</div>
          <div className={`text-sm ${colorMap[3]}`}>{title}</div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-semibold ${colorMap[2]}`}>{value}</div>
          <div className={`text-xs ${colorMap[3]}`}>{note}</div>
        </div>
      </div>
    </div>
  );
};


StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  note: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};