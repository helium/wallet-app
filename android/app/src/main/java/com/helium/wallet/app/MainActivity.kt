package com.helium.wallet.app

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import android.os.Bundle

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "HeliumWallet"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  // Add this method to fix the crash
  override fun onWindowFocusChanged(hasFocus: Boolean) {
    try {
      val reactInstanceManager = reactNativeHost.reactInstanceManager
      val reactContext = reactInstanceManager.currentReactContext

      // Only call super if React Native is ready
      if (reactContext != null) {
        super.onWindowFocusChanged(hasFocus)
      }
    } catch (e: Exception) {
      // Log but don't crash if something goes wrong
      android.util.Log.w("MainActivity", "Error in onWindowFocusChanged: ${e.message}")
    }
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled))
}