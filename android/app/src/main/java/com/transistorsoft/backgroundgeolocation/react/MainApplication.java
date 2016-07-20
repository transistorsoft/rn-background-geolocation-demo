package com.transistorsoft.backgroundgeolocation.react;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;

import java.util.Arrays;
import java.util.List;

import com.transistorsoft.rnbackgroundgeolocation.*;
import com.oblador.vectoricons.VectorIconsPackage;
import com.mapbox.reactnativemapboxgl.ReactNativeMapboxGLPackage;
import com.learnium.RNDeviceInfo.*;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    protected boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
        return Arrays.<ReactPackage>asList(
                new MainReactPackage(),
                new RNBackgroundGeolocation(),      // <-- for background-geolocation
                new VectorIconsPackage(),
                new ReactNativeMapboxGLPackage(),
                new RNDeviceInfo()                     // react-native-device-info
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
      return mReactNativeHost;
  }
}
