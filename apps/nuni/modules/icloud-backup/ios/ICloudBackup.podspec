Pod::Spec.new do |s|
  s.name           = 'ICloudBackup'
  s.version        = '1.0.0'
  s.summary        = 'Copies the Nuni backup snapshot to and from the iCloud Drive ubiquity container.'
  s.author         = 'Chagyung'
  s.homepage       = 'https://example.invalid'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
