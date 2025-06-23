import  { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Eye,
  Camera,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc,
  Activity,
  User,
  FileText,
  TrendingUp,
  X,
} from "lucide-react";
import { formatDate, formatTime } from "../utils/timeUtils";
import dayjs from "dayjs";
import PropTypes from "prop-types";


const PastSessions = ({ sessions }) => {
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    hoursRange: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Enhanced sessions with dummy approval data
  const enhancedSessions = useMemo(() => {
    return sessions.map((session) => ({
      ...session,
      approvalStatus:
        session.approvalStatus ||
        (["pending", "approved", "rejected"][Math.floor(Math.random() * 3)]),
      approvedBy:
        session.approvedBy ||
        (Math.random() > 0.5 ? "Sarah Johnson" : "Mike Chen"),
      approvedAt:
        session.approvedAt ||
        new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      approvalComment:
        session.approvalComment ||
        (Math.random() > 0.7 ? "Good work today!" : undefined),
    }));
  }, [sessions]);

  // Filtered and sorted sessions
  const filteredAndSortedSessions = useMemo(() => {
    const filtered = enhancedSessions.filter((session) => {
      // Status filter
      if (
        filters.status !== "all" &&
        session.approvalStatus !== filters.status
      ) {
        return false;
      }

      // Hours filter
      if (filters.hoursRange === "full" && session.productiveHours < 8) {
        return false;
      }
      if (filters.hoursRange === "partial" && session.productiveHours >= 8) {
        return false;
      }

      // Date range filter
      const sessionDate = new Date(session.date);
      const now = new Date();
      if (filters.dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (sessionDate < weekAgo) return false;
      } else if (filters.dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (sessionDate < monthAgo) return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          formatDate(sessionDate).toLowerCase().includes(searchLower) ||
          session.lessHoursComment?.toLowerCase().includes(searchLower) ||
          session.approvalComment?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Sort sessions
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "hours":
          comparison = a.productiveHours - b.productiveHours;
          break;
        case "status": {
          const statusOrder = { approved: 3, pending: 2, rejected: 1 };
          comparison =
            statusOrder[a.approvalStatus] - statusOrder[b.approvalStatus];
          break;
        }
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [enhancedSessions, filters, searchTerm, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return {
          badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
          icon: <CheckCircle className="w-3 h-3" />,
          text: "Approved",
          dot: "bg-emerald-500",
        };
      case "rejected":
        return {
          badge: "bg-red-100 text-red-700 border-red-200",
          icon: <XCircle className="w-3 h-3" />,
          text: "Rejected",
          dot: "bg-red-500",
        };
      default:
        return {
          badge: "bg-amber-100 text-amber-700 border-amber-200",
          icon: <AlertCircle className="w-3 h-3" />,
          text: "Pending",
          dot: "bg-amber-500",
        };
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilters({
      status: "all",
      dateRange: "all",
      hoursRange: "all",
    });
  };

  const hasActiveFilters =
    searchTerm ||
    filters.status !== "all" ||
    filters.dateRange !== "all" ||
    filters.hoursRange !== "all";
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="space-y-6 pb-20">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work History</h1>
            <p className="text-sm text-gray-500">
              {filteredAndSortedSessions.length} session
              {filteredAndSortedSessions.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            showFilters || hasActiveFilters
              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Enhanced Search and Filters */}
      <div
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 p-4`}
      >
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions, comments, or dates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-100 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      status: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      dateRange: e.target.value ,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Hours
                </label>
                <select
                  value={filters.hoursRange}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      hoursRange: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Hours</option>
                  <option value="full">8+ Hours</option>
                  <option value="partial">Under 8 Hours</option>
                </select>
              </div>
            </div>

            {/* Sort Options */}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Sort by:
            </span>
            <div className="flex gap-1">
              {[
                { field: "date", label: "Date" },
                { field: "hours", label: "Hours" },
                { field: "status", label: "Status" },
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sortField === field
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {label}
                  {sortField === field &&
                    (sortOrder === "asc" ? (
                      <SortAsc className="w-3 h-3" />
                    ) : (
                      <SortDesc className="w-3 h-3" />
                    ))}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      {filteredAndSortedSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredAndSortedSessions.map((session) => {
            const statusConfig = getStatusConfig(session.approvalStatus);
            const isExpanded = expandedSession === session.id;

            return (
              <div
                key={session.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
              >
                <div
                  className="p-5"
                  onClick={() =>
                    setExpandedSession(isExpanded ? null : session.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Date and Status */}
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <div className="text-lg font-semibold text-gray-900">
                          {dayjs(session.date).format("MMM DD")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dayjs(session.date).format("ddd")}
                        </div>
                      </div>

                      <div className="h-8 w-px bg-gray-200"></div>

                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusConfig.badge}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${statusConfig.dot}`}
                        ></div>
                        {statusConfig.text}
                      </div>
                    </div>

                    {/* Right: Hours and Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div
                          className={`text-xl font-bold ${
                            session.productiveHours >= 8
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {session.productiveHours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-500">productive</div>
                      </div>

                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats Row */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>
                        {dayjs(session.clockIn).format("HH:mm")} -{" "}
                        {session.clockOut
                          ? dayjs(session.clockOut).format("HH:mm")
                          : "Now"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Camera className="w-4 h-4 text-purple-500" />
                      <span>{session.screenshots.length}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Activity className="w-4 h-4 text-amber-500" />
                      <span>{formatTime(session.idleMinutes)}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-5 space-y-5">
                      {/* Detailed Stats Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                          <div className="text-lg font-bold text-gray-900">
                            {formatTime(session.totalMinutes)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total Time
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                          <Activity className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                          <div className="text-lg font-bold text-gray-900">
                            {formatTime(session.idleMinutes)}
                          </div>
                          <div className="text-xs text-gray-500">Idle Time</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                          <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                          <div className="text-lg font-bold text-gray-900">
                            {(
                              (session.productiveHours /
                                (session.totalMinutes / 60)) *
                              100
                            ).toFixed(0)}
                            %
                          </div>
                          <div className="text-xs text-gray-500">
                            Efficiency
                          </div>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {(session.lessHoursComment ||
                        session.approvalComment) && (
                        <div className="space-y-3">
                          {session.lessHoursComment && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-amber-800 mb-1">
                                    Employee Note
                                  </div>
                                  <p className="text-sm text-amber-700">
                                    {session.lessHoursComment}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {session.approvalComment && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-blue-800 mb-1">
                                    Manager Feedback
                                  </div>
                                  <p className="text-sm text-blue-700 mb-2">
                                    {session.approvalComment}
                                  </p>
                                  <div className="text-xs text-blue-600">
                                    — {session.approvedBy} •{" "}
                                    {dayjs(session.approvedAt).format(
                                      "MMM DD, YYYY"
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Screenshots Preview */}
                      {session.screenshots.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <Camera className="w-4 h-4 text-purple-500" />
                              Screenshots ({session.screenshots.length})
                            </h4>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {session.screenshots
                              .slice(0, 4)
                              .map((screenshot, index) => (
                                <div
                                  key={index}
                                  className="relative group"
                                  onClick={() => setSelectedImage(screenshot)}
                                >
                                  <img
                                    src={screenshot}
                                    alt={`Screenshot ${index + 1}`}
                                    className="w-full h-16 object-cover rounded-lg border border-gray-200 group-hover:border-purple-300 transition-colors"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                    <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ))}
                          </div>
                          {session.screenshots.length > 4 && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              +{session.screenshots.length - 4} more screenshots
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No sessions found
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {hasActiveFilters
              ? "No sessions match your current filters. Try adjusting your search criteria."
              : "Your submitted work sessions will appear here once you complete and submit them."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Screenshot preview"
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all duration-200"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

PastSessions.propTypes = {
  sessions: PropTypes.array.isRequired,
};

export default PastSessions;
