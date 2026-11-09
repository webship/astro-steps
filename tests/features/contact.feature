# The titles, copy and paths below are those of the demo site in demo/; swap
# them for your own content when you copy this feature.
Feature: Contact page
  As a visitor
  I want to fill in the contact form
  So that I can send a message

  Scenario: Contact page loads with a form
    Given I am on "/contact/"
    Then I should see "Contact us"
    And I should see a "Name" element
    And I should see an "Email" element
    And I should see a "Message" element

  Scenario: Filling in the contact form
    Given I am on "/contact/"
    When I fill in the following:
      | name    | Ada Lovelace          |
      | email   | ada@example.com       |
      | message | Hello from webship-js |
    Then "#name" should have value "Ada Lovelace"
    And "#email" should have value "ada@example.com"
    And "#message" should have value "Hello from webship-js"
