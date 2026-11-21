import React, { useContext, useEffect, useState } from 'react'
import { AiFillHeart } from 'react-icons/ai'
import { useMutation } from 'react-query'

import useAuthCheck from '../../hooks/useAuthCheck'
import UserDetailsContext from '../../context/UserDetailsContext'
import { toFavourites } from '../../utils/api'
import { checkFavourites, updateFavourites } from '../../utils/common'

const Heart = ({ id }) => {

    const [heartColor, setHeartColor] = useState('white')
    const { validateLogin } = useAuthCheck()
    const { userDetails: { favourites }, setUserDetails } = useContext(UserDetailsContext)

    const { mutate } = useMutation({
        mutationFn: () => toFavourites(id),
        onSuccess: () => {
            setUserDetails( prev => ({
                ...prev,
                favourites: updateFavourites(id, prev.favourites)
            }))
        }
    })

    const handleLike = () => {
        if (validateLogin()) {
            mutate()
        }
    }

    useEffect (() => {
        setHeartColor(() => checkFavourites(id, favourites))
    }, [favourites])

    return (
        <AiFillHeart
            size={24}
            color={heartColor}
            onClick={(e) => {
                e.stopPropagation()
                handleLike()
            }} 
        />
    )
}

export default Heart