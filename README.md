Pasa password generator
=======================

Pasa is a simple password generator plugin for Firefox. It adds a toolbar button
that, when clicked, generates a random password. This will help you break the
habit of using the same or similar passwords on different web sites.

The length of the generated password or the permissible characters (letters,
numbers, symbols) can be changed to adapt to any web site's password
requirements.

All passwords are generated locally; there is no dependency on any external web
service. Users are encouraged to save generated passwords in Firefox and back
them up with Firefox Sync.

_Pasa_ is Spanish. It can mean either _come in_ or _raisin_, depending on the
context.

Build
=====
1. https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Installation
2. Extract https://ftp.mozilla.org/pub/mozilla.org/labs/jetpack/jetpack-sdk-latest.tar.gz
3. Run `source bin/activate` from the addok-sdk directory
4. Run `make` from the pasa directory
5. Drag and drop pasa.xpi into Firefox

License
=======
Unless otherwise noted, this software may be used under the terms of the Mozilla
Public License 2.0 or any later version published by Mozilla, the GNU General
Public License 2.0 or any later version published by the Free Software
Foundation, or the GNU Lesser General Public License 2.0 or any later version
published by the Free Software Foundation. By making commits or pull requests to
this repository, you agree to license your contributions likewise.
