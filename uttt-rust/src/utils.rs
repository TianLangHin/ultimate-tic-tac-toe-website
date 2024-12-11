// Used as a temporary measure before more features are used
#![allow(unused_imports)]
#![allow(dead_code)]

use crate::utils::engine::*;

pub mod engine;

pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// Arrays to readily convert integers in the 0-8 range to the
// name of their corresponding zone.
const ZONE_ARRAY_UPPER: [&str; 9] = ["NW", "N", "NE", "W", "C", "E", "SW", "S", "SE"];
const ZONE_ARRAY_LOWER: [&str; 9] = ["nw", "n", "ne", "w", "c", "e", "sw", "s", "se"];

// Used to output an ASCII art representation of the board.
pub fn print_board(board: Board) -> String {

    let mut lines: Vec<String> = Vec::new();

    // Destructure and retrieve values from board.
    let (us, them, share) = board;
    let zone = (share >> 54) & 0b1111;

    // Map each of the bits to the coresponding string representations.
    // That is, "X" for Player X, "O" for Player O, and "." for non-occupied.
    let small = (0..63)
        .map(|i| {
            if ((us >> i) & 1) == 1 {
                "X".to_string()
            } else if ((them >> i) & 1) == 1 {
                "O".to_string()
            } else {
                ".".to_string()
            }
        })
        .chain((0..18).map(|i| {
            if ((share >> i) & 1) == 1 {
                "X".to_string()
            } else if ((share >> (i + 18)) & 1) == 1 {
                "O".to_string()
            } else {
                ".".to_string()
            }
        }))
        .collect::<Vec<_>>();

    // Similar mapping for large grid.
    let large = (0..9)
        .map(|i| {
            if ((share >> (i + 36)) & 1) == 1 {
                "X".to_string()
            } else if ((share >> (i + 45)) & 1) == 1 {
                "O".to_string()
            } else {
                ".".to_string()
            }
        })
        .collect::<Vec<_>>();

    // After organising occupancies into Vec, iterate through and print.
    lines.push("---+---+---".to_string());
    for i in (0..81).step_by(27) {
        for j in (0..9).step_by(3) {
            let line = format!(
                "{}",
                (0..27)
                    .step_by(9)
                    .map(|k| small[i + j + k..i + j + k + 3].join(""))
                    .collect::<Vec<_>>()
                    .join("|")
            );
            lines.push(line);
        }
        lines.push("---+---+---".to_string());
    }
    for i in (0..9).step_by(3) {
        lines.push(format!("{}", large[i..i + 3].join("")));
    }
    let line = format!(
        "ZONE: {}",
        if zone == ZONE_ANY {
            "ANY"
        } else {
            ZONE_ARRAY_UPPER[zone as usize]
        }
    );
    lines.push(line);

    lines.join("\n")
}

// Converts a `u64` move representation to a string.
pub fn move_string(mv: Move) -> String {
    format!(
        "{0}/{1}",
        ZONE_ARRAY_LOWER[(mv / 9) as usize],
        ZONE_ARRAY_LOWER[(mv % 9) as usize]
    )
}

// Returns the internal move representation from its string representation.
pub fn move_from_string(move_string: &str) -> Option<Move> {
    let zone_and_square: Vec<_> = move_string.split('/').collect();
    if zone_and_square.len() != 2 {
        return None;
    }
    let zone = ZONE_ARRAY_LOWER
        .iter()
        .position(|&z| z == zone_and_square[0]);
    let square = ZONE_ARRAY_LOWER
        .iter()
        .position(|&s| s == zone_and_square[1]);
    if let (Some(z), Some(s)) = (zone, square) {
        Some(9 * z as u64 + s as u64)
    } else {
        None
    }
}

// Converts a `i32` heuristic evaluation value to a string.
pub fn eval_string(eval: i32, max_depth: usize) -> String {
    if eval <= OUTCOME_LOSS + max_depth as i32 {
        format!("L{0}", eval - OUTCOME_LOSS)
    } else if eval >= OUTCOME_WIN - max_depth as i32 {
        format!("W{0}", OUTCOME_WIN - eval)
    } else if eval == OUTCOME_DRAW {
        "D0".to_string()
    } else {
        format!("{:+0}", eval)
    }
}

