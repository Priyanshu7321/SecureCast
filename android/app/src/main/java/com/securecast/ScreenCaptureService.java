package com.securecast;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.WindowManager;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Foreground service for screen capture using MediaProjection
 * Handles the lifecycle of screen recording and provides WebRTC integration
 */
public class ScreenCaptureService extends Service {
    private static final String TAG = "ScreenCaptureService";
    private static final String CHANNEL_ID = "screen_capture_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    // Screen capture components
    private MediaProjection mediaProjection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;
    private ScreenCaptureCallback callback;
    
    // Display metrics
    private int screenWidth;
    private int screenHeight;
    private int screenDensity;
    
    // Service state
    private boolean isCapturing = false;
    
    // Binder for local service binding
    private final IBinder binder = new ScreenCaptureBinder();
    
    /**
     * Interface for screen capture callbacks
     */
    public interface ScreenCaptureCallback {
        void onScreenCaptureStarted();
        void onScreenCaptureStopped();
        void onScreenCaptureError(String error);
        void onFrameAvailable(ImageReader reader);
    }
    
    /**
     * Binder class for local service binding
     */
    public class ScreenCaptureBinder extends Binder {
        public ScreenCaptureService getService() {
            return ScreenCaptureService.this;
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "ScreenCaptureService created");
        
        // Initialize display metrics
        initializeDisplayMetrics();
        
        // Create notification channel
        createNotificationChannel();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "ScreenCaptureService started");
        
        // Start foreground service with notification
        startForeground(NOTIFICATION_ID, createNotification());
        
        return START_NOT_STICKY; // Don't restart if killed
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        Log.d(TAG, "ScreenCaptureService bound");
        return binder;
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "ScreenCaptureService destroyed");
        stopScreenCapture();
        super.onDestroy();
    }
    
    /**
     * Initialize display metrics for screen capture
     */
    private void initializeDisplayMetrics() {
        WindowManager windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        Display display = windowManager.getDefaultDisplay();
        DisplayMetrics metrics = new DisplayMetrics();
        display.getRealMetrics(metrics);
        
        screenWidth = metrics.widthPixels;
        screenHeight = metrics.heightPixels;
        screenDensity = metrics.densityDpi;
        
        Log.d(TAG, String.format("Screen metrics: %dx%d, density: %d", 
            screenWidth, screenHeight, screenDensity));
    }
    
    /**
     * Create notification channel for Android O+
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Screen Capture Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Screen sharing in progress");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    /**
     * Create foreground service notification
     */
    private Notification createNotification() {
        // Intent to open the app when notification is tapped
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Stop action intent
        Intent stopIntent = new Intent(this, ScreenCaptureService.class);
        stopIntent.setAction("STOP_SCREEN_CAPTURE");
        PendingIntent stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Screen Sharing Active")
            .setContentText("Your screen is being shared")
            .setSmallIcon(R.drawable.ic_notification) // You'll need to add this icon
            .setContentIntent(pendingIntent)
            .addAction(R.drawable.ic_stop, "Stop", stopPendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }
    
    /**
     * Start screen capture with MediaProjection
     */
    public boolean startScreenCapture(MediaProjection projection, ScreenCaptureCallback callback) {
        if (isCapturing) {
            Log.w(TAG, "Screen capture already in progress");
            return false;
        }
        
        try {
            this.mediaProjection = projection;
            this.callback = callback;
            
            // Create ImageReader for frame capture
            imageReader = ImageReader.newInstance(
                screenWidth, screenHeight, PixelFormat.RGBA_8888, 2
            );
            
            // Set up frame available listener
            imageReader.setOnImageAvailableListener(reader -> {
                if (callback != null) {
                    callback.onFrameAvailable(reader);
                }
            }, null);
            
            // Create VirtualDisplay
            virtualDisplay = mediaProjection.createVirtualDisplay(
                "ScreenCapture",
                screenWidth, screenHeight, screenDensity,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                imageReader.getSurface(),
                null, null
            );
            
            isCapturing = true;
            
            // Update notification
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, createNotification());
            }
            
            Log.d(TAG, "Screen capture started successfully");
            
            if (callback != null) {
                callback.onScreenCaptureStarted();
            }
            
            return true;
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to start screen capture", e);
            
            if (callback != null) {
                callback.onScreenCaptureError("Failed to start screen capture: " + e.getMessage());
            }
            
            stopScreenCapture();
            return false;
        }
    }
    
    /**
     * Stop screen capture and clean up resources
     */
    public void stopScreenCapture() {
        Log.d(TAG, "Stopping screen capture");
        
        isCapturing = false;
        
        try {
            // Clean up VirtualDisplay
            if (virtualDisplay != null) {
                virtualDisplay.release();
                virtualDisplay = null;
            }
            
            // Clean up ImageReader
            if (imageReader != null) {
                imageReader.close();
                imageReader = null;
            }
            
            // Clean up MediaProjection
            if (mediaProjection != null) {
                mediaProjection.stop();
                mediaProjection = null;
            }
            
            Log.d(TAG, "Screen capture stopped and resources cleaned up");
            
            if (callback != null) {
                callback.onScreenCaptureStopped();
                callback = null;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error stopping screen capture", e);
        }
        
        // Stop foreground service
        stopForeground(true);
        stopSelf();
    }
    
    /**
     * Check if screen capture is currently active
     */
    public boolean isCapturing() {
        return isCapturing;
    }
    
    /**
     * Get current screen dimensions
     */
    public int getScreenWidth() {
        return screenWidth;
    }
    
    public int getScreenHeight() {
        return screenHeight;
    }
    
    public int getScreenDensity() {
        return screenDensity;
    }
}