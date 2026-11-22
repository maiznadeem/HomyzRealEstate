import React, { useContext, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth0 } from '@auth0/auth0-react'

import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import { createUser, errorMessage, setAccessTokenGetter } from '../../utils/api'
import UserDetailsContext from '../../context/UserDetailsContext'
import useFavourites from '../../hooks/useFavourites'
import useBookings from '../../hooks/useBookings'
import useLogin, { RETURN_TO_KEY, isSafeReturnPath } from '../../hooks/useLogin'

import './Layout.css'

const RELOGIN_ERRORS = ['login_required', 'consent_required', 'missing_refresh_token', 'invalid_grant']

const Layout = () => {

    useFavourites()
    useBookings()

    const { isAuthenticated, user, getAccessTokenSilently } = useAuth0()
    const login = useLogin()
    const { userDetails, setUserDetails } = useContext(UserDetailsContext)
    const registerAttempt = userDetails.registerAttempt ?? 0
    const navigate = useNavigate()
    const { pathname } = useLocation()

    useEffect(() => {
        if (!isAuthenticated) {
            setAccessTokenGetter(null)
            return
        }
        let cancelled = false
        setAccessTokenGetter(() => getAccessTokenSilently())
        createUser()
            .then(() => !cancelled && setUserDetails((prev) => ({ ...prev, registered: true, registerError: null })))
            .catch((error) => {
                if (cancelled) return
                // Auth0 could not renew the session silently: send the user to log in again.
                if (RELOGIN_ERRORS.includes(error?.error)) return login()
                console.error("Could not sign in to the Homyz API:", error)
                const status = error?.response?.status
                const message = status === 403
                    ? errorMessage(error, "Please verify your email address, then log in again.")
                    : errorMessage(error, "Could not finish signing in. Please try again.")
                setUserDetails((prev) => ({ ...prev, registered: false, registerError: { status, message } }))
            })
        return () => { cancelled = true }
    }, [isAuthenticated, user?.sub, getAccessTokenSilently, login, setUserDetails, registerAttempt])

    // After logging in, go back to the page the person logged in from.
    useEffect(() => {
        if (!isAuthenticated) return
        let returnTo = null
        try {
            returnTo = sessionStorage.getItem(RETURN_TO_KEY)
            sessionStorage.removeItem(RETURN_TO_KEY)
        } catch { /* storage unavailable */ }
        if (isSafeReturnPath(returnTo)) navigate(returnTo, { replace: true })
    }, [isAuthenticated, navigate])

    // Start each page at the top.
    useEffect(() => { window.scrollTo(0, 0) }, [pathname])

    return (
        <div className="layout">
            <a className="skip-link" href="#main">Skip to content</a>
            <Header />
            <main id="main" className="layout-main">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default Layout
