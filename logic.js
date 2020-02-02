const nodemailer = require('nodemailer');
//const xoauth2 = require('xoauth2');
const imaps = require('imap-simple');
const fs = require('fs');

console.log(`
-🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖-
-----Welcome to  Xio----
-🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖-
`);

let newMsg;
let blackList = fs.readFileSync('xiodb.json', function (err, data) {
    if (err) throw err;
    return data;
});
let blackListJSON = JSON.parse(blackList);

const imapConfig = {
    imap: {
        user: 'ifchasethenhire@gmail.com',
        password: process.env.PW,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false
        },
        authTimeout: 10000
    },
    onmail: function() {
        console.log("Someone sent you a message.");
        newMsg = true;
    },
};

let msgMap = function(msgResult) {
    return msgResult.map(function(res) {
        return res.parts.filter(function(part) {
            return part.which === 'HEADER';
        })[0].body.from[0];
    });
};

let xioDictate = function(msgResult, mailSender) {
    return msgResult.map(function(res) {

        let b = res.parts[0].body;
        
        //find msg from Xio and get its index
        let cutAt = b.indexOf("Beep, boop, hi!");
        console.log("Beep boop hi! was found at ", cutAt);
        //use index to slice email
        let truncatedMsg = b.slice(0, cutAt);
	    console.log("the body of the truncated msg result is ", truncatedMsg);

        let aboutMe = truncatedMsg.includes("about you") || truncatedMsg.includes("About you") || truncatedMsg.includes("About You") || truncatedMsg.includes("about You");
        let shutUpXio = truncatedMsg.includes("THANKS XIO") || truncatedMsg.includes("thanks xio")|| truncatedMsg.includes("Thanks xio") || truncatedMsg.includes("Thanks Xio") || truncatedMsg.includes("thanks Xio");
	    let resumePlz = truncatedMsg.includes("Resume please") || truncatedMsg.includes("resume please") || truncatedMsg.includes("RESUME PLEASE");

        let msgObj = {};
        msgObj.messageContent = res;
        msgObj.shutUpXio = shutUpXio;
        msgObj.aboutMe = aboutMe;
	    msgObj.resumePlz = resumePlz;

        if (shutUpXio) {
            //push someone to the blacklist
            blackListJSON.push(mailSender);
            //push the email to the blacklist if user writes "QUIET XIO"
            fs.writeFileSync("xiodb.json", JSON.stringify(blackListJSON));
        }
        return msgObj;
    });
};

async function mailCtn() {
    try {
       return await imaps.connect(imapConfig)
    }
    catch(err) {
        if (err) throw err;
    }
}

setInterval(() => {
    mailCtn().then(boxConnection => {
        boxConnection.openBox('INBOX').then(async function () {

            const searchCriteria = ['UNSEEN'];
            const fetchOptions = {
                bodies: [
                    'HEADER', 'TEXT'
                ],
                markSeen: true
            };
            // search for  UNSEEN emails
            const results = await boxConnection.search(searchCriteria, fetchOptions);

            if (results.length > 0) {
                console.log("You've got something in your mailbox.");
                newMsg = false;
            }
            else {
                boxConnection.end();
            }
            //create an array with sender emails
            var theMsgIdArray = [];
            results.forEach(result => {
                theMsgIdArray.push(result.attributes.uid);
            });
            // if there are any senders, process them with msgMap;
            let senderInfo = msgMap(results);

            if (senderInfo.length > 0) {
                flagAsRead(boxConnection, theMsgIdArray);
                let emailSplit = senderInfo.toString().split('<');
                let trimmedEmail = emailSplit[1].replace('>', '');
                let mailSender;
                mailSender = trimmedEmail;

                // Xio parses the message and sets the variables
                let xioSaid = xioDictate(results, mailSender);
                console.log("xioSaid returned ", xioSaid);

                //send a response if someone isn't on the blacklist
                if (!JSON.stringify(blackListJSON).includes(mailSender)) {
                    return sendTrigger(mailSender, boxConnection, theMsgIdArray, xioSaid[0].aboutMe, xioSaid[0].resumePlz);
                }
                else {
                    console.log(mailSender, " is blacklisted - not sending anything and moving the message to DMs");
                    ctn.moveMessage(theMsgIdArray, "DIRECT", function () {
                        console.log("messages moved to direct");
                    }).catch(err => {
                        console.log(err);
                    });
                    boxConnection.end();
                }
            }
            ;
        })
    })
}, 20000)

