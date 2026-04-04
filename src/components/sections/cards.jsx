import { useState } from 'react'
import Card from '../shared/card'
import Modal from '../widgets/AppModal'
import { cards } from '../../data/cards'
import '../../assets/styles/AppCard.css'

function SectionCards() {
    const [selectedCard, setSelectedCard] = useState(null)

    return (
        <>
            <h2 className='cards__title'>
                Каталог моделей
            </h2>
            <div className="cards">
                {cards.map(card => (
                    <div key={card.id} onClick={() => setSelectedCard(card)} className='card'>
                        <Card
                            title={card.title}
                            description={card.description}
                            image={card.image}
                        />
                    </div>
                ))}
            </div>

            {selectedCard && (
                <Modal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </>
    )
}

export default SectionCards