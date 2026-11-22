import React, { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { BiMenuAltRight, BiX } from 'react-icons/bi'
import OutsideClickHandler from 'react-outside-click-handler'
import { Link, NavLink, useLocation } from 'react-router'
import { useAuth0 } from '@auth0/auth0-react'
import { useMediaQuery } from '@mantine/hooks'

import ProfileMenu from '../ProfileMenu/ProfileMenu'
import useAuthCheck from '../../hooks/useAuthCheck'
import useLogin from '../../hooks/useLogin'

import './Header.css'

// Loaded on first use: the form brings the map (Leaflet) and the country list with it.
const AddPropertyModal = lazy(() => import('../AddPropertyModal/AddPropertyModal'))

const CONTACT_EMAIL = 'contact.maiznadeem@gmail.com'

const Header = () => {

    const [menuOpened, setMenuOpened] = useState(false)
    const [modalOpened, setModalOpened] = useState(false)
    // Once loaded, the form stays mounted so a half-finished draft survives closing it.
    const [modalLoaded, setModalLoaded] = useState(false)
    const { isAuthenticated, isLoading, user, logout } = useAuth0()
    const isPhone = useMediaQuery('(max-width: 768px)')
    const menuButton = useRef(null)
    const { validateLogin } = useAuthCheck()
    const login = useLogin()
    const { pathname } = useLocation()

    // Close the phone menu whenever the page changes.
    useEffect(() => { setMenuOpened(false) }, [pathname])

    // Escape closes the phone menu and returns focus to its button.
    useEffect(() => {
        if (!menuOpened) return
        const onKeyDown = (event) => {
            if (event.key !== 'Escape') return
            setMenuOpened(false)
            menuButton.current?.focus()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [menuOpened])

    const logOut = () => logout({ logoutParams: { returnTo: window.location.origin } })

    let account
    if (isLoading) {
        account = <span className="h-auth-placeholder" aria-hidden="true" />
    } else if (!isAuthenticated) {
        account = <button type="button" className="button" onClick={() => login()}>Log in</button>
    } else if (isPhone) {
        // In the phone panel the account items are plain rows, not a second popup.
        account = (
            <div className="h-account" role="group" aria-label="Account">
                <p className="h-account-label">{user?.name ?? user?.email}{user?.name && user?.email && <small>{user.email}</small>}</p>
                <NavLink to="/favourites">Favourites</NavLink>
                <NavLink to="/bookings">Bookings</NavLink>
                <button type="button" className="h-link" onClick={logOut}>Log out</button>
            </div>
        )
    } else {
        account = <ProfileMenu user={user} logout={logout} />
    }

    const handleAddPropertyClick = () => {
        setMenuOpened(false)
        if (!validateLogin()) return
        setModalLoaded(true)
        setModalOpened(true)
    }

    return (
        <header className="h-wrapper">
            <div className="h-container paddings innerWidth">
                <Link to="/" className="h-logo" aria-label="Homyz home">
                    <img src="/logo.png" alt="Homyz" width={100} height={38} />
                </Link>
                <OutsideClickHandler onOutsideClick={() => setMenuOpened(false)}>
                    <nav id="main-menu" className={`h-menu ${menuOpened ? 'h-menu--open' : ''}`} aria-label="Main">
                        <NavLink to="/properties">Properties</NavLink>
                        <button type="button" className="h-link" onClick={handleAddPropertyClick}>Add property</button>
                        <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
                        {account}
                    </nav>
                    <button
                        type="button"
                        ref={menuButton}
                        className="menu-icon"
                        aria-label={menuOpened ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpened}
                        aria-controls="main-menu"
                        onClick={() => setMenuOpened((prev) => !prev)}
                    >
                        {menuOpened ? <BiX size={28} /> : <BiMenuAltRight size={28} />}
                    </button>
                </OutsideClickHandler>
                {modalLoaded && (
                    <Suspense fallback={null}>
                        <AddPropertyModal opened={modalOpened} setOpened={setModalOpened} />
                    </Suspense>
                )}
            </div>
        </header>
    )
}

export default Header
