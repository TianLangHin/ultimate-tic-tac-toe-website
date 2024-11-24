export type SquareProps = {
  sideToMove: boolean,
  zoneStatus: GameStatus,
  onMovePlayed: () => void,
}

export type ZoneProps = {
  sideToMove: boolean,
  gameStatus: GameStatus,
  isPlayableZone: boolean,
  onMovePlayed: (index: number, newStatus: GameStatus) => void,
}

export enum Occupancy {
  X, O, Free,
}

export enum GameStatus {
  X, O, Draw, Free,
}
