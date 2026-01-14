# TODO List

## Fixed Issues
- [x] Corrected enrolled student names to use actual user account names instead of default/sample names
  - Updated enrollCourse function to use req.auth.fullName, email, and imageUrl when creating new users
  - This ensures new enrollments display correct user information

## Remaining Tasks
- [ ] Test the enrollment functionality to verify names are now correct
- [ ] Check if existing enrolled students need name updates (may require database migration or manual update)
- [ ] Verify that the mock auth provides proper user names in development
- [ ] Test educator dashboard to ensure enrolled students list shows correct names

## Notes
- The fix addresses the root cause: when users enroll in courses, if they don't exist in DB, they are now created with actual auth data instead of hardcoded defaults
- Existing users with wrong names may need to be updated separately
