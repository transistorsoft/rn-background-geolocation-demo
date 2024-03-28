package com.transistorsoft.backgroundgeolocation.react;

import android.app.Application;
import android.location.Location;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import com.transistorsoft.locationmanager.adapter.BackgroundGeolocation;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
    new DefaultReactNativeHost(this) {
      @Override
      public boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG;
      }

      @Override
      protected List<ReactPackage> getPackages() {
        @SuppressWarnings("UnnecessaryLocalVariable")
        List<ReactPackage> packages = new PackageList(this).getPackages();
        // Packages that cannot be autolinked yet can be added manually here, for example:
        // packages.add(new MyReactNativePackage());
        return packages;
      }

      @Override
      protected String getJSMainModuleName() {
        return "index";
      }

      @Override
      protected boolean isNewArchEnabled() {
        return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
      }
      @Override
      protected Boolean isHermesEnabled() {
        return BuildConfig.IS_HERMES_ENABLED;
      }
    };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }

    /**
     *
     *
    BackgroundGeolocation.getInstance(getApplicationContext()).setBeforeInsertBlock(tsLocation -> {
      Location location = tsLocation.getLocation();  // <-- Native Location instance for your convenience.
      Log.d(BackgroundGeolocation.TAG, "*** [onBeforeInsertBlock] location: " + location + ", tsLocation: " + tsLocation);

      try {
        JSONObject json = tsLocation.toJson();
        return json;
      } catch (JSONException e) {
        return null;
      }
    });
     *
     *
     */
    //ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

}
