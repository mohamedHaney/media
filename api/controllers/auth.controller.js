import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(errorHandler(400, 'All fields are required'));
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);

  try {
    const newUser = await new User({ username, email, password: hashedPassword }).save();
    res.json('Signup successful');
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    const validUser = await User.findOne({ email });
    if (!validUser) {
      return next(errorHandler(404, 'User not found'));
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(errorHandler(400, 'Invalid password'));
    }

    const token = jwt.sign(
      { id: validUser._id, isAdmin: validUser.isAdmin },
      process.env.JWT_SECRET,
      
    );

    const { password: pass, ...rest } = validUser._doc;
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: true, // Cookie is sent only over HTTPS
      sameSite: "None", // Allows cookie to be sent across different domains
    }).status(200).json(rest);
    
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  const { email, name, googlePhotoUrl } = req.body;

  try {
    let user = await User.findOne({ email });
    let token;

    if (!user) {
      const generatedPassword = bcryptjs.hashSync(
        Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
        10
      );

      user = new User({
        username: name.toLowerCase().replace(/\s+/g, '') + Math.random().toString(36).slice(-4),
        email,
        password: generatedPassword,
        profilePicture: googlePhotoUrl,
      });

      await user.save();
    }

    token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      
    );

    const { password, ...rest } = user._doc;
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: true, // Cookie is sent only over HTTPS
      sameSite: "None", // Allows cookie to be sent across different domains
    }).status(200).json(rest);
    
  } catch (error) {
    next(error);
  }
};
