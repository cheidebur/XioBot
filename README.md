# Xio

### Xio is an email bot written in Node with imap-simple.

I'll go over
- what Xio does
- design challenges


## what does Xio do?
Xio checks, sorts, and responds to your email based on the email's contents. With Xio, all mail received
goes into a filtered folder, and it is only moved into the "Direct" folder if the sender flags it as important
by including a command in their email.

Right now Xio listens for and responds differently to two commands:

1. resume please
2. thanks Xio

The email sender can include the term __resume please__ anywhere in their email, and Xio
will respond with a link to my resume. Theorhetically this could be used for anything, and the commands
could be changed to whatever. 

__Thanks Xio__ will add the sender's email to a blacklist and move their message to your Direct inbox. This
has the added benefit of also moving their last message to your inbox so it doesn't get lost in the filtered
folder (currently called TRASH but that's a misnomer).

## design challenges

One interesting bug I ran into was that since the imap-simple nor imap libraries do any magic to parse emails,
Xio would listen to commands that were provided by Xio itself. To fix this, I added a unique identifier to the top
of Xio's emails and used only the string before its location for parsing.

