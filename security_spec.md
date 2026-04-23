# Security Specification: Tre Việt Firestore

## 1. Data Invariants
- Products must have a valid name (3-100 chars).
- `priceNum` must be a positive number.
- `image` must be a valid URL string.
- Only authenticated users with their UID in the `/admins` collection can write to `/products`.
- Document IDs must be valid.

## 2. The "Dirty Dozen" Payloads (Rejected)
1. Unauthenticated write to `/products/p1`.
2. Authenticated non-admin write to `/products/p1`.
3. Creating a product with negative `priceNum`.
4. Creating a product without a name.
5. Updating a product's immutable `createdAt` field.
6. Injecting a 1MB string into the `category` field.
7. Admin attempt to delete a document in an unauthorized collection.
8. Non-admin attempt to read from `/admins`.
9. Authenticated user trying to set themselves as an admin via client.
10. Creating a product with a shadow field `isFeatured: true` when not in schema.
11. Updating a product to remove required `material` field.
12. Attempting to list all admins as a regular user.

## 3. Test Runner (Mock)
A real `firestore.rules.test.ts` would verify these. For now, we move to rules generation.
