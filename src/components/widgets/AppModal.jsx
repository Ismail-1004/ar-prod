import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import '../../assets/styles/AppModal.css'

function Modal({ card, onClose }) {
    const qrRef = useRef(null)
    const [step, setStep] = useState(1) // 1 = QR, 2 = маркер

    useEffect(() => {
        if (!qrRef.current) return
        const arUrl = `${window.location.origin}/ar/${card.id}`
        QRCode.toCanvas(qrRef.current, arUrl, {
            width: 200,
            margin: 2,
        })
    })

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal__title">{card.title}</h2>

                <div className='modal__top-borders'>
                    <div></div>
                    <div></div>
                </div>

                {/* Переключатель шагов */}
                <div className="modal__steps">
                    <button
                        className={`modal__step-btn ${step === 1 ? 'active' : ''}`}
                        onClick={() => setStep(1)}
                    >
                        1. Сканируй QR
                    </button>
                    <button
                        className={`modal__step-btn ${step === 2 ? 'active' : ''}`}
                        onClick={() => setStep(2)}
                    >
                        2. Наведи на маркер
                    </button>
                </div>

                {/* Шаг 1 — QR код */}
                {step === 1 && (
                    <div className="modal__content">
                        <p className="modal__hint">
                            Отсканируй QR-код камерой телефона
                        </p>
                        <div className="qr-code-container">
                            <canvas ref={qrRef} />
                        </div>
                        <button
                            className="modal__next-btn"
                            onClick={() => setStep(2)}
                        >
                            Далее →
                        </button>
                    </div>
                )}

                {/* Шаг 2 — маркер */}
                {step === 2 && (
                    <div className="modal__content">
                        <p className="modal__hint">
                            Наведи камеру телефона на эту картинку
                        </p>
                        <div className="marker-container">
                            <img
                                src={card.markerImage}
                                alt="AR маркер"
                                className="marker-image"
                            />
                        </div>
                        <button
                            className="modal__next-btn"
                            onClick={() => setStep(1)}
                        >
                            ← Назад
                        </button>
                    </div>
                )}

                <div className='modal__bottom-borders'>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>
    )
}

export default Modal