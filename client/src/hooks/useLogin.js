import { useCallback } from "react"
import { useAuth0 } from "@auth0/auth0-react"

export const RETURN_TO_KEY = "homyz:returnTo"

// Log in and come back to the current page afterwards (Layout handles the return).
const useLogin = () => {
    const { loginWithRedirect } = useAuth0()
    return useCallback(() => {
        try {
            sessionStorage.setItem(RETURN_TO_KEY, window.location.pathname + window.location.search)
        } catch { /* storage unavailable: land on the home page instead */ }
        return loginWithRedirect()
    }, [loginWithRedirect])
}

export default useLogin
