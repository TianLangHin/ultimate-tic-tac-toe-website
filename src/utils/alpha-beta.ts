export type Bitboard = bigint

export type Board = {
  us: Bitboard,
  them: Bitboard,
  share: Bitboard,
}

export function newBoard(): Board {
  return { us: BigInt(0), them: BigInt(0), share: ZONE_ANY << BigInt(54) }
}

export type Move = bigint
export type Eval = number
export type EvalAndPV = {
  evaluation: Eval,
  pv: Move[]
}

export const OUTCOME_WIN: Eval = 1000000
export const OUTCOME_DRAW: Eval = 0
export const OUTCOME_LOSS: Eval = -1000000

const BIG_TWO_COUNT: Eval = 90
const BIG_ONE_COUNT: Eval = 20
const SMALL_TWO_COUNT: Eval = 8
const SMALL_ONE_COUNT: Eval = 1

const CENTRE: Eval = 9
const CORNER: Eval = 7
const EDGE: Eval = 5
const SQ_BIG: Eval = 25

const LINE: Bitboard = BigInt(0b111)
const CHUNK: Bitboard = BigInt(0b111111111)
const DBLCHUNK: Bitboard = (CHUNK << BigInt(9)) | CHUNK
const EXCLZONE: Bitboard = (BigInt(0b111111) << BigInt(58)) | ((BigInt(1) << BigInt(54)) - BigInt(1))
const CORNER_MASK: Bitboard = BigInt(0b101000101)
const EDGE_MASK: Bitboard = BigInt(0b010101010)
const CENTRE_MASK: Bitboard = BigInt(0b000010000)

const ZONE_ANY: Bitboard = BigInt(9)
const NULL_MOVE: Move = BigInt(81)

const LINE_MAGICS: Bitboard[] = [
  BigInt(0b000_100_000_000_100_000_000_100),
  BigInt(0b000_000_000_000_010_000_100_000),
  BigInt(0b100_000_000_000_001_100_000_000),
  BigInt(0b000_000_000_100_000_000_000_010),
  BigInt(0b010_010_000_010_000_000_010_000),
  BigInt(0b000_000_000_001_000_010_000_000),
  BigInt(0b001_000_100_000_000_000_000_001),
  BigInt(0b000_000_010_000_000_000_001_000),
  BigInt(0b000_001_001_000_000_001_000_000),
]

const PRESENCE_MAGICS: Bitboard[] = [
  BigInt(0b10110110),
  BigInt(0b11101110),
  BigInt(0b01011110),
  BigInt(0b11110101),
  BigInt(0b00101101),
  BigInt(0b11011101),
  BigInt(0b01110011),
  BigInt(0b11101011),
  BigInt(0b10011011),
]

function lines(grid: Bitboard): Bitboard {
  return Array.from(LINE_MAGICS.entries())
    .map(([i, v]) => v * ((grid >> BigInt(i)) & BigInt(1)))
    .reduce((x, y) => x+y, BigInt(0))
}

function linePresence(grid: Bitboard): boolean {
  return BigInt(0) !== Array.from(PRESENCE_MAGICS.entries())
    .map(([i, v]) => v | (((grid >> BigInt(i)) & BigInt(1)) * BigInt(0xff)))
    .reduce((x, y) => x & y, BigInt(0xff))
}

