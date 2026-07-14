require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |spec|
  spec.name         = "react-native-spoiler-view"
  spec.version      = package["version"]
  spec.summary      = package["description"]
  spec.homepage     = package["homepage"]
  spec.license      = package["license"]
  spec.authors      = package["author"]
  spec.platforms    = { :ios => "13.4" }
  spec.source       = { :git => package["repository"]["url"], :tag => "v#{spec.version}" }
  spec.source_files = "ios/**/*.{h,m,mm}"
  spec.dependency "React-Core"
end
