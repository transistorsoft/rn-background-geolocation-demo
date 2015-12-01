package com.transistorsoft.rnbackgroundgeolocationsample;

import com.transistorsoft.rnbackgroundgeolocation.*;
import com.oblador.vectoricons.VectorIconsPackage;
import com.rota.rngmaps.RNGMapsPackage;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.view.KeyEvent;

import com.facebook.react.LifecycleState;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

public class MainActivity extends Activity implements DefaultHardwareBackBtnHandler {

    private ReactInstanceManager mReactInstanceManager;
    private ReactRootView mReactRootView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        _askForOverlayPermission();

        super.onCreate(savedInstanceState);

        mReactRootView = new ReactRootView(this);

        mReactInstanceManager = ReactInstanceManager.builder()
                .setApplication(getApplication())
                .setBundleAssetName("index.android.bundle")
                .setJSMainModuleName("jsx/index.android")
                .addPackage(new MainReactPackage())
                .addPackage(new RNBackgroundGeolocation(this))  // <-- for background-geolocation
                .addPackage(new VectorIconsPackage())   // react-native-vector-icons
                .addPackage(new RNGMapsPackage()) // <-- Register package here
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build();

        mReactRootView.startReactApplication(mReactInstanceManager, "RNBackgroundGeolocationSample", null);

        setContentView(mReactRootView);

        _askForLocationPermission();
        
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_MENU && mReactInstanceManager != null) {
            mReactInstanceManager.showDevOptionsDialog();
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }

    @Override
    public void onBackPressed() {
      if (mReactInstanceManager != null) {
        mReactInstanceManager.onBackPressed();
      } else {
        super.onBackPressed();
      }
    }

    @Override
    public void invokeDefaultOnBackPressed() {
      super.onBackPressed();
    }

    @Override
    protected void onPause() {
        super.onPause();

        if (mReactInstanceManager != null) {
            mReactInstanceManager.onPause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (mReactInstanceManager != null) {
            mReactInstanceManager.onResume(this);
        }
    }
    private static final int OVERLAY_PERMISSION_REQUEST_CODE = 2;

    @TargetApi(Build.VERSION_CODES.M)
    private void _askForOverlayPermission() {
        if (!BuildConfig.DEBUG || android.os.Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return;
        }

        if (!Settings.canDrawOverlays(this)) {
            Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            startActivityForResult(settingsIntent, OVERLAY_PERMISSION_REQUEST_CODE);
        }
    }
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 3;
    @TargetApi(Build.VERSION_CODES.M)
    private void _askForLocationPermission() {
        if (!BuildConfig.DEBUG || android.os.Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return;
        }

        if (!Settings.canDrawOverlays(this)) {
            Intent settingsIntent = new Intent(Settings.ACTION_SECURITY_SETTINGS,
                    Uri.parse("package:" + getPackageName()));
            startActivityForResult(settingsIntent, LOCATION_PERMISSION_REQUEST_CODE);
        }
    }

}
