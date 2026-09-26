package com.aepttas.shield.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.aepttas.shield.CallDetectionModule;
import com.aepttas.shield.R;
import com.aepttas.shield.db.CallerEntity;
import com.aepttas.shield.helpers.ContactUtils;

import java.util.Locale;

public class PopupService extends Service {
    private static final String TAG = "PopupService";
    private static final int NOTIFICATION_ID = 999;
    private static final String CHANNEL_ID = "call_popup_channel";
    private static final String CHANNEL_NAME = "Call Identification";

    private static final long SUMMARY_AUTO_DISMISS_MS = 8000L;

    private WindowManager windowManager;
    private View popupView;
    private WindowManager.LayoutParams layoutParams;

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForegroundPopupService();

        if (intent == null) return START_NOT_STICKY;

        String action = intent.getAction();
        if ("DISMISS_POPUP".equals(action)) {
            dismissPopup();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !Settings.canDrawOverlays(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String phoneNumber  = intent.getStringExtra("phoneNumber");
        String callType     = intent.getStringExtra("callType") != null
                ? intent.getStringExtra("callType") : "INCOMING";
        String durationStr  = intent.getStringExtra("duration");
        boolean answered    = intent.getBooleanExtra("answered", false);

        if (phoneNumber == null || phoneNumber.isEmpty()) {
            stopSelf();
            return START_NOT_STICKY;
        }

        resolveIdentityAndShow(phoneNumber, callType, durationStr, answered);
        return START_STICKY;
    }

    private void resolveIdentityAndShow(String phoneNumber, String callType,
                                        @Nullable String duration, boolean answered) {

        ContactUtils.getContactNameByPhoneNumber(this, phoneNumber, localContactName -> {
            boolean isInLocal = (localContactName != null
                    && !localContactName.isEmpty()
                    && !localContactName.equals("null"));

            ContactLookupService.lookup(this, phoneNumber, new ContactLookupService.OnLookupCompleted() {
                @Override
                public void onResult(CallerEntity caller) {
                    new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                        String finalName;
                        if (isInLocal) {
                            finalName = "📇 " + localContactName;
                        } else if (caller.callerName != null && !caller.callerName.isEmpty()
                                && !caller.callerName.equals("Unknown Caller")) {
                            finalName = "📊 " + caller.callerName;
                        } else {
                            finalName = "Unknown Caller";
                        }

                        showUnifiedPopup(
                                finalName,
                                caller.phoneNumber,
                                isInLocal,
                                caller.riskScore,
                                caller.totalReports,
                                callType, duration, answered,
                                caller.carrier,
                                caller.location
                        );
                    });
                }

                @Override
                public void onError(String message) {
                    new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                        String finalName = isInLocal ? "📇 " + localContactName : "Unknown Caller";
                        showUnifiedPopup(finalName, phoneNumber,
                                isInLocal, 50, 0,
                                callType, duration, answered,
                                "Unknown", "Unknown");
                    });
                }
            });
        });
    }

    private void showUnifiedPopup(String callerName, String phoneNumber,
                                  boolean isInContacts, int riskScore, int spamReports,
                                  String callType, String durationStr, 
                                  boolean answered, String carrier, String location) {

        Log.d(TAG, "🚀 Showing Popup Over Apps: " + callerName + " (" + phoneNumber + ")");

        new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
            try {
                if (popupView != null && popupView.isAttachedToWindow()) {
                    windowManager.removeView(popupView);
                }

                LayoutInflater inflater = (LayoutInflater) getSystemService(LAYOUT_INFLATER_SERVICE);
                popupView = inflater.inflate(R.layout.floating_caller_info, null);

                ImageView iconIV     = popupView.findViewById(R.id.popupIcon);
                TextView titleTV     = popupView.findViewById(R.id.popupTitle);
                TextView nameTV      = popupView.findViewById(R.id.callerNameTV);
                TextView numberTV    = popupView.findViewById(R.id.callerNumberTV);
                TextView detailsTV   = popupView.findViewById(R.id.detailsTV);
                TextView reportsTV   = popupView.findViewById(R.id.reportsTV);
                TextView riskScoreTV = popupView.findViewById(R.id.riskScoreTV);

                ImageButton dismissBtn = popupView.findViewById(R.id.dismissBtn);
                Button btnAllow  = popupView.findViewById(R.id.allowButton);
                Button btnBlock  = popupView.findViewById(R.id.blockButton);
                Button btnReport = popupView.findViewById(R.id.reportButton);

                nameTV.setText(callerName);
                numberTV.setText(phoneNumber);
                
                String carrierStr = (carrier != null && !carrier.equals("null")) ? carrier : "Shield Network";
                String locationStr = (location != null && !location.equals("null")) ? location : "India";
                detailsTV.setText(carrierStr + " | " + locationStr);

                if (spamReports > 0) {
                    reportsTV.setVisibility(View.VISIBLE);
                    reportsTV.setText(spamReports + " community reports detected");
                } else {
                    reportsTV.setText(isInContacts ? "Verified in Contacts" : "Shield Verified Caller");
                }

                riskScoreTV.setText("RISK SCORE: " + riskScore + "%");
                
                int riskColor = riskScore >= 70 ? 0xFFEF4444 : riskScore >= 40 ? 0xFFF59E0B : 0xFF10B981;
                riskScoreTV.setTextColor(riskColor);

                if ("SUMMARY".equals(callType)) {
                    iconIV.setImageResource(android.R.drawable.ic_menu_call);
                    iconIV.setColorFilter(0xFFFFFFFF);
                    
                    String statusStr = answered ? "ANSWERED" : "MISSED";
                    if (durationStr != null && !durationStr.equals("0") && !durationStr.equals("null")) {
                        try {
                            long secs = Long.parseLong(durationStr);
                            statusStr += " | " + String.format(Locale.getDefault(), "%02d:%02d", secs / 60, secs % 60);
                        } catch (Exception ignore) {}
                    }
                    titleTV.setText("CALL SUMMARY");
                    titleTV.setTextColor(0xFF94A3B8);
                    detailsTV.setText(statusStr);
                    detailsTV.setTextColor(riskColor);

                    if (btnAllow != null) btnAllow.setVisibility(View.GONE);
                    
                    new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                        dismissPopup();
                        stopSelf();
                    }, SUMMARY_AUTO_DISMISS_MS);

                } else {
                    iconIV.setImageResource(android.R.drawable.star_big_on);
                    iconIV.setColorFilter(0xFFF59E0B);
                    
                    titleTV.setText("INCOMING CALL IDENTIFIED");
                    titleTV.setTextColor(0xFFF59E0B);
                    if (btnAllow != null) btnAllow.setVisibility(View.VISIBLE);
                }

                if (btnAllow != null) btnAllow.setOnClickListener(v -> { dismissPopup(); stopSelf(); });
                btnBlock.setOnClickListener(v -> {
                    BlockService.blockNumber(this, phoneNumber, callerName);
                    dismissPopup();
                    stopSelf();
                });
                btnReport.setOnClickListener(v -> {
                    ReportService.showReportDialogAndReport(this, phoneNumber, callerName, () -> {
                        dismissPopup();
                        stopSelf();
                    });
                });
                dismissBtn.setOnClickListener(v -> { dismissPopup(); stopSelf(); });

                int layoutType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                        ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                        : WindowManager.LayoutParams.TYPE_PHONE;

                layoutParams = new WindowManager.LayoutParams(
                        WindowManager.LayoutParams.MATCH_PARENT,   // ✅ Full width
                        WindowManager.LayoutParams.WRAP_CONTENT,
                        layoutType,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                                | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                                | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                        PixelFormat.TRANSLUCENT
                );

                layoutParams.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
                layoutParams.y = 120;
                layoutParams.x = 0;

                windowManager.addView(popupView, layoutParams);

            } catch (Exception e) {
                Log.e(TAG, "❌ Popup error: " + e.getMessage());
            }
        });
    }

    public void startForegroundPopupService() {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Shield Call Identification")
                .setContentText("Active protection enabled")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .build();
                
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_MIN);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    public void dismissPopup() {
        if (popupView != null && popupView.isAttachedToWindow()) {
            windowManager.removeView(popupView);
            popupView = null;
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        dismissPopup();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }
}
