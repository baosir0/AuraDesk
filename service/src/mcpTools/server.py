from mcp.server.fastmcp import FastMCP

mcp = FastMCP('baosir的 MCP Server')

@mcp.tool(
    name='add',
    description='对两个数字进行实数域的加法'
)
def add(a: int, b: int) -> int:
    return a + b

@mcp.resource(
    uri="greeting://{name}",
    name='greeting',
    description='用于演示的一个资源协议'
)
def get_greeting(name: str) -> str:
    # 访问处理 greeting://{name} 资源访问协议，然后返回
    # 此处方便起见，直接返回一个 Hello，balabala 了
    return f"Hello, {name}!"

@mcp.prompt(
    name='translate',
    description='进行翻译的prompt'
)
def translate(message: str) -> str:
    return f'请将下面的话语翻译成中文：\n\n{message}'

@mcp.tool(
    name='weather',
    description='获取指定城市的天气信息'
)
def get_weather(city: str) -> str:
    """模拟天气查询协议，返回格式化字符串"""
    return f"Weather in {city}: Sunny, 25°C"

@mcp.resource(
    uri="user://{user_id}",
    name='user_profile',
    description='获取用户基本信息'
)
def get_user_profile(user_id: str) -> dict:
    """模拟用户协议，返回字典数据"""
    return {
        "id": user_id,
        "name": "张三",
        "role": "developer"
    }

@mcp.resource(
    uri="book://{isbn}",
    name='book_info',
    description='通过ISBN查询书籍信息'
)
def get_book_info(isbn: str) -> dict:
    """模拟书籍协议，返回结构化数据"""
    return {
        "isbn": isbn,
        "title": "Python编程：从入门到实践",
        "author": "Eric Matthes"
    }

@mcp.prompt(
    name='summarize',
    description='生成文本摘要的提示词模板'
)
def summarize(text: str) -> str:
    """返回摘要生成提示词"""
    return f"请用一句话总结以下内容：\n\n{text}"