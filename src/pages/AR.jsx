import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cards } from "../data/cards";

function ARPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const containerRef = useRef(null)
    const mindarRef = useRef(null)
    const isStartedRef = useRef(false)

    const card = cards.find(c => c.id === Number(id))

    const stopAR = async () => {
        // Сначала останавливаем animation loop
        if (mindarRef.current?.renderer) {
            mindarRef.current.renderer.setAnimationLoop(null)
        }

        // Останавливаем MindAR только если запустился
        if (mindarRef.current && isStartedRef.current) {
            try {
                await mindarRef.current.stop()
            } catch (e) {
                console.warn('MindAR stop:', e)
            }
        }

        // Останавливаем все видеопотоки камеры
        document.querySelectorAll('video').forEach(video => {
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop())
                video.srcObject = null
            }
        })

        // Убираем все элементы которые MindAR добавил в body и container
        // MindAR создаёт canvas, video и div снаружи нашего контейнера
        document.querySelectorAll('.mindar-ui-overlay').forEach(el => el.remove())
        document.querySelectorAll('.mindar-ui-loading').forEach(el => el.remove())
        document.querySelectorAll('.mindar-ui-scanning').forEach(el => el.remove())

        // Чистим сам контейнер
        if (containerRef.current) {
            containerRef.current.innerHTML = ''
        }

        mindarRef.current = null
        isStartedRef.current = false
    }

    useEffect(() => {
        if (!card) return

        const start = async () => {
            const THREE = window.MINDAR.IMAGE.THREE

            const mindarThree = new window.MINDAR.IMAGE.MindARThree({
                container: containerRef.current,
                imageTargetSrc: card.mindSrc,
                filterMinCF: 0.001,
                filterBeta: 0.01,
            })

            mindarRef.current = mindarThree

            const { renderer, scene, camera } = mindarThree
            const anchor = mindarThree.addAnchor(0)

            const loader = new window.THREE.GLTFLoader()

            loader.load(
                card.modelSrc,
                (gltf) => {
                    if (!mindarRef.current) return

                    const model = gltf.scene

                    const box = new THREE.Box3().setFromObject(model)
                    const size = box.getSize(new THREE.Vector3())
                    const maxDim = Math.max(size.x, size.y, size.z)
                    const baseScale = 1.6 / maxDim
                    const finalScale = baseScale * (card.scale || 1)
                    
                    model.scale.setScalar(finalScale)

                    const center = box.getCenter(new THREE.Vector3())
                    model.position.x = -center.x * baseScale
                    model.position.y = -center.y * baseScale
                    model.position.z = -center.z * baseScale

                    const pivot = new THREE.Group()
                    pivot.add(model)
                    anchor.group.add(pivot)

                    let isDragging = false
                    let previousX = 0
                    let velocity = 0

                    const onTouchStart = (e) => { isDragging = true; velocity = 0; previousX = e.touches[0].clientX }
                    const onTouchMove = (e) => {
                        if (!isDragging) return
                        const deltaX = e.touches[0].clientX - previousX
                        velocity = deltaX * 0.01
                        pivot.rotation.y += velocity
                        previousX = e.touches[0].clientX
                    }
                    const onTouchEnd = () => { isDragging = false }
                    const onMouseDown = (e) => { isDragging = true; velocity = 0; previousX = e.clientX }
                    const onMouseMove = (e) => {
                        if (!isDragging) return
                        const deltaX = e.clientX - previousX
                        velocity = deltaX * 0.01
                        pivot.rotation.y += velocity
                        previousX = e.clientX
                    }
                    const onMouseUp = () => { isDragging = false }

                    const el = containerRef.current
                    if (!el) return

                    el.addEventListener('touchstart', onTouchStart)
                    el.addEventListener('touchmove', onTouchMove)
                    el.addEventListener('touchend', onTouchEnd)
                    el.addEventListener('mousedown', onMouseDown)
                    el.addEventListener('mousemove', onMouseMove)
                    el.addEventListener('mouseup', onMouseUp)

                    let mixer = null
                    if (gltf.animations.length > 0) {
                        mixer = new THREE.AnimationMixer(model)
                        mixer.clipAction(gltf.animations[0]).play()
                    }

                    renderer.setAnimationLoop(() => {
                        if (!isDragging) {
                            pivot.rotation.y += velocity
                            velocity *= 0.95
                        }
                        if (mixer) mixer.update(0.016)
                        renderer.render(scene, camera)
                    })
                },
                undefined,
                (error) => console.error('Ошибка загрузки модели:', error)
            )

            const ambientLight = new THREE.AmbientLight(0xffffff, 1)
            const dirLight = new THREE.DirectionalLight(0xffffff, 2)
            dirLight.position.set(1, 2, 1)
            scene.add(ambientLight, dirLight)

            await mindarThree.start()
            isStartedRef.current = true

            const fixCamera = () => {
                const video = containerRef.current.querySelector('video')
                const canvas = containerRef.current.querySelector('canvas')

                if (!video || !canvas) return

                const vw = window.innerWidth
                const vh = window.innerHeight

                // Делает одинаковое поведение
                video.style.position = 'absolute'
                canvas.style.position = 'absolute'

                video.style.top = '0'
                video.style.left = '0'
                canvas.style.top = '0'
                canvas.style.left = '0'

                video.style.width = vw + 'px'
                video.style.height = vh + 'px'
                canvas.style.width = vw + 'px'
                canvas.style.height = vh + 'px'

                video.style.objectFit = 'cover' // ВАЖНО
            }

            fixCamera()
            window.addEventListener('resize', fixCamera)
        }

        start()

        return () => { stopAR() }
    }, [card])

    const handleBack = async () => {
        await stopAR()
        navigate('/')
    }

    if (!card) return <div>Карточка не найдена</div>

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: "hidden" }} />
            <button
                onClick={handleBack}
                style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    zIndex: 100,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14
                }}
            >
                ← Назад
            </button>
        </div>
    )
}

export default ARPage