import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button.jsx'
import './App.css'

// 导入游戏素材
import wizardImg from './assets/wizard.png'
import monster1Img from './assets/monster1.png'
import monster2Img from './assets/monster2.png'
import monster3Img from './assets/monster3.png'
import monster4Img from './assets/monster4.png'
import monster6Img from './assets/monster6.png'
import monster7Img from './assets/monster7.png'

const GRID_SIZE = 15
const CELL_SIZE = 40

// 游戏地图 - 1表示墙，0表示空地，2表示可破坏的墙
const INITIAL_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,2,0,0,2,0,0,2,0,0,2,0,1],
  [1,0,1,2,1,0,1,2,1,0,1,2,1,0,1],
  [1,2,2,0,2,2,0,2,2,0,2,2,0,2,1],
  [1,0,1,2,1,0,1,2,1,0,1,2,1,0,1],
  [1,0,0,2,0,0,2,0,0,2,0,0,2,0,1],
  [1,2,1,0,1,2,1,0,1,2,1,0,1,2,1],
  [1,0,2,2,2,0,0,0,0,0,2,2,2,0,1],
  [1,2,1,0,1,2,1,0,1,2,1,0,1,2,1],
  [1,0,0,2,0,0,2,0,0,2,0,0,2,0,1],
  [1,0,1,2,1,0,1,2,1,0,1,2,1,0,1],
  [1,2,2,0,2,2,0,2,2,0,2,2,0,2,1],
  [1,0,1,2,1,0,1,2,1,0,1,2,1,0,1],
  [1,0,0,2,0,0,2,0,0,2,0,0,2,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
]

const MONSTER_IMAGES = [monster1Img, monster2Img, monster3Img, monster4Img, monster6Img, monster7Img]

