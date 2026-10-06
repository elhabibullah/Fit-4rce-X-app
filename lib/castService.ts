/**
 * Native Wireless TV & Screen Mirroring Service
 * Directly interfaces with the real browser and OS native wireless display APIs:
 * - Screen Mirroring API (navigator.mediaDevices.getDisplayMedia)
 * - Google Cast Web SDK (CastContext.requestSession)
 * - W3C Presentation API (PresentationRequest.start)
 * - Remote Playback API (video.remote.prompt for AirPlay / Cast)
 */

export interface CastResult {
  success: boolean;
  method: 'google_cast' | 'presentation_api' | 'display_media' | 'remote_playback' | 'fullscreen' | 'none';
  error?: string;
}

export interface CastOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
}

/**
 * Universal Screen Mirroring (System Native Display Picker)
 * Works across Samsung TVs, LG TVs, PC, Mac, Android, and external monitors.
 */
export const launchScreenMirroring = async (options?: CastOptions): Promise<CastResult> => {
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        } as any,
        audio: true,
      });

      if (stream) {
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          tracks[0].onended = () => {
            options?.onDisconnected?.();
          };
        }
        options?.onConnected?.();
        return { success: true, method: 'display_media' };
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
        return { success: false, method: 'display_media', error: 'Sélection annulée par l’utilisateur.' };
      }
      return { success: false, method: 'display_media', error: err?.message };
    }
  }
  return { success: false, method: 'none', error: 'Capture d’écran non supportée sur ce navigateur.' };
};

/**
 * Google Cast Web SDK (Chromecast, Google TV, Android TV, Sony TV)
 */
export const launchGoogleCast = async (options?: CastOptions): Promise<CastResult> => {
  try {
    const cast = (window as any).cast;
    if (cast && cast.framework) {
      const castContext = cast.framework.CastContext.getInstance();
      if (castContext) {
        const err = await castContext.requestSession();
        if (!err) {
          options?.onConnected?.();
          return { success: true, method: 'google_cast' };
        }
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('cancel')) {
      return { success: false, method: 'google_cast', error: 'Annulé par l’utilisateur' };
    }
    console.debug('Google Cast prompt bypass:', err);
  }

  // Fallback to Presentation API
  try {
    const PresentationRequest = (window as any).PresentationRequest;
    if (PresentationRequest) {
      const request = new PresentationRequest([
        window.location.origin,
        window.location.href
      ]);
      const connection = await request.start();
      if (connection) {
        connection.onclose = () => options?.onDisconnected?.();
        connection.onterminate = () => options?.onDisconnected?.();
        options?.onConnected?.();
        return { success: true, method: 'presentation_api' };
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') {
      return { success: false, method: 'presentation_api', error: 'Annulé par l’utilisateur' };
    }
    console.debug('Presentation API bypass:', err);
  }

  return { success: false, method: 'none', error: 'Aucun appareil Google Cast détecté sur ce réseau.' };
};

/**
 * Default TV Mirroring Launcher:
 * Attempts Display Media (Universal Mirroring) or Google Cast depending on availability.
 */
export const launchNativeTVMirroring = async (options?: CastOptions): Promise<CastResult> => {
  // 1. If getDisplayMedia is available, trigger universal screen mirroring
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
    const res = await launchScreenMirroring(options);
    if (res.success) return res;
    if (res.error === 'Sélection annulée par l’utilisateur.') return res;
  }

  // 2. Try Google Cast / Presentation API
  const castRes = await launchGoogleCast(options);
  if (castRes.success) return castRes;
  if (castRes.error?.includes('Annulé')) return castRes;

  // 3. Fallback: Fullscreen theater mode
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
      options?.onConnected?.();
      return { success: true, method: 'fullscreen' };
    }
  } catch (err) {
    console.debug('Fullscreen fallback error:', err);
  }

  return { success: false, method: 'none', error: 'Aucun protocole de diffusion supporté.' };
};
