Feature: View transitions
  As a visitor
  I want to move between pages without the whole page loading again
  So that navigation is fast and keeps my place

  Scenario: A link opens the next page with a view transition
    Given I am on the homepage
    Then the "astro:page-load" event should have fired
    And the "astro:after-swap" event should not have fired
    When I click the link "About" without a full page reload
    Then I should be on "/about/"
    And the page title should end with "| Astro Steps Demo"
    And I should see "About this demo"
    And the "astro:before-swap" event should have fired
    And the "astro:after-swap" event should have fired
    And the last transition should have gone "forward"

  Scenario: Going back also uses the router
    Given I am on the homepage
    When I click the link "Blog" without a full page reload
    And I go back without a full page reload
    Then I should be on the homepage
    And the last transition should have gone "back"

  Scenario: An element that persists is kept across pages
    Given I am on the homepage
    When I click the link "Contact" without a full page reload
    Then the persistent elements should have been kept
    And I should see "This note stays when you move between pages."

  Scenario: The route announcer tells screen readers about the new page
    Given I am on the homepage
    When I click the link "About" without a full page reload
    Then the page should have a route announcer
    And the route announcer should announce "About | Astro Steps Demo"
    And the route announcer should not announce "Home | Astro Steps Demo"

  Scenario: The content area has a view transition
    Given I am on the homepage
    Then the "main" element should have a view transition
    And the "footer" element should not have a view transition

  Scenario: A link under the mouse is prefetched
    Given I am on the homepage
    Then the page "/blog/" should not be prefetched
    When I hover over "nav a[href='/blog/']"
    Then the page "/blog/" should be prefetched

  Scenario: A page without the router fires no router events
    Given I am on "/static/"
    Then the "astro:page-load" event should not have fired
