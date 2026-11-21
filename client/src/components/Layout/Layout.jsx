import React, { useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { toast } from 'react-toastify'

import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import { createUser, errorMessage, setAccessTokenGetter } from '../../utils/api'
import UserDetailsContext from '../../context/UserDetailsContext'
import useFavourites from '../../hooks/useFavourites'
import useBookings from '../../hooks/useBookings'

const RELOGIN_ERRORS = ['login_required', 'consent_required', 'missing_refresh_token', 'invalid_grant']

const Layout = () => {

    useFavourites()
    useBookings()

    const { isAuthenticated, user, getAccessTokenSilently, loginWithRedirect } = useAuth0()
    const { setUserDetails } = useContext(UserDetailsContext)

    useEffect(() => {
        if (!isAuthenticated) {
            setAccessTokenGetter(null)
            return
        }
        let cancelled = false
        setAccessTokenGetter(() => getAccessTokenSilently())
        createUser()
            .then(() => !cancelled && setUserDetails((prev) => ({ ...prev, registered: true })))
            .catch((error) => {
                // Auth0 could not renew the session silently: send the user to log in again.
                if (RELOGIN_ERRORS.includes(error?.error)) return loginWithRedirect()
                console.error("Could not sign in to the Homyz API:", error)
                toast.error(errorMessage(error, "Could not finish signing in. Please log in again."), { position: "bottom-right" })
            })
        return () => { cancelled = true }
    }, [isAuthenticated, user?.sub, getAccessTokenSilently, loginWithRedirect, setUserDetails])

    return (
        <>
            <div style={{ background: "var(--black)" }}>
                <Header />
                <Outlet />
            </div>
            <Footer />
        </>
    )
}

export default Layout