// Compressed inline string representation for compact passing of Board setups.
pub fn board_string(board: Board) -> String {
    let (us, them, share) = board;
    let zone = (share >> 54) & 0b1111;
    let cells = (0..81).step_by(27).flat_map(move |i| {
        (0..9).step_by(3).map(move |j| {
            (0..27)
                .step_by(9)
                .flat_map(move |k| i + j + k..i + j + k + 3)
        })
    });
    format!(
        "{} {}",
        cells
            .map(|v| v
                .map(|i| {
                    if i > 62 {
                        if ((share >> (i - 63)) & 1) == 1 {
                            "x".to_string()
                        } else if ((share >> (i - 45)) & 1) == 1 {
                            "o".to_string()
                        } else {
                            ".".to_string()
                        }
                    } else if ((us >> i) & 1) == 1 {
                        "x".to_string()
                    } else if ((them >> i) & 1) == 1 {
                        "o".to_string()
                    } else {
                        ".".to_string()
                    }
                })
                .collect::<Vec<_>>()
                .join(""))
            .collect::<Vec<_>>()
            .join("/")
            .replace(".........", "9")
            .replace("........", "8")
            .replace(".......", "7")
            .replace("......", "6")
            .replace(".....", "5")
            .replace("....", "4")
            .replace("...", "3")
            .replace("..", "2")
            .replace('.', "1"),
        if zone == ZONE_ANY {
            "any"
        } else {
            ZONE_ARRAY_LOWER[zone as usize]
        }
    )
}

// Returns an internal board representation from its string representation.
pub fn board_from_string(board_string: &str) -> Option<Board> {
    let (mut us, mut them, mut share) = (0u64, 0u64, 0u64);
    let decompressed_string = board_string
        .replace('1', ".")
        .replace('2', "..")
        .replace('3', "...")
        .replace('4', "....")
        .replace('5', ".....")
        .replace('6', "......")
        .replace('7', ".......")
        .replace('8', "........")
        .replace('9', ".........");
    let cell_and_zone: Vec<_> = decompressed_string.split_whitespace().collect();
    if cell_and_zone.len() != 2 {
        return None;
    }
    let (cell, zone) = (cell_and_zone[0], cell_and_zone[1]);
    if let Some(z) = ZONE_ARRAY_LOWER.iter().position(|&z| z == zone) {
        share |= (z as u64) << 54;
    } else if zone == "any" {
        share |= ZONE_ANY << 54;
    } else {
        return None;
    }
    let rows: Vec<_> = cell.split('/').collect();
    if rows.len() != 9 {
        return None;
    }
    if rows.iter().any(|row| row.len() != 9) {
        return None;
    }
    decompressed_string
        .replace('/', "")
        .chars()
        .zip((0..81).step_by(27).flat_map(move |i| {
            (0..9).step_by(3).flat_map(move |j| {
                (0..27)
                    .step_by(9)
                    .flat_map(move |k| i + j + k..i + j + k + 3)
            })
        }))
        .for_each(|(c, i)| {
            if i > 62 {
                if c == 'x' {
                    share |= 1 << (i - 63);
                } else if c == 'o' {
                    share |= 1 << (i - 45);
                }
            } else if c == 'x' {
                us |= 1 << i;
            } else if c == 'o' {
                them |= 1 << i;
            }
        });
    let first_seven_us = us;
    let first_seven_them = them;
    for i in 0..7 {
        if line_presence(first_seven_us >> (9 * i)) {
            share |= 1 << (36 + i);
        } else if line_presence(first_seven_them >> (9 * i)) {
            share |= 1 << (45 + i);
        }
    }
    let last_two_us = share;
    let last_two_them = share >> 18;
    for i in 7..9 {
        if line_presence(last_two_us >> (9 * i - 63)) {
            share |= 1 << (36 + i);
        } else if line_presence(last_two_them >> (9 * i - 63)) {
            share |= 1 << (45 + i);
        }
    }
    Some((us, them, share))
}
