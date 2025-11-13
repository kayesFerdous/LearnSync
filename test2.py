# from langchain_docling.loader import DoclingLoader, ExportType
#
#
# url = "/home/kayes/Documents/cv.pdf"
#
# loader = DoclingLoader(
#     file_path=url,
#     export_type=ExportType.MARKDOWN
# )
#
# docs = loader.load()
#
# print(docs)

# string = "https://kayees.me/api/studybot"

# rm_prefix = string.split("://")
# if len(rm_prefix) > 1:
#     rm_prefix = rm_prefix[1]
# else:
#     rm_prefix = rm_prefix[0]
#
# url = "-".join(rm_prefix.split("/"))
# print(url)

emni = "kayees.me"
# emni = "/tmp/tmp1p3qtshzstory.pdf"

domain = emni.replace('https://', '').replace('http://', '')
domain = domain.rstrip('/').lstrip("/").replace("/", "-")

print(domain)

