package com.transistorsoft.rnbackgroundgeolocationsample;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;

import com.transistorsoft.rnbackgroundgeolocation.*;
import com.oblador.vectoricons.VectorIconsPackage;
import com.rota.rngmaps.RNGMapsPackage;
import com.learnium.RNDeviceInfo.*;

import java.util.Arrays;
import java.util.List;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "RNBackgroundGeolocationSample";
    }

    /**
     * Returns whether dev mode should be enabled.
     * This enables e.g. the dev menu.
     */
    @Override
    protected boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG;
    }

    /**
     * A list of packages used by the app. If the app uses additional views
     * or modules besides the default ones, add more packages here.
     */
    @Override
    protected List<ReactPackage> getPackages() {
        return Arrays.<ReactPackage>asList(
                new RNBackgroundGeolocation(this),      // <-- for background-geolocation
                new VectorIconsPackage(),               // react-native-vector-icons
                new RNGMapsPackage(),                   // react-native-gmaps
                new RNDeviceInfo(),                     // react-native-device-info
                new MainReactPackage()
        );
    }
}
