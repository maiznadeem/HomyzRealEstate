import { useContext } from 'react'
import { useQuery } from 'react-query'

import { getAllBookings } from '../utils/api'
import UserDetailsContext from '../context/UserDetailsContext'

const useBookings = () => {

    const { userDetails, setUserDetails } = useContext(UserDetailsContext)

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: "allBookings",
        queryFn: getAllBookings,
        onSuccess: (data) => setUserDetails(prev => ({ ...prev, bookings: data ?? [] })),
        enabled: Boolean(userDetails?.registered),
        staleTime: 30000,
    })

    return { data, isError, isLoading, refetch }
}

export default useBookings
