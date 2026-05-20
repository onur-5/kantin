import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1055 }}>
        {toasts.map(toast => (
          <div key={toast.id} className={`toast show align-items-center text-white bg-${toast.type} border-0 mb-2`} role="alert" aria-live="assertive" aria-atomic="true">
            <div className="d-flex">
              <div className="toast-body">
                {toast.message}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} aria-label="Close"></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
