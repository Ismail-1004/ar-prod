import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cards } from '../data/cards'
import { isIOS, isAndroid, supportsWebXR } from '../utils/device'

function ARSurfacePage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const [status, setStatus] = useState('loading') // loading | ios | webxr | unsupported
    const [placed, setPlaced] = useState(false)
    const xrSessionRef = useRef(null)

    const card = cards.find(c => c.id === Number(id))

    useEffect(() => {
        if (!card) return

        const init = async () => {
            if (isIOS()) {
                setStatus('ios')
                return
            }

            if (isAndroid()) {
                const supported = await supportsWebXR()
                if (supported) {
                    setStatus('webxr')
                    startWebXR()
                } else {
                    setStatus('unsupported')
                }

                return
            }

            const supported = await supportsWebXR()
            setStatus(supported ? 'webxr' : 'unsupported')

            if (supported) startWebXR()
        }

        init()

        return () => {
            if (xrSessionRef.current) {
                xrSessionRef.current.end().catch(() => { })
                xrSessionRef.current = null
            }
        }
    }, [card])

    async function startWebXR() {
        const THREE = window.MINDAR.IMAGE.THREE

        const canvas = canvasRef.current
        const gl = canvas.getContext('webgl2', { xrCompatible: true })
        if (!gl) { setStatus('unsupported'); return }

        const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.xr.enabled = true

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

        // Освещение
        scene.add(new THREE.AmbientLight(0xffffff, 0.8))
        const dirLight = new THREE.DirectionalLight(0xffffff, 2)
        dirLight.position.set(1, 2, 1)
        scene.add(dirLight)

        // Reticle (кольцо-прицел на плоскости)
        const reticleGeo = new THREE.RingGeometry(0.05, 0.07, 32)
        reticleGeo.rotateX(-Math.PI / 2)
        const reticle = new THREE.Mesh(
            reticleGeo,
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        )
        reticle.matrixAutoUpdate = false
        reticle.visible = false
        scene.add(reticle)

        // Загрузка модели
        const loader = new window.THREE.GLTFLoader()
        let modelGroup = null

        loader.load(card.modelSrc, (gltf) => {
            const model = gltf.scene
            const box = new THREE.Box3().setFromObject(model)
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            model.scale.setScalar(0.3 / maxDim)

            const center = box.getCenter(new THREE.Vector3())
            model.position.y = -center.y * (0.3 / maxDim)

            modelGroup = new THREE.Group()
            modelGroup.add(model)
            modelGroup.visible = false
            scene.add(modelGroup)

            // Анимации
            if (gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model)
                mixer.clipAction(gltf.animations[0]).play()
                modelGroup.userData.mixer = mixer
            }
        })

        // Запуск XR сессии
        let xrSession
        try {
            xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.getElementById('ar-surface-overlay') }
            })
        } catch (e) {
            console.error('XR session error:', e)
            setStatus('unsupported')
            return
        }

        xrSessionRef.current = xrSession
        renderer.xr.setSession(xrSession)

        const viewerSpace = await xrSession.requestReferenceSpace('viewer')
        const hitTestSource = await xrSession.requestHitTestSource({ space: viewerSpace })
        const localSpace = await xrSession.requestReferenceSpace('local')

        let isPlaced = false
        const clock = new THREE.Clock()

        // Тап — размещаем модель
        xrSession.addEventListener('select', () => {
            if (reticle.visible && modelGroup && !isPlaced) {
                modelGroup.position.setFromMatrixPosition(reticle.matrix)
                modelGroup.visible = true
                isPlaced = true
                setPlaced(true)
            }
        })

        xrSession.addEventListener('end', () => {
            xrSessionRef.current = null
        })

        renderer.setAnimationLoop((timestamp, frame) => {
            if (!frame) return

            const delta = clock.getDelta()

            if (!isPlaced) {
                const hits = frame.getHitTestResults(hitTestSource)
                if (hits.length > 0) {
                    const pose = hits[0].getPose(localSpace)
                    reticle.visible = true
                    reticle.matrix.fromArray(pose.transform.matrix)
                } else {
                    reticle.visible = false
                }
            }

            if (modelGroup?.userData.mixer) {
                modelGroup.userData.mixer.update(delta)
            }

            renderer.render(scene, camera)
        })
    }

    if (!card) return <div>Карточка не найдена</div>

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000' }}>
            {status === 'webxr' && (
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                />
            )}

            {status === 'ios' && (
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    height: '100%', gap: 24, padding: 32
                }}>
                    <img
                        src={card.image}
                        alt={card.title}
                        style={{ width: 200, height: 200, objectFit: 'contain', borderRadius: 16 }}
                    />
                    <h2 style={{ color: '#fff', margin: 0 }}>{card.title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: 0 }}>
                        Нажми кнопку чтобы открыть модель в AR
                    </p>

                    <a href={card.usdzSrc}
                        rel="ar"
                        style={{ textDecoration: 'none' }}
                    >
                        <img src={card.image} alt="" style={{ display: 'none' }} />
                        <div style={{
                            background: '#fff', color: '#000',
                            padding: '14px 32px', borderRadius: 12,
                            fontSize: 16, fontWeight: 500, cursor: 'pointer'
                        }}>
                            Открыть в AR
                        </div>
                    </a>

                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                        Только для iPhone / iPad
                    </p>
                </div>
            )}

            {status === 'unsupported' && (
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    height: '100%', gap: 16, padding: 32
                }}>
                    <p style={{ color: '#fff', textAlign: 'center' }}>
                        Surface AR не поддерживается на этом устройстве.
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>
                        Android: требуется Chrome с поддержкой ARCore{'\n'}
                        iOS: требуется файл .usdz
                    </p>
                </div>
            )}

            <div id="ar-surface-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {status === 'webxr' && !placed && (
                    <div style={{
                        position: 'absolute', bottom: 100,
                        left: '50%', transform: 'translateX(-50%)',
                        color: '#fff', fontSize: 14,
                        background: 'rgba(0,0,0,0.6)',
                        padding: '10px 20px', borderRadius: 20,
                        whiteSpace: 'nowrap'
                    }}>
                        Наведи на поверхность и нажми
                    </div>
                )}
                {status === 'webxr' && placed && (
                    <div style={{
                        position: 'absolute', bottom: 100,
                        left: '50%', transform: 'translateX(-50%)',
                        color: '#fff', fontSize: 14,
                        background: 'rgba(0,0,0,0.6)',
                        padding: '10px 20px', borderRadius: 20,
                    }}>
                        Модель размещена
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute', top: 16, left: 16, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    border: 'none', padding: '8px 16px',
                    borderRadius: 8, cursor: 'pointer', fontSize: 14
                }}
            >
                ← Назад
            </button>
        </div>
    )
}

export default ARSurfacePage