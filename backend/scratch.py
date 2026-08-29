import json
from deep_translator import GoogleTranslator

langs = GoogleTranslator().get_supported_languages(as_dict=True)
print(json.dumps(langs, indent=2))
