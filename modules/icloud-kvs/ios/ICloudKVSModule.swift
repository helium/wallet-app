import ExpoModulesCore

public class ICloudKVSModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ICloudKVS")

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
