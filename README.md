Pasa password generator
=======================

Pasa is a simple password generator plugin for Firefox. It adds a button that,
when clicked, generates a unique password. This will help you break the habit
of using the same or similar passwords on different web sites.

To use Pasa, click the Pasa button and copy and paste the new password the tab
that is opened. The password is only available while the tab is open, so be sure
to click Yes when Firefox asks you if it should remember the password. To be
truly secure, configure the Firefox password manager to use a master password
and create a Firefox Sync account to back up your encrypted passwords.

All passwords are generated locally. There is no dependency on any external web
service.

Build
=====
1. https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Installation
2. Extract https://ftp.mozilla.org/pub/mozilla.org/labs/jetpack/jetpack-sdk-latest.tar.gz
3. Run `source bin/activate` from the addok-sdk directory
4. Run `cfx xpi` from the pasa directory
5. Drag and drop pasa.xpi into Firefox

