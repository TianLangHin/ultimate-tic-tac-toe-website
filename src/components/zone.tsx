import { useState } from 'react'
import '../App.css'
import { ZoneProps, Occupancy, GameStatus } from '../utils/data-types.ts'
import { calculateGameStatus } from '../utils/calculate-game-status.ts'
import { Square } from '../components/square.tsx'

export function Zone(props: ZoneProps) {
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
