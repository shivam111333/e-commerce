import User from '../models/userSchema.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'
import sendVerificationEmail from '../utils/sendVerificationEmail.js';


export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOneAndUpdate(
      {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpires: { $gt: new Date() },
        isEmailVerified: false,
      },
      {
        $set: { isEmailVerified: true },
        $unset: {
          emailVerificationTokenHash: "",
          emailVerificationExpires: "",
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OR_EXPIRED_VERIFICATION_TOKEN",
        message: "This verification link is invalid, expired, or already used.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("EMAIL VERIFICATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying your email.",
    });
  }
};
export const register = async (req,res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      password,
      
    } = req.body;

    
if (!phone ||!role  || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone=phone.trim();

   {
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    const existingContactNo=await User.findOne({
      phone:normalizedPhone,
    })


    if (existingUser ) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    if(existingContactNo)
    {
        return res.status(409).json({
            success:false,
            message:"Phone Number already registered"
        })
    }

   
}
    

   
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto
      .randomBytes(32)
      .toString("hex");
    const emailVerificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Token expires after 24 hours
    const verificationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );
  
    //TO Avoid sending role:admin from postman 
    const allowedRoles= ["user" , "vendor"];
    if(!allowedRoles.includes(role))
    {
        return res.status(400).json(
            {
                success:false,
                message:"Invalid role"
            }
        )
    
    }
   
    

   
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone:normalizedPhone,
      password: hashedPassword,
      role: role,
      isEmailVerified:false,
      emailVerificationTokenHash,
      emailVerificationExpires: verificationExpires,
      
    });

    try {
      await sendVerificationEmail(normalizedEmail, verificationToken);
    } catch (emailError) {
      console.error("VERIFICATION EMAIL ERROR:", emailError);

      return res.status(503).json({
        success: false,
        code: "VERIFICATION_EMAIL_FAILED",
        message:
          "Your account was created, but the verification email could not be sent. Please try again later.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
    });

  } catch (error) {
    console.error(
      "REGISTRATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong during registration",
    });
  }
};

export const login=async(req,res)=>{

     try {
        const {
          email,
          password,
        } = req.body;
    
        
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message:
              "Email and password are required",
          });
        }
    
    
        const normalizedEmail =
          email.toLowerCase().trim();
    
        
     
        const user = await User.findOne({
          email: normalizedEmail,
        });
    
        if (!user) {
          return res.status(401).json({
            success: false,
            message:
              "Invalid email or password",
          });
        }
    
      
    
        if (user.status==="blocked") {
          return res.status(403).json({
            success: false,
            message:
              "your account has been  blocked",
          });
        }
    
    
        const passwordMatch =
          await bcrypt.compare(
            password,
            user.password
          );
    
        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            message:
              "Invalid email or password",
          });
        }
    

    
        
    
        if (!process.env.JWT_SECRET) {
          console.error(
            "JWT_SECRET is missing from .env"
          );
    
          return res.status(500).json({
            success: false,
            message:
              "Server configuration error",
          });
        }
    
        
    
        const token = jwt.sign(
          {
            userId: user._id.toString(),
    
            role: user.role,
          },
    
          process.env.JWT_SECRET,
    
          {
            expiresIn: "1d",
          }
        );
    
    
        return res.status(200).json({
          success: true,
    
          message: "Login successful",
    
          token,
    
          user: {
            id: user._id,
    
            name: user.name,
    
            email: user.email,

            phone:user.phone,
    
            role: user.role,

            status:user.status
    
          },
        });
      } catch (error) {
        console.error(
          "LOGIN ERROR:",
          error
        );
    
        return res.status(500).json({
          success: false,
          message:
            "Something went wrong during login",
        });
      }

}

