import { useState } from 'react';
import { SCREENS } from './data/constants';
import { useGameState } from './hooks/useGameState';
import HomeScreen from './components/HomeScreen';
import TaskOverview from './components/TaskOverview';
import BattleScreen from './components/BattleScreen';
import CollectionsScreen from './components/CollectionsScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.HOME);
  const [selectedTask, setSelectedTask] = useState(null);
  const gameState = useGameState();

  const navigateTo = (screen, task = null) => {
    if (task) setSelectedTask(task);
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.HOME:
        return (
          <HomeScreen
            gameState={gameState}
            onNavigate={navigateTo}
          />
        );
      case SCREENS.TASKS:
        return (
          <TaskOverview
            gameState={gameState}
            onNavigate={navigateTo}
            onStartTask={(task) => navigateTo(SCREENS.BATTLE, task)}
          />
        );
      case SCREENS.BATTLE:
        return (
          <BattleScreen
            task={selectedTask}
            gameState={gameState}
            onExit={() => navigateTo(SCREENS.TASKS)}
            onComplete={() => navigateTo(SCREENS.TASKS)}
          />
        );
      case SCREENS.COLLECTIONS:
        return (
          <CollectionsScreen
            gameState={gameState}
            onBack={() => navigateTo(SCREENS.HOME)}
          />
        );
      default:
        return <HomeScreen gameState={gameState} onNavigate={navigateTo} />;
    }
  };

  return <div className="app">{renderScreen()}</div>;
}

export default App;
