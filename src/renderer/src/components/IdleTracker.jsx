import PropTypes from 'prop-types';
import { PauseCircle, Activity, Clock } from 'lucide-react';
import { formatTime } from '../utils/timeUtils';


const IdleTracker = ({ idleEvents, totalIdleMinutes }) => {
  return (
    <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
              <PauseCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Idle Time Tracking</h3>
              <p className="text-sm text-gray-600">Automatic inactivity detection</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-amber-600 mb-1">
              {formatTime(totalIdleMinutes)}
            </div>
            <div className="text-sm font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Total Idle
            </div>
          </div>
        </div>

        {idleEvents.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">Recent Idle Periods</h4>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {idleEvents.length} events
              </span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {idleEvents.slice(-8).reverse().map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100 hover:border-amber-200 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                      <PauseCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(event.startTime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        Idle period #{idleEvents.length - index}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-700">
                      {event.duration} min
                    </div>
                    <div className="text-xs text-amber-600">
                      Duration
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Great Focus!</h4>
            <p className="text-gray-500 text-sm">No idle time detected yet</p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4 mr-2" />
              Actively working
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
IdleTracker.propTypes = {
  idleEvents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
      duration: PropTypes.number.isRequired,
    })
  ).isRequired,
  totalIdleMinutes: PropTypes.number.isRequired,
};

export default IdleTracker;