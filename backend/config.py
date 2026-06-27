import os

# How supermarket flyers are parsed into products.
#   "cloud" -> Moonshot/Kimi OCR + LLM (works on hosted deployments)
#   "local" -> local Ollama Gemma (requires a local Ollama server)
PARSER_MODE = os.getenv("PARSER_MODE", "cloud")

# How recipes are generated from the discounted products.
#   "cloud" -> Moonshot/Kimi LLM (works on hosted deployments)
#   "local" -> local Ollama Gemma (requires a local Ollama server)
RECIPE_MODE = os.getenv("RECIPE_MODE", "cloud")
