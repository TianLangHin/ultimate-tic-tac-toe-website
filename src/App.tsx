import { useEffect, useState } from 'react'
import './App.css'
import { Occupancy, GameStatus } from './utils/data-types.ts'
import { calculateGameStatus } from './utils/calculate-game-status.ts'
import { Zone } from './components/zone.tsx'
import {
  // alphaBetaRootCall,
  // Board,
  newBoard,
  playMove,
  // OUTCOME_WIN,
  // OUTCOME_DRAW,
  // OUTCOME_LOSS
} from './utils/alpha-beta.ts'
import { go, serialise_board } from '../uttt-rust/pkg'

const zoneStrings: string[] = [
  "NW", "N", "NE", "W", "C", "E", "SW", "S", "SE"
]

function zoneString(zone: number | null): string {
  return zone === null ? "ANY" : zoneStrings[zone]
}

function moveString(move: bigint | number): string {
  if (Number(move) < 0 || Number(move) > 80)
    return ""

  let bigZone = zoneStrings[Math.floor(Number(move) / 9)]
  let smallZone = zoneStrings[Number(move) % 9]

  return `${bigZone}/${smallZone}`
}

export default function App() {
  const [player, setPlayer] = useState(true)
  const [playableZone, setPlayableZone] = useState<number | null>(null)
  const [status, setStatus] = useState(GameStatus.Free)
  const [grid, setGrid] = useState(Array(9).fill(GameStatus.Free))
  const [history, setHistory] = useState<number[]>([])
  const [boardValue, setBoardValue] = useState(newBoard())
  const [analysis, setAnalysis] = useState("Loading analysis...")

  const maxDepth = 8

  const playable = (index: number) => playableZone === index || playableZone === null

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

      const move = zoneIndex * 9 + index

      setPlayer(player => !player)
      setPlayableZone(
        (index === zoneIndex ? newStatus : grid[index]) === GameStatus.Free ? index : null
      )
      setStatus(newGameStatus)
      setGrid(newGrid)
      setHistory([...history, move])
      setBoardValue(playMove(boardValue, BigInt(move), player))
    }
  }

  useEffect(() => {
    let response = go(
      `${maxDepth}`,
      serialise_board(`${boardValue.us} ${boardValue.them} ${boardValue.share}`),
      player)
    if (response[0] === "error") {
      if (response[1] === "depth") {
        if (response[2] === "invalid") {
          setAnalysis("Non-positive depth is set.")
        } else if (response[2] === "overflow") {
          setAnalysis(`Depth was set higher than maximum of ${response[3]}`)
        }
      } else if (response[1] === "board") {
        setAnalysis("Board serialisation failed")
      }
    } else if (response[0] === "info") {
      if (response[1] === "depth") {
        let dpt = Number(response[2])
        let pv = response.slice(4, 4 + dpt)
        let evaluation = response[4 + dpt + 1]
        setAnalysis(`Eval: ${ evaluation }, PV: ${ pv.map(x => x.toUpperCase()).join(", ") }`)
      }
    }
  }, [boardValue])

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
      <p>
      { `${analysis}` }
      </p>
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
          history.map(move => (
              <li className="odd:text-blue-600 even:text-green-600">
                <p>{ `${ moveString(move) }` }</p>
              </li>
            )
          )
        }
        </ul>
      </div>
    </>
  )
}
