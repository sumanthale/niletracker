import  { useState } from 'react';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

const AuthWrapper = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginScreen onSwitchToRegister={() => setIsLogin(false)} />
  ) : (
    <RegisterScreen onSwitchToLogin={() => setIsLogin(true)} />
  );
};

export default AuthWrapper;