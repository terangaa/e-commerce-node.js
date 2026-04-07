const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models').User;
const jwt = require('jsonwebtoken');

// Configuration Passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configuration Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Vérifier si l'utilisateur existe déjà
      let user = await User.findOne({ where: { googleId: profile.id } });
      
      if (user) {
        return done(null, user);
      }
      
      // Vérifier si l'email existe déjà
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (email) {
        user = await User.findOne({ where: { email } });
        if (user) {
          // Lier le compte Google à l'utilisateur existant
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }
      }
      
      // Créer un nouvel utilisateur
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName || 'Utilisateur Google',
        email: email,
        emailVerified: true,
        role: 'customer'
      });
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Configuration Facebook OAuth
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Vérifier si l'utilisateur existe déjà
      let user = await User.findOne({ where: { facebookId: profile.id } });
      
      if (user) {
        return done(null, user);
      }
      
      // Vérifier si l'email existe déjà
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (email) {
        user = await User.findOne({ where: { email } });
        if (user) {
          // Lier le compte Facebook à l'utilisateur existant
          user.facebookId = profile.id;
          await user.save();
          return done(null, user);
        }
      }
      
      // Créer un nouvel utilisateur
      user = await User.create({
        facebookId: profile.id,
        name: profile.displayName || 'Utilisateur Facebook',
        email: email,
        emailVerified: true,
        role: 'customer'
      });
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Fonctions du contrôleur
const socialAuthController = {
  // Afficher la page de connexion sociale
  showSocialLogin: (req, res) => {
    res.render('auth/socialLogin', { 
      error: req.query.error || null,
      success: req.query.success || null
    });
  },
  
  // Initier la connexion Google
  googleAuth: passport.authenticate('google', { scope: ['profile', 'email'] }),
  
  // Callback Google
  googleCallback: (req, res, next) => {
    passport.authenticate('google', { failureRedirect: '/auth/social?error=google_auth_failed' }, (err, user) => {
      if (err) {
        console.error('Erreur Google OAuth:', err);
        return res.redirect('/auth/social?error=google_auth_error');
      }
      
      if (!user) {
        return res.redirect('/auth/social?error=google_auth_failed');
      }
      
      // Connecter l'utilisateur
      req.logIn(user, (err) => {
        if (err) {
          console.error('Erreur de connexion:', err);
          return res.redirect('/auth/social?error=login_error');
        }
        
        // Générer un token JWT
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );
        
        // Stocker le token dans la session
        req.session.token = token;
        req.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
        
        res.redirect('/?success=google_login_success');
      });
    })(req, res, next);
  },
  
  // Initier la connexion Facebook
  facebookAuth: passport.authenticate('facebook', { scope: ['email'] }),
  
  // Callback Facebook
  facebookCallback: (req, res, next) => {
    passport.authenticate('facebook', { failureRedirect: '/auth/social?error=facebook_auth_failed' }, (err, user) => {
      if (err) {
        console.error('Erreur Facebook OAuth:', err);
        return res.redirect('/auth/social?error=facebook_auth_error');
      }
      
      if (!user) {
        return res.redirect('/auth/social?error=facebook_auth_failed');
      }
      
      // Connecter l'utilisateur
      req.logIn(user, (err) => {
        if (err) {
          console.error('Erreur de connexion:', err);
          return res.redirect('/auth/social?error=login_error');
        }
        
        // Générer un token JWT
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );
        
        // Stocker le token dans la session
        req.session.token = token;
        req.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
        
        res.redirect('/?success=facebook_login_success');
      });
    })(req, res, next);
  },
  
  // Déconnexion
  logout: (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Erreur de déconnexion:', err);
      }
      req.session.destroy(() => {
        res.redirect('/');
      });
    });
  },
  
  // Lier un compte social
  linkAccount: async (req, res) => {
    try {
      const { provider, providerId } = req.body;
      const userId = req.user.id;
      
      if (!provider || !providerId) {
        return res.status(400).json({ error: 'Provider et providerId sont requis' });
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      // Mettre à jour le compte social
      if (provider === 'google') {
        user.googleId = providerId;
      } else if (provider === 'facebook') {
        user.facebookId = providerId;
      } else {
        return res.status(400).json({ error: 'Provider non supporté' });
      }
      
      await user.save();
      
      res.json({ success: true, message: `Compte ${provider} lié avec succès` });
    } catch (error) {
      console.error('Erreur lors de la liaison du compte:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },
  
  // Délier un compte social
  unlinkAccount: async (req, res) => {
    try {
      const { provider } = req.body;
      const userId = req.user.id;
      
      if (!provider) {
        return res.status(400).json({ error: 'Provider est requis' });
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      // Vérifier que l'utilisateur a un mot de passe ou un autre moyen de connexion
      if (!user.password && !user.googleId && !user.facebookId) {
        return res.status(400).json({ error: 'Vous devez avoir un mot de passe ou un autre moyen de connexion pour délier ce compte' });
      }
      
      // Délier le compte social
      if (provider === 'google') {
        user.googleId = null;
      } else if (provider === 'facebook') {
        user.facebookId = null;
      } else {
        return res.status(400).json({ error: 'Provider non supporté' });
      }
      
      await user.save();
      
      res.json({ success: true, message: `Compte ${provider} délié avec succès` });
    } catch (error) {
      console.error('Erreur lors de la déliaison du compte:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

module.exports = socialAuthController;
