require("dotenv").config();
const twilio = require('twilio');


const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

const sendSMSVerificationCode = async (clientName, phoneNumber, verificationCode) => {
    // client.messages.create({
    //     body: `Hola ${clientName}, para continuar con el registro, por favor ingresa el siguiente código
    //     de verificación: ${verificationCode}`,
    //     from: `${process.env.TWILIO_PHONE_NUMBER}`,
    //     to:  `+57${phoneNumber}`
    // })
    // .then(message => console.log(`Mensaje enviado con SID: ${message.sid}`))
    // .catch(error => console.error(error));
}

module.exports = { sendSMSVerificationCode };

