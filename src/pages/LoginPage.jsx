import React, { useState, useEffect, useCallback } from "react";
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; // Ensure these are correctly set up in your firebase.js
import { doc, setDoc } from 'firebase/firestore';
import "./Styles.css";
import { Transition } from 'react-transition-group';
import { useSpring, animated } from 'react-spring';

function TypewriterText({ text, onComplete }) {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 100); // Adjust typing speed here

      return () => clearTimeout(timeoutId);
    } else if (index === text.length) {
      onComplete(); // Call onComplete when typing is done
    }
  }, [index, text, onComplete]);

  return <span>{displayText}</span>;
}

function AnimatedText({ text1, text2, text3 }) {
  const [currentText, setCurrentText] = useState(text1); // Start with text1
  const [key, setKey] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const props = useSpring({
    opacity: 1,
    from: { opacity: 0 },
    reset: true,
  });

  const handleTypingComplete = useCallback(() => {
    setIsTypingComplete(true);
  }, []);

  useEffect(() => {
    let timeoutId;
    if (isTypingComplete) {
      timeoutId = setTimeout(() => {
        setCurrentText((prevText) => {
          if (prevText === text1) return text2;
          if (prevText === text2) return text3;
          return text1; // Loop back to text1
        });
        setKey((prevKey) => prevKey + 1); // Force re-render of TypewriterText
        setIsTypingComplete(false); // Reset typing completion
      }, 2000); // 2-second delay after typing is complete
    }
    return () => clearTimeout(timeoutId);
  }, [isTypingComplete, text1, text2, text3]);

  return (
    <Transition in={true} timeout={1000}>
      {(state) => (
        <animated.h2 style={props}>
          <TypewriterText
            key={key}
            text={currentText}
            onComplete={handleTypingComplete}
          />
        </animated.h2>
      )}
    </Transition>
  );
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create or update user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        lastLogin: new Date(),
        // Add other user-specific data as needed
      }, { merge: true }); // Merge allows updating existing documents

      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      navigate('/dashboard');
    } catch (err) {
      setError('Could not log in anonymously. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="animation-text">
        <AnimatedText text1="Welcome!" text2="AskMedi Ai" text3="You Can Ask Anything" />
      </div>
      <h3>Login</h3>
      <form onSubmit={handleLogin}>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='username or email'
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='password'
          />
        </div>
        <div className="submit-move">
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit">Continue</button>
          <button type="button" onClick={handleAnonymousLogin}>Log In As Guest</button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
