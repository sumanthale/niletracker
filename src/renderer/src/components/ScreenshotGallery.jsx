import { useState } from 'react'
import PropTypes from 'prop-types'
import { Camera, Image, ZoomIn, X } from 'lucide-react'
import dayjs from 'dayjs'

const ScreenshotGallery = ({ screenshots }) => {
  const [selectedImage, setSelectedImage] = useState(null)

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Screenshot Gallery</h3>
              <p className="text-sm text-gray-600">Captured every 10 minutes</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600 mb-1">{screenshots.length}</div>
            <div className="text-sm font-medium text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
              Screenshots
            </div>
          </div>
        </div>

        {screenshots.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {screenshots.slice(-6).map((screenshot, index) => (
                <div
                  key={index}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedImage(screenshot)}
                >
                  <img
                    src={screenshot?.image}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-28 object-cover rounded-xl border-2 border-purple-100 group-hover:border-purple-300 transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-xl flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-white bg-opacity-95 text-xs px-2 py-1 rounded-lg text-purple-700 font-medium shadow-sm">
                    #{screenshots.length - index}
                  </div>
                  <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-lg font-medium">
                    {dayjs(screenshot.timestamp).format('MMM D, HH:mm')}
                  </div>
                </div>
              ))}
            </div>

            {screenshots.length > 6 && (
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-700 font-medium">
                  +{screenshots.length - 6} more screenshots captured
                </p>
                <p className="text-xs text-purple-600 mt-1">Showing latest 6 screenshots</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Screenshots Yet</h4>
            <p className="text-gray-500 text-sm mb-4">Screenshots will be captured automatically</p>
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              <Camera className="w-4 h-4 mr-2" />
              Next capture in ~10 min
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage.image}
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
  )
}
ScreenshotGallery.propTypes = {
  screenshots: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default ScreenshotGallery
