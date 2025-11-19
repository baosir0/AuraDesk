#[cfg_attr(mobile, tauri::mobile_entry_point)]
use tauri::Manager;
use tauri_plugin_positioner::{WindowExt, Position};
use tauri::tray::TrayIconBuilder;
use tauri::{LogicalPosition, PhysicalPosition};
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      app.handle().plugin(tauri_plugin_positioner::init());
      let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .build(app)?;
      let mut win = app.get_webview_window("main").unwrap();
      let logical_pos = LogicalPosition::new(1950.0, 885.0);
      let _ = win.set_position(logical_pos);
      #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

                let ctrl_n_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyN);
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new().with_handler(move |_app, shortcut, event| {
                        println!("{:?}", shortcut);
                        if shortcut == &ctrl_n_shortcut {
                            match event.state() {
                              ShortcutState::Pressed => {
                                if win.is_visible().unwrap() {
                                  win.hide();
                                }else {
                                  win.show();
                                }
                              }
                              ShortcutState::Released => {

                              }
                            }
                        }
                    })
                    .build(),
                )?;

                app.global_shortcut().register(ctrl_n_shortcut)?;
            }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
