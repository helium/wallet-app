package com.helium.wallet.app;

import android.content.res.Configuration;

import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;

import android.app.Application;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.soloader.SoLoader;

import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHostWrapper(this, new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          packages.add((new HeliumAppPackage()));
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
      });

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    OkHttpClientProvider.setOkHttpClientFactory(new UserAgentClientFactory(userAgent()));
    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }
    ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    ApplicationLifecycleDispatcher.onApplicationCreate(this);
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);
  }

  private String userAgent() {
    try {
      Context context = getApplicationContext();
      PackageManager packageManager = context.getPackageManager();
      ApplicationInfo applicationInfo = packageManager.getApplicationInfo(context.getPackageName(), 0);
      PackageInfo packageInfo = packageManager.getPackageInfo(context.getPackageName(), 0);

      String appName = (String) packageManager.getApplicationLabel(applicationInfo);
      Long appVersionCode;

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        // For API level 28 and above
        appVersionCode = packageInfo.getLongVersionCode();
      } else {
        // For lower API levels
        appVersionCode = (long) packageInfo.versionCode;
      }

      return appName + "$" + appVersionCode.toString() + " " + "android/" + Build.VERSION.RELEASE;
    } catch (PackageManager.NameNotFoundException e) {
      return null;
    }
  }
}
