use std::sync::LazyLock;

use crate::{
    utils::{
        set_panic_hook,
        move_string,
        // move_from_string,
        eval_string,
        board_string,
        board_from_string,
        // print_board,
        engine::{
            // Board, Move, Eval,
            init, alpha_beta,
            // play_move, generate_moves,
            // ZONE_ANY,
            NULL_MOVE, MAX_PLY,
            OUTCOME_WIN, OUTCOME_LOSS,
        },
    },
};

mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

static TABLES: LazyLock<(Vec<i32>, Vec<i32>)> = LazyLock::new(|| init());

#[wasm_bindgen]
pub fn go(depth: &str, board: &str, side: bool) -> Vec<String> {
    set_panic_hook();
    let response = if let Ok(d) = depth.parse::<usize>() {
        if d <= 0 {
            "error depth invalid"
        } else if d > MAX_PLY {
            &format!("error depth overflow {MAX_PLY}") as &str
        } else {
            if let Some(b) = board_from_string(board) {
                let (eval, line) = alpha_beta(
                    b,
                    !side,
                    d,
                    OUTCOME_LOSS,
                    OUTCOME_WIN,
                    &(*TABLES),
                    d,
                );
                &format!(
                    "info depth {} pv {} eval {}",
                    d,
                    line
                        .iter()
                        .take_while(|&&m| m != NULL_MOVE)
                        .map(|m| move_string(*m))
                        .collect::<Vec<_>>()
                        .join(" "),
                    eval_string(eval, d),
                ) as &str
            } else {
                "error board invalid"
            }
        }
    } else {
        "error depth invalid"
    };
    response
        .split_whitespace()
        .map(|keyword| keyword.to_string())
        .collect()
}

#[wasm_bindgen]
pub fn serialise_board(board_value: &str) -> String {
    let segments: Vec<&str> = board_value.split_whitespace().collect();
    if segments.len() != 3 {
        "invalid".to_string()
    } else if let (Ok(us), Ok(them), Ok(share)) =
        (segments[0].parse::<u64>(), segments[1].parse::<u64>(), segments[2].parse::<u64>())
    {
        board_string((us, them, share))
    } else {
        "invalid".to_string()
    }
}
