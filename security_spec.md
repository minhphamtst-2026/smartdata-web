# Security Specification

## 1. Data Invariants
- A package must belong to an existing category.
- A package must have a name and registration syntax.
- Site configuration is accessible to all, but editable only by admins.
- Package and Category data are public (READ) to all users.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)
1. Anonymous user trying to create a package (Expected: Denied).
2. Authenticated non-admin trying to update site config (Expected: Denied).
3. Admin trying to create a package with missing required 'name' field (Expected: Denied by validation helper).
4. Admin trying to inject 2MB of junk text into package description (Expected: Denied by size constraint).
5. User trying to update 'createdAt' field on a package (Expected: Denied - immutable).
6. Malicious user trying to delete a category without permissions (Expected: Denied).
7. Trying to set 'price' as a string instead of a number (Expected: Denied).
8. Trying to set 'registrationSyntax' with a script tag (Expected: Denied by regex/sanitization).
9. Trying to create a package with a non-existent category ID (Expected: Denied).
10. Authenticated user trying to promote themselves to admin (Expected: Denied - admin collection is restricted).
11. Trying to update a package and changing its ID (Expected: Denied).
12. Trying to fetch all site configurations using a generic list if rules are not properly scoped (Expected: Scoped or Denied if sensitive).

## 3. Implementation Plan
- Use `isValidPackage`, `isValidCategory`, `isValidConfig`.
- Use `isAdmin` check based on email or presence in `/admins/` collection.
- Default deny all.
