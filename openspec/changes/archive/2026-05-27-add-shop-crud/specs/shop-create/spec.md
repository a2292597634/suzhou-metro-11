## ADDED Requirements

### Requirement: Shop can be added in station editor
The system SHALL allow users to add a new shop row in the station editor modal.

#### Scenario: Click add shop button
- **WHEN** user clicks the "添加商铺" button in the station editor
- **THEN** a new empty row is appended to the shop table with default values

#### Scenario: New row has default values
- **WHEN** a new shop row is created
- **THEN** it has empty name, type="商铺", area=0, empty tenant/contact/openDate/remark, status="未出租"

### Requirement: Shop row deletion with confirmation
The system SHALL allow users to delete a shop row with a confirmation dialog.

#### Scenario: Click delete button
- **WHEN** user clicks the delete button on a shop row
- **THEN** a confirmation dialog appears asking "确定删除该商铺？"

#### Scenario: Confirm deletion
- **WHEN** user confirms the deletion
- **THEN** the row is removed from the table

#### Scenario: Cancel deletion
- **WHEN** user cancels the deletion
- **THEN** the row remains in the table

### Requirement: At least one shop must remain
The system SHALL prevent deletion of the last remaining shop row.

#### Scenario: Try to delete last shop
- **WHEN** user tries to delete the only remaining shop row
- **THEN** the delete button is disabled or a warning is shown

### Requirement: Shop numbers are reordered on save
The system SHALL automatically renumber shop `no` fields sequentially on save.

#### Scenario: Save after deletion
- **WHEN** user saves after deleting a shop
- **THEN** remaining shops have sequential `no` values starting from 1

### Requirement: Basic validation on save
The system SHALL validate required fields before saving shop changes.

#### Scenario: Empty shop name
- **WHEN** user tries to save with an empty shop name
- **THEN** a warning is shown and save is blocked

#### Scenario: Valid data
- **WHEN** user saves with all required fields filled
- **THEN** data is saved successfully