//move the messages to the trash if there are any IDs in the msgIdArray
function trashMe(msgIds, ctn) {
    if (msgIds.length > 0) {
        console.log("modseq (uid) of emails array is ", msgIds);

        ctn.moveMessage(msgIds, 'TRASH', function() {
            console.log("messages moved to trash");
        }).catch(err => {
            console.log(err);
        });
    };
}

//flaggin messages as read before theyre moved
async function flagAsRead(ctn, ids) {
    try {
        console.log("Flagging messages as answered - passing uids: ", ids);
        return await ctn.addFlags(ids, ["\\Answered"]);
    }
    catch(err) {
        if (err) throw err;
    }
};

let sendTrigger = function(whoSent, ctn, msgIds, overShare, sendResume) {
    console.log("Hey Chase ", whoSent, " emailed you. I'll send a response back.");;
	let leCannedMessage;

	if (overShare) {
	leCannedMessage = `
    <body style="text-align:center">  <h1 style="font-size:5em;">🤖</h1>
    <p style="font-family:'Monospace';color:gray;font-size:.9em;">  Beep, boop, hi!  </p>
    <p>
    This is getting a little personal.
    </p>
    `;
	} else if (sendResume) {
	leCannedMessage = `
    <body style="background-color:#121d21;text-align:center">         <h1 style="font-size:5em;">🤖</h1>
    <p style="font-family:'Monospace';color:gray;font-size:.9em;">  Beep, boop, hi!  </p>
    <p>
    Resume link: https://cheidebur.github.io/portfolio/ChaseHeideburResumeN.pdf
    </p>
    `;
	} else {
	leCannedMessage = `
        <body style="background-color:#121d21;text-align:center">         <h1 style="font-size:5em;">🤖</h1>
        <p style="font-family:'Monospace';color:gray;font-size:.9em;">  Beep, boop, hi!  </p>
                                                                          <p style="font-family:'Monospace';color:#f7c45f;font-size:
1.4em;">                                                                  I got your message, and I should check it soon! BTW - this
 email is automated and interactive.                                      To get a summary of my recent work and mission, type "about you" anywhere in your next message. </p>                                <br>								 <p style="font-family:'Monospace';color:#f7c45f;font-size:1.4em;">Type "resume please" anywhere in your next email to receive a copy of my resume</p>
									  <br>
	<p style="font-family:'Monospace';color:#f7c45f;font-size:1.4em;">								  
You will continue to receive this message until I respond.        Or if you'd like, you can silence Xio and flag your next message as high priority
        by typing "thanks Xio" anywhere in your next email.               </p>
        <p style="display:inline;background-color:#F26A4B;padding:.3em;border-radius:10px;">
        Sent by Chase via a robot named Xio                                                    </p>
        <p style="font-family:'Monospace';color:gray;font-size:.9e
m;">                                                                      Beep, boop, bye!                                                  </p>
        <p style="font-family:'Monospace';color:#f23d3d;font-size:
1.1em;">Review my portfolio here:<br>                              https://cheidebur.github.io/portfolio                             </p>          
	</body>
        `;
	};
	

    let mailOptions = {
        from: 'ifchasethenhire@gmail.com',
        to: whoSent,
        subject: 'Hey beautiful!',
        html: leCannedMessage,
        text:`
        Hey! I got your email, but it's been screened from my inbox.
        Recruiters - please review my portfolio/resume before asking me to fill out a survey.
        You can find that here: https://cheidebur.github.io/portfolio
        
        This is an automated message sent from Chase's pet robot, Xio.
        To stop receiving messages from me and instead send a message directly to Chase's inbox,
        just include "thanks xio" anywhere in your next message.
        
        Beep, boop, bye!
        `
    };

    transporter.sendMail(mailOptions, function(e, r) {
        if (e) {
            console.log(e);
        } else {
            console.log(r);
        }
        transporter.close();
    });

    trashMe(msgIds, ctn);
    ctn.end();
}

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secure: 'true',
    port: '465',
    auth: {
        type: "login",
        user: "ifchasethenhire@gmail.com",
        pass: process.env.PW
    }
});