function App() {
  const [gameMap, setGameMap] = useState(INITIAL_MAP.map(row => [...row]))
  const [player, setPlayer] = useState({ x: 1, y: 1 })
  const [monsters, setMonsters] = useState([
    { id: 1, x: 13, y: 1, img: MONSTER_IMAGES[0], direction: 'left' },
    { id: 2, x: 13, y: 13, img: MONSTER_IMAGES[1], direction: 'up' },
    { id: 3, x: 1, y: 13, img: MONSTER_IMAGES[2], direction: 'right' },
    { id: 4, x: 7, y: 3, img: MONSTER_IMAGES[3], direction: 'down' },
    { id: 5, x: 11, y: 7, img: MONSTER_IMAGES[4], direction: 'left' },
    { id: 6, x: 3, y: 11, img: MONSTER_IMAGES[5], direction: 'right' }
  ])
  const [bombs, setBombs] = useState([])
  const [explosions, setExplosions] = useState([])
  const [gameStatus, setGameStatus] = useState('playing') // playing, won, lost
  const [score, setScore] = useState(0)

  // 检查位置是否可以移动
  const canMoveTo = useCallback((x, y) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false
    return gameMap[y][x] === 0
  }, [gameMap])

  // 玩家移动
  const movePlayer = useCallback((direction) => {
    if (gameStatus !== 'playing') return
    
    setPlayer(prev => {
      let newX = prev.x
      let newY = prev.y
      
      switch (direction) {
        case 'up': newY--; break
        case 'down': newY++; break
        case 'left': newX--; break
        case 'right': newX++; break
      }
      
      if (canMoveTo(newX, newY)) {
        return { x: newX, y: newY }
      }
      return prev
    })
  }, [canMoveTo, gameStatus])

  // 放置炸弹
  const placeBomb = useCallback(() => {
    if (gameStatus !== 'playing') return
    
    setBombs(prev => {
      const existingBomb = prev.find(bomb => bomb.x === player.x && bomb.y === player.y)
      if (existingBomb) return prev
      
      const newBomb = {
        id: Date.now(),
        x: player.x,
        y: player.y,
        timer: 3000 // 3秒后爆炸
      }
      
      // 设置炸弹爆炸定时器
      setTimeout(() => {
        explodeBomb(newBomb)
      }, 3000)
      
      return [...prev, newBomb]
    })
  }, [player, gameStatus])

  // 炸弹爆炸
  const explodeBomb = useCallback((bomb) => {
    setBombs(prev => prev.filter(b => b.id !== bomb.id))
    
    const explosionCells = []
    const directions = [
      { dx: 0, dy: 0 }, // 中心
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, // 左右
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }  // 上下
    ]
    
    directions.forEach(({ dx, dy }) => {
      for (let i = 0; i < 3; i++) {
        const x = bomb.x + dx * i
        const y = bomb.y + dy * i
        
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) break
        if (gameMap[y][x] === 1) break // 遇到不可破坏的墙
        
        explosionCells.push({ x, y })
        
        if (gameMap[y][x] === 2) {
          // 破坏可破坏的墙
          setGameMap(prev => {
            const newMap = prev.map(row => [...row])
            newMap[y][x] = 0
            return newMap
          })
          setScore(prev => prev + 10)
          break
        }
      }
    })
    
    setExplosions(prev => [...prev, ...explosionCells.map(cell => ({ ...cell, id: Date.now() + Math.random() }))])
    
    // 检查是否击中玩家
    const playerHit = explosionCells.some(cell => cell.x === player.x && cell.y === player.y)
    if (playerHit) {
      setGameStatus('lost')
    }
    
    // 检查是否击中怪物
    setMonsters(prev => {
      const newMonsters = prev.filter(monster => {
        const hit = explosionCells.some(cell => cell.x === monster.x && cell.y === monster.y)
        if (hit) {
          setScore(prevScore => prevScore + 50)
        }
        return !hit
      })
      
      // 检查是否所有怪物都被消灭
      if (newMonsters.length === 0) {
        setGameStatus('won')
      }
      
      return newMonsters
    })
    
    // 清除爆炸效果
    setTimeout(() => {
      setExplosions(prev => prev.filter(exp => !explosionCells.some(cell => cell.x === exp.x && cell.y === exp.y)))
    }, 500)
  }, [gameMap, player])

  // 怪物移动AI
  useEffect(() => {
    if (gameStatus !== 'playing') return
    
    const moveMonsters = () => {
      setMonsters(prev => prev.map(monster => {
        const directions = ['up', 'down', 'left', 'right']
        let newX = monster.x
        let newY = monster.y
        
        // 尝试当前方向
        switch (monster.direction) {
          case 'up': newY--; break
          case 'down': newY++; break
          case 'left': newX--; break
          case 'right': newX++; break
        }
        
        // 如果不能移动，随机选择新方向
        if (!canMoveTo(newX, newY)) {
          const availableDirections = directions.filter(dir => {
            let testX = monster.x
            let testY = monster.y
            switch (dir) {
              case 'up': testY--; break
              case 'down': testY++; break
              case 'left': testX--; break
              case 'right': testX++; break
            }
            return canMoveTo(testX, testY)
          })
          
          if (availableDirections.length > 0) {
            const newDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)]
            newX = monster.x
            newY = monster.y
            switch (newDirection) {
              case 'up': newY--; break
              case 'down': newY++; break
              case 'left': newX--; break
              case 'right': newX++; break
            }
            return { ...monster, x: newX, y: newY, direction: newDirection }
          }
          return monster
        }
        
        return { ...monster, x: newX, y: newY }
      }))
    }
    
    const interval = setInterval(moveMonsters, 800)
    return () => clearInterval(interval)
  }, [canMoveTo, gameStatus])

  // 检查玩家与怪物碰撞
  useEffect(() => {
    if (gameStatus !== 'playing') return
    
    const collision = monsters.some(monster => monster.x === player.x && monster.y === player.y)
    if (collision) {
      setGameStatus('lost')
    }
  }, [player, monsters, gameStatus])

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          movePlayer('up')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          movePlayer('down')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          movePlayer('left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          movePlayer('right')
          break
        case ' ':
        case 'Enter':
          e.preventDefault()
          placeBomb()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [movePlayer, placeBomb])

  // 重新开始游戏
  const restartGame = () => {
    setGameMap(INITIAL_MAP.map(row => [...row]))
    setPlayer({ x: 1, y: 1 })
    setMonsters([
      { id: 1, x: 13, y: 1, img: MONSTER_IMAGES[0], direction: 'left' },
      { id: 2, x: 13, y: 13, img: MONSTER_IMAGES[1], direction: 'up' },
      { id: 3, x: 1, y: 13, img: MONSTER_IMAGES[2], direction: 'right' },
      { id: 4, x: 7, y: 3, img: MONSTER_IMAGES[3], direction: 'down' },
      { id: 5, x: 11, y: 7, img: MONSTER_IMAGES[4], direction: 'left' },
      { id: 6, x: 3, y: 11, img: MONSTER_IMAGES[5], direction: 'right' }
    ])
    setBombs([])
    setExplosions([])
    setGameStatus('playing')
    setScore(0)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold mb-2 text-yellow-400">Anoma Bomber</h1>
        <p className="text-lg mb-2">魔法师炸弹人</p>
        <div className="flex gap-4 justify-center items-center">
          <span className="text-xl">得分: {score}</span>
          <span className="text-lg">怪物剩余: {monsters.length}</span>
        </div>
      </div>
      
      <div 
        className="game-board relative border-4 border-yellow-400 bg-green-800"
        style={{ 
          width: GRID_SIZE * CELL_SIZE, 
          height: GRID_SIZE * CELL_SIZE,
          backgroundImage: 'linear-gradient(45deg, #166534 25%, transparent 25%), linear-gradient(-45deg, #166534 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #166534 75%), linear-gradient(-45deg, transparent 75%, #166534 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        {/* 渲染地图 */}
        {gameMap.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`absolute ${
                cell === 1 ? 'bg-gray-600 border border-gray-500' : 
                cell === 2 ? 'bg-yellow-600 border border-yellow-500' : ''
              }`}
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE
              }}
            />
          ))
        )}
        
        {/* 渲染玩家 */}
        <div
          className="absolute transition-all duration-150 ease-in-out"
          style={{
            left: player.x * CELL_SIZE + 2,
            top: player.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4
          }}
        >
          <img 
            src={wizardImg} 
            alt="魔法师" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* 渲染怪物 */}
        {monsters.map(monster => (
          <div
            key={monster.id}
            className="absolute transition-all duration-200 ease-in-out"
            style={{
              left: monster.x * CELL_SIZE + 2,
              top: monster.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4
            }}
          >
            <img 
              src={monster.img} 
              alt="怪物" 
              className="w-full h-full object-contain"
            />
          </div>
        ))}
        
        {/* 渲染炸弹 */}
        {bombs.map(bomb => (
          <div
            key={bomb.id}
            className="absolute bg-red-600 rounded-full border-2 border-red-400 animate-pulse"
            style={{
              left: bomb.x * CELL_SIZE + 8,
              top: bomb.y * CELL_SIZE + 8,
              width: CELL_SIZE - 16,
              height: CELL_SIZE - 16
            }}
          />
        ))}
        
        {/* 渲染爆炸效果 */}
        {explosions.map(explosion => (
          <div
            key={explosion.id}
            className="absolute bg-orange-400 animate-ping"
            style={{
              left: explosion.x * CELL_SIZE,
              top: explosion.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE
            }}
          />
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <div className="mb-4">
          <p className="text-sm mb-2">控制说明:</p>
          <p className="text-xs">方向键或WASD移动 | 空格键或回车键放炸弹</p>
        </div>
        
        {gameStatus === 'won' && (
          <div className="mb-4 p-4 bg-green-600 rounded-lg">
            <h2 className="text-2xl font-bold">恭喜获胜!</h2>
            <p>你消灭了所有怪物！最终得分: {score}</p>
          </div>
        )}
        
        {gameStatus === 'lost' && (
          <div className="mb-4 p-4 bg-red-600 rounded-lg">
            <h2 className="text-2xl font-bold">游戏结束!</h2>
            <p>你被怪物或爆炸击中了！最终得分: {score}</p>
          </div>
        )}
        
        {gameStatus !== 'playing' && (
          <Button onClick={restartGame} className="bg-yellow-600 hover:bg-yellow-700">
            重新开始
          </Button>
        )}
      </div>
      
      {/* 移动端控制按钮 */}
      <div className="mt-4 md:hidden">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div></div>
          <Button 
            onClick={() => movePlayer('up')}
            className="bg-blue-600 hover:bg-blue-700 h-12"
          >
            ↑
          </Button>
          <div></div>
          <Button 
            onClick={() => movePlayer('left')}
            className="bg-blue-600 hover:bg-blue-700 h-12"
          >
            ←
          </Button>
          <Button 
            onClick={() => movePlayer('down')}
            className="bg-blue-600 hover:bg-blue-700 h-12"
          >
            ↓
          </Button>
          <Button 
            onClick={() => movePlayer('right')}
            className="bg-blue-600 hover:bg-blue-700 h-12"
          >
            →
          </Button>
        </div>
        <Button 
          onClick={placeBomb}
          className="bg-red-600 hover:bg-red-700 w-full h-12"
        >
          放炸弹
        </Button>
      </div>
    </div>
  )
}

export default App

