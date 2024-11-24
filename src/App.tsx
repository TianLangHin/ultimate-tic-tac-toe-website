import { useState } from 'react'
import './App.css'

type SquareProps = {
  sideToMove: boolean,
  zoneStatus: GameStatus,
  onMovePlayed: () => void,
}

type ZoneProps = {
  sideToMove: boolean,
  gameStatus: GameStatus,
  isPlayableZone: boolean, 
  onMovePlayed: (index: number, newStatus: GameStatus) => void,
}

enum Occupancy {
  X, O, Free
}

enum GameStatus {
  X, O, Draw, Free
}

const lines: number[] = [
  0b000000111,
  0b000111000,
  0b111000000,
  0b001001001,
  0b010010010,
  0b100100100,
  0b100010001,
  0b001010100,
]

const zoneStrings: string[] = [
  "NW", "N", "NE", "W", "C", "E", "SW", "S", "SE"
]


function calculateGameStatus(grid: Occupancy[]): GameStatus {
  const xLines = Array.from(grid.entries())
    .map(([idx, value]) => value === Occupancy.X ? (1 << idx) : 0)
    .reduce((acc, x) => acc | x, 0)

  if (lines.some(line => (line & xLines) === line)) return GameStatus.X

  const oLines = Array.from(grid.entries())
    .map(([idx, value]) => value === Occupancy.O ? (1 << idx) : 0)
    .reduce((acc, x) => acc | x, 0)

  if (lines.some(line => (line & oLines) === line)) return GameStatus.O

  if (grid.every(value => value !== Occupancy.Free)) return GameStatus.Draw

  return GameStatus.Free
}

function Square(props: SquareProps) {
  const { sideToMove, zoneStatus, onMovePlayed } = props

  const [occupancy, setOccupancy] = useState(Occupancy.Free)

  const handleClick = () => {
    if (zoneStatus !== GameStatus.Free || occupancy !== Occupancy.Free) return
    setOccupancy(sideToMove ? Occupancy.X : Occupancy.O)
    onMovePlayed()
  }

  return (
    <button
      onClick={handleClick}
      className="text-center w-[75px] h-[75px] p-2 bg-white"
    >
      <p className="text-3xl">
      {
        occupancy === Occupancy.X ? "X" :
        occupancy === Occupancy.O ? "O" : ""
      }
      </p>
    </button>
  )
}

