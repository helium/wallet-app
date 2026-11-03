Pod::Spec.new do |s|
  s.name           = 'ScrollEdgeEffect'
  s.version        = '1.0.0'
  s.summary        = 'Hides the bottom scroll edge effect on one scroll view'
  s.description    = 'A view that hides the iOS 26 bottom scroll edge effect on the scroll view inside it'
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
