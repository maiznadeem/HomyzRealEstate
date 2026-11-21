import { useEffect } from "react"

const SITE = "Homyz Real Estate"

const useDocumentTitle = (title) => {
    useEffect(() => {
        document.title = title ? `${title} | ${SITE}` : SITE
    }, [title])
}

export default useDocumentTitle
