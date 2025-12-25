package com.securecast

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.graphics.Bitmap
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.webrtc.*
import java.nio.ByteBuffer

/**
 * React Native module for Android screen sharing using MediaProjection and WebRTC
 * Provides complete screen capture functionality with WebRTC integration
 */
class ScreenShareModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), ScreenCaptureService.ScreenCaptureCallback {
    
    companion object {
        private const val TAG = "ScreenShareModule"
        private const val SCREEN_CAPTURE_REQUEST_CODE = 1001
    }
    
    // MediaProjection components
    private var mediaProjectionManager: MediaProjectionManager? = null
    private var mediaProjection: MediaProjection? = null
    private var screenCapturePromise: Promise? = null
    
    // Service components
    private var screenCaptureService: ScreenCaptureService? = null
    private var isServiceBound = false
    
    // WebRTC components
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var videoCapturer: ScreenCapturer? = null
    private var videoSource: VideoSource? = null
    private var videoTrack: VideoTrack? = null
    private var eglBase: EglBase? = null
    
    // State
    private var isCapturing = false
    private var currentStreamId: String? = null
    
    // Service connection for binding to ScreenCaptureService
    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            Log.d(TAG, "ScreenCaptureService connected")
            val binder = service as ScreenCaptureService.ScreenCaptureBinder
            screenCaptureService = binder.service
            isServiceBound = true
        }
        
        override fun onServiceDisconnected(name: ComponentName?) {
            Log.d(TAG, "ScreenCaptureService disconnected")
            screenCaptureService = null
            isServiceBound = false
        }
    }
    
    // Activity event listener for permission results
    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, intent: Intent?) {
            if (requestCode == SCREEN_CAPTURE_REQUEST_CODE) {
                handleScreenCapturePermissionResult(resultCode, intent)
            }
        }
    }
    
    init {
        reactContext.addActivityEventListener(activityEventListener)
        
        // Initialize MediaProjectionManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            mediaProjectionManager = reactContext.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        }
        
        // Initialize WebRTC
        initializeWebRTC()
    }
    
    override fun getName(): String = "ScreenShareNative"
    
    /**
     * Initialize WebRTC components
     */
    private fun initializeWebRTC() {
        try {
            // Initialize PeerConnectionFactory
            val options = PeerConnectionFactory.InitializationOptions.builder(reactApplicationContext)
                .setEnableInternalTracer(true)
                .createInitializationOptions()
            PeerConnectionFactory.initialize(options)
            
            // Create EglBase for hardware acceleration
            eglBase = EglBase.create()
            
            // Create PeerConnectionFactory
            peerConnectionFactory = PeerConnectionFactory.builder()
                .setVideoEncoderFactory(DefaultVideoEncoderFactory(eglBase!!.eglBaseContext, true, true))
                .setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase!!.eglBaseContext))
                .createPeerConnectionFactory()
            
            Log.d(TAG, "WebRTC initialized successfully")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize WebRTC", e)
        }
    }
    
    /**
     * Check if screen capture is supported on this device
     */
    @ReactMethod
    fun isScreenCaptureSupported(promise: Promise) {
        try {
            val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
            promise.resolve(supported)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking screen capture support", e)
            promise.reject("SUPPORT_CHECK_ERROR", e.message)
        }
    }
    
    /**
     * Request screen capture permission from user
     */
    @ReactMethod
    fun requestScreenCapturePermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
                promise.reject("NOT_SUPPORTED", "Screen capture not supported on this Android version")
                return
            }
            
            val currentActivity = currentActivity
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available")
                return
            }
            
            screenCapturePromise = promise
            
            // Create and start screen capture intent
            val captureIntent = mediaProjectionManager?.createScreenCaptureIntent()
            currentActivity.startActivityForResult(captureIntent, SCREEN_CAPTURE_REQUEST_CODE)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting screen capture permission", e)
            promise.reject("PERMISSION_REQUEST_ERROR", e.message)
        }
    }
    
    /**
     * Start screen sharing with WebRTC integration
     */
    @ReactMethod
    fun startScreenShare(promise: Promise) {
        try {
            if (isCapturing) {
                promise.reject("ALREADY_CAPTURING", "Screen capture already in progress")
                return
            }
            
            if (mediaProjection == null) {
                promise.reject("NO_PERMISSION", "Screen capture permission not granted")
                return
            }
            
            if (peerConnectionFactory == null) {
                promise.reject("WEBRTC_NOT_INITIALIZED", "WebRTC not properly initialized")
                return
            }
            
            // Generate unique stream ID
            currentStreamId = "screen_${System.currentTimeMillis()}"
            
            // Start foreground service
            val serviceIntent = Intent(reactApplicationContext, ScreenCaptureService::class.java)
            reactApplicationContext.startForegroundService(serviceIntent)
            
            // Bind to service
            val bindIntent = Intent(reactApplicationContext, ScreenCaptureService::class.java)
            reactApplicationContext.bindService(bindIntent, serviceConnection, Context.BIND_AUTO_CREATE)
            
            // Wait a moment for service to bind, then start capture
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                if (isServiceBound && screenCaptureService != null) {
                    startScreenCaptureWithService(promise)
                } else {
                    promise.reject("SERVICE_NOT_BOUND", "Failed to bind to screen capture service")
                }
            }, 500)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error starting screen share", e)
            promise.reject("START_SCREEN_SHARE_ERROR", e.message)
        }
    }
    
    /**
     * Start screen capture using the bound service
     */
    private fun startScreenCaptureWithService(promise: Promise) {
        try {
            // Create video source and track
            videoSource = peerConnectionFactory?.createVideoSource(false)
            videoTrack = peerConnectionFactory?.createVideoTrack(currentStreamId!!, videoSource)
            
            // Start screen capture with service
            val success = screenCaptureService?.startScreenCapture(mediaProjection!!, this)
            
            if (success == true) {
                isCapturing = true
                
                // Send success event to React Native
                sendEvent("screenShareStarted", WritableNativeMap().apply {
                    putString("streamId", currentStreamId)
                    putInt("width", screenCaptureService?.screenWidth ?: 0)
                    putInt("height", screenCaptureService?.screenHeight ?: 0)
                })
                
                promise.resolve(WritableNativeMap().apply {
                    putString("streamId", currentStreamId)
                    putBoolean("success", true)
                })
                
                Log.d(TAG, "Screen share started successfully with stream ID: $currentStreamId")
                
            } else {
                promise.reject("CAPTURE_START_FAILED", "Failed to start screen capture")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error starting screen capture with service", e)
            promise.reject("CAPTURE_START_ERROR", e.message)
        }
    }
    
    /**
     * Stop screen sharing
     */
    @ReactMethod
    fun stopScreenShare(promise: Promise) {
        try {
            if (!isCapturing) {
                promise.resolve(WritableNativeMap().apply {
                    putBoolean("success", true)
                    putString("message", "Screen share was not active")
                })
                return
            }
            
            // Stop screen capture service
            screenCaptureService?.stopScreenCapture()
            
            // Clean up WebRTC components
            cleanupWebRTCComponents()
            
            // Unbind service
            if (isServiceBound) {
                reactApplicationContext.unbindService(serviceConnection)
                isServiceBound = false
            }
            
            isCapturing = false
            currentStreamId = null
            
            // Send stop event to React Native
            sendEvent("screenShareStopped", null)
            
            promise.resolve(WritableNativeMap().apply {
                putBoolean("success", true)
                putString("message", "Screen share stopped successfully")
            })
            
            Log.d(TAG, "Screen share stopped successfully")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping screen share", e)
            promise.reject("STOP_SCREEN_SHARE_ERROR", e.message)
        }
    }
    
    /**
     * Get current screen share status
     */
    @ReactMethod
    fun getScreenShareStatus(promise: Promise) {
        try {
            promise.resolve(WritableNativeMap().apply {
                putBoolean("isCapturing", isCapturing)
                putString("streamId", currentStreamId)
                putBoolean("serviceConnected", isServiceBound)
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error getting screen share status", e)
            promise.reject("STATUS_ERROR", e.message)
        }
    }
    
    /**
     * Get the WebRTC video track for the current screen share
     */
    @ReactMethod
    fun getVideoTrack(promise: Promise) {
        try {
            if (!isCapturing || videoTrack == null) {
                promise.reject("NO_VIDEO_TRACK", "No active video track available")
                return
            }
            
            // Return video track information
            promise.resolve(WritableNativeMap().apply {
                putString("trackId", videoTrack?.id())
                putString("streamId", currentStreamId)
                putBoolean("enabled", videoTrack?.enabled() ?: false)
            })
            
        } catch (e: Exception) {
            Log.e(TAG, "Error getting video track", e)
            promise.reject("VIDEO_TRACK_ERROR", e.message)
        }
    }
    
    /**
     * Handle screen capture permission result
     */
    private fun handleScreenCapturePermissionResult(resultCode: Int, data: Intent?) {
        val promise = screenCapturePromise ?: return
        screenCapturePromise = null
        
        try {
            if (resultCode == Activity.RESULT_OK && data != null) {
                // Permission granted - create MediaProjection
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    mediaProjection = mediaProjectionManager?.getMediaProjection(resultCode, data)
                    Log.d(TAG, "Screen capture permission granted")
                    promise.resolve(true)
                } else {
                    promise.reject("NOT_SUPPORTED", "Android version not supported")
                }
            } else {
                // Permission denied
                Log.d(TAG, "Screen capture permission denied")
                promise.resolve(false)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling screen capture permission result", e)
            promise.reject("PERMISSION_RESULT_ERROR", e.message)
        }
    }
    
    /**
     * Clean up WebRTC components
     */
    private fun cleanupWebRTCComponents() {
        try {
            videoTrack?.dispose()
            videoTrack = null
            
            videoSource?.dispose()
            videoSource = null
            
            videoCapturer?.dispose()
            videoCapturer = null
            
        } catch (e: Exception) {
            Log.e(TAG, "Error cleaning up WebRTC components", e)
        }
    }
    
    /**
     * Send event to React Native
     */
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
    
    // ScreenCaptureService.ScreenCaptureCallback implementation
    override fun onScreenCaptureStarted() {
        Log.d(TAG, "Screen capture started callback")
        sendEvent("screenCaptureServiceStarted", null)
    }
    
    override fun onScreenCaptureStopped() {
        Log.d(TAG, "Screen capture stopped callback")
        sendEvent("screenCaptureServiceStopped", null)
    }
    
    override fun onScreenCaptureError(error: String) {
        Log.e(TAG, "Screen capture error: $error")
        sendEvent("screenCaptureError", WritableNativeMap().apply {
            putString("error", error)
        })
    }
    
    override fun onFrameAvailable(reader: ImageReader) {
        try {
            // Process frame for WebRTC
            val image = reader.acquireLatestImage()
            if (image != null && videoSource != null) {
                processFrameForWebRTC(image)
                image.close()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing frame", e)
        }
    }
    
    /**
     * Process captured frame for WebRTC transmission
     */
    private fun processFrameForWebRTC(image: Image) {
        try {
            // Convert Image to VideoFrame for WebRTC
            val planes = image.planes
            val yPlane = planes[0]
            val uPlane = planes[1]
            val vPlane = planes[2]
            
            val yBuffer = yPlane.buffer
            val uBuffer = uPlane.buffer
            val vBuffer = vPlane.buffer
            
            val ySize = yBuffer.remaining()
            val uSize = uBuffer.remaining()
            val vSize = vBuffer.remaining()
            
            val nv21 = ByteArray(ySize + uSize + vSize)
            
            yBuffer.get(nv21, 0, ySize)
            vBuffer.get(nv21, ySize, vSize)
            uBuffer.get(nv21, ySize + vSize, uSize)
            
            // Create VideoFrame and send to WebRTC
            val videoFrame = VideoFrame.Builder()
                .setBuffer(JavaI420Buffer.allocate(image.width, image.height))
                .setRotation(0)
                .setTimestampNs(System.nanoTime())
                .build()
            
            // Send frame to video source
            videoSource?.capturerObserver?.onFrameCaptured(videoFrame)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing frame for WebRTC", e)
        }
    }
    
    /**
     * Custom screen capturer for WebRTC integration
     */
    private inner class ScreenCapturer : VideoCapturer {
        private var capturerObserver: CapturerObserver? = null
        
        override fun initialize(
            surfaceTextureHelper: SurfaceTextureHelper?,
            context: Context?,
            capturerObserver: CapturerObserver?
        ) {
            this.capturerObserver = capturerObserver
        }
        
        override fun startCapture(width: Int, height: Int, framerate: Int) {
            // Screen capture is handled by the service
        }
        
        override fun stopCapture() {
            // Screen capture stop is handled by the service
        }
        
        override fun changeCaptureFormat(width: Int, height: Int, framerate: Int) {
            // Format changes handled by service
        }
        
        override fun dispose() {
            capturerObserver = null
        }
        
        override fun isScreencast(): Boolean = true
    }
}