const Users = require('../models/userModel')
const bcrypt = require ('bcrypt') 
const jwt = require ('jsonwebtoken')


const userCtrl = {
        //register User
    register : async (req,res) => {
        try {
            const {name,email,password} = req.body;

            const user = await Users.findOne({email})
                //check email
            if(user) 
                return res.status(400).json({msg: "this email already exist !"})
                
                //check Password
            if (password.length<6)
                return res.status(400).json({msg:"password is at least 6 characters long !"})
                
                //hash passwords (cryptage)
            const passwordHash = await bcrypt.hash(password, 10)
                
                //create user account
            const newUser = new Users ({
                name , email , password:passwordHash
            })
                
                //save user in DB 
            await newUser.save()
                
                //create JWToken to authentification
            const accesstoken = createAccessToken({id: newUser._id})
            const refreshtoken = createRefreshToken({id: newUser._id})
            
            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true ,
                path: '/user/refresh_token'
            })
            
            res.json({accesstoken}) 
        }  catch(err){
            return res.status(500).json({msg: err.message})
        }
    },

        //login User
    login : async (req,res) => {
        try {
            const {email , password} = req.body;
                //check user.Email exist or not 
            const user = await Users.findOne({email})
            if(!user) return res.status(400).json({msg:"Email not found , Please register before"})
                //check user.password true or false
            const isMatch = await bcrypt.compare(password , user.password)
            if (!isMatch) return res.status(400).json({msg:"wrong password"}) 
                //If login success , create access token and refresh token 
            const accesstoken = createAccessToken({id: user._id})
            const refreshtoken = createRefreshToken({id: user._id})
            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true ,
                path: '/user/refresh_token'
            })
            res.json({accesstoken})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    
        //refreshToken 
    refreshToken: (req,res) => {
        try{
            const rf_token = req.cookies.refreshtoken;
            if(!rf_token)
                return res.status(400).json({msg: " Please Login or Register"})
            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err) return res.status(400).json({msg: " Please Login or Register"})
                const accesstoken = createAccessToken ({id: user.id})
                res.json ({accesstoken })
            })
        }
        catch(err){
            return res.status(500).json({msg: err.message})
        }
    }

}

const createAccessToken = (user)=>{
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '1d'})
}

const createRefreshToken = (user)=>{
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn : '7d'})
}



module.exports = userCtrl