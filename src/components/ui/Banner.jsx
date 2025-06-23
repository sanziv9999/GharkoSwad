import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const Banner = ({ type = 'info', message, onClose, autoClose = true, duration = 4000 }) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className={`mx-4 mt-4 p-4 rounded-lg border shadow-lg ${getStyles()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={getIconColor()}>
              {getIcon()}
            </div>
            <p className="font-medium">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banner;