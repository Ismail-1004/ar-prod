import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import '../../assets/styles/AppModal.css'

function Modal({ card, onClose }) {
    const qrRef = useRef(null)
    const [step, setStep] = useState(1)
    const [mode, setMode] = useState('marker') // 'marker' | 'surface'
    const navigate = useNavigate()

    useEffect(() => {
        if (!qrRef.current) return
        if (step !== 1) return

        const arUrl = mode === 'marker'
            ? `${window.location.origin}/ar/${card.id}`
            : `${window.location.origin}/ar-surface/${card.id}`

        QRCode.toCanvas(qrRef.current, arUrl, { width: 200, margin: 2 })
    }, [card.id, mode, step])

    const handleSurfaceDirect = () => {
        onClose()
        navigate(`/ar-surface/${card.id}`)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal__title">{card.title}</h2>

                <div className='modal__top-borders'>
                    <div></div>
                    <div></div>
                </div>

                {/* Выбор режима AR */}
                <div className="modal__mode-toggle">
                    <button
                        className={`modal__mode-btn ${mode === 'marker' ? 'active' : ''}`}
                        onClick={() => { setMode('marker'); setStep(1) }}
                    >
                        По QR-маркеру
                    </button>
                    <button
                        className={`modal__mode-btn ${mode === 'surface' ? 'active' : ''}`}
                        onClick={() => { setMode('surface'); setStep(1) }}
                    >
                        На поверхность
                    </button>
                </div>

                {/* Переключатель шагов — только для marker режима */}
                {mode === 'marker' && (
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
                )}

                {/* MARKER MODE */}
                {mode === 'marker' && (
                    <>
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
                    </>
                )}

                {/* SURFACE MODE */}
                {mode === 'surface' && (
                    <div className="modal__content">
                        <p className="modal__hint">
                            Модель появится на любой плоской поверхности
                        </p>

                        {/* QR для открытия с другого устройства */}
                        <div className="qr-code-container">
                            <canvas ref={qrRef} />
                        </div>

                        <p className="modal__hint" style={{ marginTop: 8 }}>
                            Или открой прямо на этом устройстве
                        </p>

                        <button
                            className="modal__next-btn modal__next-btn--primary"
                            onClick={handleSurfaceDirect}
                        >
                            Открыть AR здесь
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