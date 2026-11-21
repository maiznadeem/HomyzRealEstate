import React, { useEffect, useState } from 'react'
import { BiMenuAltRight, BiX } from 'react-icons/bi'
import OutsideClickHandler from 'react-outside-click-handler'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

import ProfileMenu from '../ProfileMenu/ProfileMenu'
import AddPropertyModal from '../AddPropertyModal/AddPropertyModal'
import useAuthCheck from '../../hooks/useAuthCheck'
import useLogin from '../../hooks/useLogin'

import './Header.css'

const CONTACT_EMAIL = 'contact.maiznadeem@gmail.com'

const Header = () => {

    const [menuOpened, setMenuOpened] = useState(false)
    const [modalOpened, setModalOpened] = useState(false)
    const { isAuthenticated, user, logout } = useAuth0()
    const { validateLogin } = useAuthCheck()
    const login = useLogin()
    const { pathname } = useLocation()

    // Close the phone menu whenever the page changes.
    useEffect(() => { setMenuOpened(false) }, [pathname])

    const handleAddPropertyClick = () => {
        setMenuOpened(false)
        if (validateLogin()) setModalOpened(true)
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
                        {!isAuthenticated
                            ? <button type="button" className="button" onClick={login}>Log in</button>
                            : <ProfileMenu user={user} logout={logout} />}
                    </nav>
                    <button
                        type="button"
                        className="menu-icon"
                        aria-label={menuOpened ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpened}
                        aria-controls="main-menu"
                        onClick={() => setMenuOpened((prev) => !prev)}
                    >
                        {menuOpened ? <BiX size={28} /> : <BiMenuAltRight size={28} />}
                    </button>
                </OutsideClickHandler>
                <AddPropertyModal opened={modalOpened} setOpened={setModalOpened} />
            </div>
        </header>
    )
}

export default Header
