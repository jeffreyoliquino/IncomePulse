import { useState, useRef, useCallback } from 'react';

export function useCamera() {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef(null);

  const capturePhoto = useCallback(async () => {
    return null;
  }, []);

  const resetCapture = useCallback(() => {
    setCapturedUri(null);
  }, []);

  return {
    cameraRef,
    permission: { granted: false, canAskAgain: false, expires: 'never' as const, status: 'undetermined' as const },
    requestPermission: async () => ({ granted: false, canAskAgain: false, expires: 'never' as const, status: 'undetermined' as const }),
    capturedUri,
    capturePhoto,
    resetCapture,
  };
}
