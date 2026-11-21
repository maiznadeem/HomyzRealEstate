import React, { useContext } from 'react'
import { AiFillHeart } from 'react-icons/ai'
import { useMutation } from 'react-query'

import useAuthCheck from '../../hooks/useAuthCheck'
import UserDetailsContext from '../../context/UserDetailsContext'
import { toFavourites } from '../../utils/api'
import { updateFavourites } from '../../utils/common'

import './Heart.css'

const Heart = ({ id, className = '' }) => {

    const { validateLogin } = useAuthCheck()
    const { userDetails: { favourites }, setUserDetails } = useContext(UserDetailsContext)
    const saved = Boolean(favourites?.includes(id))

    const { mutate, isLoading } = useMutation({
        mutationFn: () => toFavourites(id),
        onSuccess: () => {
            setUserDetails( prev => ({
                ...prev,
                favourites: updateFavourites(id, prev.favourites)
            }))
        }
    })

    return (
        <button
            type="button"
            className={`heart ${saved ? 'heart--saved' : ''} ${className}`}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
            disabled={isLoading}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (validateLogin()) mutate()
            }}
        >
            <AiFillHeart size={22} aria-hidden="true" />
        </button>
    )
}

export default Heart
