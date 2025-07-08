source "https://rubygems.org"

# Chirpy theme - use exact version that's proven stable
gem "jekyll-theme-chirpy", "~> 6.5.0"

# Lock Jekyll to compatible version
gem "jekyll", "~> 4.3.0"

# Essential plugins for Chirpy - grouped together
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-seo-tag", "~> 2.6"
  gem "jekyll-archives", "~> 2.2"
  gem "jekyll-paginate", "~> 1.1"
  gem "jekyll-include-cache", "~> 0.2"
end

# Performance and reliability gems
gem "webrick", "~> 1.7"
gem "csv", "~> 3.2"
gem "base64", "~> 0.1"
gem "logger", "~> 1.5"

# Windows support
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Windows file watching
gem "wdm", ">= 0.1.0", platforms: [:mingw, :x64_mingw, :mswin]

# Lock for JRuby compatibility
gem "http_parser.rb", "~> 0.6.0", platforms: [:jruby] 