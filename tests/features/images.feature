Feature: Optimized images
  As a visitor
  I want images that are the right size and do not move the page
  So that the site feels quick on any connection

  Scenario: Images from astro:assets are optimized
    Given I am on "/images/"
    Then I should see an optimized image
    And every optimized image should have a width and a height
    And every optimized image should load lazily
    And every optimized image should be loaded

  Scenario: A picture offers modern formats
    Given I am on "/images/"
    Then the optimized image should offer the "avif" format
    And the optimized image should offer the "webp" format
    But the optimized image should not offer the "jpeg" format

  Scenario: A page without optimized images
    Given I am on "/about/"
    Then I should not see an optimized image

  Scenario: An image at the top of the page loads at once
    Given I am on "/hero/"
    Then I should see an optimized image
    And every optimized image should not load lazily
    And every optimized image should be loaded

  Scenario: An image far below the fold loads when it is scrolled to
    Given I am on "/below-the-fold/"
    Then every optimized image should load lazily
    And every optimized image should not be loaded
    When I scroll to the bottom of the page
    Then every optimized image should be loaded
