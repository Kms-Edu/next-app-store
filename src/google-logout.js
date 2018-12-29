import React from 'react'
import { GoogleLogout } from 'react-google-login';
const Logout = ({
  onLogoutSuccess,
  buttonText = "Logout",
  render
}) => {
  return (
    <GoogleLogout
      buttonText={buttonText}
      onLogoutSuccess={onLogoutSuccess}
      render={render}
    />
  )
}

export default Logout
