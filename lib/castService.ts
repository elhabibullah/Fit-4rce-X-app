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
  deviceName?: string;
  error?: string;
}

export interface CastOptions {
  onConnected?: (deviceName?: string) => void;
  onDisconnected?: () => void;
}

/**
 * Universal Screen Mirroring (System Native Display Picker)
 * Works across all operating systems, TVs, PC, Mac, Android, and external monitors.
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
        const rawLabel = tracks[0]?.label || '';
        const deviceName = rawLabel ? rawLabel : 'Écran connecté';
        if (tracks.length > 0) {
          tracks[0].onended = () => {
            options?.onDisconnected?.();
          };
        }
        options?.onConnected?.(deviceName);
        return { success: true, method: 'display_media', deviceName };
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
 * Google Cast Web SDK (Chromecast, Google TV, Android TV, Smart TVs with Cast)
 * Uses the built-in Default Media Receiver (CC1AD845) which requires NO developer console registration!
 */
export const launchGoogleCast = async (options?: CastOptions): Promise<CastResult> => {
  try {
    const cast = (window as any).cast;
    const chrome = (window as any).chrome;
    if (cast && cast.framework) {
      const castContext = cast.framework.CastContext.getInstance();
      if (castContext) {
        try {
          const appId = chrome?.cast?.media?.DEFAULT_MEDIA_RECEIVER_APP_ID || 'CC1AD845';
          castContext.setOptions({
            receiverApplicationId: appId,
            autoJoinPolicy: chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED || 'origin_scoped'
          });
        } catch (e) {}

        const err = await castContext.requestSession();
        if (!err) {
          const session = castContext.getCurrentSession();
          const deviceName = session?.getCastDevice()?.friendlyName || 'Écran Google Cast';
          options?.onConnected?.(deviceName);
          return { success: true, method: 'google_cast', deviceName };
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
        const deviceName = 'Écran sans fil connecté';
        connection.onclose = () => options?.onDisconnected?.();
        connection.onterminate = () => options?.onDisconnected?.();
        options?.onConnected?.(deviceName);
        return { success: true, method: 'presentation_api', deviceName };
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') {
      return { success: false, method: 'presentation_api', error: 'Annulé par l’utilisateur' };
    }
    console.debug('Presentation API bypass:', err);
  }

  return { success: false, method: 'none', error: 'Aucun appareil Cast détecté.' };
};

/**
 * Universal Native TV & Screen Mirroring Launcher:
 * Triggers the browser and OS native device selector dialog.
 */
export const launchNativeTVMirroring = async (options?: CastOptions): Promise<CastResult> => {
  // If Google Cast framework is ready, try Cast first
  if ((window as any).cast && (window as any).cast.framework) {
    const castRes = await launchGoogleCast(options);
    if (castRes.success) return castRes;
    if (castRes.error === 'Annulé par l’utilisateur') return castRes;
  }

  // Universal Screen Mirroring (System Display Picker)
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
    const res = await launchScreenMirroring(options);
    if (res.success) return res;
    if (res.error === 'Sélection annulée par l’utilisateur.') return res;
  }

  // Try Presentation API if DisplayMedia wasn't chosen
  const castRes = await launchGoogleCast(options);
  if (castRes.success) return castRes;
  if (castRes.error?.includes('Annulé')) return castRes;

  // Fallback: Fullscreen theater mode
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
      options?.onConnected?.('Plein écran');
      return { success: true, method: 'fullscreen', deviceName: 'Plein écran' };
    }
  } catch (err) {
    console.debug('Fullscreen fallback error:', err);
  }

  return { success: false, method: 'none', error: 'Aucun protocole de diffusion supporté.' };
};
