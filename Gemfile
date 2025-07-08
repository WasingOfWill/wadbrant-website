source "https://rubygems.org"

# Use Jekyll for GitHub Pages deployment  
gem "jekyll", "~> 4.3.0"

# GitHub Pages gem for better compatibility
gem "github-pages", group: :jekyll_plugins

# Chirpy theme
gem "jekyll-theme-chirpy", "~> 6.0", ">= 6.0.1"

# Essential Jekyll plugins
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-sitemap"
  gem "jekyll-seo-tag"
  gem "jekyll-archives"
  gem "jekyll-paginate"
  gem "jekyll-include-cache"
end

# Testing and development gems
group :test do
  gem "html-proofer", "~> 4.0"
end

# Ruby 3.4.0 compatibility - required standard library gems
gem "base64"
gem "logger"
gem "csv"

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Webrick is needed for Ruby 3.0+
gem "webrick", "~> 1.7"

# Windows polling for file changes
gem 'wdm', '>= 0.1.0' if Gem.win_platform?

# Lock `http_parser.rb` gem to `v0.6.x` on JRuby builds since newer versions of the gem
# do not have a Java counterpart.
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby] 