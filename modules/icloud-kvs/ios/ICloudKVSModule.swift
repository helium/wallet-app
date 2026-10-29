import ExpoModulesCore

public class ICloudKVSModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ICloudKVS")

    Function("getString") { (key: String) -> String? in
      NSUbiquitousKeyValueStore.default.string(forKey: key)
    }

    Function("remove") { (keys: [String]) in
      keys.forEach { NSUbiquitousKeyValueStore.default.removeObject(forKey: $0) }
      NSUbiquitousKeyValueStore.default.synchronize()
    }
  }
}
