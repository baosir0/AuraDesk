import { defineConfig } from '@vue/cli-service'

export default defineConfig({
  // 你的配置项
  devServer: {
    port: 8080,
    open: true
  },
  transpileDependencies: true,
  productionSourceMap: true,
  configureWebpack: {
    devtool: 'source-map' // 明确设置 devtool 为 'source-map' 或 'eval-source-map'
  }
})