import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

import '../../assets/styles/AppModal.css'

function Modal({ card, onClose }) {
    const qrRef = useRef(null)

    useEffect(() => {
        if (!qrRef.current) return

        const arUrl = `${window.location.origin}/ar/${card.id}`

        QRCode.toCanvas(qrRef.current, arUrl, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        })
    }, [card.id])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="modal__title">{card.title}</h2>

                <div className='modal__top-borders'>
                    <div></div>
                    <div></div>
                </div>

                <div className="qr-code-container">
                    <canvas ref={qrRef} />
                    <p className='qr-hint'> Наведите камеру на QR код </p>
                </div>

                <div className='modal__bottom-borders'>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>
    )
}

export default Modal