import ExpoModulesCore

public class ICloudKVSModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ICloudKVS")

    Function("getString") { (key: String) -> String? in
      NSUbiquitousKeyValueStore.default.string(forKey: key)
    }
  }
}
