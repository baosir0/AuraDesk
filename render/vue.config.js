import { defineConfig } from '@vue/cli-service'

export default defineConfig({
  // 你的配置项
  devServer: {
    port: 8080,
    open: true
  },
  transpileDependencies: true
})