function init(): { large: Eval[], small: Eval[] } {
  var evaluationTableLarge = Array(262144).fill(0)
  var evaluationTableSmall = Array(262144).fill(0)

  const popCount = Array.from(Array(512).keys())
    .map(i => Array.from(Array(9).keys()).reduce((acc, j) => acc + ((i >> j) & 1), 0))

  for (let us: Bitboard = BigInt(0); us < BigInt(512); us++) {
    for (let them: Bitboard = BigInt(0); them < BigInt(512); them++) {
      var evaluationLarge: Eval = 0
      var evaluationSmall: Eval = 0

      let usLines = lines(us)
      let themLines = lines(them)

      var usWon = false
      var themWon = false

      for (let i: Bitboard = BigInt(0); i < BigInt(24); i += BigInt(3)) {
        let usCount = popCount[Number((usLines >> i) & LINE)]
        let themCount = popCount[Number((themLines >> i) & LINE)]

        if (usCount != 0 && themCount != 0)
          continue

        if (usCount === 3) {
          usWon = true
          break
        }

        if (themCount === 3) {
          themWon = true
          break
        }

        evaluationLarge += (usCount === 2 ? BIG_TWO_COUNT : usCount === 1 ? BIG_ONE_COUNT : 0)
          - (themCount === 2 ? BIG_TWO_COUNT : themCount === 1 ? BIG_ONE_COUNT : 0)

        evaluationSmall += (usCount === 2 ? SMALL_TWO_COUNT : usCount === 1 ? SMALL_ONE_COUNT : 0)
          - (themCount === 2 ? SMALL_TWO_COUNT : themCount === 1 ? SMALL_ONE_COUNT : 0)
      }

      let evaluationPos =
        CORNER * (popCount[Number(us & CORNER_MASK)] - popCount[Number(them & CORNER_MASK)])
        + EDGE * (popCount[Number(us & EDGE_MASK)] - popCount[Number(them & EDGE_MASK)])
        + CENTRE * (popCount[Number(us & CENTRE_MASK)] - popCount[Number(them & CENTRE_MASK)])

      if (usWon) {
        evaluationTableLarge[Number((them << BigInt(9)) | us)] = OUTCOME_WIN
      } else if (themWon) {
        evaluationTableLarge[Number((them << BigInt(9)) | us)] = OUTCOME_LOSS
      } else if (popCount[Number(us | them)] === 9) {
        evaluationTableLarge[Number((them << BigInt(9)) | us)] = OUTCOME_DRAW
      } else {
        evaluationTableLarge[Number((them << BigInt(9)) | us)] = evaluationLarge + evaluationPos * SQ_BIG
        evaluationTableSmall[Number((them << BigInt(9)) | us)] = evaluationSmall + evaluationPos
      }
    }
  }

  return { large: evaluationTableLarge, small: evaluationTableSmall }
}

const TABLES = init()
const EVAL_TABLE_LARGE: Eval[] = TABLES.large
const EVAL_TABLE_SMALL: Eval[] = TABLES.small

function generateMoves(board: Board): Move[] {
  let { us, them, share } = board

  if (linePresence(share >> BigInt(36)) || linePresence(share >> BigInt(45)))
    return []

  let zone = (share >> BigInt(54)) & BigInt(0b1111)

  if (zone === ZONE_ANY) {
    let nwToSw: Bitboard = us | them
    let sToSe: Bitboard = (share >> BigInt(18)) | share
    let large: Bitboard = (share >> BigInt(36)) | (share >> BigInt(45))

    return Array.from(Array(63).keys())
      .map(i => BigInt(i))
      .filter(
        i => ((nwToSw >> i) & BigInt(1)) === BigInt(0) &&
          ((large >> (i / BigInt(9))) & BigInt(1)) === BigInt(0))
      .concat(Array.from(Array(18).keys())
        .map(i => BigInt(i + 63))
        .filter(
          i => ((sToSe >> (i - BigInt(63))) & BigInt(1)) === BigInt(0) &&
            ((large >> (i / BigInt(9)) & BigInt(1)) === BigInt(0))))

} else if (zone === BigInt(7) || zone === BigInt(8)) {
    let sToSe = (share >> BigInt(18)) | share

    return Array.from(Array(9).keys())
      .map(i => BigInt(i) + BigInt(9) * zone)
      .filter(i => ((sToSe >> (i - BigInt(63))) & BigInt(1)) === BigInt(0))
  } else {
    let nwToSw = us | them

    return Array.from(Array(9).keys())
     .map(i => BigInt(i) + BigInt(9) * zone)
     .filter(i => ((nwToSw >> i) & BigInt(1)) === BigInt(0))
  }
}

