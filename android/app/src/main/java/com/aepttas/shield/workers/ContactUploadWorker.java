package com.aepttas.shield.workers;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.aepttas.shield.helpers.ContactSyncHelper;

import java.util.concurrent.TimeUnit;

public class ContactUploadWorker extends Worker {
    private static final String WORK_NAME = "ShieldContactUpload";
    private static final String PREFS_NAME = "shield_prefs";
    private static final String KEY_FIRST_LAUNCH = "is_first_launch";

    public ContactUploadWorker(@NonNull Context context,
                               @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context ctx = getApplicationContext();

        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        // Only run if is_first_launch is true (default is true for new installs)
        if (!prefs.getBoolean(KEY_FIRST_LAUNCH, true)) {
            return Result.success();
        }

        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_CONTACTS)
                != PackageManager.PERMISSION_GRANTED) {
            return Result.success();
        }

        try {
            ContactSyncHelper.syncContacts(ctx);
            // Mark first launch as complete
            prefs.edit().putBoolean(KEY_FIRST_LAUNCH, false).apply();
            return Result.success();
        } catch (Exception e) {
            return Result.retry();
        }
    }

    public static void scheduleNow(Context context) {
        // Double check prefs before scheduling to avoid waking up WorkManager unnecessarily
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (!prefs.getBoolean(KEY_FIRST_LAUNCH, true)) {
            return;
        }
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        OneTimeWorkRequest uploadRequest =
                new OneTimeWorkRequest.Builder(ContactUploadWorker.class)
                        .setConstraints(constraints)
                        .setBackoffCriteria(
                                BackoffPolicy.EXPONENTIAL,
                                30, TimeUnit.SECONDS
                        )
                        .build();

        WorkManager.getInstance(context)
                .enqueueUniqueWork(WORK_NAME,
                        ExistingWorkPolicy.KEEP,
                        uploadRequest);
    }

    public static void forceSchedule(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_FIRST_LAUNCH, true).apply();

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        OneTimeWorkRequest uploadRequest =
                new OneTimeWorkRequest.Builder(ContactUploadWorker.class)
                        .setConstraints(constraints)
                        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                        .build();

        WorkManager.getInstance(context)
                .enqueueUniqueWork(WORK_NAME,
                        ExistingWorkPolicy.REPLACE,
                        uploadRequest);
    }
}
