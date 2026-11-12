Feature: Accessibility
  As a visitor who uses a screen reader or a keyboard
  I want pages that are structured correctly
  So that I can use the site

  Scenario Outline: The page structure is accessible
    Given I am on "<path>"
    Then the page should declare a language
    And the page should have a title
    And the page should have a main landmark
    And the page should have exactly one h1

    Examples:
      | path      |
      | /         |
      | /about/   |
      | /islands/ |
      | /posts/   |

  Scenario: The home page has no serious accessibility violations
    Given I am on the homepage
    Then the page should have no critical accessibility violations
