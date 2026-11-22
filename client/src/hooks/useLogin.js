import { useCallback } from "react"
import { useAuth0 } from "@auth0/auth0-react"

export const RETURN_TO_KEY = "homyz:returnTo"

// Only same-site paths may be used as a return target (no open redirects).
export const isSafeReturnPath = (path) => typeof path === "string" && path.startsWith("/") && !path.startsWith("//")

// Log in and come back afterwards (Layout handles the return). Without a path,
// the person returns to the page they are on now.
const useLogin = () => {
    const { loginWithRedirect } = useAuth0()
    return useCallback((returnTo) => {
        const target = isSafeReturnPath(returnTo) ? returnTo : window.location.pathname + window.location.search
        try {
            sessionStorage.setItem(RETURN_TO_KEY, target)
        } catch { /* storage unavailable: land on the home page instead */ }
        return loginWithRedirect()
    }, [loginWithRedirect])
}

export default useLogin
