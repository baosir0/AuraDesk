// import path from "path"

export const getCurrentTime = () => {
  return new Date().toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export const formatMessage = (content: string) => {
  return content.replace(/\n/g, '<br>')
}

// export const getAbsolutePathByRelativePath = (relativePath: string) => {
//   return path.resolve(process.cwd(), relativePath)
// }