import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { cards } from "../data/cards";

function ARPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const containerRef = useRef(null)

    const card = cards.find(c => c.id === Number(id))

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

            const { renderer, scene, camera } = mindarThree
            const anchor = mindarThree.addAnchor(0)

            const loader = new window.THREE.GLTFLoader()

            loader.load(
                card.modelSrc,
                (gltf) => {
                    const model = gltf.scene
                    model.scale.set(0.1, 0.1, 0.1)

                    const pivot = new THREE.Group()
                    pivot.add(model)
                    anchor.group.add(pivot)

                    let isDragging = false
                    let previousX = 0
                    let velocity = 0

                    const onTouchStart = (e) => {
                        isDragging = true
                        velocity = 0
                        previousX = e.touches[0].clientX
                    }

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
        }

        start()
    }, [card])

    if (!card) return <div>Карточка не найдена</div>

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* Кнопка назад */}
            <button
                onClick={() => navigate('/')}
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