import User from '../models/userSchema.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export const register = async (req,res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      password,
      
    } = req.body;

    // 1. Validate input
if (!phone ||!role  || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2. Normalize input
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone=phone.trim();

   { // 3. Check existing user
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
    

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // // 6. Generate verification token
    // const verificationToken = crypto
    //   .randomBytes(32)
    //   .toString("hex");

    // // Token expires after 24 hours
    // const verificationExpires = new Date(
    //   Date.now() + 24 * 60 * 60 * 1000
    // );
  
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
   
    

   
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone:normalizedPhone,
      password: hashedPassword,
      role: role
    });

    
    // 9. Send verification email
    // await sendVerificationEmail(
    //   normalizedEmail,
    //   verificationToken,
    //   frontendUrl,
    // );

    // 10. Response
    return res.status(201).json({
      success: true,
      message:
        "Registration successful.",
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

            staus:user.status
    
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