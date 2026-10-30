package com.helium.wallet.securewindow

import android.view.WindowManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// FLAG_SECURE hides the window from recents, screenshots and screen capture.
class SecureWindowModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SecureWindow")

    AsyncFunction("setSecure") { secure: Boolean ->
      val window = (appContext.currentActivity ?: throw Exceptions.MissingActivity()).window
      if (secure) {
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
      } else {
        window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
      }
    }.runOnQueue(Queues.MAIN)
  }
}
