export const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

export const isAndroid = () => {
    return /Android/.test(navigator.userAgent)
}

export const supportsWebXR = async() => {
    if (!navigator.xr) return false
    try {
        return await navigator.xr.isSessionSupported('immersive-ar')
    } catch {
        return false
    }
}