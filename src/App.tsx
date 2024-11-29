import { useEffect, useState } from 'react'
import './App.css'
import { Occupancy, GameStatus } from './utils/data-types.ts'
import { calculateGameStatus } from './utils/calculate-game-status.ts'
import { Zone } from './components/zone.tsx'
import {
  alphaBetaRootCall,
  newBoard,
  playMove,
  OUTCOME_WIN,
  OUTCOME_DRAW,
  OUTCOME_LOSS
} from './utils/alpha-beta.ts'

const zoneStrings: string[] = [
  "NW", "N", "NE", "W", "C", "E", "SW", "S", "SE"
]

export default function Board() {
  const [player, setPlayer] = useState(true)
  const [playableZone, setPlayableZone] = useState<number | null>(null)
  const [status, setStatus] = useState(GameStatus.Free)
  const [grid, setGrid] = useState(Array(9).fill(GameStatus.Free))
  const [history, setHistory] = useState<number[]>([])
  const [boardValue, setBoardValue] = useState(newBoard())
  const [analysis, setAnalysis] = useState("Loading analysis...")

  const maxDepth = 6

  const playable = (index: number) => playableZone === index || playableZone === null

  const zoneString = (zone: number | null) => {
    return zone === null ? "ANY" : zoneStrings[zone]
  }

  const moveString = (move: bigint | number) => {
    if (Number(move) < 0 || Number(move) > 80)
      return ""

    let bigZone = zoneStrings[Math.floor(Number(move) / 9)]
    let smallZone = zoneStrings[Number(move) % 9]

    return `${bigZone}/${smallZone}`
  }

  const evalString = (evaluation: number) => (
    evaluation <= OUTCOME_LOSS + maxDepth ? `L${evaluation - OUTCOME_LOSS}` :
    evaluation >= OUTCOME_WIN - maxDepth ? `W${OUTCOME_WIN - evaluation}` :
    evaluation == OUTCOME_DRAW ? "D0" :
    evaluation > 0 ? `+${evaluation}` : `${evaluation}`
  )

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
    let { evaluation, pv } = alphaBetaRootCall(boardValue, player, maxDepth)
    setAnalysis(`Eval: ${ evalString(evaluation) }, PV: ${
      pv.map(m => moveString(m)).filter(m => m !== "").join(", ")
    }`)
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
