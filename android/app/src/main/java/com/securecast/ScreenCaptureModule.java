package com.securecast;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class ScreenCaptureModule extends ReactContextBaseJavaModule {
    private static final String TAG = "ScreenCaptureModule";
    private static final int SCREEN_CAPTURE_REQUEST_CODE = 1001;
    
    private MediaProjectionManager mediaProjectionManager;
    private MediaProjection mediaProjection;
    private Promise screenCapturePromise;
    private boolean isCapturing = false;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
            if (requestCode == SCREEN_CAPTURE_REQUEST_CODE) {
                handleScreenCaptureResult(resultCode, intent);
            }
        }
    };

    public ScreenCaptureModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            mediaProjectionManager = (MediaProjectionManager) 
                reactContext.getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        }
    }

    @NonNull
    @Override
    public String getName() {
        return "ScreenCaptureNative";
    }

    @ReactMethod
    public void isScreenCaptureSupported(Promise promise) {
        try {
            // Screen capture is supported on Android API 21+ (Lollipop)
            boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP;
            promise.resolve(supported);
        } catch (Exception e) {
            Log.e(TAG, "Error checking screen capture support", e);
            promise.reject("SUPPORT_CHECK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestScreenCapturePermission(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
                promise.reject("NOT_SUPPORTED", "Screen capture not supported on this Android version");
                return;
            }

            Activity currentActivity = getCurrentActivity();
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available");
                return;
            }

            screenCapturePromise = promise;
            
            // Create screen capture intent
            Intent captureIntent = mediaProjectionManager.createScreenCaptureIntent();
            currentActivity.startActivityForResult(captureIntent, SCREEN_CAPTURE_REQUEST_CODE);
            
        } catch (Exception e) {
            Log.e(TAG, "Error requesting screen capture permission", e);
            promise.reject("PERMISSION_REQUEST_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startScreenCapture(Promise promise) {
        try {
            if (isCapturing) {
                promise.reject("ALREADY_CAPTURING", "Screen capture already in progress");
                return;
            }

            if (mediaProjection == null) {
                promise.reject("NO_PERMISSION", "Screen capture permission not granted");
                return;
            }

            // Start screen capture
            isCapturing = true;
            
            // Generate a unique stream ID
            String streamId = "screen_capture_" + System.currentTimeMillis();
            
            // In a real implementation, you would:
            // 1. Create a VirtualDisplay using MediaProjection
            // 2. Set up surface for capturing
            // 3. Start recording/streaming
            // 4. Return the stream ID that can be used with WebRTC
            
            Log.d(TAG, "Screen capture started with stream ID: " + streamId);
            
            // Send event to React Native
            sendEvent("screenCaptureStarted", streamId);
            
            promise.resolve(streamId);
            
        } catch (Exception e) {
            Log.e(TAG, "Error starting screen capture", e);
            isCapturing = false;
            promise.reject("START_CAPTURE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopScreenCapture(Promise promise) {
        try {
            if (!isCapturing) {
                promise.resolve(null);
                return;
            }

            // Stop screen capture
            isCapturing = false;
            
            if (mediaProjection != null) {
                mediaProjection.stop();
                mediaProjection = null;
            }
            
            Log.d(TAG, "Screen capture stopped");
            
            // Send event to React Native
            sendEvent("screenCaptureStopped", null);
            
            promise.resolve(null);
            
        } catch (Exception e) {
            Log.e(TAG, "Error stopping screen capture", e);
            promise.reject("STOP_CAPTURE_ERROR", e.getMessage());
        }
    }

    private void handleScreenCaptureResult(int resultCode, Intent data) {
        if (screenCapturePromise == null) {
            return;
        }

        try {
            if (resultCode == Activity.RESULT_OK) {
                // Permission granted
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    mediaProjection = mediaProjectionManager.getMediaProjection(resultCode, data);
                    Log.d(TAG, "Screen capture permission granted");
                    screenCapturePromise.resolve(true);
                } else {
                    screenCapturePromise.reject("NOT_SUPPORTED", "Android version not supported");
                }
            } else {
                // Permission denied
                Log.d(TAG, "Screen capture permission denied");
                screenCapturePromise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling screen capture result", e);
            screenCapturePromise.reject("RESULT_HANDLING_ERROR", e.getMessage());
        } finally {
            screenCapturePromise = null;
        }
    }

    private void sendEvent(String eventName, @Nullable Object params) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}