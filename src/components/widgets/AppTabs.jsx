import '../../assets/styles/AppTabs.css'


function AppTabs() {
    return (
        <div className="tabs">
            <button className="tabs__item active">
                <span className="tabs__item-title">По QR-коду</span>
            </button>
            <button className="tabs__item">
                <span className="tabs__item-title">По поверхности</span>
            </button>
        </div>
    )
}

export default AppTabs