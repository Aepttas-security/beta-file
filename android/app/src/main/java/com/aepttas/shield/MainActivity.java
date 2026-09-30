package com.aepttas.shield;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.aepttas.shield.workers.WorkScheduler;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {

    private static final int PERMISSION_REQUEST_CODE = 100;
    private static final int OVERLAY_PERMISSION_REQUEST_CODE = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.AppTheme);
        super.onCreate(null);

        getWindow().getDecorView().post(() -> {
            try {
                requestAllPermissions();
                checkOverlayPermission();
                checkCallScreeningRole();
            } catch (Exception e) {
                Log.e("MainActivity", "Error during initialization/permissions: " + e.getMessage());
            }
        });

        // One-time contact upload logic
        try {
            WorkScheduler.scheduleOneTimeContactUpload(this);
        } catch (Exception e) {
            Log.e("MainActivity", "WorkScheduler contact upload error: " + e.getMessage());
        }
    }

    private void checkCallScreeningRole() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            android.app.role.RoleManager roleManager =
                    (android.app.role.RoleManager) getSystemService(
                            android.content.Context.ROLE_SERVICE);
            if (roleManager != null
                    && roleManager.isRoleAvailable(
                            android.app.role.RoleManager.ROLE_CALL_SCREENING)
                    && !roleManager.isRoleHeld(
                            android.app.role.RoleManager.ROLE_CALL_SCREENING)) {
                Intent intent = roleManager.createRequestRoleIntent(
                        android.app.role.RoleManager.ROLE_CALL_SCREENING);
                startActivityForResult(intent, 123);
            }
        }
    }

    private void requestAllPermissions() {
        java.util.ArrayList<String> permissionsList = new java.util.ArrayList<>();
        permissionsList.add(Manifest.permission.READ_PHONE_STATE);
        permissionsList.add(Manifest.permission.READ_CALL_LOG);
        permissionsList.add(Manifest.permission.READ_CONTACTS);
        permissionsList.add(Manifest.permission.CALL_PHONE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsList.add(Manifest.permission.POST_NOTIFICATIONS);
        }

        java.util.ArrayList<String> toRequest = new java.util.ArrayList<>();
        for (String p : permissionsList) {
            if (ContextCompat.checkSelfPermission(this, p)
                    != PackageManager.PERMISSION_GRANTED) {
                toRequest.add(p);
            }
        }

        if (!toRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                    this, toRequest.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }

    private void checkOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !Settings.canDrawOverlays(this)) {
            requestOverlayPermission();
        }
    }

    private void requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName())
            );
            startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == PERMISSION_REQUEST_CODE) {
            for (int i = 0; i < permissions.length; i++) {
                if (permissions[i].equals(Manifest.permission.READ_CONTACTS)
                        && grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                    try {
                        WorkScheduler.forceContactUpload(this);
                    } catch (Exception e) {
                        Log.e("MainActivity", "Failed forceContactUpload: " + e.getMessage());
                    }
                    break;
                }
            }
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        try {
            super.onActivityResult(requestCode, resultCode, data);
        } catch (Throwable t) {
            Log.w("MainActivity", "Ignored onActivityResult soft exception: " + t.getMessage());
        }

        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    Log.w("MainActivity", "Overlay permission not granted");
                }
            }
        }
    }

    @Override
    protected String getMainComponentName() {
        return "AepttasShield";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
                this,
                getMainComponentName(),
                DefaultNewArchitectureEntryPoint.getFabricEnabled());
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed();
            }
            return;
        }
        super.invokeDefaultOnBackPressed();
    }
}
