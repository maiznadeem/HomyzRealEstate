import { useContext } from 'react'
import { useQuery } from 'react-query'

import { getAllFavourites } from '../utils/api'
import UserDetailsContext from '../context/UserDetailsContext'

const useFavourites = () => {

    const { userDetails, setUserDetails } = useContext(UserDetailsContext)

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: "allFavourites",
        queryFn: getAllFavourites,
        onSuccess: (data) => setUserDetails(prev => ({ ...prev, favourites: data ?? [] })),
        enabled: Boolean(userDetails?.registered),
        staleTime: 30000,
    })

    return { data, isError, isLoading, refetch }
}

export default useFavourites
