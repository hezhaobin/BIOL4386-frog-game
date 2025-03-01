import React, { useState, useEffect, useCallback } from 'react';

const FrogGame = () => {
  const GRID_WIDTH = 11;
  const GRID_HEIGHT = 15;
  const ROAD_START = 3;
  const ROAD_END = 7;
  const RIVER_START = 9;
  const RIVER_END = 13;
  
  const [frogPos, setFrogPos] = useState({ x: Math.floor(GRID_WIDTH / 2), y: GRID_HEIGHT - 1 });
  const [cars, setCars] = useState([]);
  const [logs, setLogs] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Generate initial cars and logs
  useEffect(() => {
    const initialCars = [];
    // Cars on the road
    for (let y = ROAD_START; y <= ROAD_END; y++) {
      const direction = (y % 2 === 0) ? 1 : -1;
      const carCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < carCount; i++) {
        initialCars.push({
          x: Math.floor(Math.random() * GRID_WIDTH),
          y,
          direction,
          speed: 0.5 + Math.random() * 0.5
        });
      }
    }
    setCars(initialCars);
    
    const initialLogs = [];
    // Logs on the river
    for (let y = RIVER_START; y <= RIVER_END; y++) {
      const direction = (y % 2 === 0) ? 1 : -1;
      const logCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < logCount; i++) {
        const length = 2 + Math.floor(Math.random() * 3);
        initialLogs.push({
          x: Math.floor(Math.random() * GRID_WIDTH),
          y,
          length,
          direction,
          speed: 0.3 + Math.random() * 0.3
        });
      }
    }
    setLogs(initialLogs);
  }, []);
  
  const resetGame = () => {
    setFrogPos({ x: Math.floor(GRID_WIDTH / 2), y: GRID_HEIGHT - 1 });
    setGameOver(false);
    setWon(false);
    if (score > highScore) setHighScore(score);
    setScore(0);
  };
  
  // Game loop
  useEffect(() => {
    if (gameOver || won) return;
    
    const gameLoop = setInterval(() => {
      // Move cars
      setCars(prevCars => 
        prevCars.map(car => {
          let newX = car.x + (car.direction * car.speed);
          if (newX > GRID_WIDTH) newX = -1;
          if (newX < -1) newX = GRID_WIDTH;
          return { ...car, x: newX };
        })
      );
      
      // Move logs
      setLogs(prevLogs => 
        prevLogs.map(log => {
          let newX = log.x + (log.direction * log.speed);
          if (newX > GRID_WIDTH) newX = -log.length;
          if (newX < -log.length) newX = GRID_WIDTH;
          return { ...log, x: newX };
        })
      );
      
      // Check if frog is on a log (and move with it)
      if (frogPos.y >= RIVER_START && frogPos.y <= RIVER_END) {
        const onLog = logs.some(log => {
          if (log.y === frogPos.y) {
            const logStart = Math.floor(log.x);
            const logEnd = Math.floor(log.x) + log.length;
            if (frogPos.x >= logStart && frogPos.x < logEnd) {
              setFrogPos(prev => ({
                ...prev,
                x: prev.x + (log.direction * log.speed)
              }));
              return true;
            }
          }
          return false;
        });
        
        if (!onLog) {
          // Frog is in water and not on a log
          setGameOver(true);
        }
      }
      
      // Check if frog is hit by a car
      const isHit = cars.some(car => {
        return (car.y === frogPos.y && 
                Math.abs(car.x - frogPos.x) < 1);
      });
      
      if (isHit) {
        setGameOver(true);
      }
      
      // Check if frog is out of bounds
      if (frogPos.x < 0 || frogPos.x >= GRID_WIDTH) {
        setGameOver(true);
      }
      
      // Check if frog reached the goal
      if (frogPos.y === 0) {
        setWon(true);
        setScore(prev => prev + 100);
      }
      
    }, 200);
    
    return () => clearInterval(gameLoop);
  }, [frogPos, cars, logs, gameOver, won]);
  
  // Handle keyboard controls
  const handleKeyDown = useCallback((e) => {
    if (gameOver || won) {
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowUp':
        setFrogPos(prev => ({ ...prev, y: Math.max(prev.y - 1, 0) }));
        break;
      case 'ArrowDown':
        setFrogPos(prev => ({ ...prev, y: Math.min(prev.y + 1, GRID_HEIGHT - 1) }));
        break;
      case 'ArrowLeft':
        setFrogPos(prev => ({ ...prev, x: Math.max(prev.x - 1, 0) }));
        break;
      case 'ArrowRight':
        setFrogPos(prev => ({ ...prev, x: Math.min(prev.x + 1, GRID_WIDTH - 1) }));
        break;
      default:
        break;
    }
  }, [gameOver, won]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Check if a position is on a log
  const isOnLog = (x, y) => {
    return logs.some(log => 
      log.y === y && 
      x >= Math.floor(log.x) && 
      x < Math.floor(log.x) + log.length
    );
  };
  
  // Render game cell
  const renderCell = (x, y) => {
    // Render frog
    if (Math.floor(frogPos.x) === x && frogPos.y === y) {
      return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">🐸</div>;
    }
    
    // Render car
    const car = cars.find(car => car.y === y && Math.floor(car.x) === x);
    if (car) {
      return <div className="w-6 h-6 bg-red-500 rounded-md flex items-center justify-center">🚗</div>;
    }
    
    // Render log
    if (isOnLog(x, y)) {
      return <div className="w-6 h-6 bg-yellow-800 rounded-sm"></div>;
    }
    
    // Render terrain
    if (y === 0) {
      return <div className="w-6 h-6 bg-green-200"></div>; // Goal
    } else if (y >= RIVER_START && y <= RIVER_END) {
      return <div className="w-6 h-6 bg-blue-400"></div>; // River
    } else if (y >= ROAD_START && y <= ROAD_END) {
      return <div className="w-6 h-6 bg-gray-500"></div>; // Road
    } else {
      return <div className="w-6 h-6 bg-green-300"></div>; // Grass
    }
  };

  // Mobile controls
  const handleButtonPress = (direction) => {
    if (gameOver || won) {
      if (direction === 'reset') {
        resetGame();
      }
      return;
    }
    
    switch (direction) {
      case 'up':
        setFrogPos(prev => ({ ...prev, y: Math.max(prev.y - 1, 0) }));
        break;
      case 'down':
        setFrogPos(prev => ({ ...prev, y: Math.min(prev.y + 1, GRID_HEIGHT - 1) }));
        break;
      case 'left':
        setFrogPos(prev => ({ ...prev, x: Math.max(prev.x - 1, 0) }));
        break;
      case 'right':
        setFrogPos(prev => ({ ...prev, x: Math.min(prev.x + 1, GRID_WIDTH - 1) }));
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-xl shadow-lg">
      <div className="mb-4 text-xl font-bold">Classic Frog Game</div>
      
      <div className="mb-2 flex gap-4">
        <div>Score: {score}</div>
        <div>High Score: {highScore}</div>
      </div>
      
      {gameOver && (
        <div className="mb-2 text-red-600 font-bold">Game Over! Press R to restart</div>
      )}
      
      {won && (
        <div className="mb-2 text-green-600 font-bold">You Win! Press R to play again</div>
      )}
      
      <div className="border-4 border-black mb-4">
        {Array.from({ length: GRID_HEIGHT }).map((_, y) => (
          <div key={y} className="flex">
            {Array.from({ length: GRID_WIDTH }).map((_, x) => (
              <div key={`${x}-${y}`} className="flex items-center justify-center">
                {renderCell(x, y)}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="text-sm mb-2">Use arrow keys to move the frog</div>
      
      {/* Mobile controls */}
      <div className="grid grid-cols-3 gap-2 w-32 mb-4">
        <div></div>
        <button 
          className="bg-gray-300 p-2 rounded text-center"
          onClick={() => handleButtonPress('up')}
        >
          ↑
        </button>
        <div></div>
        <button 
          className="bg-gray-300 p-2 rounded text-center"
          onClick={() => handleButtonPress('left')}
        >
          ←
        </button>
        <button 
          className="bg-gray-300 p-2 rounded text-center"
          onClick={() => handleButtonPress(gameOver || won ? 'reset' : 'down')}
        >
          {gameOver || won ? 'R' : '↓'}
        </button>
        <button 
          className="bg-gray-300 p-2 rounded text-center"
          onClick={() => handleButtonPress('right')}
        >
          →
        </button>
      </div>
      
      <div className="text-sm">
        <p>Instructions:</p>
        <ul className="list-disc pl-4">
          <li>Get the frog to the top of the screen</li>
          <li>Avoid cars on the road</li>
          <li>Use logs to cross the river</li>
          <li>If you fall in the water, you lose</li>
        </ul>
      </div>
    </div>
  );
};

export default FrogGame;
