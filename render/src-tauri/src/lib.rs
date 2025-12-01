#[cfg_attr(mobile, tauri::mobile_entry_point)]
use tauri::Manager;
use tauri_plugin_positioner::{WindowExt, Position};
use tauri::tray::TrayIconBuilder;
use tauri::{LogicalPosition, PhysicalPosition};
use std::process::Command;
use std::path::Path;

pub fn run() {
  startService();
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

pub fn startService(){
  let program = r"C:\nvm4w\nodejs\npx.cmd"; 
  
  // TS 项目 B 的路径和入口文件
  let service_dir = Path::new("../../service");
  let entry_file = service_dir.join(r"C:\persional_system\project\my-aiagent\service\src\main.ts");
  
  // 配置要运行的命令
  let mut command = Command::new(program);

  command
      // 添加 ts-node 参数和入口文件
      .arg("ts-node")
      .arg("--transpile-only") // 推荐：只转译不进行类型检查，启动更快
      .arg(entry_file)
      
      
      // 设置工作目录，确保 TS 项目能够找到其配置文件和其他资源
      .current_dir(service_dir)
      
      // 将子进程的 stdout/stderr 导入到主进程 (可选，但通常很有用)
      .stdout(std::process::Stdio::inherit())
      .stderr(std::process::Stdio::inherit());


  println!("正在启动 Node.js/TS 项目...");

  // 执行命令并等待其完成
  match command.spawn() {
        Ok(child) => {
            println!("Node.js 服务器已成功启动，其进程 ID (PID) 是: {}", child.id());
            println!("Rust 主程序继续执行其他任务...");

        }
        Err(e) => {
            eprintln!("启动 Node.js 服务器失败: {}", e);
        }
    }
}