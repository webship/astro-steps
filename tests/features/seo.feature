# The titles and paths below are those of the demo site in demo/; swap them
# for your own content when you copy this feature.
Feature: Sitemap and feeds
  As a search engine or a feed reader
  I want the site to list its pages
  So that I can find and follow them

  Scenario: The sitemap lists the pages of the site
    Given I am on the homepage
    Then the sitemap should list "/"
    And the sitemap should list "/about/"
    And the sitemap should list "/posts/first-post/"
    And the sitemap should not list "/posts/draft-post/"
    And the sitemap should not list "/404/"

  Scenario: The RSS feed lists the published posts
    Given I am on the homepage
    Then the RSS feed should be valid
    And the RSS feed should list "The first post"
    And the RSS feed should list "The second post"
    And the RSS feed should not list "A draft post"
