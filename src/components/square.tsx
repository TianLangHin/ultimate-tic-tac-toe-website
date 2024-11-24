import { useState } from 'react'
import '../App.css'
import { SquareProps, Occupancy, GameStatus } from '../utils/data-types.ts'

export function Square(props: SquareProps) {
  const { sideToMove, zoneStatus, onMovePlayed } = props

  const [occupancy, setOccupancy] = useState(Occupancy.Free)

  const handleClick = () => {
    if (zoneStatus !== GameStatus.Free || occupancy !== Occupancy.Free)
      return
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
