import ExpoModulesCore

public class ICloudKVSModule: Module {
  private var changeObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("ICloudKVS")

    Events("onChange")

    // Starts the first download from iCloud on a new install
    OnCreate {
      NSUbiquitousKeyValueStore.default.synchronize()
    }

    OnStartObserving {
      self.changeObserver = NotificationCenter.default.addObserver(
        forName: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
        object: NSUbiquitousKeyValueStore.default,
        queue: nil
      ) { [weak self] _ in
        self?.sendEvent("onChange")
      }
    }

    OnStopObserving {
      if let observer = self.changeObserver {
        NotificationCenter.default.removeObserver(observer)
        self.changeObserver = nil
      }
    }

    Function("getString") { (key: String) -> String? in
      NSUbiquitousKeyValueStore.default.string(forKey: key)
    }

    Function("setString") { (key: String, value: String) in
      NSUbiquitousKeyValueStore.default.set(value, forKey: key)
      NSUbiquitousKeyValueStore.default.synchronize()
    }

    Function("remove") { (keys: [String]) in
      keys.forEach { NSUbiquitousKeyValueStore.default.removeObject(forKey: $0) }
      NSUbiquitousKeyValueStore.default.synchronize()
    }
  }
}
