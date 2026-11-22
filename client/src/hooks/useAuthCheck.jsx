import { useContext } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { toast } from 'react-toastify'

import UserDetailsContext from '../context/UserDetailsContext'
import useLogin from './useLogin'

// validateLogin() returns true when the person can act. Otherwise it sends them to log in
// (coming back to `returnTo`, default: this page) or says what is wrong with their account.
const useAuthCheck = () => {

    const { isAuthenticated, isLoading } = useAuth0()
    const { userDetails } = useContext(UserDetailsContext)
    const login = useLogin()

    const validateLogin = (returnTo) => {
        if (isLoading) {
            toast.info("Checking your login… try again in a moment.", { position: "bottom-right" })
            return false
        }
        if (!isAuthenticated) {
            login(returnTo)
            return false
        }
        if (userDetails?.registerError) {
            toast.error(userDetails.registerError.message, { position: "bottom-right" })
            return false
        }
        return true
    }

    return ({ validateLogin })
}

export default useAuthCheck
