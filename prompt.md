I want to start a new branch to change how the 'Message Center' element works in `sb-admin-react\src\markup\topbar.html`.

- If one user responnds to another, that's considered a "message", and it needs to be stored in the database, and the 'message center' component needs to show any messages sent to the current user.
If the current user has no messages, the message center button should be disabled.