function Zone(props: ZoneProps) {
  const { sideToMove, gameStatus, isPlayableZone, onMovePlayed } = props

  const [zoneStatus, setZoneStatus] = useState(GameStatus.Free)
  const [grid, setGrid] = useState(Array(9).fill(Occupancy.Free))

  const movePlayedCallback = (index: number) => {
    return () => {
      const occupancy = sideToMove ? Occupancy.X : Occupancy.O
      const newGrid = [
        ...grid.slice(0, index),
        occupancy,
        ...grid.slice(index + 1),
      ]
      const newStatus = calculateGameStatus(newGrid)

      setGrid(newGrid)
      setZoneStatus(newStatus)

      onMovePlayed(index, newStatus)
    }
  }

  // Used as a way to express that a square in an unfocused zone or concluded game cannot be clicked.
  const status = isPlayableZone && gameStatus === GameStatus.Free ? zoneStatus : GameStatus.Draw

  return (
    <>
      <div className="grid grid-rows-3 border-4 border-black gap-1 bg-gray-300">
        <div className="grid grid-cols-3 gap-1 bg-gray-300 row-start-1">
          <div>
            <Square sideToMove={sideToMove} zoneStatus={status} onMovePlayed={movePlayedCallback(0)} />
          </div>
          <div>
            <Square sideToMove={sideToMove} zoneStatus={status} onMovePlayed={movePlayedCallback(1)} />
          </div>
          <div>
            <Square sideToMove={sideToMove} zoneStatus={status} onMovePlayed={movePlayedCallback(2)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-gray-300 row-start-2">
          <div>
            <Square sideToMove={sideToMove} zoneStatus={status} onMovePlayed={movePlayedCallback(3)} />
          </div>
          <div>
            <Square sideToMove={sideToMove} zoneStatus={status} onMovePlayed={movePlayedCallback(4)} />
          </div>
          <div>
            <Square sideToMove={sideToMove} zoneStatus={status} onMovePlayed={movePlayedCallback(5)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-gray-300 row-start-3">
          <div>
            <Square sideToMove={sideToMove} zoneStatus={status} onMovePlayed={movePlayedCallback(6)} />
          </div>
          <div>
            <Square sideToMove={sideToMove} zoneStatus={status} onMovePlayed={movePlayedCallback(7)} />
          </div>
          <div>
            <Square sideToMove={sideToMove} zoneStatus={status} onMovePlayed={movePlayedCallback(8)} />
          </div>
        </div>
        {
          zoneStatus !== GameStatus.Free &&
          <div className="row-span-3 col-span-3 fixed bg-gray-400 opacity-50 items-center">
            <p className="font-bold text-rose-700 text-5-xl">
              {
                zoneStatus === GameStatus.X ? "X" :
                zoneStatus === GameStatus.O ? "O" : "Draw"
              }
            </p>
          </div>
        }

      </div>
    </>
  )
}

export default function Board() {
  const [player, setPlayer] = useState(true)
  const [playableZone, setPlayableZone] = useState<number | null>(null)
  const [status, setStatus] = useState(GameStatus.Free)
  const [grid, setGrid] = useState(Array(9).fill(GameStatus.Free))
  const [history, setHistory] = useState<number[]>([])

  const playable = (index: number) => playableZone === index || playableZone === null

  const zoneString = (zone: number | null) => {
    return zone === null ? "ANY" : zoneStrings[zone]
  }

  const callback = (zoneIndex: number) => {
    return (index: number, newStatus: GameStatus) => {
      const newGrid = [
        ...grid.slice(0, zoneIndex),
        newStatus,
        ...grid.slice(zoneIndex + 1),
      ]

      const wonLines = calculateGameStatus(
        newGrid.map(gameStatus => (
          gameStatus === GameStatus.X ? Occupancy.X :
          gameStatus === GameStatus.O ? Occupancy.O : Occupancy.Free
        ))
      )

      const newGameStatus = wonLines === GameStatus.X || wonLines === GameStatus.O ?
        wonLines :
        newGrid.some(gameStatus => gameStatus === GameStatus.Free) ? GameStatus.Free :
        GameStatus.Draw

      setPlayer(player => !player)
      setPlayableZone(
        (index === zoneIndex ? newStatus : grid[index]) === GameStatus.Free ? index : null
      )
      setStatus(newGameStatus)
      setGrid(newGrid)
      setHistory([...history, zoneIndex * 9 + index])
    }
  }

  return (
    <>
      <h1 className="text-4xl font-bold">Ultimate Tic-Tac-Toe</h1>
      <h2 className="text-lg">
        {
          status === GameStatus.X ? "Player X has won" :
          status === GameStatus.O ? "Player O has won" :
          status === GameStatus.Draw ? "The game is drawn" : "The game is continuing"
        }
      </h2>
      <p>
        {
          player ? "Player X to move" : "Player O to move"
        }
      </p>
      <p>{ `Playable Zone: ${zoneString(playableZone)}` }</p>
      <div className="flex items-center justify-center">
        <div className="grid grid-rows-3 gap-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Zone
                sideToMove={player}
                gameStatus={status}
                isPlayableZone={playable(0)}
                onMovePlayed={callback(0)}
              />
            </div>
            <div>
              <Zone
                sideToMove={player}
                gameStatus={status}
                isPlayableZone={playable(1)}
                onMovePlayed={callback(1)}
              />
             </div>
            <div>
              <Zone
                sideToMove={player}
                gameStatus={status}
                isPlayableZone={playable(2)}
                onMovePlayed={callback(2)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Zone
                sideToMove={player}
                gameStatus={status}
                isPlayableZone={playable(3)}
                onMovePlayed={callback(3)}
              />
            </div>
            <div>
              <Zone
                sideToMove={player}
                gameStatus={status}
                isPlayableZone={playable(4)}
                onMovePlayed={callback(4)}
             />
            </div>
            <div>
              <Zone
                sideToMove={player}
                gameStatus={status}
                isPlayableZone={playable(5)}
                onMovePlayed={callback(5)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Zone
                sideToMove={player}
                gameStatus={status}
                isPlayableZone={playable(6)}
                onMovePlayed={callback(6)}
              />
            </div>
            <div>
              <Zone
                sideToMove={player}
                gameStatus={status}
                isPlayableZone={playable(7)}
                onMovePlayed={callback(7)}
              />
            </div>
            <div>
              <Zone
                sideToMove={player}
                gameStatus={status}
                isPlayableZone={playable(8)}
                onMovePlayed={callback(8)}
              />
            </div>
         </div>
        </div>
      </div>
      <div className="left-[1%] top-[1%] fixed">
        <h3 className="font-bold text-xl">Move List</h3>
        <ul>
        {
          history.map(move => {
            const bigZone = zoneStrings[Math.floor(move / 9)]
            const smallZone = zoneStrings[move % 9]

            return (
              <li className="odd:text-blue-600 even:text-green-600">
                <p>{ `${bigZone}/${smallZone}` }</p>
              </li>
            )
          })
        }
        </ul>
      </div>
    </>
  )
}
