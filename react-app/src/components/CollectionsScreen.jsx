import { useState } from 'react';
import { DUNGEON_ROOMS, MONSTERS } from '../data/constants';

function CollectionsScreen({ gameState, onBack }) {
  const { player } = gameState;
  const [activeCategory, setActiveCategory] = useState('monsters');

  const heroCollectibles = [
    { id: 'knight-1', name: 'Knight I', src: '/assets/characters/knight-character/Knight_1/Idle.png' },
    { id: 'knight-2', name: 'Knight II', src: '/assets/characters/knight-character/Knight_2/Idle.png' },
    { id: 'knight-3', name: 'Knight III', src: '/assets/characters/knight-character/Knight_3/Idle.png' },
    { id: 'wizard', name: 'Wizard', src: '/assets/characters/wizard/Idle.png' },
    { id: 'king', name: 'King', src: '/assets/characters/medieval-king-01/Idle.png' },
  ];

  const categoryConfig = {
    monsters: {
      label: 'Monsters',
      items: Object.values(MONSTERS).map((monster) => ({
        id: monster.id,
        name: monster.name,
        src: `${monster.basePath}/${monster.idleSprite}`,
      })),
    },
    dungeons: {
      label: 'Dungeons',
      items: DUNGEON_ROOMS.map((room, index) => ({
        id: `dungeon-${index}`,
        name: `Dungeon ${index + 1}`,
        src: room,
      })),
    },
    heroes: {
      label: 'Heroes',
      items: heroCollectibles,
    },
  };

  const activeItems = categoryConfig[activeCategory].items;

  return (
    <div className="screen collections-screen">
      <div className="collections-wrap">
        <header className="screen-header">
          <button className="btn btn-back" onClick={onBack}>
            ← Back
          </button>
          <h1>Collectibles</h1>
          <div className="coins-display">
            <span className="coin-icon">🪙</span>
            <span>{player.coins}</span>
          </div>
        </header>

        <div className="collections-content collections-layout">
          <nav className="collections-sidebar">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                className={`collections-nav-btn ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}
                type="button"
              >
                {config.label}
              </button>
            ))}
          </nav>

          <section className={`collections-gallery ${activeCategory}`}>
            <h2>{categoryConfig[activeCategory].label}</h2>
            <div className={`collections-grid ${activeCategory}`}>
              {activeItems.map((item) => (
                <div key={item.id} className={`collections-card ${activeCategory}-card`}>
                  <div className="collections-card-frame">
                    <img className="collections-card-img" src={item.src} alt={item.name} />
                  </div>
                  <div className="collections-card-name">{item.name}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CollectionsScreen;
