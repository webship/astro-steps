# The labels and paths below are those of the demo site in demo/; swap them
# for your own content when you copy this feature.
Feature: Islands
  As a visitor
  I want interactive components to work once they have loaded
  So that I can use them, while the rest of the page stays plain HTML

  Scenario: The islands of a page hydrate as their directive says
    Given I am on "/islands/"
    Then the page should have 4 islands
    And the "client:load" island should be hydrated
    And the "client:idle" island should be hydrated
    And the "client:only" island should be hydrated
    And the "client:visible" island should not be hydrated
    When I scroll to the bottom of the page
    Then the "client:visible" island should be hydrated

  Scenario: A hydrated island responds
    Given I am on "/islands/"
    And the "client:load" island should be hydrated
    When I click the "Increment load" button
    Then "astro-island[client='load'] output" should have text "1"

  Scenario: A component without a directive is plain HTML
    Given I am on "/islands/"
    And the "client:load" island should be hydrated
    When I click the "Increment static" button
    Then "div.counter:not(astro-island *) output" should have text "0"

  Scenario: A component with a style has scoped styles
    Given I am on "/islands/"
    Then the page should have scoped styles
    And I should see "This card has a style that applies to it only."

  Scenario: A page without a styled component has no scoped styles
    Given I am on "/about/"
    Then the page should not have scoped styles
