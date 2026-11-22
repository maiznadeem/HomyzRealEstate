import { createContext } from "react"

const UserDetailsContext = createContext()

// Layout registers the signed-in user with the API whenever `registerAttempt` changes.
// A failed registration is kept as `registerError` ({ status, message }) so pages can show it.
export const retryRegistration = (setUserDetails) =>
    setUserDetails((prev) => ({ ...prev, registerError: null, registerAttempt: (prev.registerAttempt ?? 0) + 1 }))

export default UserDetailsContext