export function playMove(board: Board, move: Move, side: boolean): Board {
  var { us, them, share } = board

  let lineOccupancy

  if (move > BigInt(62)) {
    share |= BigInt(1) << (move - BigInt(63) + (side ? BigInt(0) : BigInt(18)))
    lineOccupancy = linePresence(
      share >> (BigInt(9) * (move / BigInt(9)) - BigInt(63) + (side ? BigInt(0) : BigInt(18))))
  } else if (side) {
    us |= BigInt(1) << move
    lineOccupancy = linePresence(us >> (BigInt(9) * (move / BigInt(9))))
  } else {
    them |= BigInt(1) << move
    lineOccupancy = linePresence(them >> (BigInt(9) * (move / BigInt(9))))
  }

  if (lineOccupancy) {
    share |= BigInt(1) << (BigInt(36) + (side ? BigInt(0) : BigInt(9)) + (move / BigInt(9)))
  }

  let nextChunk = move % BigInt(9) > BigInt(6) ?
    ((share | (share >> BigInt(18))) >> (BigInt(9) * ((move % BigInt(9)) - BigInt(7)))) & CHUNK :
    ((us | them) >> (BigInt(9) * (move % BigInt(9)))) & CHUNK

  let zone = nextChunk === CHUNK ||
    (((share | (share >> BigInt(9))) >> (BigInt(36) + move % BigInt(9))) & BigInt(1)) === BigInt(1) ?
    ZONE_ANY :
    move % BigInt(9)

  return {
    us: us,
    them: them,
    share: (share & EXCLZONE) | (zone << BigInt(54))
  }
}

function evaluate(board: Board, side: boolean): Eval {
  let { us, them, share } = board

  let decisiveEval = EVAL_TABLE_LARGE[Number((share >> BigInt(36)) & DBLCHUNK)]

  if (decisiveEval === OUTCOME_WIN || decisiveEval === OUTCOME_LOSS)
    return side ? decisiveEval : -decisiveEval

  let large = ((share >> BigInt(36)) | (share >> BigInt(45))) & CHUNK
  if (large === CHUNK)
    return OUTCOME_DRAW

  var evaluation: Eval = decisiveEval
  for (let i: Bitboard = BigInt(0); i < BigInt(7); i++) {
    let usData = (us >> (BigInt(9)*i)) & CHUNK
    let themData = (them >> (BigInt(9)*i)) & CHUNK

    evaluation += ((large >> i) & BigInt(1)) === BigInt(1) || (usData | themData) === CHUNK ? 0 :
      EVAL_TABLE_SMALL[Number((themData << BigInt(9)) | usData)]
  }
  for (let i: Bitboard = BigInt(7); i < BigInt(9); i++) {
    let usData = (share >> (BigInt(9)*i - BigInt(63))) & CHUNK
    let themData = (share >> (BigInt(9)*i - BigInt(45))) & CHUNK

    evaluation += ((large >> i) & BigInt(1)) === BigInt(1) || (usData | themData) === CHUNK ? 0 :
      EVAL_TABLE_SMALL[Number((themData << BigInt(9)) | usData)]
  }

  return side ? evaluation : -evaluation
}

function alphaBeta(
  board: Board,
  side: boolean,
  depth: number,
  alpha: Eval,
  beta: Eval,
  maxDepth: number): EvalAndPV {

  if (depth === 0) {
    let evaluation = evaluate(board, side)

    let adjusted_eval =
      evaluation === OUTCOME_WIN ? evaluation - maxDepth + depth :
      evaluation === OUTCOME_LOSS ? evaluation + maxDepth - depth :
      evaluation

    return { evaluation: adjusted_eval, pv: Array(maxDepth).fill(NULL_MOVE) }
  }

  let moveList = generateMoves(board)

  if (moveList.length === 0) {
    let evaluation = EVAL_TABLE_LARGE[Number((board.share >> BigInt(36)) & DBLCHUNK)] * (side ? 1 : -1)

    let adjusted_eval =
      evaluation === OUTCOME_WIN ? evaluation - maxDepth + depth :
      evaluation === OUTCOME_LOSS ? evaluation + maxDepth - depth :
      OUTCOME_DRAW
    return {
      evaluation: adjusted_eval,
      pv: Array(maxDepth).fill(NULL_MOVE)
    }
  }

  var pv = Array(maxDepth).fill(NULL_MOVE)

  for (const move of moveList) {
    var { evaluation, pv: line } = alphaBeta(
      playMove(board, move, side),
      !side,
      depth - 1,
      -beta,
      -alpha,
      maxDepth,
    )

    evaluation = -evaluation
    line[maxDepth - depth] = move

    if (evaluation >= beta) {
      return { evaluation: beta, pv: line }
    } else if (evaluation > alpha) {
      alpha = evaluation
      pv = line
    }
  }

  return { evaluation: alpha, pv: pv }
}

export function alphaBetaRootCall(
  board: Board,
  side: boolean,
  depth: number): EvalAndPV {

  return alphaBeta(board, side, depth, OUTCOME_LOSS, OUTCOME_WIN, depth)
}

