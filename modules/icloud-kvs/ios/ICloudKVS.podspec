Pod::Spec.new do |s|
  s.name           = 'ICloudKVS'
  s.version        = '1.0.0'
  s.summary        = 'Reads and removes strings in the iCloud key-value store'
  s.description    = 'NSUbiquitousKeyValueStore access for the first-launch import and sign-out'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,swift}"
end
