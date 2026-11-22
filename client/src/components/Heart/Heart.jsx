import React, { useContext } from 'react'
import { AiFillHeart } from 'react-icons/ai'
import { useMutation } from 'react-query'
import { useLocation } from 'react-router'
import { toast } from 'react-toastify'

import useAuthCheck from '../../hooks/useAuthCheck'
import UserDetailsContext from '../../context/UserDetailsContext'
import { toFavourites } from '../../utils/api'
import { updateFavourites } from '../../utils/common'

import './Heart.css'

const Heart = ({ id, className = '' }) => {

    const { validateLogin } = useAuthCheck()
    const { userDetails: { favourites }, setUserDetails } = useContext(UserDetailsContext)
    const { pathname } = useLocation()
    const saved = Boolean(favourites?.includes(id))

    const toggleLocally = () => setUserDetails( prev => ({
        ...prev,
        favourites: updateFavourites(id, prev.favourites)
    }))

    // The card disappears from /favourites once it is removed, so offer a way back.
    const offerUndo = () => {
        const undo = async (closeToast) => {
            closeToast?.()
            try {
                await toFavourites(id)
                setUserDetails(prev => prev.favourites?.includes(id) ? prev : { ...prev, favourites: updateFavourites(id, prev.favourites) })
            } catch { /* toFavourites already showed the error */ }
        }
        toast(({ closeToast }) => (
            <span>
                Removed from favourites.{' '}
                <button type="button" onClick={() => undo(closeToast)} style={{ marginLeft: '0.5rem', padding: '0.15rem 0.6rem', border: '1px solid currentColor', borderRadius: 4, background: 'transparent', color: 'inherit', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>Undo</button>
            </span>
        ), { position: "bottom-right", autoClose: 6000 })
    }

    const { mutate, isLoading } = useMutation({
        mutationFn: () => toFavourites(id),
        onSuccess: (_, wasSaved) => {
            toggleLocally()
            if (wasSaved && pathname === '/favourites') offerUndo()
        }
    })

    return (
        <button
            type="button"
            className={`heart ${saved ? 'heart--saved' : ''} ${className}`}
            aria-pressed={saved}
            aria-label="Save to favourites"
            disabled={isLoading}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (validateLogin()) mutate(saved)
            }}
        >
            <AiFillHeart size={22} aria-hidden="true" />
        </button>
    )
}

export default Heart
