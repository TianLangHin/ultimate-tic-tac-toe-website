import { Occupancy, GameStatus } from './data-types.ts'

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

export function calculateGameStatus(grid: Occupancy[]): GameStatus {
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
