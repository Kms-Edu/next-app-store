import React from 'react';
import GoogleLogin from 'react-google-login';

const Login = ({
  clientId,
  render,
  onLoginSuccess,
  onLoginFailure,
  buttonText = "Login"
}) => {
  return (
    <GoogleLogin
      clientId={clientId}
      render={render}
      buttonText={buttonText}
      onSuccess={onLoginSuccess}
      onFailure={onLoginFailure}
    />
  )
}

export default Login
