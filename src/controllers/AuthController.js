const { PrismaClient } = require('@prisma/client'); //Importamos el cliente de prisma
const prisma = new PrismaClient(); //Creamos una instancia de prisma
const bcrypt = require('bcryptjs'); //Importamos bcryptjs para encriptar la contraseña
const jwt = require('jsonwebtoken'); //Importamos jsonwebtoken para generar el token
require("dotenv").config(); //Nos permite leer las variables de entorno
const nodemailer = require("nodemailer"); //Importamos nodemailer para enviar correos electronicos
const {sendSMSVerificationCode} = require( '../middlewares/sms');

// Configuración del transporte de correo electrónico
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); //Generamos un codigo de verificacion aleatorio
}

// Función para enviar el correo electrónico con el código de verificación
const sendVerificationEmail = async (email, code, fullname) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Código de verificación para tu cuenta",
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Verificación de cuenta</h2>
            <p>Hola ${fullname},</p>
            <p>Gracias por registrarte. Para completar tu registro, por favor utiliza el siguiente código de verificación:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p>Este código expirará en 15 minutos.</p>
            <p>Si no has solicitado este código, por favor ignora este correo.</p>
            <p>Saludos,<br>El equipo de soporte</p>
          </div>
        `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

const verifyCode = async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({
            message: "Email and verification code are required",
        });
    }

    try {
        const user = await prisma.users.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (user.status === "ACTIVE") {
            return res.status(400).json({
                message: "User is already verified",
            });
        }

        // Verificar si el código ha expirado
        const now = new Date();
        if (now > user.verificationCodeExpires) {
            return res.status(400).json({
                message: "Verification code has expired. Please request a new one.",
            });
        }

        // Verificar si el código es correcto
        if (user.verificationCode !== code) {
            return res.status(400).json({
                message: "Invalid verification code",
            });
        }

        // Actualizar estado del usuario a activo
        await prisma.users.update({
            where: { id: user.id },
            data: {
                status: "ACTIVE",
                verificationCode: null,
                verificationCodeExpires: null, // Corregido el nombre del campo
            },
        });

        res.status(200).json({
            message: "Account verified succsessfully",
        });

    } catch (error) {
        console.log("Error during verification:", error);
        res.status(500).json({
            message: "Verification failed",
            error: error.message,
        });
    }
};

const resendVerificationCode = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required",
        });
    }

    try {
        const user = await prisma.users.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (user.status === "ACTIVE") {
            return res.status(400).json({
                message: "User is already verified",
            });
        }

        // Generar nuevo código y actualizar fecha de expiración
        const newCode = generateVerificationCode();
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 15);

        await prisma.users.update({
            where: { id: user.id },
            data: {
                verificationCode: newCode,
                verificationCodeExpires: expirationTime,
            },
        });

        // Enviar nuevo código por correo
        const emailSent = await sendVerificationEmail(email, newCode, user.fullname);

        if (!emailSent) {
            return res.status(500).json({
                message: "Failed to send verification email. Please try again later.",
            });
        }

        res.status(200).json({
            message: "Verification code sent successfully. Please check your email.",
        });

    } catch (error) {
        console.log("Error resending code:", error);
        res.status(500).json({
            message: "Failed to resend verification code",
            error: error.message,
        });
    }
};

const signUp = async (req, res) => {
    let { fullname, email, current_password, phone } = req.body; //Extraemos los datos del body

    if (email) {
        email = email.toLowerCase().trim(); //Convertimos el email a minusculas y quitamos los espacios adicionales
    }

    //Validate the data
    if (!fullname || !email || !current_password || !phone) { //Validamos que los campos no esten vacios
        return res.status(400).json({
            message: "fullname, email, current_password are required"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //Expresion regular para validar el email  

    if (!emailRegex.test(email)) { //Validamos que el email sea valido
        return res.status(400).json({
            message: "Invalid email format"
        });

    }

    if (current_password.length < 6) { //Validamos que la contraseña tenga al menos 6 caracteres
        return res.status(400).json({
            message: "Password must be at least 6 characters"
        });
    }

    try {
        const existingUser = await prisma.users.findUnique({
            where: { email }
        })

        //En caso de que encuentre el correo en la db
        if (existingUser) { //Validamos que el usuario no exista
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(current_password, 10);
        console.log(hashedPassword);

        const verificationCode = generateVerificationCode(); //Generamos el codigo de verificacion
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 15); //Establecemos la expiracion del codigo a 15 minutos

        const user = await prisma.users.create({
            data: {
                fullname,
                email,
                current_password: hashedPassword,
                status: "PENDING",
                phone: phone,
                verificationCode,
                verificationCodeExpires: expirationTime // Corregido el nombre del campo
            },
        });
        console.log(user);

        // Enviar correo con código de verificación
        const emailSent = await sendVerificationEmail(email, verificationCode, fullname);

        if (!emailSent) {
            // Si falla el envío del correo, eliminamos el usuario creado
            await prisma.users.delete({
                where: { id: user.id },
            });

            return res.status(500).json({
                message: "Failed to send verification email. Please try again later.",
            });
        }


        res.status(201).json({
            message: "User created successfully. Please check your email out for the verification code.",
            user
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "User was not created",
            error: error
        });
    }
}

const signIn = async (req, res) => {
    let { email, current_password } = req.body;
    console.log(req.body);

    if (email) {
        email = email.toLowerCase().trim();
    }

    if (!email || !current_password) {
        return res.status(400).json({
            message: "All required fields: email and password",
        })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Invalid email address",
        })
    }

    try {
        const userExists = await prisma.users.findUnique({
            where: { email }
        })
        if (!userExists) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        const validatePassword = await bcrypt.compare(
            current_password,
            userExists.current_password
        )

        if (!validatePassword) {
            return res.status(400).json({
                message: "Password doesn't match"
            })
        }

        if (userExists.status !== "ACTIVE") {
            return res.status(400).json({
                message: "User is not active",
            })
        }

        const verificationCode = generateVerificationCode();
        sendSMSVerificationCode(userExists.fullname, userExists.phone, verificationCode);
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 15);

        await prisma.users.update({
            where: { id: userExists.id },
            data: {
                verificationCodePhone: verificationCode,
                verificationCodePhoneExpires: expirationTime,
            },
        });
        
        res.status(200).json({
            message: "Verification code to your phone number sent successfully, please check it out"
        })

    } catch (error) {
        res.status(500).json({
            message: "User was not logged in",
            error: error.message
        })
    }

}

const twoFactorAuthentication = async (req, res) => {
    let { email, phoneCode } = req.body;
    if (email) {
        email = email.toLowerCase().trim();
    }
    if (!email || !phoneCode) {
        return res.status(400).json({
            message: "All required fields: email and phoneCode",
        })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Invalid email address",
        })
    }

    try {
        const userExists = await prisma.users.findUnique({
            where: { email }
        })
        if (!userExists) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        
        if (userExists.status !== "ACTIVE") {
            return res.status(400).json({
                message: "User is not active",
            })
        }
        
        if (userExists.verificationCodePhone !== phoneCode) {
            return res.status(400).json({
                message: "Invalid verification code",
            })
        }

        if (userExists.verificationCodeExpiresPhone < new Date()) {
            return res.status(400).json({
                message: "Verification code has expired",
            })
        }
        else{
            await prisma.users.update({
                where: { id: userExists.id },
                data: {
                    verificationCodePhone: null,
                    verificationCodePhoneExpires: null,
                },
            })
            const token = jwt.sign({
                id: userExists.id,
                email: userExists.email,
                role: userExists.role
            }, process.env.JWT_SECRET,
                {
                    expiresIn: "2h"
                })
            res.status(200).json({
                message: "Two factor authentication successfull",
                token
            })
        }
    

    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        })
    }
}

const resendPhoneVerificationCode = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Email is required",
        });
    }

    try {
        const userExists = await prisma.users.findUnique({
            where: { email },
        });

        if (!userExists) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        
        const verificationCode = generateVerificationCode();
        sendSMSVerificationCode(userExists.fullname, userExists.phone, verificationCode);
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 15);

        await prisma.users.update({
            where: { id: userExists.id },
            data: {
                verificationCodePhone: verificationCode,
                verificationCodePhoneExpires: expirationTime,
            },
        });
        
        res.status(200).json({
            message: "Verification code to your phone number sent successfully, please check it out"
        })

    } catch (error) {
        console.log("Error resending code:", error);
        res.status(500).json({
            message: "Failed to resend verification code",
            error: error.message,
        });
    }
};

module.exports = {
    signUp,
    signIn,
    verifyCode,
    resendVerificationCode,
    twoFactorAuthentication,
    resendPhoneVerificationCode
}