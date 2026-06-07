// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::UdpSocket;
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State, Emitter};
use crate::telemetry::TelemetryPayload;
use crate::session::{ActiveSession, SessionSummary, save_session, load_all_sessions};

mod telemetry;
mod session;

pub struct AppState {
    pub app_data_dir: std::path::PathBuf,
    pub active_session: Mutex<Option<ActiveSession>>,
}

// Commands
#[tauri::command]
fn get_historical_sessions(state: State<'_, AppState>) -> Result<Vec<SessionSummary>, String> {
    load_all_sessions(&state.app_data_dir)
}

#[tauri::command]
fn get_active_session(state: State<'_, AppState>) -> Result<Option<SessionSummary>, String> {
    let active = state.active_session.lock().unwrap();
    Ok(active.as_ref().map(|s| s.to_summary()))
}

#[tauri::command]
fn delete_all_sessions(state: State<'_, AppState>) -> Result<(), String> {
    let mut sessions_path = state.app_data_dir.clone();
    sessions_path.push("sessions");
    if sessions_path.exists() {
        std::fs::remove_dir_all(&sessions_path).map_err(|e| e.to_string())?;
        std::fs::create_dir_all(&sessions_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Get local AppData directory for storing sessions
            let app_data_dir = app.path().app_local_data_dir().unwrap_or_else(|_| {
                let mut path = std::env::current_dir().unwrap();
                path.push("telemetry_data");
                path
            });

            // Create AppState
            let state = Arc::new(AppState {
                app_data_dir: app_data_dir.clone(),
                active_session: Mutex::new(None),
            });
            app.manage(state.clone());

            // Spawn background thread to listen to UDP packets
            let state_clone = state.clone();
            let app_handle_clone = app_handle.clone();
            thread::spawn(move || {
                let socket = match UdpSocket::bind("0.0.0.0:5300") {
                    Ok(s) => s,
                    Err(e) => {
                        eprintln!("Failed to bind UDP socket to port 5300: {}. Telemetry listener disabled.", e);
                        return;
                    }
                };

                let mut buffer = [0u8; 1024];

                loop {
                    match socket.recv_from(&mut buffer) {
                        Ok((amt, _src)) => {
                            if amt >= 311 {
                                let payload = TelemetryPayload::parse(&buffer[..amt]);
                                
                                // Emit telemetry data to webview
                                let _ = app_handle_clone.emit("telemetry-data", &payload);

                                // Manage active driving session
                                let mut active = state_clone.active_session.lock().unwrap();
                                if payload.is_race_on {
                                    if let Some(session) = active.as_mut() {
                                        // If car changed or race time went backwards significantly, end previous and start new
                                        if session.car_ordinal != payload.car_ordinal 
                                           || payload.current_race_time < session.last_race_time - 2.0 {
                                            // Save previous session
                                            let summary = session.to_summary();
                                            let _ = save_session(&state_clone.app_data_dir, &summary);
                                            let _ = app_handle_clone.emit("session-ended", &summary);
                                            
                                            // Start new session
                                            *session = ActiveSession::new(&payload);
                                            let _ = app_handle_clone.emit("session-started", ());
                                        } else {
                                            // Update session
                                            session.update(&payload);
                                        }
                                    } else {
                                        // Start new session
                                        *active = Some(ActiveSession::new(&payload));
                                        let _ = app_handle_clone.emit("session-started", ());
                                    }
                                } else {
                                    // If not in race (paused or menus), check if we have a running session
                                    if let Some(session) = active.take() {
                                        // Convert to summary and save
                                        let summary = session.to_summary();
                                        let _ = save_session(&state_clone.app_data_dir, &summary);
                                        let _ = app_handle_clone.emit("session-ended", &summary);
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("UDP read error: {}", e);
                            thread::sleep(Duration::from_millis(100));
                        }
                    }
                }
            });

            // Spawn a monitoring thread to finalize sessions if packets stop coming
            let state_monitor = state.clone();
            let app_handle_monitor = app_handle.clone();
            thread::spawn(move || {
                loop {
                    thread::sleep(Duration::from_secs(5));
                    
                    let mut active = state_monitor.active_session.lock().unwrap();
                    if let Some(session) = active.as_ref() {
                        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
                        // If we haven't received telemetry packets for 8 seconds, finalize the session
                        if now.saturating_sub(session.last_packet_time) > 8000 {
                            if let Some(ended_session) = active.take() {
                                let summary = ended_session.to_summary();
                                let _ = save_session(&state_monitor.app_data_dir, &summary);
                                let _ = app_handle_monitor.emit("session-ended", &summary);
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_historical_sessions,
            get_active_session,
            delete_all_sessions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
